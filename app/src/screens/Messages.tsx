import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
    FlatList,
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
import { Conversation, Message } from "../types/message";

const NAVY = "#1a2340";

function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AVATAR_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777"];
function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function convDisplayName(conv: Conversation) {
    return conv.role === "doctor"
        ? `Dr. ${conv.full_name.split(" ").slice(-1)[0]}`
        : conv.full_name;
}

export default function Messages() {
    const {
        conversations, messages, unreadCounts,
        loadConversations, loadUnreadCounts,
        fetchMessages, sendMessage, appendMessage,
    } = useMedStore();

    const [selected, setSelected] = useState<Conversation | null>(null);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState("");
    const userIdRef = useRef("");
    const flatListRef = useRef<FlatList>(null);
    const subscriptionRef = useRef<any>(null);

    useFocusEffect(
        useCallback(() => {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (!user) return;
                userIdRef.current = user.id;
                setUserId(user.id);
            });
            loadConversations();
            loadUnreadCounts();

            return () => {
                subscriptionRef.current?.unsubscribe();
            };
        }, [])
    );

    function subscribeToMessages(partnerId: string) {
        subscriptionRef.current?.unsubscribe();
        subscriptionRef.current = supabase
            .channel(`chat-${userIdRef.current}-${partnerId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload: any) => {
                    const msg = payload.new as Message;
                    const uid = userIdRef.current;
                    const relevant =
                        (msg.sender_id === uid && msg.receiver_id === partnerId) ||
                        (msg.sender_id === partnerId && msg.receiver_id === uid);
                    if (relevant) {
                        appendMessage(msg);
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
                    }
                }
            )
            .subscribe();
    }

    async function openChat(conv: Conversation) {
        setSelected(conv);
        await fetchMessages(conv.id);
        subscribeToMessages(conv.id);
    }

    async function handleSend() {
        const text = input.trim();
        if (!text || !selected) return;
        setInput("");
        await sendMessage(selected.id, text);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    /* ── Chat view ── */
    if (selected) {
        return (
            <KeyboardAvoidingView
                style={styles.screen}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        setSelected(null);
                        subscriptionRef.current?.unsubscribe();
                    }}>
                        <Text style={styles.backBtn}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerSub}>Chat with</Text>
                    <Text style={styles.headerTitle}>{convDisplayName(selected)}</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === userIdRef.current;
                        return (
                            <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
                                {!isMe && (
                                    <View style={[styles.bubbleAvatar, { backgroundColor: getAvatarColor(selected.full_name) }]}>
                                        <Text style={styles.bubbleAvatarText}>{getInitials(selected.full_name)}</Text>
                                    </View>
                                )}
                                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                                    <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                                        {item.content}
                                    </Text>
                                    <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                                        {formatTime(item.created_at)}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.inputField}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#9ca3af"
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim()}
                    >
                        <Text style={styles.sendBtnText}>›</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    /* ── Conversation list ── */
    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerSub}>Inbox</Text>
                        <Text style={styles.headerTitle}>Messages</Text>
                    </View>
                    {totalUnread > 0 && <View style={styles.unreadDot} />}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                <Text style={styles.sectionLabel}>CONVERSATIONS</Text>

                {conversations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No conversations yet</Text>
                        <Text style={styles.emptyHint}>
                            Connect with a doctor to start messaging
                        </Text>
                    </View>
                ) : (
                    <View style={styles.convCard}>
                        {conversations.map((conv, idx) => {
                            const unread = unreadCounts[conv.id] ?? 0;
                            return (
                                <View key={conv.id}>
                                    <TouchableOpacity style={styles.convRow} onPress={() => openChat(conv)}>
                                        <View style={[styles.convAvatar, { backgroundColor: getAvatarColor(conv.full_name) }]}>
                                            <Text style={styles.convAvatarText}>{getInitials(conv.full_name)}</Text>
                                        </View>
                                        <View style={styles.convInfo}>
                                            <Text style={styles.convName}>{convDisplayName(conv)}</Text>
                                            <Text style={styles.convSub}>Tap to open chat</Text>
                                        </View>
                                        {unread > 0 && (
                                            <View style={styles.unreadBadge}>
                                                <Text style={styles.unreadBadgeText}>{unread}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    {idx < conversations.length - 1 && <View style={styles.convDivider} />}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f2f4f7" },

    header: { backgroundColor: NAVY, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
    backBtn: { color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 8 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444", marginBottom: 4 },

    listContent: { paddingBottom: 40 },
    sectionLabel: {
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        letterSpacing: 1, marginTop: 20, marginBottom: 10, marginHorizontal: 20,
    },

    convCard: {
        backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: "hidden",
    },
    convRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    convAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginRight: 12 },
    convAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    convInfo: { flex: 1 },
    convName: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
    convSub: { fontSize: 12, color: "#9ca3af" },
    convDivider: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 74 },
    unreadBadge: {
        backgroundColor: "#2563eb", borderRadius: 12,
        minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
    },
    unreadBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    emptyState: { alignItems: "center", marginTop: 48 },
    emptyText: { fontSize: 15, color: "#9ca3af", fontWeight: "500" },
    emptyHint: { fontSize: 13, color: "#c4c9d4", marginTop: 6, textAlign: "center", paddingHorizontal: 32 },

    chatContent: { padding: 16, paddingBottom: 8 },
    emptyChat: { alignItems: "center", marginTop: 60 },
    emptyChatText: { fontSize: 14, color: "#9ca3af" },

    bubbleWrap: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
    bubbleWrapMe: { justifyContent: "flex-end" },
    bubbleWrapThem: { justifyContent: "flex-start" },
    bubbleAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 8 },
    bubbleAvatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    bubble: { maxWidth: "72%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleMe: { backgroundColor: "#2563eb", borderBottomRightRadius: 4 },
    bubbleThem: {
        backgroundColor: "#fff", borderBottomLeftRadius: 4,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
    },
    bubbleText: { fontSize: 15, lineHeight: 20 },
    bubbleTextMe: { color: "#fff" },
    bubbleTextThem: { color: "#111827" },
    bubbleTime: { fontSize: 11, marginTop: 4 },
    bubbleTimeMe: { color: "rgba(255,255,255,0.65)", textAlign: "right" },
    bubbleTimeThem: { color: "#9ca3af" },

    inputBar: {
        flexDirection: "row", alignItems: "flex-end",
        backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f3f4f6",
        paddingHorizontal: 12, paddingVertical: 10,
        paddingBottom: Platform.OS === "ios" ? 28 : 10, gap: 10,
    },
    inputField: {
        flex: 1, backgroundColor: "#f3f4f6", borderRadius: 22,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 15, color: "#111827", maxHeight: 100,
    },
    sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
    sendBtnDisabled: { backgroundColor: "#d1d5db" },
    sendBtnText: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: -2 },
});
