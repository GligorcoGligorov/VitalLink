export type Medication = {
    id: string;
    name: string;
    dose: string;
    note: string;
    time: string;
    period: string;
    status: string;
    patient_id?: string;
    doctor_id?: string;
}
