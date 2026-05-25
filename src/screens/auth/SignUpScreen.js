import { Ionicons } from '@expo/vector-icons';
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
  bg:      '#000000',
  teal:    '#0D9AA3',
  tealDim: '#0D9AA318',
  white:   '#FFFFFF',
  gray:    '#E3E3E3',
  red:     '#FD4E4E',
  card:    '#111111',
  border:  '#1E1E1E',
  input:   '#0D0D0D',
  sub:     '#666666',
};

// ── Campo reutilizable ────────────────────────────────────
function Field({ label, icon, focused, onFocus, onBlur, children }) {
  return (
    <View style={{ marginBottom: 0 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <Ionicons
          name={icon}
          size={17}
          color={focused ? C.teal : C.sub}
          style={styles.inputIcon}
        />
        {children}
      </View>
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);

  const passwordMatch = confirm.length > 0 && password !== confirm;

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name:  name,
      user_role:  'comprador',  // siempre comprador por ahora
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error de Registro', error.message);
    } else {
      Alert.alert('¡Listo!', '¡Cuenta creada! Ya puedes iniciar sesión.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ─────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={styles.headerLogoMark}>
              <Ionicons name="person-add-outline" size={28} color={C.teal} />
            </View>
            <Text style={styles.headerTitle}>Crear cuenta</Text>
            <Text style={styles.headerSub}>Únete a itambreados</Text>
          </View>

          {/* ── Formulario ─────────────────────────────── */}
          <View style={styles.form}>

            {/* Nombre */}
            <Field
              label="NOMBRE COMPLETO"
              icon="person-outline"
              focused={focused === 'name'}
              onFocus={() => setFocused('name')}
            >
              <TextInput
                style={styles.inputText}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor={C.sub}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                selectionColor={C.teal}
              />
            </Field>

            <View style={styles.spacer} />

            {/* Email */}
            <Field
              label="EMAIL"
              icon="mail-outline"
              focused={focused === 'email'}
            >
              <TextInput
                style={styles.inputText}
                placeholder="brendon@gmail.com"
                placeholderTextColor={C.sub}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                selectionColor={C.teal}
              />
            </Field>

            <View style={styles.spacer} />

            {/* Contraseña */}
            <Field
              label="CONTRASEÑA"
              icon="lock-closed-outline"
              focused={focused === 'pass'}
            >
              <TextInput
                style={styles.inputText}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={C.sub}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                selectionColor={C.teal}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={17} color={C.sub} />
              </TouchableOpacity>
            </Field>

            <View style={styles.spacer} />

            {/* Confirmar contraseña */}
            <Field
              label="CONFIRMAR CONTRASEÑA"
              icon={passwordMatch ? 'close-circle-outline' : 'shield-checkmark-outline'}
              focused={focused === 'conf'}
            >
              <TextInput
                style={styles.inputText}
                placeholder="Repite tu contraseña"
                placeholderTextColor={C.sub}
                secureTextEntry={!showConf}
                value={confirm}
                onChangeText={setConfirm}
                onFocus={() => setFocused('conf')}
                onBlur={() => setFocused(null)}
                selectionColor={C.teal}
              />
              <TouchableOpacity onPress={() => setShowConf(!showConf)} style={styles.eyeBtn}>
                <Ionicons name={showConf ? 'eye-outline' : 'eye-off-outline'} size={17} color={C.sub} />
              </TouchableOpacity>
            </Field>

            {/* Aviso contraseñas no coinciden */}
            {passwordMatch && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={13} color={C.red} />
                <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
              </View>
            )}

            {/* Info de rol */}
            <View style={styles.roleInfo}>
              <Ionicons name="bag-handle-outline" size={16} color={C.teal} />
              <Text style={styles.roleInfoText}>
                Registrándote como <Text style={{ color: C.teal, fontWeight: '700' }}>Comprador</Text>
              </Text>
            </View>

            {/* Términos */}
            <Text style={styles.terms}>
              Al registrarte aceptas nuestros{' '}
              <Text style={styles.termsLink}>Términos de uso</Text>
              {' '}y{' '}
              <Text style={styles.termsLink}>Política de privacidad</Text>
            </Text>

            {/* Botón */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.white} />
                : (
                  <View style={styles.registerBtnInner}>
                    <Text style={styles.registerBtnText}>CREAR CUENTA</Text>
                    <Ionicons name="arrow-forward" size={18} color={C.white} />
                  </View>
                )
              }
            </TouchableOpacity>

            {/* Ya tengo cuenta */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>INICIA SESIÓN</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    height: height * 0.28,
    minHeight: 200,
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
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: C.teal, opacity: 0.06,
    top: -50, right: -30,
  },
  orb2: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.teal, opacity: 0.04,
    bottom: -20, left: -10,
  },
  backBtn: {
    position: 'absolute',
    top: 16, left: 20,
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: C.bg + 'CC',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogoMark: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.tealDim,
    borderWidth: 1, borderColor: C.teal + '40',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '800', color: C.white,
  },
  headerSub: {
    fontSize: 13, color: C.sub, marginTop: 2,
  },

  // Formulario
  form: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  spacer: { height: 16 },
  label: {
    fontSize: 11, fontWeight: '700',
    color: C.sub, letterSpacing: 1.4,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.input,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14,
  },
  inputWrapFocused: {
    borderColor: C.teal,
    backgroundColor: C.tealDim,
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    flex: 1, fontSize: 15,
    color: C.white, paddingVertical: 14,
  },
  eyeBtn: { padding: 6 },

  // Error
  errorRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginTop: 6,
  },
  errorText: { fontSize: 12, color: C.red },

  // Rol info
  roleInfo: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: 20, marginBottom: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.tealDim,
    borderRadius: 12, borderWidth: 1,
    borderColor: C.teal + '30',
  },
  roleInfoText: { fontSize: 13, color: C.gray },

  // Términos
  terms: {
    fontSize: 12, color: C.sub,
    textAlign: 'center', lineHeight: 18,
    marginBottom: 24,
  },
  termsLink: { color: C.teal, fontWeight: '600' },

  // Botón
  registerBtn: {
    backgroundColor: C.teal,
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14,
    elevation: 10, marginBottom: 24,
  },
  registerBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  registerBtnText: {
    color: C.white, fontSize: 14,
    fontWeight: '800', letterSpacing: 1.2,
  },

  // Login link
  loginRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  loginPrompt: { color: C.sub, fontSize: 14 },
  loginLink: {
    color: C.teal, fontSize: 14,
    fontWeight: '800', letterSpacing: 0.5,
  },
});