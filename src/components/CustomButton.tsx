import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'dark' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export default function CustomButton({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}: CustomButtonProps) {
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.btnSecondary;
            case 'dark':
                return styles.btnDark;
            case 'outline':
                return styles.btnOutline;
            case 'primary':
            default:
                return styles.btnPrimary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.txtOutline;
            case 'secondary':
                return styles.txtSecondary;
            case 'primary':
            case 'dark':
            default:
                return styles.txtLight;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), style, (disabled || loading) && styles.disabled]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#FF7A00' : '#FFF'} size="small" />
            ) : (
                <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        marginVertical: 8,
    },
    btnPrimary: {
        backgroundColor: '#FF7A00', // Premium Orange
    },
    btnSecondary: {
        backgroundColor: '#1E3547', // Muted Deep Teal/Slate
    },
    btnDark: {
        backgroundColor: '#0B0E1E', // Very dark Navy from Figma Login Header
    },
    btnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#FF7A00',
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    txtLight: {
        color: '#FFF',
    },
    txtSecondary: {
        color: '#FFF',
    },
    txtOutline: {
        color: '#FF7A00',
    },
    disabled: {
        opacity: 0.6,
    },
});
