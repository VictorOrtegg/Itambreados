import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const { user } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      if (user) {
        navigation.replace('Home');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      {/* Decorative top-left circle */}
      <View style={styles.topLeftCircle} />

      {/* Main Logo Content */}
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCart}>
          <Text style={styles.cartEmoji}>🛒</Text>
          <View style={styles.foodBadge}>
            <Text style={styles.badgeText}>🍔</Text>
          </View>
        </View>
        <Text style={styles.logoText}>
          ITA<Text style={styles.orangeText}>mbriados</Text>
        </Text>
        <Text style={styles.tagline}>Tu mercado universitario</Text>
      </Animated.View>

      {/* Decorative bottom-right striped lines from Figma splash */}
      <View style={styles.bottomDecorContainer}>
        {[...Array(6)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.decorLine, 
              { 
                width: 140 + i * 25, 
                height: 10, 
                transform: [{ rotate: '-45deg' }],
                opacity: 0.15 - i * 0.02
              }
            ]} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  topLeftCircle: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F3F4F6',
    opacity: 0.8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCart: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      }
    }),
  },
  cartEmoji: {
    fontSize: 52,
  },
  foodBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF7A00',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    fontSize: 16,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0B0E1E',
    letterSpacing: 1,
  },
  orangeText: {
    color: '#FF7A00', // Bright Figma orange
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  bottomDecorContainer: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  decorLine: {
    backgroundColor: '#1A4F6E', // Navy/blue color from mockup
    borderRadius: 5,
    marginVertical: 4,
  },
});