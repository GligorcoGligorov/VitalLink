export type RootStackParamList = {
    Tabs: undefined;
    AddVital: undefined;
    AddMedication: { patientId: string; patientName: string };
    PatientDetail: { patientId: string; patientName: string };
};
