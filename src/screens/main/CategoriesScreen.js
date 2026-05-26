import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const C = {
  bg: "#000000",
  teal: "#0D9AA3",
  tealDim: "#0D9AA320",
  white: "#FFFFFF",
  gray: "#E3E3E3",
  red: "#FD4E4E",
  card: "#0F0F0F",
  card2: "#161616",
  border: "#1E1E1E",
  sub: "#555555",
};

// ── Definición de categorías con Ionicons ─────────────────
const CATEGORIES = [
  {
    id: "food",
    label: "Comida & Antojitos",
    color: "#FF6B35",
    bg: "#FF6B3520",
    icon: "fast-food-outline",
    items: [
      { icon: "fast-food", label: "Antojitos" },
      { icon: "restaurant", label: "Comida" },
      { icon: "cafe", label: "Bebidas" },
      { icon: "leaf", label: "Ensaladas" },
    ],
  },
  {
    id: "desserts",
    label: "Postres & Dulces",
    color: "#F5A623",
    bg: "#F5A62320",
    icon: "ice-cream-outline",
    items: [
      { icon: "ellipse", label: "Flanes" },
      { icon: "gift", label: "Dulces" },
      { icon: "pie-chart", label: "Pasteles" },
      { icon: "ice-cream", label: "Donas" },
    ],
  },
  {
    id: "frozen",
    label: "Congelados & Bolis",
    color: "#4FC3F7",
    bg: "#4FC3F720",
    icon: "snow-outline",
    items: [
      { icon: "snow", label: "Bolis" },
      { icon: "ice-cream", label: "Helados" },
      { icon: "water", label: "Aguas" },
      { icon: "cafe", label: "Smoothies" },
    ],
  },
  {
    id: "snacks",
    label: "Snacks & Botanas",
    color: "#A8D5A2",
    bg: "#A8D5A220",
    icon: "nutrition-outline",
    items: [
      { icon: "nutrition", label: "Cacahuates" },
      { icon: "fast-food", label: "Palomitas" },
      { icon: "pizza", label: "Chicharrón" },
      { icon: "flame", label: "Picantes" },
    ],
  },
  {
    id: "phones",
    label: "Teléfonos",
    color: "#7B68EE",
    bg: "#7B68EE20",
    icon: "phone-portrait-outline",
    items: [
      { icon: "phone-portrait", label: "iPhones" },
      { icon: "logo-android", label: "Android" },
      { icon: "battery-charging", label: "Baterías" },
      { icon: "save", label: "Memoria" },
    ],
  },
  {
    id: "accessories",
    label: "Accesorios Tech",
    color: "#0D9AA3",
    bg: "#0D9AA320",
    icon: "headset-outline",
    items: [
      { icon: "tablet-portrait", label: "Fundas" },
      { icon: "flash", label: "Cargadores" },
      { icon: "headset", label: "Audífonos" },
      { icon: "link", label: "Cables" },
    ],
  },
  {
    id: "laptops",
    label: "Laptops & Cómputo",
    color: "#E0E0E0",
    bg: "#E0E0E015",
    icon: "laptop-outline",
    items: [
      { icon: "laptop", label: "Laptops" },
      { icon: "mouse", label: "Mouse" },
      { icon: "keypad", label: "Teclados" },
      { icon: "desktop", label: "Monitores" },
    ],
  },
  {
    id: "fashion",
    label: "Ropa & Moda",
    color: "#F48FB1",
    bg: "#F48FB120",
    icon: "shirt-outline",
    items: [
      { icon: "shirt", label: "Camisas" },
      { icon: "briefcase", label: "Pantalones" },
      { icon: "footsteps", label: "Tenis" },
      { icon: "bag", label: "Bolsas" },
    ],
  },
  {
    id: "streaming",
    label: "Cuentas Digitales",
    color: "#E50914",
    bg: "#E5091420",
    icon: "play-circle-outline",
    items: [
      { icon: "tv", label: "Netflix" },
      { icon: "musical-notes", label: "Spotify" },
      { icon: "film", label: "Max" },
      { icon: "game-controller", label: "Gaming" },
    ],
  },
  {
    id: "skincare",
    label: "Cuidado Personal",
    color: "#CE93D8",
    bg: "#CE93D820",
    icon: "flower-outline",
    items: [
      { icon: "sparkles", label: "Skincare" },
      { icon: "color-palette", label: "Maquillaje" },
      { icon: "water", label: "Higiene" },
      { icon: "fitness", label: "Bienestar" },
    ],
  },
];

