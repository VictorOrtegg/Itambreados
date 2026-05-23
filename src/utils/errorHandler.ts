import { Alert, Platform } from 'react-native';

export const handleError = (error: any, customTitle?: string) => {
    const message = error?.message || error?.toString() || 'An unknown error occurred.';
    const title = customTitle || 'Error';

    console.error(`[App Error] ${title}:`, message, error);

    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

export const showSuccess = (message: string, title: string = 'Success') => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};
