import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';

interface CustomInputProps {
    label?: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    placeholderTextColor?: string;
    editable?: boolean;
}

export default function CustomInput({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    style,
    inputStyle,
    placeholderTextColor = '#9CA3AF',
    editable = true,
}: CustomInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isSecure = secureTextEntry && !showPassword;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputFocused,
                ]}
            >
                <TextInput
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isSecure}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    placeholderTextColor={placeholderTextColor}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={editable}
                    style={[styles.input, inputStyle, !editable && { opacity: 0.6 }]}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Text style={styles.eyeText}>
                            {showPassword ? '👁️' : '🙈'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
        paddingLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Light gray background matching Figma
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputFocused: {
        borderColor: '#FF7A00', // Focused orange border
        backgroundColor: '#FFF',
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyeText: {
        fontSize: 18,
    },
});
