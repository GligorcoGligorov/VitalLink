import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Doctor } from "../types/doctor";
import { Medication } from "../types/medication";
import { Conversation, Message } from "../types/message";
import { Patient } from "../types/patient";
import { Vital } from "../types/Vital";

export type RequestStatus = "none" | "pending" | "active";

type MedStore = {
    meds: Medication[];
    fetchMedications: () => Promise<void>;
    markAsTaken: (id: string) => Promise<void>;
    addMedication: (med: Omit<Medication, "id">) => Promise<string>;

    vitals: Vital[];
    addVital: (vital: Omit<Vital, "id" | "recordedAt">) => Promise<void>;
    fetchVitals: () => Promise<void>;

    patients: Patient[];
    fetchPatients: () => Promise<void>;
    pendingRequests: Patient[];
    activePatients: Patient[];
    fetchDoctorPatients: () => Promise<void>;
    acceptPatient: (patientId: string) => Promise<void>;
    declinePatient: (patientId: string) => Promise<void>;

    doctors: Doctor[];
    requestMap: Record<string, RequestStatus>;
    connectedDoctor: Doctor | null;
    fetchDoctors: () => Promise<void>;
    sendRequest: (doctor: Doctor) => Promise<string>;
    removeDoctor: () => Promise<void>;

    // ── Messages ──
    conversations: Conversation[];
    messages: Message[];
    unreadCounts: Record<string, number>;
    loadConversations: () => Promise<void>;
    loadUnreadCounts: () => Promise<void>;
    fetchMessages: (partnerId: string) => Promise<void>;
    sendMessage: (partnerId: string, content: string) => Promise<void>;
    appendMessage: (msg: Message) => void;
    markRead: (partnerId: string) => void;
};

