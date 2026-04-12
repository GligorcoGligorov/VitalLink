export type Vital = {
  id: string;
  type: "heart_rate" | "blood_pressure" | "blood_sugar" | "weight";
  value: string;
  unit: string;
  status: "normal" | "elevated" | "high" | "low";
  recordedAt: string;
};