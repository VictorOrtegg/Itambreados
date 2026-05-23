import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { handleError, showSuccess } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const { 
    isBiometricsEnabled, 
    setBiometricsEnabled, 
    authenticateWithBiometrics, 
    checkBiometricsAvailable,
    signInUser,
    isSupabaseConfigured,
    simulateOAuthLogin
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');

  useEffect(() => {
    // Check if biometric hardware is supported & configured on this device
    checkBiometricsAvailable().then((available) => {
      setBiometricsSupported(available);
    });

    // Check if rememberMe was active previously to auto-fill email
    AsyncStorage.getItem('remember_email').then((savedEmail) => {
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    });

    // Auto biometric login check on startup if enabled and there are saved credentials
    AsyncStorage.getItem('biometrics_enabled').then(async (enabled) => {
      if (enabled === 'true') {
        const savedEmail = await AsyncStorage.getItem('secure_email');
        const savedPassword = await AsyncStorage.getItem('secure_password');
        if (savedEmail && savedPassword) {
          // Offer immediate biometric login
          handleBiometricSignIn(savedEmail, savedPassword);
        }
      }
    });
  }, []);

  const handleLogin = async () => {
    if (isLocked) {
      handleLockoutVerification();
      return;
    }

    if (!email || !password) {
      handleError({ message: 'Por favor, ingresa correo y contraseña.' });
      return;
    }

    setLoading(true);
    try {
      await signInUser(email, password);

      // Successful login - reset failed attempts
      setFailedAttempts(0);
      setIsLocked(false);

      // Handle Remember Me
      if (rememberMe) {
        await AsyncStorage.setItem('remember_email', email);
      } else {
        await AsyncStorage.removeItem('remember_email');
      }

      // Prompt to enable Biometrics if not already enabled
      if (biometricsSupported && !isBiometricsEnabled) {
        Alert.alert(
          '🔒 Inicio rápido con Huella',
          '¿Deseas activar el inicio de sesión rápido con huella digital para entrar sin contraseñas la próxima vez?',
          [
            {
              text: 'Quizás después',
              style: 'cancel',
            },
            {
              text: '¡Sí, activar!',
              onPress: async () => {
                await setBiometricsEnabled(true);
                // Securely save credentials locally (encrypted session proxy in production)
                await AsyncStorage.setItem('secure_email', email);
                await AsyncStorage.setItem('secure_password', password);
                showSuccess('Acceso con huella digital activado con éxito.');
              }
            }
          ]
        );
      }

      showSuccess('¡Inicio de sesión exitoso!', 'Bienvenido');
      navigation.replace('Splash');
    } catch (err: any) {
      // Increment failed attempts
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      if (nextFailed >= 3) {
        setIsLocked(true);
        handleError(
          { message: 'Has superado el límite de 3 intentos. Por seguridad tu pantalla ha sido bloqueada. Confirma tu identidad con tu huella digital para continuar.' },
          'Fallo de Autenticación'
        );
      } else {
        handleError(err, 'Fallo de Autenticación');
      }
    } finally {
      setLoading(false);
    }
  };

  const startOTPUnlock = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedCode(code);
    setUnlockCode('');
    setShowUnlockModal(true);
    Alert.alert(
      '📧 Código Enviado',
      `ITAmbriados Seguridad: Tu código temporal para comprobar tu identidad es: ${code}`,
      [{ text: 'Entendido' }]
    );
  };

  const handleVerifyUnlockCode = () => {
    if (unlockCode === expectedCode) {
      setFailedAttempts(0);
      setIsLocked(false);
      setShowUnlockModal(false);
      showSuccess('Identidad confirmada. Tu cuenta ha sido desbloqueada.', 'Éxito');
    } else {
      handleError({ message: 'Código de verificación incorrecto.' }, 'Error');
    }
  };

  const handleLockoutVerification = async () => {
    const options = [
      {
        text: 'Cancelar',
        style: 'cancel' as const,
      },
      {
        text: 'Código por Email',
        onPress: startOTPUnlock,
      }
    ];

    if (biometricsSupported) {
      options.splice(1, 0, {
        text: 'Comprobar Huella',
        onPress: async () => {
          const success = await authenticateWithBiometrics('Verifica tu huella digital para desbloquear la app');
          if (success) {
            setFailedAttempts(0);
            setIsLocked(false);
            showSuccess('Identidad confirmada. Tu cuenta ha sido desbloqueada.', 'Éxito');
          } else {
            handleError({ message: 'Verificación biométrica fallida o cancelada.' }, 'Bloqueo Activo');
          }
        }
      });
    }

    Alert.alert(
      '🔒 Cuenta Bloqueada',
      'Has superado el límite de 3 intentos. Por seguridad tu pantalla ha sido bloqueada. Comprueba tu identidad para continuar.',
      options
    );
  };

  const handleBiometricSignIn = async (savedEmail?: string, savedPassword?: string) => {
    const targetEmail = savedEmail || await AsyncStorage.getItem('secure_email');
    const targetPassword = savedPassword || await AsyncStorage.getItem('secure_password');

    if (!targetEmail || !targetPassword) {
      handleError({ message: 'Primero inicia sesión con tu contraseña y activa la huella.' }, 'Huella no configurada');
      return;
    }

    const success = await authenticateWithBiometrics('Inicia sesión con tu huella digital en ITAmbriados');
    if (success) {
      setLoading(true);
      try {
        await signInUser(targetEmail, targetPassword);
        setFailedAttempts(0);
        setIsLocked(false);
        showSuccess('¡Inicio de sesión biométrico exitoso!', 'Bienvenido');
        navigation.replace('Splash');
      } catch (err) {
        handleError(err, 'Fallo de Autenticación Biométrica');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle Supabase OAuth Social Logins
  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    // Show a clean developer choices dialog to prevent getting stuck in Supabase cloud redirects if not configured
    Alert.alert(
      provider === 'google' ? '🔴 Acceso con Google (Gmail)' : '🔵 Acceso con Facebook',
      `Selecciona cómo deseas iniciar sesión con ${provider === 'google' ? 'Google' : 'Facebook'}:`,
      [
        {
          text: '1. Simulación Instantánea (Prueba)',
          onPress: async () => {
            setLoading(true);
            try {
              await simulateOAuthLogin(provider);
              showSuccess(`¡Acceso simulado con ${provider === 'google' ? 'Google' : 'Facebook'} exitoso!`, 'Simulación');
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
              console.warn('[SocialSignIn] Redirect failed:', err);
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
        {/* Navy Header styled from Figma login */}
        <View style={styles.header}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Por favor inicia sesión para continuar</Text>
        </View>

        {/* Form area */}
        <View style={styles.form}>
          
          {/* Primary Trust Social Logins at the absolute top */}
          <TouchableOpacity 
            style={styles.googlePrimaryBtn} 
            onPress={() => handleSocialSignIn('google')}
            disabled={isLocked}
          >
            <Text style={styles.socialLogoEmoji}>🔴</Text>
            <Text style={styles.googlePrimaryText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.facebookPrimaryBtn} 
            onPress={() => handleSocialSignIn('facebook')}
            disabled={isLocked}
          >
            <Text style={styles.socialLogoEmoji}>📘</Text>
            <Text style={styles.facebookPrimaryText}>Continuar con Facebook</Text>
          </TouchableOpacity>

          {/* Social Divider */}
          <View style={styles.socialDivider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>O inicia con correo electrónico</Text>
            <View style={styles.line} />
          </View>

          {/* Secondary Email & Password Inputs */}
          <CustomInput
            label="EMAIL"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!isLocked}
          />

          <CustomInput
            label="CONTRASEÑA"
            placeholder="Introduce tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLocked}
          />

          {/* Remember me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLocked}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Recordarme</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} disabled={isLocked}>
              <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Action Row: Primary Login + Fingerprint icon */}
          <View style={styles.actionRow}>
            <CustomButton
              title={isLocked ? "DESBLOQUEAR CUENTA" : "INICIAR SESIÓN"}
              onPress={isLocked ? handleLockoutVerification : handleLogin}
              loading={loading}
              variant="primary"
              style={[styles.loginBtn, isLocked && styles.lockedBtn]}
            />

            {biometricsSupported && isBiometricsEnabled && (
              <TouchableOpacity 
                style={styles.biometricBtn} 
                onPress={() => handleBiometricSignIn()}
                disabled={loading}
              >
                <Text style={styles.fingerprintEmoji}>☝️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Toggle Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={isLocked}>
              <Text style={styles.signUpLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Custom Lock Screen Modal for Verification Challenge */}
      <Modal
        visible={showUnlockModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnlockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.lockIconContainer}>
              <Text style={styles.lockIconEmoji}>🛡️</Text>
            </View>
            
            <Text style={styles.modalTitle}>Verificación de Seguridad</Text>
            <Text style={styles.modalSubtitle}>
              Hemos generado un código temporal para verificar tu identidad:
            </Text>
            
            <View style={styles.codeBadgeContainer}>
              <Text style={styles.codeTextBadge}>{expectedCode}</Text>
            </View>
            
            <Text style={styles.modalSubtext}>
              Por favor introduce los 4 dígitos a continuación:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={unlockCode}
              onChangeText={setUnlockCode}
              placeholder="0000"
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => setShowUnlockModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalConfirmBtn]} 
                onPress={handleVerifyUnlockCode}
              >
                <Text style={styles.modalConfirmBtnText}>Verificar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#0B0E1E',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 45,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    borderColor: '#FF7A00',
    backgroundColor: '#FF7A00',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotLink: {
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: '#0B0E1E',
    paddingVertical: 16,
    borderRadius: 12,
  },
  lockedBtn: {
    backgroundColor: '#DC2626', // Red color for locked status
  },
  biometricBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fingerprintEmoji: {
    fontSize: 28,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  noAccountText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  signUpLink: {
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '700',
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 14, 30, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIconEmoji: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B0E1E',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  codeBadgeContainer: {
    backgroundColor: '#0B0E1E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  codeTextBadge: {
    color: '#FF7A00',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  modalSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  modalInput: {
    width: '60%',
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#0B0E1E',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  modalCancelBtnText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmBtn: {
    backgroundColor: '#0B0E1E',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
});