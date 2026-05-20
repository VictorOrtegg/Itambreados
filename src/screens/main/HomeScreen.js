import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  
  // Extract first name if available, else generic greeting
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Alumno';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hola, Good Afternoon!</Text>
            <Text style={styles.nameText}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.profileIcon}>
            {/* Logout icon placeholder / Profile pic */}
            <Text style={{fontSize: 20}}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search dishes, restaurants"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Categories</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See All &gt;</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIconContainer, {backgroundColor: '#FDE68A'}]}>
              <Text style={styles.categoryEmoji}>🍕</Text>
            </View>
            <Text style={styles.categoryName}>Pizza</Text>
            <Text style={styles.categoryCount}>Starting</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIconContainer, {backgroundColor: '#FCA5A5'}]}>
              <Text style={styles.categoryEmoji}>🍔</Text>
            </View>
            <Text style={styles.categoryName}>Burger</Text>
            <Text style={styles.categoryCount}>$20</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIconContainer, {backgroundColor: '#FEF3C7'}]}>
              <Text style={styles.categoryEmoji}>🌭</Text>
            </View>
            <Text style={styles.categoryName}>Hot Dog</Text>
            <Text style={styles.categoryCount}>$15</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={[styles.categoryIconContainer, {backgroundColor: '#DBEAFE'}]}>
              <Text style={styles.categoryEmoji}>🥤</Text>
            </View>
            <Text style={styles.categoryName}>Drink</Text>
            <Text style={styles.categoryCount}>$10</Text>
          </View>
        </ScrollView>

        {/* Open Restaurants */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open Restaurants</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See All &gt;</Text></TouchableOpacity>
        </View>
        
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantImagePlaceholder} />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>Rose Garden Restaurant</Text>
            <Text style={styles.restaurantTags}>Burger - Chicken - Riche - Wings</Text>
            <View style={styles.restaurantMeta}>
              <Text style={styles.metaText}>⭐ 4.7</Text>
              <Text style={styles.metaText}>🚚 Free</Text>
              <Text style={styles.metaText}>⏱ 20 min</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFC' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 80 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 14, color: '#6B7280' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#1E2235' },
  profileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, alignItems: 'center', height: 50, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E2235' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E2235' },
  seeAllText: { fontSize: 14, color: '#6B7280' },
  categoriesContainer: { flexDirection: 'row', marginBottom: 25 },
  categoryCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 16, alignItems: 'center', marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, width: 90 },
  categoryIconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  categoryEmoji: { fontSize: 24 },
  categoryName: { fontSize: 14, fontWeight: 'bold', color: '#1E2235', marginBottom: 4 },
  categoryCount: { fontSize: 12, color: '#9CA3AF' },
  restaurantCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  restaurantImagePlaceholder: { width: '100%', height: 150, backgroundColor: '#95A5B6' },
  restaurantInfo: { padding: 15 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', color: '#1E2235', marginBottom: 5 },
  restaurantTags: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  restaurantMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: '#164E87', fontWeight: '600', marginRight: 15 },
});
