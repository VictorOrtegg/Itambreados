import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView, StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 12) / 2;

const C = {
  bg:      '#000000',
  teal:    '#0D9AA3',
  tealDim: '#0D9AA318',
  white:   '#FFFFFF',
  gray:    '#E3E3E3',
  red:     '#FD4E4E',
  card:    '#111111',
  card2:   '#161616',
  border:  '#1E1E1E',
  sub:     '#555555',
};

const RECENT   = ['Botana', 'Cacahuates', 'Chapatas'];
const SELLERS  = [
  { id: '1', name: 'Fernanda Cristobal', rating: 4.9 },
  { id: '2', name: 'El de los bolis',    rating: 4.3 },
  { id: '3', name: 'El de los flanes',   rating: 4.0 },
];
const PRODUCTS = [
  { id: '1', name: 'Chapatas',  seller: 'Fernanda Cristobal' },
  { id: '2', name: 'Flan',      seller: 'El De Los Flanes' },
  { id: '3', name: 'Chapatas',  seller: 'Fernanda Cristobal' },
  { id: '4', name: 'Flan',      seller: 'El De Los Flanes' },
  { id: '5', name: 'Chapatas',  seller: 'Fernanda Cristobal' },
  { id: '6', name: 'Flan',      seller: 'El De Los Flanes' },
];

// ── Avatar placeholder ────────────────────────────────────
function Avatar({ size = 46 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.28 }]} />
  );
}

// ── Tarjeta de producto ───────────────────────────────────
function ProductCard({ item }) {
  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.8}>
      <View style={styles.productImg} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productSeller} numberOfLines={1}>{item.seller}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Pantalla ──────────────────────────────────────────────
export default function SearchScreen() {
  const [query, setQuery] = useState('Cacahuates');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Header ───────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={C.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Buscar</Text>

          <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7}>
            <Ionicons name="bag-handle-outline" size={20} color={C.white} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Buscador ─────────────────────────────────── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={C.sub} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar producto o vendedor"
            placeholderTextColor={C.sub}
            selectionColor={C.teal}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <View style={styles.clearCircle}>
                <Ionicons name="close" size={11} color={C.bg} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Búsquedas recientes ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Búsquedas Recientes</Text>
          <View style={styles.chipsRow}>
            {RECENT.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, query === item && styles.chipActive]}
                activeOpacity={0.75}
                onPress={() => setQuery(item)}
              >
                <Text style={[styles.chipText, query === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Vendedores sugeridos ──────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendedores Sugeridos</Text>
          <View style={styles.sellerList}>
            {SELLERS.map((seller, idx) => (
              <TouchableOpacity
                key={seller.id}
                style={[
                  styles.sellerRow,
                  idx < SELLERS.length - 1 && styles.sellerRowBorder,
                ]}
                activeOpacity={0.75}
              >
                <Avatar size={46} />
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star-outline" size={13} color={C.teal} />
                    <Text style={styles.ratingText}>{seller.rating}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.sub} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Productos populares ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos Populares</Text>
          <View style={styles.productsGrid}>
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id + p.name + Math.random()} item={p} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 8, fontWeight: '800', color: C.white },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.white,
    paddingVertical: 12,
  },
  clearBtn:    { padding: 4 },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sección genérica
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.tealDim,
    borderColor: C.teal,
  },
  chipText: {
    fontSize: 13,
    color: C.gray,
    fontWeight: '500',
  },
  chipTextActive: {
    color: C.teal,
    fontWeight: '700',
  },

  // Vendedores
  sellerList: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  sellerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: {
    backgroundColor: '#1E1E1E',
  },
  sellerInfo: { flex: 1 },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: C.sub,
    fontWeight: '500',
  },

  // Productos
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: CARD_W,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: CARD_W * 0.75,
    backgroundColor: '#1A1A1A',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
    marginBottom: 2,
  },
  productSeller: {
    fontSize: 11,
    color: C.sub,
  },
});