import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/syncService';

export default function ChatListScreen({ navigation }: any) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadConversations = async () => {
            if (!user) return;
            try {
                // Get all cached conversations
                const cachedConvs = await syncService.getItems('conversations');
                
                // For each conversation, fetch the other user's profile details
                const enriched = await Promise.all(
                    cachedConvs.map(async (c) => {
                        const isBuyer = c.buyer_id === user.id;
                        const otherId = isBuyer ? c.seller_id : c.buyer_id;

                        // Fetch other user's profile
                        const otherProfiles = await syncService.getItems('profiles', { id: otherId });
                        const otherName = otherProfiles.length > 0
                            ? otherProfiles[0].full_name
                            : (isBuyer ? 'Vendedor' : 'Comprador');
                        const otherAvatar = otherProfiles.length > 0
                            ? (otherProfiles[0].avatar_url || '👤')
                            : '👤';
                        
                        return {
                            ...c,
                            recipientName: otherName,
                            recipientId: otherId,
                            avatar: otherAvatar
                        };
                    })
                );

                // Sort by last message date descending
                enriched.sort((a, b) => 
                    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                );

                setConversations(enriched);
            } catch (e) {
                console.error('Error loading conversations:', e);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
        
        // Listen to online sync flushes which could update details
        const unsubscribe = syncService.onConnectionChange((online) => {
            if (online) loadConversations();
        });

        // Polling update check for real-time changes
        const interval = setInterval(loadConversations, 5000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [user]);

    const renderItem = ({ item }: any) => {
        const messageTime = new Date(item.last_message_at);
        const timeString = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                style={styles.chatCard}
                onPress={() => navigation.navigate('ChatRoom', {
                    conversationId: item.id,
                    recipientName: item.recipientName,
                    recipientId: item.recipientId
                })}
            >
                <View style={styles.avatarContainer}>
                    {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{item.avatar}</Text>
                    )}
                </View>
                <View style={styles.chatInfo}>
                    <Text style={styles.recipientName}>{item.recipientName}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message}
                    </Text>
                </View>
                <View style={styles.meta}>
                    <Text style={styles.timeText}>{timeString}</Text>
                    {item.sync_status === 'pending' && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>⏳</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Mensajes</Text>
                <View style={styles.badgePlaceholder} />
            </View>

            {loading ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Cargando chats...</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No tienes conversaciones activas.</Text>
                            <Text style={styles.emptySubtext}>Contacta a un vendedor desde los detalles de un producto para iniciar una venta.</Text>
                        </View>
                    }
                />
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    backBtn: {
        padding: 6,
    },
    backText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0B0E1E',
    },
    badgePlaceholder: {
        width: 34,
    },
    listContent: {
        paddingVertical: 10,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: '#F9FAFB',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E6F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    chatInfo: {
        flex: 1,
    },
    recipientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#6B7280',
    },
    meta: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    pendingBadge: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    pendingText: {
        fontSize: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
});
