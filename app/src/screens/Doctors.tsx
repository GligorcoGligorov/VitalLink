import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useMedStore } from "../store/useMedStore";
import { Doctor } from "../types/doctor";

function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777"];
function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Doctors() {
    const { doctors, requestMap, connectedDoctor, fetchDoctors, sendRequest, removeDoctor } = useMedStore();
    const navigation = useNavigation<any>();
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchDoctors().finally(() => setLoading(false));
        }, [])
    );

    async function handleRequest(doctor: Doctor) {
        const error = await sendRequest(doctor);
        if (error) {
            Alert.alert("Error", error);
        } else {
            setToast(`Request sent to ${doctor.full_name} — awaiting approval`);
            setTimeout(() => setToast(""), 4000);
        }
    }

    const filtered = doctors.filter((d) =>
        d.full_name.toLowerCase().includes(search.toLowerCase())
    );

    /* ── Connected view ── */
    if (connectedDoctor) {
        return (
            <View style={styles.screen}>
                <View style={[styles.header, { backgroundColor: "#059669" }]}>
                    <Text style={styles.headerSub}>Your doctor</Text>
                    <Text style={styles.headerTitle}>Connected ✓</Text>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                    <View style={styles.successToast}>
                        <Text style={styles.successToastText}>
                            ✓  {connectedDoctor.full_name} accepted your request!
                        </Text>
                    </View>

                    <View style={styles.connectedCard}>
                        <View style={styles.connectedCardTop}>
                            <View style={[styles.avatar, { backgroundColor: getAvatarColor(connectedDoctor.full_name) }]}>
                                <Text style={styles.avatarText}>{getInitials(connectedDoctor.full_name)}</Text>
                            </View>
                            <View style={styles.connectedInfo}>
                                <Text style={styles.doctorName}>{connectedDoctor.full_name}</Text>
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>Active</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.sendMsgBtn} onPress={() => navigation.navigate("Messages")}>
                            <Text style={styles.sendMsgBtnText}>💬  Send Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={removeDoctor}>
                            <Text style={styles.removeText}>Remove doctor</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    /* ── Browse view ── */
    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.headerSub}>Find your doctor</Text>
                <Text style={styles.headerTitle}>Doctors</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or specialty..."
                        placeholderTextColor="#9ca3af"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {toast ? (
                    <View style={styles.pendingToast}>
                        <Text style={styles.pendingToastText}>⏳  {toast}</Text>
                    </View>
                ) : null}

                <Text style={styles.sectionLabel}>AVAILABLE DOCTORS</Text>

                {loading ? (
                    <ActivityIndicator color={BLUE} style={{ marginTop: 40 }} />
                ) : filtered.length === 0 ? (
                    <Text style={styles.emptyText}>No doctors found</Text>
                ) : (
                    filtered.map((doctor) => {
                        const status = requestMap[doctor.id] ?? "none";
                        return (
                            <View key={doctor.id} style={styles.card}>
                                <View style={[styles.avatar, { backgroundColor: getAvatarColor(doctor.full_name) }]}>
                                    <Text style={styles.avatarText}>{getInitials(doctor.full_name)}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.doctorName}>{doctor.full_name}</Text>
                                    <Text style={styles.doctorSub}>Doctor</Text>
                                </View>
                                {status === "none" && (
                                    <TouchableOpacity style={styles.requestBtn} onPress={() => handleRequest(doctor)}>
                                        <Text style={styles.requestBtnText}>Request</Text>
                                    </TouchableOpacity>
                                )}
                                {status === "pending" && (
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText}>Pending</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const BLUE = "#2563eb";

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },
    header: { backgroundColor: BLUE, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
    headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
    content: { flex: 1 },
    contentInner: { paddingBottom: 32 },
    searchBar: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        borderRadius: 12, marginHorizontal: 16, marginTop: 16,
        paddingHorizontal: 12, paddingVertical: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    searchIcon: { fontSize: 15, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: "#111827" },
    pendingToast: { backgroundColor: "#fef3c7", borderRadius: 10, marginHorizontal: 16, marginTop: 12, padding: 12 },
    pendingToastText: { fontSize: 13, color: "#92400e", fontWeight: "500" },
    successToast: { backgroundColor: "#d1fae5", borderRadius: 10, marginHorizontal: 16, marginTop: 16, padding: 12 },
    successToastText: { fontSize: 13, color: "#065f46", fontWeight: "500" },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 1, marginTop: 20, marginBottom: 10, marginHorizontal: 20 },
    card: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
    avatarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    cardInfo: { flex: 1 },
    doctorName: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
    doctorSub: { fontSize: 12, color: "#6b7280" },
    requestBtn: { borderWidth: 1.5, borderColor: BLUE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
    requestBtnText: { color: BLUE, fontSize: 13, fontWeight: "600" },
    pendingBadge: { backgroundColor: "#fef3c7", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
    pendingBadgeText: { color: "#92400e", fontSize: 13, fontWeight: "600" },
    connectedCard: {
        backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16, marginTop: 20, padding: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        borderWidth: 1.5, borderColor: "#059669",
    },
    connectedCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    connectedInfo: { flex: 1, marginLeft: 12 },
    activeBadge: { alignSelf: "flex-start", backgroundColor: "#d1fae5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
    activeBadgeText: { color: "#065f46", fontSize: 12, fontWeight: "600" },
    sendMsgBtn: { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
    sendMsgBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    removeText: { textAlign: "center", color: "#c62828", fontSize: 14, fontWeight: "600" },
    emptyText: { textAlign: "center", color: "#9ca3af", fontSize: 15, marginTop: 40 },
});
