import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView, Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

const C = {
  bg:       '#000000',
  teal:     '#0D9AA3',
  tealDim:  '#0D9AA318',
  white:    '#FFFFFF',
  gray:     '#E3E3E3',
  red:      '#FD4E4E',
  card:     '#111111',
  border:   '#1E1E1E',
  subtext:  '#666666',
  input:    '#0D0D0D',
};

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [focusedField, setFocused] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert('Error de Inicio de Sesión', error.message);
  };

  const inputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Encabezado ───────────────────────────────── */}
          <View style={styles.header}>
            {/* Decoración de fondo */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <View style={styles.logoMark}>
              <Ionicons name="storefront" size={32} color={C.teal} />
            </View>
            <Text style={styles.appName}>itambreados</Text>
            <Text style={styles.headerTitle}>Bienvenido</Text>
            <Text style={styles.headerSub}>Inicia sesión en tu cuenta</Text>
          </View>

          {/* ── Formulario ───────────────────────────────── */}
          <View style={styles.form}>

            {/* Email */}
            <Text style={styles.label}>EMAIL</Text>
            <View style={inputStyle('email')}>
              <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? C.teal : C.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="brendon@gmail.com"
                placeholderTextColor={C.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                selectionColor={C.teal}
              />
            </View>

            {/* Contraseña */}
            <Text style={[styles.label, { marginTop: 20 }]}>CONTRASEÑA</Text>
            <View style={inputStyle('password')}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? C.teal : C.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="••••••••"
                placeholderTextColor={C.subtext}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                selectionColor={C.teal}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.subtext} />
              </TouchableOpacity>
            </View>

            {/* Opciones */}
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <Checkbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={rememberMe ? C.teal : C.border}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>Recuérdame</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Botón principal */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.white} />
                : (
                  <View style={styles.loginBtnInner}>
                    <Text style={styles.loginBtnText}>INICIAR SESIÓN</Text>
                    <Ionicons name="arrow-forward" size={18} color={C.white} />
                  </View>
                )
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Registro */}
            <View style={styles.registerRow}>
              <Text style={styles.noAccountText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.registerText}>REGÍSTRATE</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    height: height * 0.32,
    minHeight: 220,
    backgroundColor: C.card,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  orb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.teal,
    opacity: 0.06,
    top: -60,
    right: -40,
  },
  orb2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: C.teal,
    opacity: 0.05,
    bottom: -30,
    left: -20,
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: C.tealDim,
    borderWidth: 1,
    borderColor: C.teal + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.teal,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
  },
  headerSub: {
    fontSize: 13,
    color: C.subtext,
    marginTop: 2,
  },

  // Form
  form: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.subtext,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputFocused: {
    borderColor: C.teal,
    backgroundColor: C.tealDim,
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: C.white,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
  },

  // Opciones
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 28,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: { width: 18, height: 18, borderRadius: 5 },
  rememberText: { fontSize: 13, color: C.subtext },
  forgotText: { fontSize: 13, color: C.teal, fontWeight: '600' },

  // Botón
  loginBtn: {
    backgroundColor: C.teal,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.subtext, fontWeight: '500' },

  // Registro
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: { color: C.subtext, fontSize: 14 },
  registerText: { color: C.teal, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});