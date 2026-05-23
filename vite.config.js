import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'expo-image-picker': path.resolve(__dirname, 'src/utils/imagePickerMock.ts'),
            'expo-local-authentication': path.resolve(__dirname, 'src/utils/localAuthMock.ts'),
            'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'src/utils/codegenMock.ts'),
            'react-native-web/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'src/utils/codegenMock.ts'),
            'react-native': 'react-native-web',
        },
        extensions: [
            '.web.tsx',
            '.web.ts',
            '.web.jsx',
            '.web.js',
            '.tsx',
            '.ts',
            '.jsx',
            '.js',
        ],
    },
    define: {
        global: 'window',
        __DEV__: 'true',
    },
    optimizeDeps: {
        esbuildOptions: {
            resolveExtensions: [
                '.web.tsx',
                '.web.ts',
                '.web.jsx',
                '.web.js',
                '.tsx',
                '.ts',
                '.jsx',
                '.js',
            ],
        },
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
});

