import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MedCard from "../components/MedCard";
import { useMedStore } from "../store/useMedStore";
import { Medication } from "../types/medication";

function getPeriodLabel(period: string) {
  if (period === "morning")   return "MORNING";
  if (period === "afternoon") return "AFTERNOON";
  return "EVENING";
}

const PERIODS = ["morning", "afternoon", "evening"];

export default function Meds() {
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const { meds, markAsTaken, fetchMedications } = useMedStore();

  useFocusEffect(
    useCallback(() => {
      fetchMedications();
    }, [])
  );

  const takenCount = meds.filter((m) => m.status === "taken").length;
  const total = meds.length;
  const progress = total > 0 ? takenCount / total : 0;

  const sections = PERIODS.map((period) => ({
    period,
    meds: meds.filter((m) => m.period === period),
  })).filter((s) => s.meds.length > 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSub}>Today</Text>
            <Text style={styles.headerTitle}>Medications</Text>
          </View>
          <View style={styles.takenBadge}>
            <Text style={styles.takenBadgeText}>{takenCount}/{total} taken</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No medications assigned yet</Text>
          </View>
        ) : (
          sections.map(({ period, meds }) => (
            <View key={period}>
              <Text style={styles.sectionLabel}>{getPeriodLabel(period)}</Text>
              {meds.map((item) => (
                <TouchableOpacity key={item.id} onPress={() => setSelectedMed(item)}>
                  <MedCard item={item} />
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {selectedMed && selectedMed.status === "upcoming" && (
          <TouchableOpacity style={styles.markBtn} onPress={() => {
            markAsTaken(selectedMed.id);
            setSelectedMed(null);
          }}>
            <Text style={styles.markBtnText}>Mark as Taken</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f2f4f7" },
  header: { backgroundColor: "#1b2d5b", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 },
  headerSub: { fontSize: 13, color: "#a0aec0", marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#ffffff" },
  takenBadge: { backgroundColor: "#2563eb", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  takenBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  progressBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: "#34d399", borderRadius: 2 },
  content: { flex: 1 },
  contentInner: { paddingBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 1, marginTop: 20, marginBottom: 8, marginHorizontal: 20 },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
  footer: { padding: 16, backgroundColor: "#f2f4f7" },
  markBtn: { backgroundColor: "#2e7d32", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  markBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
