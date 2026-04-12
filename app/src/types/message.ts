export type Conversation = {
    id: string;
    full_name: string;
    role: string;
};

export type Message = {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
};
