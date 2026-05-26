import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const C = {
  bg: "#000000",
  teal: "#0D9AA3",
  tealDim: "#0D9AA318",
  white: "#FFFFFF",
  gray: "#E3E3E3",
  red: "#FD4E4E",
  redDim: "#FD4E4E15",
  card: "#111111",
  border: "#1E1E1E",
  sub: "#555555",
  yellow: "#F5A623",
};

// ── Fila de opción genérica ───────────────────────────────
function OptionRow({
  icon,
  iconColor = C.teal,
  label,
  value,
  onPress,
  danger,
  last,
  children,
}) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, !last && styles.optionBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.optionIconWrap,
          { backgroundColor: danger ? C.redDim : C.tealDim },
        ]}
      >
        <Ionicons name={icon} size={17} color={danger ? C.red : iconColor} />
      </View>
      <Text style={[styles.optionLabel, danger && { color: C.red }]}>
        {label}
      </Text>
      <View style={styles.optionRight}>
        {value ? (
          <Text style={styles.optionValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {children}
        {onPress && !children && (
          <Ionicons name="chevron-forward" size={16} color={C.sub} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Encabezado de sección ─────────────────────────────────
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── Contenedor de sección ─────────────────────────────────
function Section({ children }) {
  return <View style={styles.section}>{children}</View>;
}

// ── Pantalla ──────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const [notifPedidos, setNotifPedidos] = useState(true);
  const [notifMensajes, setNotifMensajes] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // Datos de ejemplo — luego los conectas con tu AuthContext/Supabase
  const user = {
    name: "Brandon García",
    email: "brandon@gmail.com",
    phone: "+52 246 123 4567",
    location: "Apizaco, Tlaxcala",
    initials: "BG",
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ───────────────────────────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Perfil</Text>
        <TouchableOpacity style={styles.editIconBtn} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color={C.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Avatar + info ─────────────────────────── */}
        <View style={styles.profileCard}>
          {/* Orbs decorativos */}
          <View style={styles.orbA} />
          <View style={styles.orbB} />

          {/* Avatar */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{user.initials}</Text>
            </View>
            <TouchableOpacity style={styles.avatarEditBtn} activeOpacity={0.8}>
              <Ionicons name="camera" size={13} color={C.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>

          <View style={styles.profileMeta}>
            <Ionicons name="location-outline" size={13} color={C.sub} />
            <Text style={styles.profileMetaText}>{user.location}</Text>
          </View>

          {/* Stats rápidos */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.yellow }]}>2</Text>
              <Text style={styles.statLabel}>Cupones</Text>
            </View>
          </View>

          {/* Botón editar perfil */}
          <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={15} color={C.white} />
            <Text style={styles.editProfileText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ════ INFORMACIÓN PERSONAL ════════════════════ */}
        <SectionHeader title="Información Personal" />
        <Section>
          <OptionRow
            icon="person-outline"
            label="Nombre visible"
            value={user.name}
            onPress={() => {}}
          />
          <OptionRow
            icon="mail-outline"
            label="Correo"
            value={user.email}
            onPress={() => {}}
          />
          <OptionRow
            icon="call-outline"
            label="Teléfono"
            value={user.phone}
            onPress={() => {}}
            last
          />
        </Section>

        {/* ════ ENTREGAS Y PAGOS ════════════════════════ */}
        <SectionHeader title="Entregas y Pagos" />
        <Section>
          <OptionRow
            icon="location-outline"
            label="Direcciones guardadas"
            onPress={() => {}}
          />
          <OptionRow
            icon="chatbubble-ellipses-outline"
            label="Instrucciones por defecto"
            value="Sin notas"
            onPress={() => {}}
          />
          <OptionRow
            icon="wallet-outline"
            label="Métodos de pago"
            value="Efectivo · Transfer."
            onPress={() => {}}
            last
          />
        </Section>

        {/* ════ ACTIVIDAD ═══════════════════════════════ */}
        <SectionHeader title="Actividad de la Cuenta" />
        <Section>
          <OptionRow
            icon="heart-outline"
            label="Favoritos"
            onPress={() => {}}
          />
          <OptionRow
            icon="time-outline"
            label="Historial de pedidos"
            onPress={() => {}}
          />
          <OptionRow
            icon="pricetag-outline"
            iconColor={C.yellow}
            label="Cupones y Promociones"
            value="2 disponibles"
            onPress={() => {}}
            last
          />
        </Section>

        {/* ════ NOTIFICACIONES ══════════════════════════ */}
        <SectionHeader title="Notificaciones" />
        <Section>
          <OptionRow icon="bag-handle-outline" label="Estado del pedido">
            <Switch
              value={notifPedidos}
              onValueChange={setNotifPedidos}
              trackColor={{ false: C.border, true: C.teal }}
              thumbColor={C.white}
              ios_backgroundColor={C.border}
            />
          </OptionRow>
          <OptionRow icon="chatbubbles-outline" label="Mensajes nuevos">
            <Switch
              value={notifMensajes}
              onValueChange={setNotifMensajes}
              trackColor={{ false: C.border, true: C.teal }}
              thumbColor={C.white}
              ios_backgroundColor={C.border}
            />
          </OptionRow>
          <OptionRow
            icon="megaphone-outline"
            iconColor={C.yellow}
            label="Promociones y ofertas"
            last
          >
            <Switch
              value={notifPromos}
              onValueChange={setNotifPromos}
              trackColor={{ false: C.border, true: C.yellow }}
              thumbColor={C.white}
              ios_backgroundColor={C.border}
            />
          </OptionRow>
        </Section>

        {/* ════ CONFIGURACIÓN Y SOPORTE ════════════════ */}
        <SectionHeader title="Configuración y Soporte" />
        <Section>
          <OptionRow
            icon="help-circle-outline"
            label="Ayuda y Soporte"
            onPress={() => {}}
          />
          <OptionRow
            icon="shield-checkmark-outline"
            label="Seguridad de la cuenta"
            onPress={() => {}}
          />
          <OptionRow
            icon="document-text-outline"
            label="Términos de uso"
            onPress={() => {}}
          />
          <OptionRow
            icon="lock-closed-outline"
            label="Política de privacidad"
            onPress={() => {}}
            last
          />
        </Section>

        {/* ════ CERRAR SESIÓN ════════════════════════════ */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={C.red} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Versión */}
        <Text style={styles.version}>itambreados v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topTitle: { fontSize: 22, fontWeight: "800", color: C.white },
  editIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile card
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    padding: 24,
    overflow: "hidden",
  },
  orbA: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.teal,
    opacity: 0.06,
    top: -50,
    right: -30,
  },
  orbB: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.teal,
    opacity: 0.04,
    bottom: -20,
    left: -10,
  },
  avatarOuter: { marginBottom: 14, position: "relative" },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.tealDim,
    borderWidth: 2,
    borderColor: C.teal + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "900", color: C.teal },
  avatarEditBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.card,
  },
  profileName: {
    fontSize: 19,
    fontWeight: "800",
    color: C.white,
    marginBottom: 4,
  },
  profileEmail: { fontSize: 13, color: C.sub, marginBottom: 6 },
  profileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  profileMetaText: { fontSize: 12, color: C.sub },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    marginBottom: 18,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: C.teal,
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: "500" },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  // Edit profile btn
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 11,
    backgroundColor: C.teal,
    borderRadius: 12,
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.3,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: C.sub,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  // Section container
  section: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  // Option row
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { flex: 1, fontSize: 14, color: C.gray, fontWeight: "500" },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: width * 0.4,
  },
  optionValue: { fontSize: 12, color: C.sub, textAlign: "right" },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: C.red + "40",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.red,
    letterSpacing: 0.3,
  },

  // Versión
  version: {
    textAlign: "center",
    fontSize: 11,
    color: C.border,
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
});
