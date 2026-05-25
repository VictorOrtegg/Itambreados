import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';

const Tab = createBottomTabNavigator();

const C = {
  bg:       '#000000',
  teal:     '#0D9AA3',
  white:    '#FFFFFF',
  island:   '#111111',
  border:   '#242424',
  inactive: '#444444',
};

const TABS = [
  { name: 'Home',    label: 'Inicio',   icon: 'home',        iconOutline: 'home-outline' },
  { name: 'Search',  label: 'Buscar',   icon: 'search',      iconOutline: 'search-outline' },
  { name: 'Chats',   label: 'Chats',    icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { name: 'Orders',  label: 'Pedidos',  icon: 'bag-handle',  iconOutline: 'bag-handle-outline' },
  { name: 'Profile', label: 'Perfil',   icon: 'person',      iconOutline: 'person-outline' },
];

// ── Placeholder ───────────────────────────────────────────
function PlaceholderScreen({ route }) {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="construct-outline" size={48} color={C.teal} />
      <Text style={styles.placeholderTitle}>{route.name}</Text>
      <Text style={styles.placeholderSub}>Próximamente</Text>
    </View>
  );
}

// ── Tab item ──────────────────────────────────────────────
function IslandTab({ tab, isFocused, onPress }) {
  const scale      = useRef(new Animated.Value(1)).current;
  const bgOpacity  = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const labelWidth = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const labelAlpha = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    // Bounce
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(bgOpacity,  { toValue: isFocused ? 1 : 0, duration: 230, useNativeDriver: false }),
      Animated.timing(labelWidth, { toValue: isFocused ? 1 : 0, duration: 230, useNativeDriver: false }),
      Animated.timing(labelAlpha, { toValue: isFocused ? 1 : 0, duration: 180, useNativeDriver: false }),
    ]).start();
  }, [isFocused]);

  const pillBg = bgOpacity.interpolate({
    inputRange: [0, 1], outputRange: ['#0D9AA300', '#0D9AA324'],
  });
  const pillBorder = bgOpacity.interpolate({
    inputRange: [0, 1], outputRange: ['#24242400', '#0D9AA350'],
  });
  const maxW = labelWidth.interpolate({
    inputRange: [0, 1], outputRange: [0, 58],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.tabTouch}>
      <Animated.View style={[styles.tabPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={isFocused ? tab.icon : tab.iconOutline}
            size={22}
            color={isFocused ? C.teal : C.inactive}
          />
        </Animated.View>
        <Animated.View style={{ maxWidth: maxW, overflow: 'hidden' }}>
          <Animated.Text style={[styles.tabLabel, { opacity: labelAlpha }]} numberOfLines={1}>
            {'  '}{tab.label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Isla flotante ─────────────────────────────────────────
function FloatingIsland({ state, navigation }) {
  return (
    <View style={styles.islandOuter} pointerEvents="box-none">
      <View style={styles.islandContainer}>
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return <IslandTab key={route.key} tab={tab} isFocused={isFocused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────
export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingIsland {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Search"  component={SearchScreen} />
      <Tab.Screen name="Chats"   component={PlaceholderScreen} />
      <Tab.Screen name="Orders"  component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  islandOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  islandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.island,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  tabTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 1,
    minWidth: 46,
  },
  tabLabel: {
    color: C.teal,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  placeholder: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.white,
  },
  placeholderSub: {
    fontSize: 14,
    color: C.inactive,
  },
});