import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    title: 'Todo dentro de la misma app',
    description: 'Obten todos los productos dentro de la misma aplicación, busca en el catálogo.',
  },
  {
    title: 'Todos tus favoritos',
    description: 'Todos tus productos favoritos dentro de la app, a un solo click de distancia.',
  },
  {
    title: 'Busca a tu vendedor favorito',
    description: 'Todos los pequeños vendedores estarán cerca de ti.',
  },
  {
    title: 'Entregas súper sencillas',
    description: 'Solo selecciona un producto, acuerda con el vendedor y listo!',
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login'); // Move to Login
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const currentItem = ONBOARDING_DATA[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topDecoration} />
      
      <View style={styles.content}>
        {/* Placeholder for the central image block */}
        <View style={styles.imagePlaceholder} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentItem.title}</Text>
          <Text style={styles.description}>{currentItem.description}</Text>
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentIndex === index && styles.activeDot
              ]} 
            />
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'EMPEZAR' : 'SIGUIENTE'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Saltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topDecoration: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F8FBFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: '#95A5B6', // Slate gray from the design mockups
    borderRadius: 8,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
    height: 80, // Fixed height to prevent jumping
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E2235',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#164E87',
    width: 12,
  },
  primaryButton: {
    backgroundColor: '#164E87',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  }
});
