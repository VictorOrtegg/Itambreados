import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { syncService } from '../services/syncService';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { handleError, showSuccess } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

type AccountRole = 'buyer' | 'seller' | 'mixed';

const AVATAR_PRESETS = [
  { id: 'student1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', label: 'Sofía 👩‍🎓' },
  { id: 'student2', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80', label: 'Carlos 🧑‍🎓' },
  { id: 'student3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', label: 'Mateo 🧑‍🎓' },
  { id: 'student4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', label: 'Valeria 👩‍🎓' },
  { id: 'emoji1', url: '👨‍🍳', label: 'Chef 👨‍🍳' },
  { id: 'emoji2', url: '🍔', label: 'Dona 🍔' },
];

export default function SignUpScreen({ navigation }: any) {
  const { signUpUser, isSupabaseConfigured, simulateOAuthLogin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('mixed');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permiso Requerido 📸',
          'Para subir una foto directamente de tu dispositivo, ITAmbriados necesita acceso a tu galería de imágenes.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.15, // Keep quality optimized to guarantee compact base64 strings
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // Format as standard data URL so it displays and uploads seamlessly
        const dataUrl = `data:${selectedAsset.mimeType || 'image/jpeg'};base64,${selectedAsset.base64}`;
        setCustomAvatarUrl(dataUrl);
        setAvatarUrl(dataUrl);
        showSuccess('¡Imagen de perfil cargada desde tu dispositivo exitosamente!', 'Foto Cargada');
      }
    } catch (e: any) {
      handleError(e, 'Error al elegir foto');
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      handleError({ message: 'Por favor, llena todos los campos del formulario.' });
      return;
    }

    if (password !== confirmPassword) {
      handleError({ message: 'Las contraseñas no coinciden.' });
      return;
    }

    setLoading(true);
    const finalAvatar = customAvatarUrl.trim() !== '' ? customAvatarUrl.trim() : avatarUrl;
    try {
      await signUpUser(email, password, name, role, finalAvatar);

      showSuccess('Cuenta registrada con éxito. Por favor verifica tu correo.', 'Registro Exitoso');
      // Redirect to verification UI
      navigation.navigate('Verification', { email });
    } catch (err) {
      handleError(err, 'Fallo de Registro');
    } finally {
      setLoading(false);
    }
  };

  // Handle Supabase OAuth Social Register
  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    // Show a clean developer choices dialog to prevent getting stuck in Supabase cloud redirects if not configured
    Alert.alert(
      provider === 'google' ? '🔴 Registro con Google (Gmail)' : '🔵 Registro con Facebook',
      `Selecciona cómo deseas registrarte con ${provider === 'google' ? 'Google' : 'Facebook'}:`,
      [
        {
          text: '1. Simulación Instantánea (Prueba)',
          onPress: async () => {
            setLoading(true);
            try {
              await AsyncStorage.setItem('oauth_chosen_role', role);
              await simulateOAuthLogin(provider);
              showSuccess(`¡Registro simulado con ${provider === 'google' ? 'Google' : 'Facebook'} exitoso!`, 'Simulación');
              navigation.replace('Splash');
            } catch (err: any) {
              handleError(err);
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: '2. Nube Real (Supabase Cloud Live)',
          onPress: async () => {
            setLoading(true);
            try {
              await AsyncStorage.setItem('oauth_chosen_role', role);
              if (Platform.OS === 'web') {
                const { data, error } = await supabase.auth.signInWithOAuth({
                  provider,
                  options: {
                    redirectTo: window.location.origin
                  }
                });
                if (error) throw error;
                if (data.url) {
                  window.location.href = data.url;
                }
              } else {
                showSuccess(`Iniciando conexión con ${provider === 'google' ? 'Google' : 'Facebook'}...`, 'OAuth');
                const { data, error } = await supabase.auth.signInWithOAuth({
                  provider,
                  options: {
                    redirectTo: 'itambriados://login'
                  }
                });
                if (error) throw error;
              }
            } catch (err: any) {
              console.warn('[SocialSignUp] Redirect failed:', err);
              handleError(err, 'Fallo de Conexión Real');
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        {/* Navy Header styled from Figma */}
        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
              <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Registrarse</Text>
          <Text style={styles.subtitle}>Por favor regístrate para continuar</Text>
        </View>

        <View style={styles.form}>


          {/* 2. Primary Google / Facebook Sign Up Buttons for Max Trust */}
          <TouchableOpacity 
            style={styles.googlePrimaryBtn} 
            onPress={() => handleSocialSignIn('google')}
            disabled={loading}
          >
            <Text style={styles.socialLogoEmoji}>🔴</Text>
            <Text style={styles.googlePrimaryText}>Registrarse con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.facebookPrimaryBtn} 
            onPress={() => handleSocialSignIn('facebook')}
            disabled={loading}
          >
            <Text style={styles.socialLogoEmoji}>📘</Text>
            <Text style={styles.facebookPrimaryText}>Registrarse con Facebook</Text>
          </TouchableOpacity>

          {/* 3. Divider to Secondary Email Fields */}
          <View style={styles.socialDivider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>O regístrate con correo electrónico</Text>
            <View style={styles.line} />
          </View>

          {/* Avatar / Photo Selection Presets */}
          <Text style={styles.avatarLabel}>FOTO DE PERFIL / AVATAR</Text>
          <Text style={styles.avatarSublabel}>Elige una foto real de estudiante o ingresa un enlace</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.avatarSlider}
          >
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = avatarUrl === preset.url && customAvatarUrl.trim() === '';
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.avatarPresetCard, isSelected && styles.avatarPresetSelected]}
                  onPress={() => {
                    setAvatarUrl(preset.url);
                    setCustomAvatarUrl('');
                  }}
                >
                  {preset.url.startsWith('http') ? (
                    <Image source={{ uri: preset.url }} style={styles.avatarPresetImage} />
                  ) : (
                    <Text style={styles.avatarPresetEmoji}>{preset.url}</Text>
                  )}
                  <Text style={[styles.avatarPresetText, isSelected && styles.avatarPresetTextActive]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Photo Picker Button & Preview Row */}
          <View style={styles.imagePickerRow}>
            <TouchableOpacity 
              style={styles.pickDeviceImageBtn}
              onPress={handlePickImage}
              disabled={loading}
            >
              <Text style={styles.pickDeviceImageBtnText}>📸 SUBIR FOTO DEL DISPOSITIVO</Text>
            </TouchableOpacity>

            {customAvatarUrl.startsWith('data:image') && (
              <View style={styles.pickedPhotoPreview}>
                <Image source={{ uri: customAvatarUrl }} style={styles.pickedPhotoPreviewImage} />
                <Text style={styles.pickedPhotoPreviewText}>Elegida ✓</Text>
              </View>
            )}
          </View>

          <CustomInput
            label="O INGRESA ENLACE DE TU FOTO (URL)"
            placeholder="https://ejemplo.com/tu_foto.jpg"
            value={customAvatarUrl.startsWith('data:image') ? 'Foto cargada desde el dispositivo 🖼️' : customAvatarUrl}
            onChangeText={(val) => {
              setCustomAvatarUrl(val);
            }}
            editable={!loading && !customAvatarUrl.startsWith('data:image')}
          />

          {/* 4. Secondary Inputs */}
          <CustomInput
            label="NOMBRE COMPLETO"
            placeholder="Introduce tu nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />

          <CustomInput
            label="EMAIL"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
          />

          <CustomInput
            label="CONTRASEÑA"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <CustomInput
            label="VERIFICAR CONTRASEÑA"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <CustomButton
            title="REGISTRARSE"
            onPress={handleSignUp}
            loading={loading}
            variant="primary"
            style={styles.signupBtn}
          />

          {/* Toggle Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.alreadyAccountText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={styles.loginLink}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#0B0E1E', // Matching Figma deep navy
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 30 : 15,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backArrow: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },

  signupBtn: {
    backgroundColor: '#0B0E1E', // Matching dark blue primary button from onboarding
    paddingVertical: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  alreadyAccountText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  loginLink: {
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '700',
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  socialIcon: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  socialLogo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0E1E',
  },
  googlePrimaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  googlePrimaryText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  facebookPrimaryBtn: {
    backgroundColor: '#1877F2',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 1,
  },
  facebookPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  socialLogoEmoji: {
    fontSize: 16,
  },
  avatarLabel: {
    fontSize: 11,
    fontWeight: '850',
    color: '#0B0E1E',
    letterSpacing: 1.1,
    marginTop: 10,
    marginBottom: 4,
  },
  avatarSublabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '600',
  },
  avatarSlider: {
    paddingVertical: 6,
    gap: 12,
    marginBottom: 16,
  },
  avatarPresetCard: {
    width: 75,
    height: 95,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  avatarPresetSelected: {
    borderColor: '#FF7A00',
    backgroundColor: '#FFF8F3',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPresetImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  avatarPresetEmoji: {
    fontSize: 28,
    lineHeight: 44,
    height: 44,
    marginBottom: 6,
  },
  avatarPresetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  avatarPresetTextActive: {
    color: '#FF7A00',
    fontWeight: '800',
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  pickDeviceImageBtn: {
    flex: 1,
    backgroundColor: '#0B0E1E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickDeviceImageBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pickedPhotoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  pickedPhotoPreviewImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FF7A00',
  },
  pickedPhotoPreviewText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FF7A00',
    marginTop: 4,
    textAlign: 'center',
  },
});