import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView, ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const C = {
  bg:      '#000000',
  teal:    '#0D9AA3',
  tealDim: '#0D9AA318',
  white:   '#FFFFFF',
  gray:    '#E3E3E3',
  red:     '#FD4E4E',
  redDim:  '#FD4E4E18',
  card:    '#111111',
  card2:   '#181818',
  border:  '#1E1E1E',
  sub:     '#555555',
  yellow:  '#F5A623',
  yellowDim: '#F5A62318',
  green:   '#27AE60',
  greenDim: '#27AE6018',
};

// ── Status config ─────────────────────────────────────────
const STATUS = {
  pendiente:  { label: 'Pendiente',   color: C.yellow,  bg: C.yellowDim, icon: 'time-outline' },
  confirmado: { label: 'Confirmado',  color: C.teal,    bg: C.tealDim,   icon: 'checkmark-circle-outline' },
  entregado:  { label: 'Entregado',   color: C.green,   bg: C.greenDim,  icon: 'bag-check-outline' },
  cancelado:  { label: 'Cancelado',   color: C.red,     bg: C.redDim,    icon: 'close-circle-outline' },
};

// ── Datos de ejemplo ──────────────────────────────────────
const ORDERS = [
  {
    id: 'ORD-001',
    seller: 'Fernanda Cristobal',
    sellerType: 'Chapotas · Ensaladas',
    date: '25 May 2026  •  10:32 am',
    status: 'pendiente',
    payment: 'Efectivo',
    total: 85,
    items: [
      { name: 'Chapata de elote', qty: 2, price: 25 },
      { name: 'Ensalada mixta',   qty: 1, price: 35 },
    ],
    note: 'Sin chile en la ensalada, por favor.',
    address: 'Edificio P, Piso 3',
  },
  {
    id: 'ORD-002',
    seller: 'Victor Ortega',
    sellerType: 'Botana',
    date: '24 May 2026  •  2:15 pm',
    status: 'confirmado',
    payment: 'Transferencia',
    total: 60,
    items: [
      { name: 'Cacahuates preparados', qty: 3, price: 20 },
    ],
    note: '',
    address: 'Edificio P, Piso 1',
  },
  {
    id: 'ORD-003',
    seller: 'El de los flanes',
    sellerType: 'Postres',
    date: '22 May 2026  •  4:00 pm',
    status: 'entregado',
    payment: 'Efectivo',
    total: 120,
    items: [
      { name: 'Flan napolitano', qty: 2, price: 45 },
      { name: 'Gelatina de cajeta', qty: 1, price: 30 },
    ],
    note: '',
    address: 'Edificio P, Piso 2',
  },
  {
    id: 'ORD-004',
    seller: 'El de los bolis',
    sellerType: 'Bebidas frías',
    date: '20 May 2026  •  12:45 pm',
    status: 'cancelado',
    payment: 'Efectivo',
    total: 30,
    items: [
      { name: 'Boli de tamarindo', qty: 3, price: 10 },
    ],
    note: 'Cancelado porque el vendedor no estaba disponible.',
    address: 'Edificio P, Piso 4',
  },
];

// ── Filter tabs ───────────────────────────────────────────
const FILTERS = ['Todos', 'Pendiente', 'Confirmado', 'Entregado', 'Cancelado'];

// ── Línea de detalle ──────────────────────────────────────
function DetailRow({ icon, label, value, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={14} color={C.sub} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ── Card de pedido ────────────────────────────────────────
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];
  const heightAnim = useState(new Animated.Value(0))[0];

  const st = STATUS[order.status];

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.parallel([
      Animated.spring(rotateAnim, { toValue, friction: 6, useNativeDriver: true }),
      Animated.timing(heightAnim, { toValue, duration: 280, useNativeDriver: false }),
    ]).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const maxHeight = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 500] });

  return (
    <View style={styles.card}>

      {/* ── Cabecera de la card ─────────────────────── */}
      <View style={styles.cardHeader}>
        {/* Avatar inicial */}
        <View style={[styles.sellerAvatar, { backgroundColor: st.bg, borderColor: st.color + '40' }]}>
          <Text style={[styles.sellerInitial, { color: st.color }]}>
            {order.seller.charAt(0)}
          </Text>
        </View>

        <View style={styles.cardHeaderInfo}>
          <Text style={styles.sellerName} numberOfLines={1}>{order.seller}</Text>
          <Text style={styles.sellerType} numberOfLines={1}>{order.sellerType}</Text>
        </View>

        {/* Badge de estado */}
        <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.color + '50' }]}>
          <Ionicons name={st.icon} size={11} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {/* ── Info rápida ─────────────────────────────── */}
      <View style={styles.quickInfo}>
        <View style={styles.quickItem}>
          <Ionicons name="calendar-outline" size={13} color={C.sub} />
          <Text style={styles.quickText}>{order.date}</Text>
        </View>
        <View style={styles.quickDivider} />
        <View style={styles.quickItem}>
          <Ionicons name={order.payment === 'Efectivo' ? 'cash-outline' : 'phone-portrait-outline'} size={13} color={C.sub} />
          <Text style={styles.quickText}>{order.payment}</Text>
        </View>
        <View style={styles.quickDivider} />
        <View style={styles.quickItem}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total}</Text>
        </View>
      </View>

      {/* ── Botón desplegable ───────────────────────── */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.expandText}>{expanded ? 'Ocultar detalles' : 'Ver detalles'}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color={C.teal} />
        </Animated.View>
      </TouchableOpacity>

      {/* ── Detalles expandibles ────────────────────── */}
      <Animated.View style={[styles.detailsWrap, { maxHeight }]}>
        <View style={styles.detailsInner}>

          {/* Divider */}
          <View style={styles.divider} />

          {/* ID y dirección */}
          <DetailRow icon="receipt-outline"  label="Pedido"     value={order.id} />
          <DetailRow icon="location-outline" label="Entregar a" value={order.address} />
          <DetailRow
            icon="cash-outline"
            label="Pago"
            value={order.payment === 'Efectivo' ? 'Efectivo al recibir' : 'Transferencia'}
            valueColor={C.teal}
          />

          {/* Productos */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Productos</Text>
            {order.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQty}>{item.qty}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price * item.qty}</Text>
              </View>
            ))}
          </View>

          {/* Nota del cliente */}
          {order.note ? (
            <View style={styles.noteBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.sub} />
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          ) : null}

          {/* Total final */}
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Total a pagar</Text>
            <Text style={styles.totalRowValue}>${order.total}</Text>
          </View>

          {/* Acción si pendiente */}
          {order.status === 'pendiente' && (
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={16} color={C.red} />
              <Text style={styles.cancelText}>Cancelar pedido</Text>
            </TouchableOpacity>
          )}

        </View>
      </Animated.View>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────
