import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { height, width } = Dimensions.get('window');

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('comprador'); // 'comprador' or 'vendedor'
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name: name,
      user_role: role
    });
    
    setLoading(false);
    
    if (error) {
      Alert.alert('Error de Registro', error.message);
    } else {
      Alert.alert('Éxito', '¡Registro completado! Puedes iniciar sesión.');
      // Direct login might happen automatically based on Supabase config,
      // but otherwise we navigate back to Login.
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerBackground}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Registrarse</Text>
            <Text style={styles.headerSubtitle}>Por favor regístrate para iniciar</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>NOMBRE COMPLETO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

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

            <Text style={styles.label}>TIPO DE CUENTA</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'comprador' && styles.roleButtonActive]}
                onPress={() => setRole('comprador')}
              >
                <Text style={[styles.roleText, role === 'comprador' && styles.roleTextActive]}>
                  Comprador
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleButton, role === 'vendedor' && styles.roleButtonActive]}
                onPress={() => setRole('vendedor')}
              >
                <Text style={[styles.roleText, role === 'vendedor' && styles.roleTextActive]}>
                  Vendedor
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>REGISTRARSE</Text>
              )}
            </TouchableOpacity>
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
    height: height * 0.25, // Changed from fixed 200
    minHeight: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: '#9CA3AF' },
  formContainer: { paddingHorizontal: 24, paddingTop: 30 },
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
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 30 },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  roleButtonActive: { backgroundColor: '#F8FBFC', borderColor: '#164E87' },
  roleText: { color: '#6B7280', fontWeight: 'bold' },
  roleTextActive: { color: '#164E87' },
  registerButton: {
    backgroundColor: '#85B5C9', // Lighter blue for register as per some mockups, or same primary blue
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});
