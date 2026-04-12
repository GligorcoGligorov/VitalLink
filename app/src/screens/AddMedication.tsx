import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useMedStore } from "../store/useMedStore";
import { RootStackParamList } from "../types/navigation";

type AddMedRouteProp = RouteProp<RootStackParamList, "AddMedication">;

type Period = "morning" | "afternoon" | "evening";

const PERIODS: Period[] = ["morning", "afternoon", "evening"];
const PERIOD_LABELS: Record<Period, string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
};

export default function AddMedication() {
    const route = useRoute<AddMedRouteProp>();
    const navigation = useNavigation();
    const { patientId, patientName } = route.params;
    const { addMedication } = useMedStore();

    const [name, setName] = useState("");
    const [dose, setDose] = useState("");
    const [note, setNote] = useState("");
    const [time, setTime] = useState("");
    const [period, setPeriod] = useState<Period>("morning");
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name || !dose || !time) {
            Alert.alert("Missing fields", "Please fill in name, dose and time.");
            return;
        }
        setLoading(true);
        const error = await addMedication({
            name,
            dose,
            note,
            time,
            period,
            status: "upcoming",
            patient_id: patientId,
        });
        setLoading(false);
        if (error) {
            Alert.alert("Error", error);
        } else {
            navigation.goBack();
        }
    }

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerSub}>Adding medication for</Text>
                <Text style={styles.headerTitle}>{patientName}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                <Text style={styles.label}>MEDICATION NAME</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Metformin"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>DOSE</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 500mg"
                    placeholderTextColor="#9ca3af"
                    value={dose}
                    onChangeText={setDose}
                />

                <Text style={styles.label}>NOTE</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Take with food"
                    placeholderTextColor="#9ca3af"
                    value={note}
                    onChangeText={setNote}
                />

                <Text style={styles.label}>TIME</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 08:00"
                    placeholderTextColor="#9ca3af"
                    value={time}
                    onChangeText={setTime}
                />

                <Text style={styles.label}>PERIOD</Text>
                <View style={styles.periodRow}>
                    {PERIODS.map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                            onPress={() => setPeriod(p)}
                        >
                            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                                {PERIOD_LABELS[p]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveBtnText}>
                        {loading ? "Saving..." : "Add Medication"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const BLUE = "#2563eb";

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },
    header: { backgroundColor: BLUE, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
    headerTitle: { fontSize: 26, fontWeight: "700", color: "#fff" },
    content: { flex: 1 },
    contentInner: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.8, marginBottom: 6, marginTop: 16 },
    input: {
        backgroundColor: "#fff", borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 15, color: "#111827",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    },
    periodRow: { flexDirection: "row", gap: 10 },
    periodBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10,
        alignItems: "center", backgroundColor: "#fff",
        borderWidth: 1.5, borderColor: "#e5e7eb",
    },
    periodBtnActive: { backgroundColor: "#eff6ff", borderColor: BLUE },
    periodBtnText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
    periodBtnTextActive: { color: BLUE },
    saveBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 32 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
