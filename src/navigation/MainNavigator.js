import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';

const Tab = createBottomTabNavigator();

// Placeholder for Search and Profile
function PlaceholderScreen({ route }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{route.name} Screen</Text>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#164E87',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 10,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>🏠</Text> }}
      />
      <Tab.Screen 
        name="Search" 
        component={PlaceholderScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>🔍</Text> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PlaceholderScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}
