import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useAuth } from '../../context/AuthContext';

const { height, width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      Alert.alert('Error de Inicio de Sesión', error.message);
    }
    // If successful, AuthContext listener will automatically switch to MainStack
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerBackground}>
            <Text style={styles.headerTitle}>Iniciar Sesión</Text>
            <Text style={styles.headerSubtitle}>Por favor inicia sesión con tu cuenta</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="brendon@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>CONTRASEÑA</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.optionsContainer}>
              <View style={styles.rememberContainer}>
                <Checkbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={rememberMe ? '#164E87' : undefined}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>Recuérdame</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  headerBackground: {
    backgroundColor: '#1E2235',
    height: height * 0.3, // Changed from fixed 250
    minHeight: 200,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: '#9CA3AF' },
  formContainer: { paddingHorizontal: 24, paddingTop: 40 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E2235',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E2235' },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 30 },
  rememberContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { marginRight: 8, width: 18, height: 18 },
  rememberText: { fontSize: 14, color: '#6B7280' },
  forgotPasswordText: { fontSize: 14, color: '#164E87', fontWeight: '600' },
  loginButton: { backgroundColor: '#164E87', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  registerContainer: { flexDirection: 'row', justifyContent: 'center' },
  noAccountText: { color: '#6B7280', fontSize: 14 },
  registerText: { color: '#164E87', fontSize: 14, fontWeight: 'bold' }
});
