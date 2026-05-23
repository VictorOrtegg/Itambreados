import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform,
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { supabase } from '../services/supabaseClient';
import { handleError, showSuccess } from '../utils/errorHandler';

export default function ForgotPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            handleError({ message: 'Por favor ingresa tu correo electrónico.' });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
            });

            if (error) throw error;

            showSuccess('Se ha enviado un código de recuperación a tu correo.', 'Correo Enviado');
            navigation.navigate('Verification', { email });
        } catch (err) {
            handleError(err, 'Error de Recuperación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header oscuro con estilo Figma */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Contraseña olvidada</Text>
                <Text style={styles.subtitle}>
                    Por favor, escribe tu correo para enviarte el código de verificación
                </Text>
            </View>

            {/* Formulario */}
            <View style={styles.form}>
                <CustomInput
                    placeholder="ejemplo@correo.com"
                    label="EMAIL"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <CustomButton
                    title="ENVIAR CÓDIGO"
                    onPress={handleSendCode}
                    loading={loading}
                    variant="primary"
                    style={styles.button}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        backgroundColor: '#0B0E1E',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    backArrow: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    title: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        lineHeight: 20,
    },
    form: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 30,
    },
    button: {
        marginTop: 20,
    },
});
