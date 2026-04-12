import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useMedStore } from "../store/useMedStore";
import { Medication } from "../types/medication";
import { RootStackParamList } from "../types/navigation";
import { Vital } from "../types/Vital";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "PatientDetail">;

const GREEN = "#1b4332";

function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatName(name: string) {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return parts[0] + " " + parts[parts.length - 1][0] + ".";
}

const VITAL_LABELS: Record<string, string> = {
    heart_rate: "Heart rate",
    blood_pressure: "Blood pressure",
    blood_sugar: "Blood sugar",
    weight: "Weight",
};

const VITAL_ICONS: Record<string, string> = {
    heart_rate: "❤️",
    blood_pressure: "🩸",
    blood_sugar: "💉",
    weight: "⚖️",
};

type PatientProfile = {
    date_of_birth?: string;
    weight?: number;
    height?: number;
};

export default function PatientDetail() {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<RouteType>();
    const { patientId, patientName } = route.params;
    const { declinePatient } = useMedStore();

    const [profile, setProfile] = useState<PatientProfile>({});
    const [vitals, setVitals] = useState<Vital[]>([]);
    const [meds, setMeds] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchVitals(), fetchMeds()])
            .finally(() => setLoading(false));
    }, []);

    async function fetchProfile() {
        const { data } = await supabase
            .from("profiles")
            .select("date_of_birth, weight, height")
            .eq("id", patientId)
            .single();
        if (data) setProfile(data);
    }

    async function fetchVitals() {
        const { data } = await supabase
            .from("vitals")
            .select("*")
            .eq("user_id", patientId)
            .order("created_at", { ascending: false })
            .limit(5);
        if (data) setVitals(data as Vital[]);
    }

    async function fetchMeds() {
        const { data } = await supabase
            .from("medications")
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false });
        if (data) setMeds(data as Medication[]);
    }

    function handleRemove() {
        Alert.alert(
            "Remove patient",
            `Remove ${patientName} from your patients?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove", style: "destructive",
                    onPress: async () => {
                        await declinePatient(patientId);
                        navigation.goBack();
                    },
                },
            ]
        );
    }

    const hasElevated = vitals.some((v) => v.status === "elevated" || v.status === "high");

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={GREEN} size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>‹ Back</Text>
                </TouchableOpacity>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{getInitials(patientName)}</Text>
                </View>
                <Text style={styles.headerSub}>Patient overview</Text>
                <Text style={styles.headerTitle}>{formatName(patientName)}</Text>
            </View>

            {/* ── Personal Info ── */}
            <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
            <View style={styles.card}>
                <InfoRow label="Date of birth" value={profile.date_of_birth || "—"} />
                <View style={styles.divider} />
                <InfoRow label="Weight" value={profile.weight ? `${profile.weight} kg` : "—"} />
                <View style={styles.divider} />
                <InfoRow label="Height" value={profile.height ? `${profile.height} cm` : "—"} />
                <View style={styles.divider} />
                <InfoRow
                    label="Status"
                    value={hasElevated ? "Needs attention" : vitals.length === 0 ? "No data" : "Normal"}
                    valueStyle={hasElevated ? styles.statusDanger : vitals.length === 0 ? styles.statusNeutral : styles.statusGood}
                />
            </View>

            {/* ── Latest Vitals ── */}
            <Text style={styles.sectionLabel}>LATEST VITALS</Text>
            {vitals.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No vitals recorded yet</Text>
                </View>
            ) : (
                <View style={styles.card}>
                    {vitals.map((v, idx) => {
                        const isGood = v.status === "normal";
                        return (
                            <View key={v.id}>
                                <View style={styles.vitalRow}>
                                    <Text style={styles.vitalIcon}>{VITAL_ICONS[v.type] ?? "📊"}</Text>
                                    <Text style={styles.vitalName}>{VITAL_LABELS[v.type] ?? v.type}</Text>
                                    <View style={[styles.vitalBadge, { backgroundColor: isGood ? "#d1fae5" : "#fdecea" }]}>
                                        <Text style={[styles.vitalValue, { color: isGood ? "#065f46" : "#c62828" }]}>
                                            {v.value} {v.unit}
                                        </Text>
                                    </View>
                                </View>
                                {idx < vitals.length - 1 && <View style={styles.divider} />}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* ── Medications ── */}
            <Text style={styles.sectionLabel}>MEDICATIONS</Text>
            {meds.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No medications prescribed yet</Text>
                </View>
            ) : (
                <View style={styles.card}>
                    {meds.map((med, idx) => {
                        const statusColor =
                            med.status === "taken" ? "#22c55e" :
                            med.status === "missed" ? "#ef4444" : "#f59e0b";
                        return (
                            <View key={med.id}>
                                <View style={styles.medRow}>
                                    <View style={styles.medInfo}>
                                        <Text style={styles.medName}>{med.name}</Text>
                                        <Text style={styles.medMeta}>{med.dose} · {med.time} · {med.period}</Text>
                                    </View>
                                    <View style={[styles.medBadge, { backgroundColor: statusColor + "22" }]}>
                                        <Text style={[styles.medBadgeText, { color: statusColor }]}>
                                            {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                                        </Text>
                                    </View>
                                </View>
                                {idx < meds.length - 1 && <View style={styles.divider} />}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* ── Actions ── */}
            <TouchableOpacity
                style={styles.messageBtn}
                onPress={() => navigation.navigate("Tabs", { screen: "Messages" } as any)}
            >
                <Text style={styles.messageBtnText}>💬  Send Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <Text style={styles.removeBtnText}>Remove patient</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: any }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },
    scrollContent: { paddingBottom: 48 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f2f4f7" },

    /* Header */
    header: {
        backgroundColor: GREEN,
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28,
        alignItems: "center",
    },
    backBtn: { color: "rgba(255,255,255,0.75)", fontSize: 16, alignSelf: "flex-start", marginBottom: 16 },
    avatarCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center", marginBottom: 12,
    },
    avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: "700", color: "#fff" },

    /* Section label */
    sectionLabel: {
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        letterSpacing: 1, marginTop: 24, marginBottom: 8, marginHorizontal: 20,
    },

    /* Card */
    card: {
        backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: "hidden",
    },
    divider: { height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 16 },
    emptyCard: {
        backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16,
        paddingVertical: 20, alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    emptyText: { color: "#9ca3af", fontSize: 14 },

    /* Info row */
    infoRow: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
    },
    infoLabel: { fontSize: 14, color: "#6b7280" },
    infoValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
    statusGood: { color: "#22c55e", fontWeight: "700" },
    statusDanger: { color: "#ef4444", fontWeight: "700" },
    statusNeutral: { color: "#9ca3af", fontWeight: "600" },

    /* Vital row */
    vitalRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    },
    vitalIcon: { fontSize: 18 },
    vitalName: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },
    vitalBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    vitalValue: { fontSize: 13, fontWeight: "700" },

    /* Med row */
    medRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    },
    medInfo: { flex: 1 },
    medName: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
    medMeta: { fontSize: 12, color: "#9ca3af" },
    medBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    medBadgeText: { fontSize: 12, fontWeight: "700" },

    /* Actions */
    messageBtn: {
        backgroundColor: GREEN, borderRadius: 14,
        marginHorizontal: 16, marginTop: 28,
        paddingVertical: 16, alignItems: "center",
    },
    messageBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    removeBtn: { alignItems: "center", marginTop: 14, paddingVertical: 8 },
    removeBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },
});