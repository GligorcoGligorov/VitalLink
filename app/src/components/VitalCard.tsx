import { StyleSheet, Text, View } from "react-native";
import { Vital } from "../types/Vital";

const STATUS_COLORS: Record<Vital["status"], { bg: string; text: string }> = {
    normal:   { bg: "#e6f4ea", text: "#2e7d32" },
    elevated: { bg: "#fff3e0", text: "#e65100" },
    high:     { bg: "#fdecea", text: "#c62828" },
    low:      { bg: "#e3f2fd", text: "#1565c0" },
};

const TYPE_LABELS: Record<Vital["type"], string> = {
    heart_rate:     "Heart rate",
    blood_pressure: "Blood pressure",
    blood_sugar:    "Blood sugar",
    weight:         "Weight",
};

export default function VitalCard({ vital }: { vital: Vital }) {
    const statusColor = STATUS_COLORS[vital.status];
    const label = TYPE_LABELS[vital.type];
    const statusLabel = vital.status.charAt(0).toUpperCase() + vital.status.slice(1);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{label}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColor.text }]}>{statusLabel}</Text>
                </View>
            </View>
            <Text style={styles.value}>
                {vital.value}{" "}
                <Text style={styles.unit}>{vital.unit}</Text>
            </Text>
            <Text style={styles.timestamp}>
                {new Date(vital.recordedAt).toLocaleString()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    title: {
        fontSize: 14,
        color: "#555",
        fontWeight: "500",
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    value: {
        fontSize: 32,
        fontWeight: "700",
        color: "#111",
        marginBottom: 4,
    },
    unit: {
        fontSize: 16,
        fontWeight: "400",
        color: "#555",
    },
    timestamp: {
        fontSize: 12,
        color: "#aaa",
        marginTop: 4,
    },
});
