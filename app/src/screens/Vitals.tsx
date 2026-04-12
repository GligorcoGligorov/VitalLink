import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import VitalCard from "../components/VitalCard";
import { supabase } from "../lib/supabase";
import { useMedStore } from "../store/useMedStore";
import { RootStackParamList } from "../types/navigation";

type VitalsNavProp = NativeStackNavigationProp<RootStackParamList>;

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STATUS_CONFIG = {
    taken:    { dot: "#22c55e", label: "✓" },
    missed:   { dot: "#ef4444", label: "—" },
    upcoming: { dot: "#2563eb", label: "•" },
};

export default function Vitals() {
    const navigation = useNavigation<VitalsNavProp>();
    const { meds, vitals, fetchVitals } = useMedStore();
    const [firstName, setFirstName] = useState("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            const name = user?.user_metadata?.full_name ?? "";
            setFirstName(name.trim().split(" ")[0]);
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchVitals();
        }, [])
    );

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerSub}>{getGreeting()}</Text>
                        <Text style={styles.headerTitle}>{firstName}</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(firstName)}</Text>
                    </View>
                </View>
            </View>

            {/* ── Today's Vitals ── */}
            <Text style={styles.sectionLabel}>TODAY'S VITALS</Text>
            {vitals.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No vitals recorded yet</Text>
                </View>
            ) : (
                <FlatList
                    data={vitals}
                    renderItem={({ item }) => <VitalCard vital={item} />}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                />
            )}

            {/* ── Medications ── */}
            {meds.length > 0 && (
                <>
                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>MEDICATIONS</Text>
                    <View style={styles.medsCard}>
                        {meds.map((med, idx) => {
                            const config = STATUS_CONFIG[med.status as keyof typeof STATUS_CONFIG];
                            return (
                                <View key={med.id}>
                                    <View style={styles.medRow}>
                                        <View style={[styles.medDot, { backgroundColor: config.dot }]} />
                                        <Text style={styles.medName}>{med.name} {med.dose}</Text>
                                        <Text style={styles.medTime}>{med.time} {config.label}</Text>
                                    </View>
                                    {idx < meds.length - 1 && <View style={styles.medDivider} />}
                                </View>
                            );
                        })}
                    </View>
                </>
            )}

            {/* ── Log Vitals button ── */}
            <TouchableOpacity
                style={styles.logBtn}
                onPress={() => navigation.navigate("AddVital")}
            >
                <Text style={styles.logBtnText}>+ Log vitals</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const BLUE = "#2563eb";

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },
    scrollContent: { paddingBottom: 40 },

    /* Header */
    header: {
        backgroundColor: BLUE,
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
    headerTitle: { fontSize: 30, fontWeight: "700", color: "#fff" },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },

    /* Section label */
    sectionLabel: {
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        letterSpacing: 1, marginTop: 20, marginBottom: 10, marginHorizontal: 20,
    },

    /* Empty */
    emptyState: { alignItems: "center", marginTop: 32 },
    emptyText: { fontSize: 15, color: "#9ca3af" },

    /* Meds */
    medsCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    medRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    medDivider: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 34 },
    medDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    medName: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },
    medTime: { fontSize: 13, color: "#6b7280" },

    /* Log button */
    logBtn: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    logBtnText: { color: "#111827", fontSize: 16, fontWeight: "600" },
});
