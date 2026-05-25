import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const C = {
  bg:      '#000000',
  teal:    '#0D9AA3',
  tealDim: '#0D9AA315',
  white:   '#FFFFFF',
  card:    '#111111',
  border:  '#1E1E1E',
  sub:     '#333333',
};

export default function SplashScreen({ navigation }) {
  // Valores de animación
  const ringScale  = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY      = useRef(new Animated.Value(12)).current;
  const taglineOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Secuencia de entrada
    Animated.sequence([
      // 1. Anillos aparecen
      Animated.parallel([
        Animated.spring(ringScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 2. Logo aparece con bounce
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // 3. Texto y tagline
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(taglineOp,   { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
      ]),
    ]).start();

    // Navegar al Onboarding
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2600);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Orbs de fondo */}
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      {/* ── Logo central ─────────────────────────────── */}
      <View style={styles.center}>

        {/* Anillos animados */}
        <Animated.View style={[
          styles.ring, styles.ringLg,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]} />
        <Animated.View style={[
          styles.ring, styles.ringMd,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]} />

        {/* ── LOGO PLACEHOLDER ─────────────────────────
            Cuando tengas el logo real del proyecto:

            OPCIÓN A — imagen local (recomendada):
              1. Copia tu archivo (p. ej. logo.png) a: assets/images/logo.png
              2. Descomenta el import de Image arriba
              3. Reemplaza el bloque <Animated.View style={styles.logoCircle}> completo
                 por esto:

                 <Animated.Image
                   source={require('../../assets/images/logo.png')}
                   style={[styles.logoImage, {
                     opacity: logoOpacity,
                     transform: [{ scale: logoScale }],
                   }]}
                   resizeMode="contain"
                 />

            OPCIÓN B — URL remota:
                 <Animated.Image
                   source={{ uri: 'https://tu-dominio.com/logo.png' }}
                   style={[styles.logoImage, {
                     opacity: logoOpacity,
                     transform: [{ scale: logoScale }],
                   }]}
                   resizeMode="contain"
                 />

            El tamaño del logoImage está definido abajo en los estilos.
        ─────────────────────────────────────────────── */}
        <Animated.View style={[
          styles.logoCircle,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
          <Ionicons name="storefront" size={44} color={C.teal} />
        </Animated.View>

        {/* Texto */}
        <Animated.View style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textY }] },
        ]}>
          {/* ── NOMBRE DE LA APP ─────────────────────────
              Si el logo ya incluye el nombre, puedes
              eliminar este <Text> por completo.
          ─────────────────────────────────────────────── */}
          <Text style={styles.appName}>
            <Text style={styles.appNameAccent}>IT</Text>
            <Text style={styles.appNameMain}>ambreados</Text>
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOp }]}>
          Tu mercado de confianza 🛒
        </Animated.Text>

      </View>

      {/* Versión / loader */}
      <Animated.View style={[styles.footer, { opacity: taglineOp }]}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill]} />
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fondo
  orbTop: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: C.teal,
    opacity: 0.04,
    top: -width * 0.5,
  },
  orbBottom: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: C.teal,
    opacity: 0.03,
    bottom: -width * 0.35,
    right: -width * 0.1,
  },

  // Centro
  center: { alignItems: 'center', gap: 0 },

  // Anillos
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ringLg: {
    width: width * 0.6,
    height: width * 0.6,
    borderColor: C.teal + '18',
  },
  ringMd: {
    width: width * 0.44,
    height: width * 0.44,
    borderColor: C.teal + '30',
  },

  // Círculo del logo
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: C.tealDim,
    borderWidth: 1,
    borderColor: C.teal + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // Sombra teal
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },

  // ── Tamaño del logo real (Opción A/B) ──────────────────
  // logoImage: {
  //   width: 100,
  //   height: 100,
  //   marginBottom: 28,
  // },
  // ───────────────────────────────────────────────────────

  // Texto
  textBlock: { alignItems: 'center', marginBottom: 10 },
  appName: { letterSpacing: 1 },
  appNameAccent: {
    fontSize: 34,
    fontWeight: '900',
    color: C.teal,
  },
  appNameMain: {
    fontSize: 34,
    fontWeight: '900',
    color: C.white,
  },
  tagline: {
    fontSize: 13,
    color: C.sub,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingBar: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.border,
    overflow: 'hidden',
  },
  loadingFill: {
    width: '60%',
    height: '100%',
    backgroundColor: C.teal,
    borderRadius: 2,
    opacity: 0.6,
  },
  version: {
    fontSize: 11,
    color: C.sub,
    letterSpacing: 0.5,
  },
});