// ── Mini iconos dentro del folder (Actualizado) ───────────
function FolderGrid({ items, color }) {
  return (
    <View style={styles.folderGrid}>
      {items.map((item, i) => (
        <View
          key={i}
          style={[styles.miniCell, { backgroundColor: color + "25" }]}
        >
          <Ionicons name={item.icon} size={16} color={color} />
        </View>
      ))}
    </View>
  );
}

// ── Tarjeta de categoría (folder) ─────────────────────────
function CategoryCard({ item, index }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.93,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      style={styles.cardTouch}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Folder body */}
        <View
          style={[
            styles.folder,
            { backgroundColor: item.bg, borderColor: item.color + "35" },
          ]}
        >
          <FolderGrid items={item.items} color={item.color} />
          {/* Glow */}
          <View style={[styles.folderGlow, { backgroundColor: item.color }]} />
        </View>
        {/* Label */}
        <Text style={styles.cardLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={10} color={item.color} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Pantalla ──────────────────────────────────────────────
export default function CategoriesScreen() {
  const [search, setSearch] = useState("");

  const filtered = CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.items.some((i) => i.label.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categorías</Text>
          <Text style={styles.headerSub}>
            {CATEGORIES.length} secciones disponibles
          </Text>
        </View>
      </View>

      {/* ── Buscador ───────────────────────────────── */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={16}
          color={C.sub}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categoría o producto…"
          placeholderTextColor={C.sub}
          value={search}
          onChangeText={setSearch}
          selectionColor={C.teal}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <View style={styles.clearDot}>
              <Ionicons name="close" size={11} color={C.bg} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Grid ───────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {filtered.map((item, index) => (
          <CategoryCard key={item.id} item={item} index={index} />
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={44} color={C.border} />
            <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────
const COLS = 2;
const GAP = 12;
const PAD = 20;
const CARD_W = (width - PAD * 2 - GAP) / COLS;

// Nuevas medidas exactas
const FOLDER_PAD = 12;
const MINI_GAP = 8;
const FOLDER_H = CARD_W; // Lo hacemos cuadrado para que respire a lo alto
const MINI_SIZE = Math.floor((CARD_W - FOLDER_PAD * 2 - MINI_GAP) / 2); // Math.floor evita errores de decimales

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    paddingHorizontal: PAD,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.white },
  headerSub: { fontSize: 12, color: C.sub, marginTop: 2 },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: PAD,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.white, paddingVertical: 11 },
  clearDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.sub,
    alignItems: "center",
    justifyContent: "center",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: PAD,
    gap: GAP,
    paddingBottom: 120,
  },

  // Card
  cardTouch: { width: CARD_W },
  card: {
    width: CARD_W,
    alignItems: "center",
  },

  // Folder (bóveda)
  folder: {
    width: CARD_W,
    height: FOLDER_H,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    padding: FOLDER_PAD,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  folderGlow: {
    position: "absolute",
    width: CARD_W * 0.6,
    height: CARD_W * 0.6,
    borderRadius: CARD_W * 0.3,
    bottom: -CARD_W * 0.3,
    opacity: 0.06,
  },

  // Mini grid 2x2
  folderGrid: {
    width: CARD_W - FOLDER_PAD * 2, // El ancho exacto restando el padding
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MINI_GAP,
    justifyContent: "center",
  },
  miniCell: {
    width: MINI_SIZE,
    height: MINI_SIZE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Label debajo
  cardLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: C.gray,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  cardArrow: { marginTop: 2 },

  // Empty
  empty: {
    width: "100%",
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, color: C.sub },
});
