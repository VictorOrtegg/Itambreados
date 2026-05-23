import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';

export interface SyncQueueItem {
    id: string;
    table: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: number;
}

// Generate a pure JS RFC4122 compliant UUID v4
export const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

class SyncService {
    private isSyncing = false;
    private onlineStatus = true;
    private connectionListeners: ((status: boolean) => void)[] = [];

    constructor() {
        // Start connection checker
        this.checkConnectionLoop();
        // Clean bad simulated records from queue and caches to repair previous crashes
        this.cleanBadRecords();
    }

    // Subscribe to online/offline state changes
    onConnectionChange(callback: (status: boolean) => void) {
        this.connectionListeners.push(callback);
        callback(this.onlineStatus);
        return () => {
            this.connectionListeners = this.connectionListeners.filter(l => l !== callback);
        };
    }

    private setOnlineStatus(status: boolean) {
        if (this.onlineStatus !== status) {
            this.onlineStatus = status;
            console.log(`[SyncService] Connection state: ${status ? 'ONLINE' : 'OFFLINE'}`);
            this.connectionListeners.forEach(listener => listener(status));
            if (status) {
                this.flushQueue();
            }
        }
    }

    // Direct network ping to check actual online status
    async checkConnection(): Promise<boolean> {
        try {
            // Attempt to ping Supabase REST API (cheap request)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'GET',
                headers: { apikey: supabaseAnonKey },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const isUp = response.status === 200 || response.status === 404 || response.status === 401;
            this.setOnlineStatus(isUp);
            return isUp;
        } catch (e) {
            this.setOnlineStatus(false);
            return false;
        }
    }

    private async checkConnectionLoop() {
        await this.checkConnection();
        // Check every 7 seconds
        setInterval(() => {
            this.checkConnection();
        }, 7000);
    }

    isOnline(): boolean {
        return this.onlineStatus;
    }

    private isTerminalError(code: string | undefined): boolean {
        if (!code) return false;
        // Postgres error codes for syntax, RLS, foreign key, duplicate key, undefined column, etc.
        const terminalCodes = ['22P02', '23505', '23503', '42501', '23502', '42P01', '42703'];
        return terminalCodes.includes(code);
    }

