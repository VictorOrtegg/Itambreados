import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/syncService';
import { supabase } from '../services/supabaseClient';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { showSuccess, handleError } from '../utils/errorHandler';
import SellerProfileModal from '../components/SellerProfileModal';

export default function HomeScreen({ navigation }: any) {
  const { user, profile, refreshProfile, signOutUser } = useAuth();
  
  // Mixed role toggler: 'buyer' or 'seller' view mode
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');
  
  // Buyer-specific states
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Seller-specific states
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);

  // Admin-specific states
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [adminActiveProducts, setAdminActiveProducts] = useState<any[]>([]);
  const [loadingAdminAction, setLoadingAdminAction] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sellerModalVisible, setSellerModalVisible] = useState(false);

  // Sync state for queue visual indicators
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Product editing states (for Admin editing)
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleLogout = async () => {
    const performSignOut = async () => {
      try {
        await signOutUser();
        navigation.replace('Login');
      } catch (e) {
        console.error('[Logout] Error during logout:', e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas cerrar tu sesión?')) {
        await performSignOut();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar tu sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, Salir', style: 'destructive', onPress: performSignOut }
        ]
      );
    }
  };

  const loadData = async () => {
    try {
      // 1. Fetch categories
      const cachedCats = await syncService.getItems('categories');
      setCategories(cachedCats.length > 0 ? cachedCats : [
        { id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', name: 'Todos', icon: '🍽️' },
        { id: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', name: 'Churros', icon: '🍟' },
        { id: '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', name: 'Dulces', icon: '🥜' },
        { id: '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', name: 'Bebidas', icon: '🥤' },
      ]);

      // 2. Fetch products first so we can filter vendors based on their active products
      const cachedProds = await syncService.getItems('products');
      const finalProds = cachedProds.length > 0 ? cachedProds : [
        { id: 'c1017384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Churritos', price: 20, description: 'Deliciosos churros de maíz crujientes.', vendor_id: 'd3b07384-d113-4ec5-a5ae-be2d1645e5cf', image: '🍟', category: 'Churros', featured: true, approved: true },
        { id: 'c1027384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Cacahuates Enchilados', price: 12, description: 'Cacahuates sazonados.', vendor_id: 'd3b07384-d113-4ec5-a5ae-be2d1645e5cf', image: '🥜', category: 'Dulces', approved: true },
        { id: 'c1037384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Bolis de Fresa', price: 15, description: 'Bolis refrescantes.', vendor_id: 'e9f90bb3-5b8d-4f11-9a74-d2e82e21b272', image: '🍦', category: 'Bebidas', approved: true },
      ];

      const activeProds = finalProds.filter((p: any) => p.approved !== false);

      // 3. Fetch profiles to display vendors
      const cachedProfiles = await syncService.getItems('profiles');
      const cachedReviews = await syncService.getItems('reviews');

      // Filter profiles whose role is seller or mixed AND have at least one active product (allowing self for instant developer verification)
      const cachedVendors = cachedProfiles.filter(p => {
        const isSellerRole = (p.role === 'seller' || p.role === 'mixed');
        const hasActiveProducts = activeProds.some((prod: any) => prod.vendor_id === p.id);
        return isSellerRole && hasActiveProducts;
      });

      // Calculate ratings dynamically for each active vendor
      const enrichedVendors = cachedVendors.map((v: any) => {
        const vendorReviews = cachedReviews.filter((r: any) => r.vendor_id === v.id);
        let displayRating = 'Sin calificaciones';
        if (vendorReviews.length > 0) {
          const total = vendorReviews.reduce((sum, r) => sum + r.rating, 0);
          displayRating = (total / vendorReviews.length).toFixed(1);
        }
        return {
          ...v,
          rating: displayRating,
          delivery: v.delivery_fee || 'Gratis',
          time: v.delivery_time || '5 min'
        };
      });

      setVendors(enrichedVendors);

      // Enrich products with vendor names
      const enrichedProds = await Promise.all(
        finalProds.map(async (p: any) => {
          if (p.vendor_id) {
            const vendorsList = await syncService.getItems('profiles', { id: p.vendor_id });
            if (vendorsList && vendorsList.length > 0) {
              return { ...p, vendorName: vendorsList[0].full_name };
            }
          }
          return { ...p, vendorName: 'Vendedor del Campus' };
        })
      );
      
      // Sort featured products to the top of the feed
      enrichedProds.sort((a: any, b: any) => {
        const aPri = a.featured || a.priority ? 1 : 0;
        const bPri = b.featured || b.priority ? 1 : 0;
        return bPri - aPri;
      });
      // All products are active by default (no approval needed)
      setProducts(enrichedProds);
      setPendingProducts([]);
      setAdminActiveProducts(enrichedProds);

      // 4. Fetch seller owned products
      if (user) {
        const owned = cachedProds.filter(p => p.vendor_id === user.id);
        setSellerProducts(owned);
      }

      // 5. Update pending sync queue length
      const length = await syncService.getQueueLength();
      setPendingSyncCount(length);
    } catch (e) {
      console.warn('Error reading cached items in HomeScreen:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Default view mode is always buyer first, enabling toggle for everyone
    setViewMode('buyer');

    // Network connection listener to trigger sync and re-fetch
    const unsubscribeSync = syncService.onConnectionChange((online) => {
      if (online) {
        loadData();
      }
    });

    // Admin Real-time Product Upload Notification Subscription
    let adminChannel: any = null;
    if (profile?.role === 'admin' && syncService.isOnline()) {
      adminChannel = supabase
        .channel('admin_product_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'products'
          },
          async (payload) => {
            const newProd = payload.new;
            // Fetch vendor profile to display their real name
            let vendorName = 'Un estudiante';
            try {
              const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', newProd.vendor_id)
                .single();
              if (data && data.full_name) {
                vendorName = data.full_name;
              }
            } catch (e) {
              console.warn('Could not fetch vendor profile for admin notification:', e);
            }

            Alert.alert(
              '🔔 ¡Nuevo Producto Subido!',
              `El vendedor "${vendorName}" ha subido un nuevo producto:\n\n• Producto: ${newProd.name}\n• Precio: $${newProd.price} MXN\n• Descripción: ${newProd.description || 'Sin descripción'}`,
              [{ text: 'Entendido' }]
            );
            loadData();
          }
        )
        .subscribe();
    }

    // Periodic updater for offline status visual checks
    const interval = setInterval(() => {
      loadData();
    }, 4000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
      if (adminChannel) {
        supabase.removeChannel(adminChannel);
      }
    };
  }, [profile]);

  const handleAddProduct = async () => {
    if (!newProductName || !newProductPrice || !user) {
      handleError({ message: 'Por favor ingresa nombre y precio del producto.' });
      return;
    }

    setLoadingAdd(true);
    try {
      const parsedPrice = parseFloat(newProductPrice);
      if (isNaN(parsedPrice)) throw new Error('El precio debe ser un número.');

      const newProductData = {
        vendor_id: user.id,
        name: newProductName,
        price: parsedPrice,
        description: newProductDesc,
        image: '🍔',
        approved: true, // Auto-approved and active instantly!
        created_at: new Date().toISOString()
      };

      // saveItem immediately updates cache & queues sync
      await syncService.saveItem('products', newProductData);

      showSuccess('Producto agregado exitosamente localmente.', '¡Producto Añadido!');
      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setIsAddingProduct(false);
      
      // Reload UI
      await loadData();
    } catch (e: any) {
      handleError(e, 'Error al Agregar');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleSaveEditProduct = async () => {
    if (!editingProduct || !editName.trim() || !editPrice.trim()) {
      handleError({ message: 'Por favor completa todos los campos requeridos.' });
      return;
    }
    
    try {
      const parsedPrice = parseFloat(editPrice);
      if (isNaN(parsedPrice)) throw new Error('El precio debe ser un número.');
      
      const updated = {
        ...editingProduct,
        name: editName.trim(),
        price: parsedPrice,
        description: editDesc.trim(),
      };
      
      await syncService.saveItem('products', updated);
      showSuccess('Producto actualizado exitosamente.', '¡Actualizado!');
      setEditingProduct(null);
      await loadData();
    } catch (e: any) {
      handleError(e, 'Error al actualizar');
    }
  };

  const handleApproveProduct = async (productItem: any) => {
    setLoadingAdminAction(true);
    try {
      const updated = {
        ...productItem,
        approved: true,
        vendor_id: productItem.vendor_id
      };
      await syncService.saveItem('products', updated);
      showSuccess(`Producto "${productItem.name}" aprobado y dado de alta con éxito!`, 'Aprobación Exitosa');
      await loadData();
    } catch (e: any) {
      handleError(e, 'Error de Aprobación');
    } finally {
      setLoadingAdminAction(false);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    const performDelete = async () => {
      setLoadingAdminAction(true);
      try {
        // Find the product being deleted in our dynamic list to extract its vendor_id and name
        const productItem = adminActiveProducts.find(p => p.id === productId);

        // Delete the item
        await syncService.deleteItem('products', productId);
        showSuccess('Producto rechazado y eliminado.', 'Moderación');
        await loadData();

        // Send a professional notification chat message to the vendor
        if (productItem && productItem.vendor_id && user) {
          const vendorId = productItem.vendor_id;
          const adminId = user.id;
          const productName = productItem.name;

          const notificationText = `Estimado(a) colaborador(a),\n\nLe informamos de manera atenta que su producto "${productName}" ha sido retirado del catálogo activo de ITAmbriados debido a que la información proporcionada no cumple plenamente con los lineamientos de calidad o detalles requeridos por la plataforma.\n\nLe invitamos cordialmente a revisar, corregir y completar la información antes de publicarlo nuevamente.\n\nAgradecemos de antemano su comprensión y colaboración para mantener la excelencia en el mercado del campus.\n\nAtentamente,\nAdministración de ITAmbriados.`;

          // 1. Check if a conversation already exists
          const cachedConversations = await syncService.getItems('conversations');
          let conversation = cachedConversations.find(
            c => (c.buyer_id === adminId && c.seller_id === vendorId) ||
                 (c.seller_id === adminId && c.buyer_id === vendorId)
          );

          if (!conversation) {
            // Create a new conversation between Admin and Vendor
            const newConv = {
              buyer_id: adminId,
              seller_id: vendorId,
              last_message: `Aviso sobre su producto "${productName}"`,
              last_message_at: new Date().toISOString()
            };
            conversation = await syncService.saveItem('conversations', newConv);
          } else {
            // Update last message in existing conversation
            const updatedConv = {
              ...conversation,
              last_message: `Aviso sobre su producto "${productName}"`,
              last_message_at: new Date().toISOString()
            };
            await syncService.saveItem('conversations', updatedConv);
          }

          // 2. Insert notification message
          const messageData = {
            conversation_id: conversation.id,
            sender_id: adminId,
            content: notificationText,
            created_at: new Date().toISOString()
          };
          await syncService.saveItem('messages', messageData);

          console.log(`[Admin Notification] Message sent to vendor ${vendorId} regarding product "${productName}"`);
        }
      } catch (e: any) {
        handleError(e, 'Error al Eliminar');
      } finally {
        setLoadingAdminAction(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas RECHAZAR y eliminar este producto?')) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Rechazar Producto',
        '¿Estás seguro que deseas rechazar y eliminar permanentemente este producto del campus?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Rechazar y Eliminar', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleTogglePriority = async (productItem: any) => {
    setLoadingAdminAction(true);
    try {
      const isFeatured = !!productItem.featured;
      const updated = {
        ...productItem,
        featured: !isFeatured,
        priority: !isFeatured,
        vendor_id: productItem.vendor_id
      };
      await syncService.saveItem('products', updated);
      showSuccess(
        !isFeatured ? 'Prioridad aumentada (Destacado)' : 'Prioridad normalizada.',
        'Prioridad Actualizada'
      );
      await loadData();
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoadingAdminAction(false);
    }
  };

  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.catTab,
        selectedCategory === item.name && styles.catTabActive
      ]}
      onPress={() => setSelectedCategory(item.name)}
    >
      <Text style={styles.catEmoji}>{item.icon}</Text>
      <Text style={[styles.catText, selectedCategory === item.name && styles.catTextActive]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderVendorCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => {
        setSelectedSellerId(item.id);
        setSellerModalVisible(true);
      }}
    >
      <View style={styles.vendorAvatar}>
        {item.avatar_url && (item.avatar_url.startsWith('http') || item.avatar_url.startsWith('data:image')) ? (
          <Image source={{ uri: item.avatar_url }} style={styles.vendorAvatarImage} />
        ) : (
          <Text style={styles.avatarText}>{item.avatar_url || '👤'}</Text>
        )}
      </View>
      <Text style={styles.vendorName} numberOfLines={1}>{item.full_name || 'Vendedor'}</Text>
      <View style={styles.vendorInfoRow}>
        <Text style={styles.vendorRate}>
          {item.rating === 'Sin calificaciones' ? '⭐ Nuevo' : `⭐ ${item.rating}`}
        </Text>
        <Text style={styles.vendorDeliv}>• {item.delivery || 'Gratis'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderProductCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Text style={styles.productEmoji}>{item.image || '🍔'}</Text>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>
      {item.sync_status === 'pending' && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>⏳ Pendiente</Text>
        </View>
      )}
      {(item.featured || item.priority) && (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityBadgeText}>⭐ Destacado</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.headerProfileContainer}
            onPress={() => {
              if (user) {
                setSelectedSellerId(user.id);
                setSellerModalVisible(true);
              }
            }}
          >
            <View style={styles.headerAvatarPill}>
              {profile?.avatar_url && (profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('data:image')) ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.headerAvatarEmoji}>{profile?.avatar_url || '👤'}</Text>
              )}
            </View>
            <View>
              <Text style={styles.locationLabel}>📍 Campus Universitario</Text>
              <Text style={styles.greetingText} numberOfLines={1}>
                ¡Hola, {profile?.full_name || 'Estudiante'}!
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {/* Sync Alert indicator */}
            {pendingSyncCount > 0 && (
              <TouchableOpacity 
                style={styles.syncAlertBtn}
                onPress={() => {
                  syncService.flushQueue();
                  Alert.alert('Estado de Sincronización', `Tienes ${pendingSyncCount} operaciones pendientes de sincronizar con Supabase. Intentando sincronizar en segundo plano...`);
                }}
              >
                <Text style={styles.syncAlertEmoji}>🔄 {pendingSyncCount}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.chatIconBtn}
              onPress={() => navigation.navigate('ChatList')}
            >
              <Text style={styles.chatIconText}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutIconBtn}
              onPress={handleLogout}
            >
              <Text style={styles.logoutIconText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Toggle Mode for All Users (Unified Buyer & Seller) - Hidden for Admin */}
        {profile?.role !== 'admin' && (
          <View style={styles.mixedToggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'buyer' && styles.toggleBtnActive]}
              onPress={() => setViewMode('buyer')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'buyer' && styles.toggleBtnTextActive]}>
                Modo Comprador 🛍️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'seller' && styles.toggleBtnActive]}
              onPress={() => setViewMode('seller')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'seller' && styles.toggleBtnTextActive]}>
                Modo Vendedor 👨‍🍳
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {profile?.role === 'admin' ? (
        // ================= ADMIN DASHBOARD LAYOUT =================
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {/* Stats Panel */}
          <View style={styles.adminStatsRow}>
            <View style={[styles.adminStatCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Text style={styles.adminStatVal}>{vendors.length}</Text>
              <Text style={styles.adminStatLbl}>👤 Vendedores Activos</Text>
            </View>
            <View style={[styles.adminStatCard, { backgroundColor: '#E0F2FE', borderColor: '#0284C7' }]}>
              <Text style={styles.adminStatVal}>{adminActiveProducts.length}</Text>
              <Text style={styles.adminStatLbl}>✅ Productos del Campus</Text>
            </View>
          </View>

          {/* Section: Campus Catalog (Admin catalog editor and moderator) */}
          <View style={styles.section}>
            <Text style={styles.adminSectionTitle}>✅ PRODUCTOS ACTIVOS EN EL CAMPUS</Text>
            <FlatList
              data={adminActiveProducts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.adminProductRow}>
                  <Text style={styles.adminProductEmoji}>{item.image || '🍔'}</Text>
                  <View style={styles.adminProductInfo}>
                    <Text style={styles.adminProductName}>{item.name}</Text>
                    <Text style={styles.adminProductPrice}>${item.price}</Text>
                    
                    {/* Clickable vendor name to view their profile */}
                    <TouchableOpacity
                      onPress={() => {
                        if (item.vendor_id) {
                          setSelectedSellerId(item.vendor_id);
                          setSellerModalVisible(true);
                        }
                      }}
                      style={styles.adminVendorLink}
                    >
                      <Text style={styles.adminProductVendorLink}>👤 Vendedor: {item.vendorName || 'Estudiante'} 🔗</Text>
                    </TouchableOpacity>

                    {item.featured && (
                      <View style={styles.adminFeaturedBadge}>
                        <Text style={styles.adminFeaturedText}>⭐ Destacado (Prioridad Alta)</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.adminActionCol}>
                    {/* 1. Edit Product Button */}
                    <TouchableOpacity
                      style={[styles.adminActionBtn, styles.adminEditBtn]}
                      onPress={() => {
                        setEditingProduct(item);
                        setEditName(item.name);
                        setEditPrice(String(item.price));
                        setEditDesc(item.description || '');
                      }}
                    >
                      <Text style={styles.adminEditText}>📝 EDITAR</Text>
                    </TouchableOpacity>

                    {/* 2. Highlight Product Button */}
                    <TouchableOpacity
                      style={[styles.adminActionBtn, item.featured ? styles.adminPriorityActiveBtn : styles.adminPriorityBtn]}
                      onPress={() => handleTogglePriority(item)}
                      disabled={loadingAdminAction}
                    >
                      <Text style={[styles.adminPriorityBtnText, item.featured ? styles.adminPriorityActiveText : styles.adminPriorityText]}>
                        {item.featured ? '⭐ NORMAL' : '🔥 DESTACAR'}
                      </Text>
                    </TouchableOpacity>

                    {/* 3. Delete Product Button */}
                    <TouchableOpacity
                      style={[styles.adminActionBtn, styles.adminDeleteBtn]}
                      onPress={() => handleRejectProduct(item.id)}
                      disabled={loadingAdminAction}
                    >
                      <Text style={styles.adminDeleteText}>🗑️ BORRAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.adminEmptyCard}>
                  <Text style={styles.adminEmptyText}>No hay productos activos en este momento.</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      ) : viewMode === 'buyer' ? (
        // ================= BUYER VIEW LAYOUT =================
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {/* Search Shortcut Bar */}
          <TouchableOpacity
            style={styles.searchShortcut}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.searchShortcutIcon}>🔍</Text>
            <Text style={styles.searchShortcutText}>¿Qué se te antoja hoy?</Text>
          </TouchableOpacity>

          {/* Categories Slider */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Vendors Slider */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedores Disponibles</Text>
            <FlatList
              data={vendors}
              renderItem={renderVendorCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorsList}
            />
          </View>

          {/* Products Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos en Tendencia</Text>
            <FlatList
              data={
                selectedCategory === 'Todos'
                  ? products
                  : products.filter(p => p.category === selectedCategory)
              }
              renderItem={renderProductCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.productsRow}
              contentContainerStyle={styles.productsGrid}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay productos de esta categoría.</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      ) : (
        // ================= SELLER VIEW LAYOUT =================
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.sellerHeader}>
            <Text style={styles.sellerHeaderTitle}>Tus Productos Ofrecidos</Text>
            <CustomButton
              title={isAddingProduct ? 'CERRAR FORMULARIO' : 'AGREGAR PRODUCTO'}
              onPress={() => setIsAddingProduct(!isAddingProduct)}
              variant={isAddingProduct ? 'secondary' : 'primary'}
              style={styles.toggleFormBtn}
            />
          </View>

          {/* Add Product Form Collapse */}
          {isAddingProduct && (
            <View style={styles.addProductCard}>
              <Text style={styles.addProductTitle}>Nuevo Producto</Text>
              
              <CustomInput
                placeholder="Nombre del Producto (e.g. Churros Enchilados)"
                value={newProductName}
                onChangeText={setNewProductName}
              />
              
              <CustomInput
                placeholder="Precio ($ MXN)"
                value={newProductPrice}
                onChangeText={setNewProductPrice}
                keyboardType="numeric"
              />
              
              <CustomInput
                placeholder="Descripción / Ubicación de Entrega"
                value={newProductDesc}
                onChangeText={setNewProductDesc}
              />

              <CustomButton
                title="AÑADIR A MI CATÁLOGO"
                onPress={handleAddProduct}
                loading={loadingAdd}
                variant="primary"
                style={styles.saveProductBtn}
              />
            </View>
          )}

          {/* Seller Owned Products List */}
          <FlatList
            data={sellerProducts}
            renderItem={({ item }) => (
              <View style={styles.sellerProductRow}>
                <Text style={styles.sellerProductEmoji}>{item.image || '🍔'}</Text>
                <View style={styles.sellerProductInfo}>
                  <Text style={styles.sellerProductName}>{item.name}</Text>
                  <Text style={styles.sellerProductPrice}>${item.price}</Text>
                </View>
                <View style={styles.statusCol}>
                  <TouchableOpacity
                    style={styles.deleteProductBtn}
                    onPress={() => {
                      Alert.alert(
                        'Eliminar Producto',
                        '¿Estás seguro que deseas retirar este producto?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Retirar', style: 'destructive', onPress: () => syncService.deleteItem('products', item.id) }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                  {item.sync_status === 'pending' && (
                    <Text style={styles.pendingStatusText}>⏳ Pendiente</Text>
                  )}
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.sellerProductsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No has agregado ningún producto a tu menú.</Text>
                <Text style={styles.emptySubtext}>Haz click en el botón de arriba para comenzar a vender.</Text>
              </View>
            }
          />
        </ScrollView>
      )}

      {selectedSellerId && (
        <SellerProfileModal
          visible={sellerModalVisible}
          onClose={() => setSellerModalVisible(false)}
          sellerId={selectedSellerId}
        />
      )}

      {editingProduct && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setEditingProduct(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editProductModalCard}>
              <Text style={styles.editProductModalTitle}>📝 Editar Producto</Text>
              
              <CustomInput
                label="NOMBRE DEL PRODUCTO"
                placeholder="Ej. Tacos de canasta"
                value={editName}
                onChangeText={setEditName}
              />
              <CustomInput
                label="PRECIO ($ MXN)"
                placeholder="Ej. 15"
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />
              <CustomInput
                label="DESCRIPCIÓN / UBICACIÓN"
                placeholder="Ej. Salsa verde, en la entrada"
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
              />
              
              <View style={styles.editModalActions}>
                <TouchableOpacity 
                  style={[styles.editModalBtn, styles.editModalCancelBtn]}
                  onPress={() => setEditingProduct(null)}
                >
                  <Text style={styles.editModalCancelText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editModalBtn, styles.editModalSaveBtn]}
                  onPress={handleSaveEditProduct}
                >
                  <Text style={styles.editModalSaveText}>GUARDAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerAvatarPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerAvatarEmoji: {
    fontSize: 22,
  },
  adminVendorLink: {
    marginTop: 4,
    marginBottom: 6,
  },
  adminProductVendorLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
  adminEditBtn: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
    borderWidth: 1,
    marginBottom: 6,
  },
  adminEditText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 14, 30, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  editProductModalCard: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  editProductModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B0E1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  editModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalCancelBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  editModalCancelText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 14,
  },
  editModalSaveBtn: {
    backgroundColor: '#0B0E1E',
  },
  editModalSaveText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#0B0E1E', // Matching Figma deep navy
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncAlertBtn: {
    backgroundColor: 'rgba(255, 122, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF7A00',
  },
  syncAlertEmoji: {
    color: '#FF7A00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIconText: {
    fontSize: 20,
  },
  logoutIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutIconText: {
    fontSize: 18,
  },
  mixedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },
  adminSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 1.2,
    marginTop: 10,
    marginBottom: 14,
  },
  adminStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 12,
  },
  adminStatCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminStatVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0B0E1E',
    marginBottom: 4,
  },
  adminStatLbl: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  adminProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  adminProductEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  adminProductInfo: {
    flex: 1,
  },
  adminProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  adminProductPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF7A00',
    marginBottom: 2,
  },
  adminProductDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  adminProductVendor: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  adminFeaturedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  adminFeaturedText: {
    fontSize: 9,
    color: '#D97706',
    fontWeight: 'bold',
  },
  adminActionCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 12,
  },
  adminActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
  },
  adminApproveBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  adminApproveBtnText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  adminRejectBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  adminRejectBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  adminPriorityBtn: {
    backgroundColor: '#FFFDF5',
    borderColor: '#F59E0B',
  },
  adminPriorityText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  adminPriorityBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adminPriorityActiveBtn: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  adminPriorityActiveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  adminDeleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  adminDeleteText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  adminEmptyCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  adminEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  priorityBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityBadgeText: {
    fontSize: 9,
    color: '#D97706',
    fontWeight: 'bold',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FF7A00', // Sliding orange background
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  searchShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchShortcutIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchShortcutText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B0E1E',
    marginBottom: 14,
  },
  categoriesList: {
    paddingVertical: 4,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  catTabActive: {
    backgroundColor: '#FF7A00', // Active orange highlight from figma
  },
  catEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  catText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  catTextActive: {
    color: '#FFF',
  },
  vendorsList: {
    paddingVertical: 4,
  },
  vendorCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 18,
    padding: 16,
    marginRight: 14,
    width: 140,
    alignItems: 'center',
  },
  vendorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  vendorAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 26,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  vendorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorRate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF7A00',
    marginRight: 4,
  },
  vendorDeliv: {
    fontSize: 11,
    color: '#6B7280',
  },
  productsGrid: {
    paddingBottom: 10,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    flex: 0.48,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  productEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  productInfo: {
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF7A00',
  },
  pendingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingText: {
    fontSize: 9,
    color: '#D97706',
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#D1D5DB',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  sellerHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B0E1E',
  },
  toggleFormBtn: {
    marginVertical: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addProductCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF7A00',
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  addProductTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B0E1E',
    marginBottom: 12,
  },
  saveProductBtn: {
    marginTop: 10,
    backgroundColor: '#0B0E1E',
  },
  sellerProductsList: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  sellerProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sellerProductEmoji: {
    fontSize: 34,
    marginRight: 16,
  },
  sellerProductInfo: {
    flex: 1,
  },
  sellerProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sellerProductPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF7A00',
  },
  statusCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteProductBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 16,
  },
  pendingStatusText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: 'bold',
    marginTop: 4,
  },
});