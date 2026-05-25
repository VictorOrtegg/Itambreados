import { useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// ── Paleta ──────────────────────────────────────────────
const C = {
  bg:       '#000000',
  teal:     '#0D9AA3',
  white:    '#FFFFFF',
  gray:     '#E3E3E3',
  red:      '#FD4E4E',
  card:     '#111111',
  border:   '#1E1E1E',
  subtext:  '#888888',
};

// ── Datos de ejemplo ─────────────────────────────────────
const CATEGORIES = [
  { id: '1', name: 'Dulces',  emoji: '🍬' },
  { id: '2', name: 'Comida',  emoji: '🍔' },
  { id: '3', name: 'Bebidas', emoji: '🧃' },
  { id: '4', name: 'Frutas',  emoji: '🍎' },
  { id: '5', name: 'Snacks',  emoji: '🍿' },
];

const SELLERS = [
  {
    id: '1',
    name: 'Victor Ortega',
    type: 'Botana',
    rating: 4.7,
    delivery: 'Free',
    time: '10 min',
    badge: 'Top',
  },
  {
    id: '2',
    name: 'Fernanda Cristobal',
    type: 'Chapotas · Ensaladas · Dulces',
    rating: 4.9,
    delivery: 'Free',
    time: '5 min',
    badge: null,
  },
  {
    id: '3',
    name: 'Luis Hernández',
    type: 'Comida · Bebidas',
    rating: 4.5,
    delivery: 'Free',
    time: '15 min',
    badge: 'Nuevo',
  },
];

// ── Componentes auxiliares ────────────────────────────────

function StarIcon() {
  return <Text style={{ color: C.teal, fontSize: 12 }}>★</Text>;
}

function TruckIcon() {
  return <Text style={{ color: C.teal, fontSize: 12 }}>🚚</Text>;
}

function ClockIcon() {
  return <Text style={{ color: C.subtext, fontSize: 12 }}>🕐</Text>;
}

function CategoryCard({ item }) {
  return (
    <TouchableOpacity style={styles.categoryCard} activeOpacity={0.75}>
      <View style={styles.categoryEmoji}>
        <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );
}

function SellerCard({ item }) {
  return (
    <TouchableOpacity style={styles.sellerCard} activeOpacity={0.8}>
      {/* Banner placeholder */}
      <View style={styles.sellerBanner}>
        {item.badge && (
          <View style={[
            styles.badge,
            { backgroundColor: item.badge === 'Top' ? C.teal : C.red },
          ]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>

      {/* Info row */}
      <View style={styles.sellerInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sellerName}>{item.name}</Text>
          <Text style={styles.sellerType}>{item.type}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.sellerMeta}>
        <View style={styles.metaChip}>
          <StarIcon />
          <Text style={styles.metaText}>{item.rating}</Text>
        </View>
        <View style={styles.metaChip}>
          <TruckIcon />
          <Text style={[styles.metaText, { color: C.teal }]}>{item.delivery}</Text>
        </View>
        <View style={styles.metaChip}>
          <ClockIcon />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Pantalla principal ────────────────────────────────────
export default function HomeScreen({ navigation }) { // <-- Aseguramos que navigation esté aquí
  const [search, setSearch] = useState('');
  const cartCount = 2;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110}}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Dirección */}
          <TouchableOpacity style={styles.addressRow} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={[styles.menuLine, { width: 14 }]} />
              <View style={styles.menuLine} />
            </View>
            <View>
              <Text style={styles.addressLabel}>ENTREGAR A</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.addressValue}>Edificio P</Text>
                <Text style={{ color: C.teal, fontSize: 10 }}>▼</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Carrito */}
          <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Saludo ─────────────────────────────────────── */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            Hola Brandon,{' '}
            <Text style={styles.greetingBold}>Buenos Días!</Text>
          </Text>
          <View style={styles.tealAccent} />
        </View>

        {/* ── Buscador ───────────────────────────────────── */}
        {/* Envolvemos el buscador en un TouchableOpacity */}
        <TouchableOpacity 
          style={styles.searchWrapper} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')} // <-- Redirige a la pantalla de búsqueda
        >
          <Text style={{ color: C.subtext, fontSize: 16, marginRight: 8 }}>🔍</Text>
          {/* Deshabilitamos el input (editable={false}, pointerEvents="none") 
              para que el toque lo reciba el TouchableOpacity padre */}
          <View pointerEvents="none" style={{ flex: 1 }}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto o vendedor"
              placeholderTextColor={C.subtext}
              value={search}
              editable={false} 
            />
          </View>
        </TouchableOpacity>

        {/* ── Categorías ─────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todas &rsaquo;</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
          renderItem={({ item }) => <CategoryCard item={item} />}
        />

        {/* ── Vendedores ─────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Vendedores Disponibles</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todos &rsaquo;</Text>
          </TouchableOpacity>
        </View>

        {SELLERS.map((seller) => (
          <SellerCard key={seller.id} item={seller} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIcon: {
    gap: 4,
    justifyContent: 'center',
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: C.teal,
    borderRadius: 2,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.teal,
    letterSpacing: 1.2,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.white,
  },

  // Saludo
  greetingRow: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    color: C.gray,
    fontWeight: '400',
  },
  greetingBold: {
    color: C.white,
    fontWeight: '800',
  },
  tealAccent: {
    marginTop: 6,
    width: 40,
    height: 3,
    backgroundColor: C.teal,
    borderRadius: 2,
  },

  // Buscador
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  searchInput: {
    fontSize: 14,
    color: C.white,
    padding: 0,
  },

  // Sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 13,
    color: C.teal,
    fontWeight: '600',
  },

  // Categorías
  categoryCard: {
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: C.gray,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Vendedores
  sellerCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  sellerBanner: {
    width: '100%',
    height: 140,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.5,
  },
  sellerInfo: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    marginBottom: 2,
  },
  sellerType: {
    fontSize: 12,
    color: C.subtext,
  },
  sellerMeta: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: C.gray,
    fontWeight: '500',
  },
});