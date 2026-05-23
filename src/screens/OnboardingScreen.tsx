import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import CustomButton from '../components/CustomButton';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Todo dentro de la misma app',
    subtitle: 'Obtén todos los productos dentro de la misma aplicación, nosotros nos encargamos del catálogo.',
    emoji: '📱',
  },
  {
    id: '2',
    title: 'Todas tus favoritas',
    subtitle: 'Tus botanas y productos favoritos de la institución, a un solo click de distancia.',
    emoji: '❤️',
  },
  {
    id: '3',
    title: 'Busca a tu vendedor favorito',
    subtitle: 'Todos los pequeños comerciantes locales de tu facultad reunidos en un solo lugar.',
    emoji: '🤝',
  },
  {
    id: '4',
    title: 'Entregas súper sencillas',
    subtitle: 'Selecciona un producto, acuerda el punto de entrega con el vendedor a través de nuestro chat y ¡listo!',
    emoji: '🎒',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      ref.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.slide}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={ref}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
      />

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentIndex === i && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Dynamic Buttons */}
      <View style={styles.buttonContainer}>
        <CustomButton
            title={currentIndex === slides.length - 1 ? 'EMPEZAR' : 'SIGUIENTE'}
            onPress={handleNext}
            variant="primary"
            style={styles.actionButton}
        />

        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
            <Text style={styles.skip}>Saltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },

  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#E6F2F7', // Soft background matching Figma
    borderRadius: 100,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  emoji: {
    fontSize: 84,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0B0E1E',
    marginBottom: 16,
  },

  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  dotsContainer: {
    flexDirection: 'row',
    marginVertical: 15,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#FF7A00', // Premium Orange active dot
    width: 24,
  },

  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: Platform.OS === 'ios' ? 10 : 20,
  },

  actionButton: {
    width: '100%',
    backgroundColor: '#0B0E1E', // Matching navy dark blue primary action buttons in Figma onboarding
  },

  skipBtn: {
    padding: 10,
    marginTop: 6,
  },

  skip: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
});