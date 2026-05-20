import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Placeholder for actual logo image */}
        <View style={styles.iconPlaceholder}>
           <Text style={styles.iconText}>🍔</Text>
        </View>
        <Text style={styles.logoText}>
          <Text style={{color: '#44889E'}}>IT</Text>Ambreados
        </Text>
      </View>
      <View style={styles.bottomDecoration} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 50,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#164E87',
    letterSpacing: 1,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 20,
    borderColor: '#E8F1F5',
    opacity: 0.5,
  }
});
