import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useMedStore } from "../store/useMedStore";

const NAVY = "#1a2340";

function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortId(uuid: string) {
    const digits = uuid.replace(/-/g, "").replace(/\D/g, "");
    return "#" + digits.slice(-5);
}

function formatName(name: string) {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return parts[0] + " " + parts[parts.length - 1][0] + ".";
}

type EditableField = "date_of_birth" | "weight" | "height" | null;

export default function Profiles() {
    const { connectedDoctor } = useMedStore();

    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("");

    // Personal info
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");

    // Edit state
    const [editing, setEditing] = useState<EditableField>(null);
    const [draft, setDraft] = useState("");

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data } = await supabase
            .from("profiles")
            .select("full_name, role, date_of_birth, weight, height")
            .eq("id", user.id)
            .single();

        if (data) {
            setFullName(data.full_name ?? "");
            setRole(data.role ?? "patient");
            setDateOfBirth(data.date_of_birth ?? "");
            setWeight(data.weight ? String(data.weight) : "");
            setHeight(data.height ? String(data.height) : "");
        }
    }

    function startEdit(field: EditableField, currentValue: string) {
        setEditing(field);
        setDraft(currentValue);
    }

    async function saveEdit() {
        if (!editing) return;
        const updates: Record<string, string> = { [editing]: draft };
        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", userId);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        if (editing === "date_of_birth") setDateOfBirth(draft);
        if (editing === "weight") setWeight(draft);
        if (editing === "height") setHeight(draft);
        setEditing(null);
    }

    function cancelEdit() {
        setEditing(null);
    }

    async function handleChangePassword() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email);
        if (error) Alert.alert("Error", error.message);
        else Alert.alert("Check your email", "A password reset link has been sent to " + user.email);
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert("Error signing out", error.message);
    }

    const displayRole = role === "doctor" ? "Doctor" : "Patient";

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
                    </View>
                    <Text style={styles.displayName}>{formatName(fullName)}</Text>
                    <Text style={styles.roleLine}>
                        {displayRole} · ID {userId ? shortId(userId) : ""}
                    </Text>

                    {connectedDoctor && (
                        <View style={styles.doctorBadge}>
                            <Text style={styles.doctorBadgeIcon}>🏅</Text>
                            <Text style={styles.doctorBadgeText}>
                                Dr. {connectedDoctor.full_name.split(" ").slice(-1)[0]} assigned
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Personal Info ── */}
                <Text style={styles.sectionLabel}>PERSONAL INFO</Text>

                <View style={styles.card}>
                    <InfoRow
                        icon="🗓"
                        label="Date of birth"
                        value={dateOfBirth || "—"}
                        isEditing={editing === "date_of_birth"}
                        draft={draft}
                        onDraftChange={setDraft}
                        onTap={() => startEdit("date_of_birth", dateOfBirth)}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        placeholder="e.g. 12 March 2000"
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="⚖️"
                        label="Weight"
                        value={weight ? weight + " kg" : "—"}
                        isEditing={editing === "weight"}
                        draft={draft}
                        onDraftChange={setDraft}
                        onTap={() => startEdit("weight", weight)}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        placeholder="e.g. 78"
                        keyboardType="numeric"
                        suffix=" kg"
                    />
                    <View style={styles.divider} />
                    <InfoRow
                        icon="📏"
                        label="Height"
                        value={height ? height + " cm" : "—"}
                        isEditing={editing === "height"}
                        draft={draft}
                        onDraftChange={setDraft}
                        onTap={() => startEdit("height", height)}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        placeholder="e.g. 182"
                        keyboardType="numeric"
                        suffix=" cm"
                    />
                </View>

                {/* ── Settings ── */}
                <Text style={styles.sectionLabel}>SETTINGS</Text>

                <View style={styles.card}>
                    <View style={styles.settingsRow}>
                        <View style={styles.settingsIconWrap}>
                            <Text style={styles.settingsIcon}>🔔</Text>
                        </View>
                        <View style={styles.settingsInfo}>
                            <Text style={styles.settingsLabel}>Notifications</Text>
                            <Text style={styles.settingsValue}>Enabled</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.settingsRow} onPress={handleChangePassword}>
                        <View style={styles.settingsIconWrap}>
                            <Text style={styles.settingsIcon}>🔒</Text>
                        </View>
                        <View style={styles.settingsInfo}>
                            <Text style={styles.settingsLabel}>Change password</Text>
                            <Text style={styles.settingsValue}>••••••••</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Log out ── */}
                <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                    <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/* ── InfoRow component ── */
type InfoRowProps = {
    icon: string;
    label: string;
    value: string;
    isEditing: boolean;
    draft: string;
    onDraftChange: (v: string) => void;
    onTap: () => void;
    onSave: () => void;
    onCancel: () => void;
    placeholder?: string;
    keyboardType?: "default" | "numeric";
    suffix?: string;
};

function InfoRow({
    icon, label, value, isEditing, draft, onDraftChange,
    onTap, onSave, onCancel, placeholder, keyboardType = "default",
}: InfoRowProps) {
    return (
        <TouchableOpacity style={styles.infoRow} onPress={onTap} activeOpacity={0.7}>
            <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>{icon}</Text>
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                {isEditing ? (
                    <View style={styles.editRow}>
                        <TextInput
                            style={styles.editInput}
                            value={draft}
                            onChangeText={onDraftChange}
                            placeholder={placeholder}
                            keyboardType={keyboardType}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={onSave}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                            <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.infoValue}>{value}</Text>
                )}
            </View>
            {!isEditing && <Text style={styles.chevron}>›</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },
    scrollContent: { paddingBottom: 40 },

    /* Header */
    header: {
        backgroundColor: NAVY,
        paddingTop: 64,
        paddingBottom: 32,
        alignItems: "center",
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#4b5a80",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    avatarText: { color: "#fff", fontSize: 26, fontWeight: "700" },
    displayName: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
    roleLine: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 12 },
    doctorBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        gap: 6,
    },
    doctorBadgeIcon: { fontSize: 14 },
    doctorBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },

    /* Section label */
    sectionLabel: {
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        letterSpacing: 1, marginTop: 24, marginBottom: 8, marginHorizontal: 20,
    },

    /* Card */
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        overflow: "hidden",
    },
    divider: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 56 },

    /* Info rows */
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    infoIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#f1f5ff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    infoIcon: { fontSize: 16 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 2 },
    infoValue: { fontSize: 15, color: "#111827", fontWeight: "500" },
    chevron: { fontSize: 20, color: "#d1d5db", marginLeft: 8 },

    /* Edit row */
    editRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
    editInput: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
        borderBottomWidth: 1.5,
        borderBottomColor: "#2563eb",
        paddingVertical: 2,
    },
    saveBtn: {
        backgroundColor: "#2563eb",
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
    cancelBtn: { padding: 4 },
    cancelBtnText: { color: "#9ca3af", fontSize: 15 },

    /* Settings rows */
    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingsIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#f1f5ff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingsIcon: { fontSize: 16 },
    settingsInfo: { flex: 1 },
    settingsLabel: { fontSize: 15, color: "#111827", fontWeight: "500" },
    settingsValue: { fontSize: 12, color: "#9ca3af", marginTop: 1 },

    /* Log out */
    logoutBtn: {
        backgroundColor: "#fdecea",
        borderRadius: 14,
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 16,
        alignItems: "center",
    },
    logoutText: { color: "#c62828", fontSize: 16, fontWeight: "700" },
});