export const useMedStore = create<MedStore>((set, get) => ({

    // ── Medications ──
    meds: [],
    fetchMedications: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from("medications")
            .select("*")
            .eq("patient_id", user.id)
            .order("created_at", { ascending: false });
        if (error) { console.error("fetchMedications:", error); return; }
        set({ meds: (data as Medication[]) || [] });
    },
    markAsTaken: async (id) => {
        await supabase.from("medications").update({ status: "taken" }).eq("id", id);
        set((state) => ({
            meds: state.meds.map((m) => m.id === id ? { ...m, status: "taken" } : m),
        }));
    },
    addMedication: async (med) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "Not logged in";
        const { error } = await supabase.from("medications").insert({
            ...med,
            doctor_id: user.id,
        });
        if (error) return error.message;
        return "";
    },

    // ── Vitals ──
    vitals: [],
    addVital: async (vital) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("vitals").insert({ ...vital, user_id: user?.id });
        if (!error) {
            const { data } = await supabase.from("vitals").select("*").order("created_at", { ascending: false });
            set({ vitals: (data as Vital[]) || [] });
        }
    },
    fetchVitals: async () => {
        const { data, error } = await supabase.from("vitals").select("*").order("created_at", { ascending: false });
        if (error) { console.error("fetchVitals:", error); return; }
        set({ vitals: (data as Vital[]) || [] });
    },

    // ── Patients (for doctor) ──
    patients: [],
    fetchPatients: async () => {
        const { data, error } = await supabase.from("profiles").select("id, full_name, role").eq("role", "patient");
        if (error) { console.error("fetchPatients:", error); return; }
        set({ patients: (data as Patient[]) || [] });
    },
    pendingRequests: [],
    activePatients: [],
    fetchDoctorPatients: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: rows, error } = await supabase
            .from("doctor_patient")
            .select("patient_id, status, created_at")
            .eq("doctor_id", user.id);
        if (error || !rows || rows.length === 0) {
            set({ pendingRequests: [], activePatients: [] });
            return;
        }
        const patientIds = rows.map((r: any) => r.patient_id);
        const { data: profiles } = await supabase
            .from("profiles").select("id, full_name, role").in("id", patientIds);
        if (!profiles) return;
        const merged: Patient[] = rows.map((r: any) => {
            const profile = profiles.find((p: any) => p.id === r.patient_id);
            return { id: r.patient_id, full_name: profile?.full_name ?? "Unknown", role: profile?.role ?? "patient", status: r.status, created_at: r.created_at };
        });
        set({
            pendingRequests: merged.filter((p) => p.status === "pending"),
            activePatients: merged.filter((p) => p.status === "active"),
        });
    },
    acceptPatient: async (patientId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("doctor_patient").update({ status: "active" }).eq("doctor_id", user.id).eq("patient_id", patientId);
        set((state) => {
            const accepted = state.pendingRequests.find((p) => p.id === patientId);
            if (!accepted) return {};
            return {
                pendingRequests: state.pendingRequests.filter((p) => p.id !== patientId),
                activePatients: [...state.activePatients, { ...accepted, status: "active" }],
            };
        });
    },
    declinePatient: async (patientId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("doctor_patient").delete().eq("doctor_id", user.id).eq("patient_id", patientId);
        set((state) => ({ pendingRequests: state.pendingRequests.filter((p) => p.id !== patientId) }));
    },

    // ── Doctors (for patient) ──
    doctors: [],
    requestMap: {},
    connectedDoctor: null,
    fetchDoctors: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [doctorsRes, requestsRes] = await Promise.all([
            supabase.from("profiles").select("id, full_name, role").eq("role", "doctor"),
            supabase.from("doctor_patient").select("doctor_id, status").eq("patient_id", user.id),
        ]);
        const doctors = (doctorsRes.data as Doctor[]) || [];
        const map: Record<string, RequestStatus> = {};
        let connectedDoctor: Doctor | null = null;
        if (requestsRes.data) {
            requestsRes.data.forEach((r: any) => { map[r.doctor_id] = r.status; });
            const activeEntry = requestsRes.data.find((r: any) => r.status === "active");
            if (activeEntry) connectedDoctor = doctors.find((d) => d.id === activeEntry.doctor_id) ?? null;
        }
        set({ doctors, requestMap: map, connectedDoctor });
    },
    sendRequest: async (doctor) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "Not logged in";
        const { error } = await supabase.from("doctor_patient").insert({ doctor_id: doctor.id, patient_id: user.id, status: "pending" });
        if (error) return error.message;
        set((state) => ({ requestMap: { ...state.requestMap, [doctor.id]: "pending" } }));
        return "";
    },
    removeDoctor: async () => {
        const { connectedDoctor } = get();
        if (!connectedDoctor) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("doctor_patient").delete().eq("doctor_id", connectedDoctor.id).eq("patient_id", user.id);
        set((state) => {
            const map = { ...state.requestMap };
            delete map[connectedDoctor.id];
            return { connectedDoctor: null, requestMap: map };
        });
    },

    // ── Messages ──
    conversations: [],
    messages: [],
    unreadCounts: {},

    loadConversations: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from("profiles").select("role").eq("id", user.id).single();
        const role = profile?.role ?? "patient";

        if (role === "patient") {
            const { data: rows } = await supabase
                .from("doctor_patient")
                .select("doctor_id")
                .eq("patient_id", user.id)
                .eq("status", "active");
            if (!rows || rows.length === 0) return;
            const { data: p } = await supabase
                .from("profiles").select("id, full_name, role")
                .eq("id", rows[0].doctor_id).single();
            if (p) set({ conversations: [p as Conversation] });
        } else {
            const { data: rows } = await supabase
                .from("doctor_patient")
                .select("patient_id")
                .eq("doctor_id", user.id)
                .eq("status", "active");
            if (!rows || rows.length === 0) return;
            const ids = rows.map((r: any) => r.patient_id);
            const { data: profiles } = await supabase
                .from("profiles").select("id, full_name, role").in("id", ids);
            if (profiles) set({ conversations: profiles as Conversation[] });
        }
    },

    loadUnreadCounts: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("messages").select("sender_id")
            .eq("receiver_id", user.id).eq("read", false);
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((m: any) => { counts[m.sender_id] = (counts[m.sender_id] ?? 0) + 1; });
        set({ unreadCounts: counts });
    },

    fetchMessages: async (partnerId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("messages").select("*")
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),` +
                `and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
            )
            .order("created_at", { ascending: true });
        set({ messages: (data as Message[]) ?? [] });
        // mark as read
        await supabase.from("messages").update({ read: true })
            .eq("sender_id", partnerId).eq("receiver_id", user.id).eq("read", false);
        set((state) => ({
            unreadCounts: { ...state.unreadCounts, [partnerId]: 0 },
        }));
    },

    sendMessage: async (partnerId, content) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("messages").insert({
            sender_id: user.id,
            receiver_id: partnerId,
            content,
        });
    },

    appendMessage: (msg) => {
        set((state) => {
            if (state.messages.some((m) => m.id === msg.id)) return {};
            return { messages: [...state.messages, msg] };
        });
    },

    markRead: (partnerId) => {
        set((state) => ({
            unreadCounts: { ...state.unreadCounts, [partnerId]: 0 },
        }));
    },
}));
