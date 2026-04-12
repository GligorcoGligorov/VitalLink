export type Patient = {
    id: string;
    full_name: string;
    role: string;
    status?: "pending" | "active";
    created_at?: string;
    profiles?: { id: string; full_name: string; role: string };
}
