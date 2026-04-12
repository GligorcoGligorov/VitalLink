import { StyleSheet, Text, View } from "react-native";
import { Medication } from '../types/medication';

function getStatusConfig(status: Medication["status"]) {
  if (status === "taken")    return { label: "Taken",    bg: "#e6f4ea", text: "#2e7d32", symbol: "✓" };
  if (status === "missed")   return { label: "Missed",   bg: "#fdecea", text: "#c62828", symbol: "✗" };
  return                            { label: "Upcoming", bg: "#e8f0fe", text: "#1a73e8", symbol: "" };
}

function getPillColor(period: Medication["period"]) {
  if (period === "morning")   return "#f48fb1";
  if (period === "afternoon") return "#ffb74d";
  return "#81d4fa";
}

export default function MedCard({ item }: { item: Medication }) {
  const status = getStatusConfig(item.status);
  const pillColor = getPillColor(item.period);

  return (
    <View style={styles.card}>
      <View style={[styles.pillIcon, { backgroundColor: pillColor + "33" }]}>
        <View style={[styles.pillDot, { backgroundColor: pillColor }]} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.medName}>{item.name}</Text>
        <Text style={styles.medDose}>
          {item.dose} · {item.note}
        </Text>
      </View>
      <Text style={styles.medTime}>{item.time}</Text>
      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        {status.symbol ? (
          <Text style={[styles.statusSymbol, { color: status.text }]}>
            {status.symbol}
          </Text>
        ) : null}
        <Text style={[styles.statusText, { color: status.text }]}>
          {status.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f4f7",
  },

  /* Header */
  header: {
    backgroundColor: "#1b2d5b",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  headerSub: {
    fontSize: 13,
    color: "#a0aec0",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  takenBadge: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  takenBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#34d399",
    borderRadius: 2,
  },

  /* Content */
  content: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 20,
  },

  /* Med Card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pillDot: {
    width: 16,
    height: 10,
    borderRadius: 5,
  },
  cardInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  medDose: {
    fontSize: 12,
    color: "#6b7280",
  },
  medTime: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 3,
  },
  statusSymbol: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* Footer */
  footer: {
    padding: 16,
    backgroundColor: "#f2f4f7",
  },
  markBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  markBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
