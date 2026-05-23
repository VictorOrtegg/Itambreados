import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/syncService';
import { supabase } from '../services/supabaseClient';

export default function ChatRoomScreen({ route, navigation }: any) {
    const { conversationId, recipientName, recipientId } = route.params;
    const { user } = useAuth();
    
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isOnline, setIsOnline] = useState(syncService.isOnline());
    const flatListRef = useRef<FlatList>(null);

    // Load messages from local cache and refresh periodically
    const loadMessages = async () => {
        try {
            const cachedMessages = await syncService.getItems('messages', { conversation_id: conversationId });
            // Sort by created_at ascending
            cachedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setMessages(cachedMessages);
        } catch (e) {
            console.error('Error loading messages from syncService:', e);
        }
    };

    useEffect(() => {
        loadMessages();

        // Listen to connectivity shifts
        const unsubscribeConn = syncService.onConnectionChange((onlineStatus) => {
            setIsOnline(onlineStatus);
            if (onlineStatus) {
                loadMessages();
            }
        });

        // Polling check for new messages
        const pollInterval = setInterval(() => {
            loadMessages();
        }, 3000);

        // Supabase Realtime Subscription for online users
        let channel: any = null;
        if (syncService.isOnline()) {
            channel = supabase
                .channel(`chat_room_${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    async (payload) => {
                        // Save new message in cache directly without enqueuing
                        await syncService.cacheItem('messages', payload.new);
                        loadMessages();
                    }
                )
                .subscribe();
        }

        return () => {
            unsubscribeConn();
            clearInterval(pollInterval);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [conversationId]);

    // Send a message
    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        const text = inputText.trim();
        setInputText('');

        const messageData = {
            conversation_id: conversationId,
            sender_id: user.id,
            content: text,
            created_at: new Date().toISOString(),
        };

        try {
            // optimistically save locally & enqueue sync
            const saved = await syncService.saveItem('messages', messageData);
            
            // Update conversation last message locally
            const cachedConvs = await syncService.getItems('conversations', { id: conversationId });
            if (cachedConvs.length > 0) {
                const conv = {
                    ...cachedConvs[0],
                    last_message: text,
                    last_message_at: new Date().toISOString()
                };
                await syncService.saveItem('conversations', conv);
            }

            // Refresh view
            await loadMessages();
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (e) {
            console.error('Error sending message:', e);
        }
    };

    const renderMessageItem = ({ item }: any) => {
        const isSelf = item.sender_id === user?.id;
        const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[styles.messageRow, isSelf ? styles.selfRow : styles.otherRow]}>
                <View style={[styles.bubble, isSelf ? styles.selfBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isSelf ? styles.selfText : styles.otherText]}>
                        {item.content}
                    </Text>
                    <View style={styles.bubbleMeta}>
                        <Text style={[styles.timeText, isSelf ? styles.selfTime : styles.otherTime]}>
                            {time}
                        </Text>
                        {isSelf && (
                            <Text style={styles.syncIcon}>
                                {item.sync_status === 'pending' ? '⏳' : '✔✔'}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.headerIcon}>←</Text>
                </TouchableOpacity>
                
                <View style={styles.headerInfo}>
                    <Text style={styles.recipientName}>{recipientName}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                        <Text style={styles.statusText}>
                            {isOnline ? 'Conectado (Línea)' : 'Sin Conexión (Offline Local)'}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Chat List */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.keyboardContainer}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Container */}
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Escribe tu mensaje..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        style={styles.input}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        disabled={!inputText.trim()}
                    >
                        <Text style={styles.sendText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
        backgroundColor: '#FFF',
    },
    backBtn: {
        padding: 6,
    },
    headerIcon: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    recipientName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    onlineDot: {
        backgroundColor: '#10B981', // green
    },
    offlineDot: {
        backgroundColor: '#F59E0B', // amber/orange
    },
    statusText: {
        fontSize: 11,
        color: '#6B7280',
    },
    headerPlaceholder: {
        width: 34,
    },
    keyboardContainer: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 14,
        width: '100%',
    },
    selfRow: {
        justifyContent: 'flex-end',
    },
    otherRow: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    selfBubble: {
        backgroundColor: '#0B0E1E', // Navy background for self
        borderTopRightRadius: 2,
    },
    otherBubble: {
        backgroundColor: '#F3F4F6', // Light gray background for others
        borderTopLeftRadius: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    selfText: {
        color: '#FFF',
    },
    otherText: {
        color: '#1F2937',
    },
    bubbleMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
    },
    timeText: {
        fontSize: 10,
    },
    selfTime: {
        color: '#9CA3AF',
    },
    otherTime: {
        color: '#9CA3AF',
    },
    syncIcon: {
        fontSize: 10,
        marginLeft: 6,
        color: '#10B981', // Synced green checks
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: '#F3F4F6',
        backgroundColor: '#FFF',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingRight: 50,
        fontSize: 15,
        color: '#1F2937',
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF7A00', // Vibrant orange send button
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
    sendText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
