import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { syncService, generateUUID } from '../services/syncService';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    isBiometricsEnabled: boolean;
    setBiometricsEnabled: (enabled: boolean) => Promise<void>;
    authenticateWithBiometrics: (msg?: string) => Promise<boolean>;
    checkBiometricsAvailable: () => Promise<boolean>;
    isSupabaseConfigured: boolean;
    signUpUser: (email: string, password: string, name: string, role: string, avatarUrl?: string) => Promise<any>;
    signInUser: (email: string, password: string) => Promise<any>;
    simulateOAuthLogin: (provider: 'google' | 'facebook') => Promise<any>;
    signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => {},
    isBiometricsEnabled: false,
    setBiometricsEnabled: async () => {},
    authenticateWithBiometrics: async () => false,
    checkBiometricsAvailable: async () => false,
    isSupabaseConfigured: false,
    signUpUser: async () => {},
    signInUser: async () => {},
    simulateOAuthLogin: async () => {},
    signOutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBiometricsEnabled, setIsBiometricsEnabledState] = useState(false);

    const signUpUser = async (email: string, password: string, name: string, role: string, avatarUrl?: string) => {
        const finalAvatar = avatarUrl || '👤';
        if (!isSupabaseConfigured) {
            // High-fidelity fallback simulated signup
            const simulatedUsersRaw = await AsyncStorage.getItem('simulated_users') || '[]';
            const simulatedUsers = JSON.parse(simulatedUsersRaw);
            
            if (simulatedUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
                throw new Error('El correo electrónico ya está registrado.');
            }
            
            const newId = generateUUID();
            const newUser = { id: newId, email, password, full_name: name, role };
            simulatedUsers.push(newUser);
            await AsyncStorage.setItem('simulated_users', JSON.stringify(simulatedUsers));

            const profileData = {
                id: newId,
                full_name: name,
                role: role,
                avatar_url: finalAvatar,
                location_enabled: false,
                created_at: new Date().toISOString()
            };
            
            // Save to syncService local cache
            await syncService.saveItem('profiles', profileData, 'id');
            return { user: newUser };
        } else {
            // Real Supabase register
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        avatar_url: finalAvatar,
                    }
                }
            });
            if (error) throw error;
            
            if (data.user) {
                const profileData = {
                    id: data.user.id,
                    full_name: name,
                    role: role,
                    avatar_url: finalAvatar,
                    location_enabled: false,
                    created_at: new Date().toISOString()
                };
                await syncService.saveItem('profiles', profileData, 'id');
            }
            return data;
        }
    };

    const signInUser = async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
            // High-fidelity fallback simulated login
            const simulatedUsersRaw = await AsyncStorage.getItem('simulated_users') || '[]';
            const simulatedUsers = JSON.parse(simulatedUsersRaw);
            const matchedUser = simulatedUsers.find(
                (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );
            
            if (!matchedUser) {
                throw new Error('Credenciales incorrectas o usuario no registrado.');
            }

            const mockUser = {
                id: matchedUser.id,
                email: matchedUser.email,
                user_metadata: { full_name: matchedUser.full_name },
            } as any;

            const mockSession = {
                access_token: 'mock-session-token',
                user: mockUser,
            } as any;

            setSession(mockSession);
            setUser(mockUser);
            
            // Save simulated session to AsyncStorage for persistence!
            await AsyncStorage.setItem('simulated_session', JSON.stringify(mockSession));
            
            // Fetch/Mock profile
            await fetchProfile(matchedUser.id, mockUser);
            return { session: mockSession, user: mockUser };
        } else {
            // Real Supabase login
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return data;
        }
    };

    const simulateOAuthLogin = async (provider: 'google' | 'facebook') => {
        const mockId = generateUUID();
        const mockEmail = `usuario.${provider}@gmail.com`;
        const mockName = provider === 'google' ? 'Google User' : 'Facebook User';
        
        const mockUser = {
            id: mockId,
            email: mockEmail,
            user_metadata: { 
                full_name: mockName, 
                avatar_url: provider === 'google' ? '🔴' : '📘' 
            },
        } as any;

        const mockSession = {
            access_token: 'mock-oauth-token',
            user: mockUser,
        } as any;

        setSession(mockSession);
        setUser(mockUser);
        
        // Save simulated session to AsyncStorage for persistence!
        await AsyncStorage.setItem('simulated_session', JSON.stringify(mockSession));
        
        // Fetch/create profile
        await fetchProfile(mockId, mockUser);
        return { session: mockSession, user: mockUser };
    };

    useEffect(() => {
        // Cargar estado de huella digital de almacenamiento local
        AsyncStorage.getItem('biometrics_enabled').then((val) => {
            setIsBiometricsEnabledState(val === 'true');
        });
    }, []);

    const setBiometricsEnabled = async (enabled: boolean) => {
        try {
            await AsyncStorage.setItem('biometrics_enabled', enabled ? 'true' : 'false');
            setIsBiometricsEnabledState(enabled);
        } catch (e) {
            console.error('[AuthContext] Error setting biometrics:', e);
        }
    };

    const checkBiometricsAvailable = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            return hasHardware && isEnrolled;
        } catch (e) {
            console.warn('[AuthContext] Error checking biometrics:', e);
            return false;
        }
    };

    const authenticateWithBiometrics = async (msg: string = 'Verifica tu huella digital para continuar') => {
        try {
            const isAvailable = await checkBiometricsAvailable();
            if (!isAvailable) {
                // Simulación para Web
                if (Platform.OS === 'web') {
                    return new Promise<boolean>((resolve) => {
                        const confirmWeb = window.confirm('¿Simular verificación de huella dactilar exitosa? (Prueba en Web)');
                        resolve(confirmWeb);
                    });
                }
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: msg,
                fallbackLabel: 'Usar Contraseña',
                disableDeviceFallback: false,
            });
            return result.success;
        } catch (e) {
            console.warn('[AuthContext] Error running biometrics:', e);
            return false;
        }
    };

    const fetchProfile = async (userId: string, currentUser?: User | null) => {
        try {
            // First try reading from local sync cache for speed
            const localProfiles = await syncService.getItems('profiles', { id: userId });
            if (localProfiles && localProfiles.length > 0) {
                setProfile(localProfiles[0]);
            }

            // Also pull latest from Supabase if online
            if (syncService.isOnline()) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!error && data) {
                    setProfile(data);
                    // Update cache
                    await syncService.saveItem('profiles', data, 'id');
                } else if (error && (error.code === 'PGRST116' || error.message?.includes('no rows'))) {
                    // Profile does not exist! Let's auto-create it (e.g. Google / Facebook OAuth registration)
                    const chosenRole = await AsyncStorage.getItem('oauth_chosen_role') || 'buyer';
                    const activeUser = currentUser || user;
                    const newProfile = {
                        id: userId,
                        full_name: activeUser?.user_metadata?.full_name || activeUser?.email?.split('@')[0] || 'Usuario Nuevo',
                        role: chosenRole,
                        avatar_url: activeUser?.user_metadata?.avatar_url || '👤',
                        location_enabled: false,
                        created_at: new Date().toISOString()
                    };

                    // Save locally first
                    await syncService.saveItem('profiles', newProfile, 'id');
                    setProfile(newProfile);

                    // Insert to remote Supabase profiles table
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert(newProfile);

                    if (insertError) {
                        console.error('[AuthContext] Error creating remote profile:', insertError);
                    } else {
                        console.log('[AuthContext] Remote OAuth profile created successfully!');
                    }
                    await AsyncStorage.removeItem('oauth_chosen_role');
                }
            }
        } catch (err) {
            console.error('[AuthContext] Error fetching profile:', err);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id, user);
        }
    };

    const signOutUser = async () => {
        try {
            if (isSupabaseConfigured) {
                await supabase.auth.signOut();
            }
        } catch (e) {
            console.warn('[AuthContext] Error signing out from Supabase auth service:', e);
        } finally {
            // Unconditionally wipe all session, profile, and local storage variables
            setSession(null);
            setUser(null);
            setProfile(null);
            await AsyncStorage.removeItem('simulated_session');
            await AsyncStorage.removeItem('secure_email');
            await AsyncStorage.removeItem('secure_password');
            await AsyncStorage.removeItem('biometrics_enabled');
            console.log('[AuthContext] Session cleared successfully locally.');
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            if (!isSupabaseConfigured) {
                try {
                    const savedSessionRaw = await AsyncStorage.getItem('simulated_session');
                    if (savedSessionRaw) {
                        const savedSession = JSON.parse(savedSessionRaw);
                        setSession(savedSession);
                        const mockUser = savedSession.user;
                        setUser(mockUser);
                        if (mockUser?.id) {
                            await fetchProfile(mockUser.id, mockUser);
                        }
                    }
                } catch (e) {
                    console.warn('[AuthContext] Error loading simulated session:', e);
                }
                setLoading(false);
            } else {
                // Escuchar el evento de estado de autenticación inicial
                supabase.auth.getSession().then(async ({ data: { session } }) => {
                    setSession(session);
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);
                    if (currentUser) {
                        await fetchProfile(currentUser.id, currentUser);
                    }
                    setLoading(false);
                });
            }
        };

        initAuth();

        // Escuchar los eventos asíncronos cuando el usuario se loguea/desloguea
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                await fetchProfile(currentUser.id, currentUser);
            } else {
                setProfile(null);
                // Clear simulated session if real logout occurs
                await AsyncStorage.removeItem('simulated_session');
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ 
            session, 
            user, 
            profile, 
            loading, 
            refreshProfile,
            isBiometricsEnabled,
            setBiometricsEnabled,
            authenticateWithBiometrics,
            checkBiometricsAvailable,
            isSupabaseConfigured,
            signUpUser,
            signInUser,
            simulateOAuthLogin,
            signOutUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
