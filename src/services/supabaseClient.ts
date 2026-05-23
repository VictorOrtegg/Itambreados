import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const supabaseUrl: string = 'https://aocwsgdshpogmjiktjzq.supabase.co'; // Replace with your Supabase project URL
export const supabaseAnonKey: string = 'sb_publishable_g1NqQ_oAPMGb592Do651BA_ERxwypWL'; // Replace with your Supabase anon key

// Custom storage adapter for React Native vs Web
const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        AsyncStorage.removeItem(key);
    },
};

const storageConfig = Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter;

// SET TO true TO RUN ALL FEATURES IN HIGH-FIDELITY OFFLINE/LOCAL SIMULATION (No Supabase dependency).
// Set to false when you are ready to connect to your live Supabase cloud database!
export const FORCE_LOCAL_SIMULATION = false;

const isValidUrl = !FORCE_LOCAL_SIMULATION && supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

export const isSupabaseConfigured = !!isValidUrl;

export const supabase = isValidUrl 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: storageConfig,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
      })
    : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
        auth: {
            storage: storageConfig,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
      });
