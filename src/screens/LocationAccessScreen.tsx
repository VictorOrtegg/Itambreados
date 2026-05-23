import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Platform,
    Alert,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import { showSuccess } from '../utils/errorHandler';

export default function LocationAccessScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);

    const handleGrantPermission = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            showSuccess('Permiso de ubicación concedido.', 'Ubicación Activa');
            navigation.replace('Home');
        }, 1200);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Círculo decorativo con Pin de Ubicación en SVG/CSS */}
                <View style={styles.mapIconContainer}>
                    <View style={styles.outerCircle}>
                        <View style={styles.innerCircle}>
                            <Text style={styles.pinIcon}>📍</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.title}>Acceso a Ubicación</Text>
                
                <Text style={styles.description}>
                    ITAmbriados necesita conocer tu ubicación para mostrarte las ventas, 
                    vendedores y productos disponibles a tu alrededor dentro de la institución.
                </Text>

                <CustomButton
                    title="ACCEDER A UBICACIÓN"
                    onPress={handleGrantPermission}
                    loading={loading}
                    variant="primary"
                    style={styles.button}
                />

                <Text style={styles.subtext}>
                    Puedes cambiar estos permisos en cualquier momento en los ajustes de tu dispositivo.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    mapIconContainer: {
        marginBottom: 40,
    },
    outerCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#E6F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    pinIcon: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    button: {
        width: '100%',
        backgroundColor: '#0B0E1E', // Matching dark blue button from Figma mockup
    },
    subtext: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 16,
    },
});