    private async cleanBadRecords() {
        try {
            // 1. Clean the sync queue of bad simulated/mockup IDs
            const queueStr = await AsyncStorage.getItem('@ITAmbriados:sync_queue');
            if (queueStr) {
                const queue: SyncQueueItem[] = JSON.parse(queueStr);
                const filteredQueue = queue.filter(item => {
                    if (item.table === 'profiles' || item.table === 'conversations' || item.table === 'messages' || item.table === 'products') {
                        const id = item.data?.id;
                        if (id && typeof id === 'string') {
                            if (id.startsWith('simulated-uid-') || id === '1' || id === '2') {
                                console.warn(`[SyncService] Removing bad simulated ID "${id}" from queue for table ${item.table}`);
                                return false;
                            }
                            if (item.table === 'conversations') {
                                const bid = item.data?.buyer_id;
                                const sid = item.data?.seller_id;
                                if ((bid && (bid.startsWith('simulated-uid-') || bid === '1' || bid === '2')) ||
                                    (sid && (sid.startsWith('simulated-uid-') || sid === '1' || sid === '2'))) {
                                    console.warn(`[SyncService] Removing bad conversation from queue (buyer: ${bid}, seller: ${sid})`);
                                    return false;
                                }
                            }
                            if (item.table === 'messages') {
                                const senderId = item.data?.sender_id;
                                const convId = item.data?.conversation_id;
                                if ((senderId && (senderId.startsWith('simulated-uid-') || senderId === '1' || senderId === '2')) ||
                                    (convId && (convId === '1' || convId === '2' || convId.startsWith('simulated-uid-')))) {
                                    console.warn(`[SyncService] Removing bad message from queue (sender: ${senderId}, conv: ${convId})`);
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                });
                
                if (filteredQueue.length !== queue.length) {
                    await AsyncStorage.setItem('@ITAmbriados:sync_queue', JSON.stringify(filteredQueue));
                    console.log(`[SyncService] Repaired sync queue. Reduced from ${queue.length} to ${filteredQueue.length} items.`);
                }
            }

            // 2. Clean cache tables of bad simulated/mockup IDs
            const tables = ['profiles', 'products', 'conversations', 'messages'];
            for (const table of tables) {
                const cacheKey = `@ITAmbriados:cache:${table}`;
                const cachedData = await AsyncStorage.getItem(cacheKey);
                if (cachedData) {
                    const items = JSON.parse(cachedData);
                    const filteredItems = items.filter((item: any) => {
                        const id = item.id;
                        if (id && typeof id === 'string') {
                            if (id.startsWith('simulated-uid-') || id === '1' || id === '2') {
                                return false;
                            }
                            if (table === 'conversations') {
                                const bid = item.buyer_id;
                                const sid = item.seller_id;
                                if ((bid && (bid.startsWith('simulated-uid-') || bid === '1' || bid === '2')) ||
                                    (sid && (sid.startsWith('simulated-uid-') || sid === '1' || sid === '2'))) {
                                    return false;
                                }
                            }
                            if (table === 'messages') {
                                const senderId = item.sender_id;
                                const convId = item.conversation_id;
                                if ((senderId && (senderId.startsWith('simulated-uid-') || senderId === '1' || senderId === '2')) ||
                                    (convId && (convId === '1' || convId === '2' || convId.startsWith('simulated-uid-')))) {
                                    return false;
                                }
                            }
                            if (table === 'products') {
                                const vid = item.vendor_id;
                                if (vid && (vid.startsWith('simulated-uid-') || vid === '1' || vid === '2')) {
                                    return false;
                                }
                            }
                        }
                        return true;
                    });
                    if (filteredItems.length !== items.length) {
                        await AsyncStorage.setItem(cacheKey, JSON.stringify(filteredItems));
                        console.log(`[SyncService] Repaired cache for ${table}. Reduced from ${items.length} to ${filteredItems.length} items.`);
                    }
                }
            }
        } catch (err) {
            console.error('[SyncService] Error during self-healing startup migration:', err);
        }
    }

    /**
     * CORE READ: Get all items from local cache, fallback/merge from Supabase if online
     */
    async getItems(table: string, matchQuery?: any): Promise<any[]> {
        // 1. Read from AsyncStorage cache
        const cacheKey = `@ITAmbriados:cache:${table}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        let items = cachedData ? JSON.parse(cachedData) : [];

        // Apply filters if any
        if (matchQuery) {
            items = items.filter((item: any) => {
                for (const key in matchQuery) {
                    if (item[key] !== matchQuery[key]) return false;
                }
                return true;
            });
        }

        // 2. Fetch fresh data in background if online, then write to cache and update
        if (this.onlineStatus) {
            this.fetchAndCacheTable(table).catch(err => 
                console.warn(`[SyncService] Background fetch failed for ${table}:`, err)
            );
        }

        return items;
    }

    /**
     * CORE WRITE (Insert / Update / Delete)
     * Performs optimistic local write, queues operation, triggers sync in background
     */
    async saveItem(table: string, itemData: any, idField = 'id'): Promise<any> {
        const cacheKey = `@ITAmbriados:cache:${table}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        let items = cachedData ? JSON.parse(cachedData) : [];

        let finalItem = { ...itemData };
        let action: 'INSERT' | 'UPDATE' = 'INSERT';

        if (finalItem[idField]) {
            // Update
            const index = items.findIndex((i: any) => i[idField] === finalItem[idField]);
            if (index !== -1) {
                items[index] = { ...items[index], ...finalItem };
                action = 'UPDATE';
            } else {
                items.push(finalItem);
            }
        } else {
            // Insert: Generate temporary client UUID
            finalItem[idField] = generateUUID();
            finalItem.sync_status = 'pending';
            items.push(finalItem);
        }

        // Save back to local cache
        await AsyncStorage.setItem(cacheKey, JSON.stringify(items));

        // Queue for synchronization
        await this.enqueueOperation(table, action, finalItem);

        // Attempt background flush immediately
        this.flushQueue();

        return finalItem;
    }

    /**
     * Cache an item directly without enqueuing it (used for remote real-time inserts)
     */
    async cacheItem(table: string, itemData: any, idField = 'id'): Promise<any> {
        const cacheKey = `@ITAmbriados:cache:${table}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        let items = cachedData ? JSON.parse(cachedData) : [];

        const finalItem = { ...itemData, sync_status: 'synced' };

        const index = items.findIndex((i: any) => i[idField] === finalItem[idField]);
        if (index !== -1) {
            items[index] = { ...items[index], ...finalItem };
        } else {
            items.push(finalItem);
        }

        await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
        return finalItem;
    }

    async deleteItem(table: string, id: string | number, idField = 'id'): Promise<void> {
        const cacheKey = `@ITAmbriados:cache:${table}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        let items = cachedData ? JSON.parse(cachedData) : [];

        items = items.filter((i: any) => i[idField] !== id);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(items));

        // Queue delete operation
        await this.enqueueOperation(table, 'DELETE', { [idField]: id });

        // Attempt background flush
        this.flushQueue();
    }

    /**
     * FETCH & CACHE: Download the whole table, store locally
     */
    async fetchAndCacheTable(table: string): Promise<any[]> {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;

        if (data) {
            const cacheKey = `@ITAmbriados:cache:${table}`;
            // Mark items as synced
            const syncedData = data.map((item: any) => ({ ...item, sync_status: 'synced' }));
            await AsyncStorage.setItem(cacheKey, JSON.stringify(syncedData));
            return syncedData;
        }
        return [];
    }

    /**
     * QUEUE MANAGEMENT
     */
    private async getQueue(): Promise<SyncQueueItem[]> {
        const queueStr = await AsyncStorage.getItem('@ITAmbriados:sync_queue');
        return queueStr ? JSON.parse(queueStr) : [];
    }

    private async saveQueue(queue: SyncQueueItem[]): Promise<void> {
        await AsyncStorage.setItem('@ITAmbriados:sync_queue', JSON.stringify(queue));
    }

    private async enqueueOperation(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
        const queue = await this.getQueue();
        const newItem: SyncQueueItem = {
            id: generateUUID(),
            table,
            action,
            data,
            timestamp: Date.now()
        };
        queue.push(newItem);
        await this.saveQueue(queue);
    }

    /**
     * FLUSH QUEUE: Replay all queued operations to Supabase
     */
    async flushQueue(): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const queue = await this.getQueue();
            if (queue.length === 0) {
                this.isSyncing = false;
                return;
            }

            console.log(`[SyncService] Starting sync flush of ${queue.length} items...`);

            // Verify we actually are connected
            const connected = await this.checkConnection();
            if (!connected) {
                this.isSyncing = false;
                return;
            }

            const remainingItems: SyncQueueItem[] = [];

            for (const item of queue) {
                try {
                    let success = false;

                    if (item.action === 'INSERT') {
                        // Extract sync_status from data before writing to Supabase
                        const { sync_status, ...supabaseData } = item.data;
                        
                        const { error } = await supabase
                            .from(item.table)
                            .insert([supabaseData]);

                        if (!error) {
                            success = true;
                        } else {
                            console.error(`[SyncService] Insert error on ${item.table}:`, error);
                            // If duplicate key (23505), RLS (42501), or other terminal error, consider skipped/resolved to avoid clogging the queue!
                            if (this.isTerminalError(error.code)) {
                                success = true; 
                            }
                        }
                    } else if (item.action === 'UPDATE') {
                        const { sync_status, ...supabaseData } = item.data;
                        const id = supabaseData.id;

                        const { error } = await supabase
                            .from(item.table)
                            .update(supabaseData)
                            .eq('id', id);

                        if (!error) {
                            success = true;
                        } else {
                            console.error(`[SyncService] Update error on ${item.table}:`, error);
                            if (this.isTerminalError(error.code)) {
                                success = true;
                            }
                        }
                    } else if (item.action === 'DELETE') {
                        const id = item.data.id;
                        const { error } = await supabase
                            .from(item.table)
                            .delete()
                            .eq('id', id);

                        if (!error) {
                            success = true;
                        } else {
                            console.error(`[SyncService] Delete error on ${item.table}:`, error);
                            if (this.isTerminalError(error.code)) {
                                success = true;
                            }
                        }
                    }

                    if (!success) {
                        // Keep in queue to retry later if it failed due to network
                        remainingItems.push(item);
                    } else {
                        // Mark item as synced in local cache
                        await this.markItemSyncedInLocalCache(item.table, item.data.id);
                    }
                } catch (err) {
                    console.error('[SyncService] Flush item error:', err);
                    remainingItems.push(item);
                }
            }

            await this.saveQueue(remainingItems);
            console.log(`[SyncService] Sync flush complete. ${remainingItems.length} items remain in queue.`);

            // Pull latest from Supabase for all cached tables
            if (remainingItems.length === 0) {
                const tables = ['profiles', 'categories', 'products', 'conversations', 'messages'];
                for (const t of tables) {
                    await this.fetchAndCacheTable(t).catch(e => console.warn(`Cache pull failed for ${t}:`, e));
                }
            }
        } catch (e) {
            console.error('[SyncService] General sync flush error:', e);
        } finally {
            this.isSyncing = false;
        }
    }

    private async markItemSyncedInLocalCache(table: string, id: string | number) {
        const cacheKey = `@ITAmbriados:cache:${table}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
            const items = JSON.parse(cachedData);
            const index = items.findIndex((i: any) => i.id === id);
            if (index !== -1) {
                items[index].sync_status = 'synced';
                await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
            }
        }
    }

    async getQueueLength(): Promise<number> {
        const queue = await this.getQueue();
        return queue.length;
    }
}

export const syncService = new SyncService();
