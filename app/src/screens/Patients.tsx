import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useMedStore } from "../store/useMedStore";
import { RootStackParamList } from "../types/navigation";
import { Patient } from "../types/patient";

function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function RequestCard({ patient, onAccept, onDecline }: {
    patient: Patient;
    onAccept: () => void;
    onDecline: () => void;
}) {
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(patient.full_name)}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.patientName}>{patient.full_name}</Text>
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                        </View>
                    </View>
                    <Text style={styles.patientMeta}>Patient</Text>
                    {patient.created_at && (
                        <Text style={styles.patientMeta}>Requested {timeAgo(patient.created_at)}</Text>
                    )}
                </View>
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
                    <Text style={styles.acceptBtnText}>✓  Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
                    <Text style={styles.declineBtnText}>✕  Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ActiveCard({ patient, onTap, onAddMed }: { patient: Patient; onTap: () => void; onAddMed: () => void }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onTap} activeOpacity={0.85}>
            <View style={styles.cardTop}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(patient.full_name)}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.patientName}>{patient.full_name}</Text>
                        <View style={styles.activeDot} />
                    </View>
                    <Text style={styles.patientMeta}>Patient</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.addMedBtn} onPress={(e) => { e.stopPropagation?.(); onAddMed(); }}>
                <Text style={styles.addMedBtnText}>+ Add Medication</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default function Patients() {
    const { pendingRequests, activePatients, fetchDoctorPatients, acceptPatient, declinePatient } = useMedStore();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [doctorName, setDoctorName] = useState("");
    const [toast, setToast] = useState("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.user_metadata?.full_name) {
                setDoctorName(user.user_metadata.full_name);
            }
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDoctorPatients();
        }, [])
    );

    async function handleAccept(patient: Patient) {
        await acceptPatient(patient.id);
        setToast(`${patient.full_name} added to your patients`);
        setTimeout(() => setToast(""), 4000);
    }

    const hasPending = pendingRequests.length > 0;
    const totalAlerts = pendingRequests.length;

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerSub}>
                            {hasPending ? "Notifications" : "My patients"}
                        </Text>
                        <Text style={styles.headerTitle}>
                            {hasPending ? "Requests" : `Dr. ${doctorName.split(" ")[0] || "Doctor"}`}
                        </Text>
                    </View>
                    {totalAlerts > 0 && (
                        <View style={styles.alertBadge}>
                            <Text style={styles.alertBadgeText}>{totalAlerts}</Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                {/* Success toast */}
                {toast ? (
                    <View style={styles.toast}>
                        <Text style={styles.toastText}>✓  {toast}</Text>
                    </View>
                ) : null}

                {/* Pending requests */}
                {hasPending && (
                    <>
                        <Text style={styles.sectionLabel}>NEW PATIENT REQUESTS</Text>
                        {pendingRequests.map((patient) => (
                            <RequestCard
                                key={patient.id}
                                patient={patient}
                                onAccept={() => handleAccept(patient)}
                                onDecline={() => declinePatient(patient.id)}
                            />
                        ))}
                    </>
                )}

                {/* Active patients */}
                <Text style={styles.sectionLabel}>ACTIVE PATIENTS</Text>
                {activePatients.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No active patients yet</Text>
                    </View>
                ) : (
                    activePatients.map((patient) => (
                        <ActiveCard
                            key={patient.id}
                            patient={patient}
                            onTap={() => navigation.navigate('PatientDetail', { patientId: patient.id, patientName: patient.full_name })}
                            onAddMed={() => navigation.navigate('AddMedication', { patientId: patient.id, patientName: patient.full_name })}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const GREEN = "#1b4332";

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },

    /* Header */
    header: { backgroundColor: GREEN, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 2 },
    headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
    alertBadge: {
        backgroundColor: "#ef4444",
        borderRadius: 20, minWidth: 28,
        paddingHorizontal: 8, paddingVertical: 4,
        alignItems: "center",
    },
    alertBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },

    /* Content */
    content: { flex: 1 },
    contentInner: { paddingBottom: 32 },

    /* Toast */
    toast: {
        backgroundColor: "#d1fae5", borderRadius: 10,
        marginHorizontal: 16, marginTop: 16, padding: 12,
    },
    toastText: { color: "#065f46", fontSize: 13, fontWeight: "500" },

    /* Section label */
    sectionLabel: {
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        letterSpacing: 1, marginTop: 20, marginBottom: 10, marginHorizontal: 20,
    },

    /* Card */
    card: {
        backgroundColor: "#fff", borderRadius: 14,
        marginHorizontal: 16, marginBottom: 10, padding: 14,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start" },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: GREEN, alignItems: "center",
        justifyContent: "center", marginRight: 12,
    },
    avatarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    cardInfo: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    patientName: { fontSize: 15, fontWeight: "600", color: "#111827" },
    newBadge: { backgroundColor: "#dbeafe", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    newBadgeText: { color: "#1d4ed8", fontSize: 11, fontWeight: "700" },
    patientMeta: { fontSize: 12, color: "#6b7280", marginTop: 1 },

    /* Accept / Decline */
    actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    acceptBtn: {
        flex: 1, backgroundColor: "#d1fae5", borderRadius: 8,
        paddingVertical: 9, alignItems: "center",
    },
    acceptBtnText: { color: "#065f46", fontSize: 13, fontWeight: "700" },
    declineBtn: {
        flex: 1, backgroundColor: "#fdecea", borderRadius: 8,
        paddingVertical: 9, alignItems: "center",
    },
    declineBtnText: { color: "#c62828", fontSize: 13, fontWeight: "700" },

    /* Active card */
    activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" },

    addMedBtn: { backgroundColor: "#eff6ff", borderRadius: 8, paddingVertical: 9, alignItems: "center", marginTop: 10 },
    addMedBtnText: { color: "#2563eb", fontSize: 13, fontWeight: "700" },
    /* Empty */
    emptyState: { alignItems: "center", marginTop: 40 },
    emptyText: { fontSize: 15, color: "#9ca3af" },
});
