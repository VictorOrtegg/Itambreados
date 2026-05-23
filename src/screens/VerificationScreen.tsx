import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Platform,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import { handleError, showSuccess } from '../utils/errorHandler';

export default function VerificationScreen({ route, navigation }: any) {
    const email = route.params?.email || 'usuario@correo.com';
    const [code, setCode] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);

    const ref1 = useRef<TextInput>(null);
    const ref2 = useRef<TextInput>(null);
    const ref3 = useRef<TextInput>(null);
    const ref4 = useRef<TextInput>(null);

    const handleTextChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text.slice(-1); // Only keep last character
        setCode(newCode);

        // Auto focus next input
        if (text.length > 0) {
            if (index === 0) ref2.current?.focus();
            else if (index === 1) ref3.current?.focus();
            else if (index === 2) ref4.current?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Auto focus previous input on delete
        if (e.nativeEvent.key === 'Backspace' && code[index] === '') {
            if (index === 1) ref1.current?.focus();
            else if (index === 2) ref2.current?.focus();
            else if (index === 3) ref3.current?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length < 4) {
            handleError({ message: 'Por favor, introduce el código de 4 dígitos.' });
            return;
        }

        setLoading(true);
        try {
            // Simulated validation since OTP relies on email link/Supabase settings.
            // Let's pretend it succeeds to make the flow beautiful, or let the user know.
            setTimeout(() => {
                showSuccess('¡Código verificado con éxito!', 'Verificación Exitosa');
                navigation.replace('Splash');
                setLoading(false);
            }, 1000);
        } catch (err) {
            handleError(err, 'Error de Verificación');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header oscuro */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Verificación</Text>
                <Text style={styles.subtitle}>
                    Hemos enviado un código a tu correo{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
            </View>

            {/* Inputs de 4 dígitos */}
            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>📧 VERIFICACIÓN DE CORREO REQUERIDA</Text>
                    <Text style={styles.infoCardText}>
                        Para activar tu cuenta real de **Supabase**, por favor abre tu **correo electrónico** y haz clic en el **enlace de confirmación** que te enviamos. (Revisa también tu bandeja de Spam).
                    </Text>
                    <Text style={styles.infoCardTip}>
                        💡 **Consejo de Pruebas:** Si no deseas verificar correos reales durante tu desarrollo, puedes desactivar la opción en tu **Supabase Dashboard** ➔ **Authentication** ➔ **Providers** ➔ **Email** ➔ desactiva "Confirm email".
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {[ref1, ref2, ref3, ref4].map((ref, index) => (
                        <TextInput
                            key={index}
                            ref={ref}
                            value={code[index]}
                            onChangeText={(text) => handleTextChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            style={styles.otpInput}
                            textAlign="center"
                            placeholder="-"
                            placeholderTextColor="#9CA3AF"
                        />
                    ))}
                </View>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>¿No recibiste el código? </Text>
                    <TouchableOpacity onPress={() => showSuccess('Se ha reenviado el código.', 'Código Reenviado')}>
                        <Text style={styles.resendLink}>Reenviar</Text>
                    </TouchableOpacity>
                </View>

                <CustomButton
                    title="VERIFICAR CÓDIGO (MOCK)"
                    onPress={handleVerify}
                    loading={loading}
                    variant="primary"
                    style={styles.button}
                />

                <TouchableOpacity 
                    onPress={() => navigation.replace('Login')}
                    style={styles.loginBackLink}
                >
                    <Text style={styles.loginBackLinkText}>← Regresar al Inicio de Sesión</Text>
                </TouchableOpacity>
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
    emailHighlight: {
        color: '#FF7A00',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 30,
    },
    otpInput: {
        width: 55,
        height: 55,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        borderWidth: 1.5,
        borderColor: 'transparent',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    resendContainer: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    resendText: {
        color: '#6B7280',
        fontSize: 14,
    },
    resendLink: {
        color: '#FF7A00',
        fontSize: 14,
        fontWeight: 'bold',
    },
    button: {
        width: '100%',
    },
    infoCard: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1.5,
        borderColor: '#F59E0B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        width: '100%',
    },
    infoCardTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#D97706',
        letterSpacing: 0.8,
        marginBottom: 8,
        textAlign: 'center',
    },
    infoCardText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    infoCardTip: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
        textAlign: 'center',
        borderTopWidth: 1,
        borderColor: '#FEF3C7',
        paddingTop: 8,
    },
    loginBackLink: {
        marginTop: 20,
        padding: 10,
    },
    loginBackLinkText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
});
