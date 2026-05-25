import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const C = {
  bg:      '#000000',
  teal:    '#0D9AA3',
  tealDim: '#0D9AA320',
  white:   '#FFFFFF',
  gray:    '#E3E3E3',
  red:     '#FD4E4E',
  card:    '#111111',
  border:  '#1E1E1E',
  sub:     '#555555',
};

const ONBOARDING_DATA = [
  {
    icon:        'storefront-outline',
    accent:      C.teal,
    title:       'Todo dentro de\nla misma app',
    description: 'Obtén todos los productos dentro de la misma aplicación, busca en el catálogo.',
  },
  {
    icon:        'heart-outline',
    accent:      '#FD4E4E',
    title:       'Todos tus\nfavoritos',
    description: 'Todos tus productos favoritos dentro de la app, a un solo click de distancia.',
  },
  {
    icon:        'people-outline',
    accent:      C.teal,
    title:       'Busca a tu\nvendedor favorito',
    description: 'Todos los pequeños vendedores estarán cerca de ti.',
  },
  {
    icon:        'bag-check-outline',
    accent:      '#0D9AA3',
    title:       'Entregas súper\nsencillas',
    description: 'Solo selecciona un producto, acuerda con el vendedor y ¡listo!',
  },
];

// ── Slide illustration ────────────────────────────────────
function SlideIllustration({ item, animValue }) {
  const scale = animValue.interpolate({
    inputRange: [0, 1], outputRange: [0.7, 1],
  });
  const opacity = animValue.interpolate({
    inputRange: [0, 1], outputRange: [0, 1],
  });

  return (
    <Animated.View style={[styles.illustrationWrap, { opacity, transform: [{ scale }] }]}>
      {/* Anillos decorativos */}
      <View style={[styles.ring, styles.ring3, { borderColor: item.accent + '18' }]} />
      <View style={[styles.ring, styles.ring2, { borderColor: item.accent + '28' }]} />
      <View style={[styles.ring, styles.ring1, { borderColor: item.accent + '40' }]} />
      {/* Círculo central */}
      <View style={[styles.iconCircle, { backgroundColor: item.accent + '18', borderColor: item.accent + '40' }]}>
        <Ionicons name={item.icon} size={64} color={item.accent} />
      </View>
    </Animated.View>
  );
}

// ── Dot de paginación ─────────────────────────────────────
function PaginationDot({ active, color }) {
  const w = useRef(new Animated.Value(active ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(w, { toValue: active ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [active]);

  const dotWidth = w.interpolate({ inputRange: [0, 1], outputRange: [8, 24] });
  const bg = w.interpolate({ inputRange: [0, 1], outputRange: [C.border, color] });

  return <Animated.View style={[styles.dot, { width: dotWidth, backgroundColor: bg }]} />;
}

// ── Pantalla ──────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;

  const goTo = (nextIndex) => {
    Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentIndex(nextIndex);
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      goTo(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => navigation.replace('Login');

  const item     = ONBOARDING_DATA[currentIndex];
  const isLast   = currentIndex === ONBOARDING_DATA.length - 1;

  const textOpacity = anim;
  const textY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Orb de fondo */}
      <View style={[styles.bgOrb, { backgroundColor: item.accent }]} />

      {/* Skip */}
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Ionicons name="storefront" size={18} color={C.teal} />
          <Text style={styles.logoText}>itambreados</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Saltar</Text>
          <Ionicons name="chevron-forward" size={14} color={C.sub} />
        </TouchableOpacity>
      </View>

      {/* Ilustración */}
      <SlideIllustration item={item} animValue={anim} />

      {/* Texto */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        <Text style={[styles.title, { }]}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>

      {/* Paginación */}
      <View style={styles.pagination}>
        {ONBOARDING_DATA.map((_, i) => (
          <PaginationDot key={i} active={currentIndex === i} color={item.accent} />
        ))}
      </View>

      {/* Botones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: item.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'EMPEZAR' : 'SIGUIENTE'}</Text>
          <Ionicons name={isLast ? 'rocket-outline' : 'arrow-forward'} size={18} color={C.white} />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBottomBtn}>
            <Text style={styles.skipBottomText}>Saltar introducción</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },

  bgOrb: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.75,
    opacity: 0.05,
  },

  // Top
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.teal,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  skipText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // Ilustración
  illustrationWrap: {
    marginTop: height * 0.05,
    marginBottom: height * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.72,
    height: width * 0.72,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ring1: { width: width * 0.5,  height: width * 0.5 },
  ring2: { width: width * 0.62, height: width * 0.62 },
  ring3: { width: width * 0.72, height: width * 0.72 },
  iconCircle: {
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: width * 0.19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Texto
  textBlock: {
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Paginación
  pagination: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  // Acciones
  actions: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  nextBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  skipBottomBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBottomText: {
    fontSize: 13,
    color: C.sub,
    fontWeight: '500',
  },
});