export default function OrdersScreen() {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filtered = ORDERS.filter((o) => {
    if (activeFilter === 'Todos') return true;
    return STATUS[o.status].label === activeFilter;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Pedidos</Text>
          <Text style={styles.headerSub}>{ORDERS.length} pedidos en total</Text>
        </View>
        <TouchableOpacity style={styles.historyBtn} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={20} color={C.teal} />
        </TouchableOpacity>
      </View>

      {/* ── Filtros ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Lista ──────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 8 }}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={52} color={C.border} />
            <Text style={styles.emptyTitle}>Sin pedidos</Text>
            <Text style={styles.emptySub}>No tienes pedidos en esta categoría.</Text>
          </View>
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.white },
  headerSub:   { fontSize: 12, color: C.sub, marginTop: 2 },
  historyBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Filtros
  filtersScroll: { flexGrow: 0 },
  filtersRow: {
    paddingHorizontal: 20, paddingBottom: 12, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.tealDim, borderColor: C.teal,
  },
  filterText:       { fontSize: 13, color: C.sub, fontWeight: '500' },
  filterTextActive: { color: C.teal, fontWeight: '700' },

  // Card
  card: {
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  sellerAvatar: {
    width: 44, height: 44, borderRadius: 13,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  sellerInitial: { fontSize: 20, fontWeight: '800' },
  cardHeaderInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '700', color: C.white },
  sellerType: { fontSize: 11, color: C.sub, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Quick info
  quickInfo: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 10,
  },
  quickItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  quickText:    { fontSize: 12, color: C.sub },
  quickDivider: { width: 1, height: 14, backgroundColor: C.border },
  totalLabel:   { fontSize: 12, color: C.sub },
  totalValue:   { fontSize: 13, fontWeight: '700', color: C.teal, marginLeft: 4 },

  // Expand btn
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.card2,
  },
  expandText: { fontSize: 13, color: C.teal, fontWeight: '600' },

  // Detalles
  detailsWrap:  { overflow: 'hidden' },
  detailsInner: { padding: 16, paddingTop: 0 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 14 },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  detailLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailLabel: { fontSize: 12, color: C.sub },
  detailValue: { fontSize: 12, color: C.gray, fontWeight: '500', maxWidth: width * 0.5, textAlign: 'right' },

  // Productos
  itemsSection: {
    marginTop: 6, marginBottom: 12,
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 12,
  },
  itemsTitle: {
    fontSize: 11, fontWeight: '700', color: C.sub,
    letterSpacing: 1.2, marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
  },
  itemQtyBadge: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: C.tealDim, borderWidth: 1, borderColor: C.teal + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  itemQty:   { fontSize: 11, fontWeight: '800', color: C.teal },
  itemName:  { flex: 1, fontSize: 13, color: C.gray },
  itemPrice: { fontSize: 13, fontWeight: '700', color: C.white },

  // Nota
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    padding: 10, backgroundColor: C.bg, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  noteText: { flex: 1, fontSize: 12, color: C.sub, lineHeight: 18 },

  // Total final
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, marginBottom: 12,
  },
  totalRowLabel: { fontSize: 14, color: C.gray, fontWeight: '600' },
  totalRowValue: { fontSize: 18, fontWeight: '900', color: C.teal },

  // Cancelar
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.redDim, borderWidth: 1, borderColor: C.red + '40',
  },
  cancelText: { fontSize: 13, color: C.red, fontWeight: '700' },

  // Empty
  empty: {
    alignItems: 'center', paddingTop: 80, gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.sub },
  emptySub:   { fontSize: 13, color: C.border },
});