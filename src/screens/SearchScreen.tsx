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
    Image,
} from 'react-native';
import SellerProfileModal from '../components/SellerProfileModal';
import { syncService } from '../services/syncService';

const recentSearches = ['Botana', 'Cacahuates', 'Chapatas'];

const suggestedVendors = [
    { id: 'e9f90bb3-5b8d-4f11-9a74-d2e82e21b272', name: 'Fernanda Cristobal', rating: '4.9', role: 'seller', delivery: 'Free', time: '5 min' },
    { id: 'd3b07384-d113-4ec5-a5ae-be2d1645e5cf', name: 'El de los bolis (Victor)', rating: '4.3', role: 'seller', delivery: 'Free', time: '10 min' },
    { id: 'f4f90bb3-5b8d-4f11-9a74-d2e82e21b272', name: 'El de los flanes', rating: '4.0', role: 'seller', delivery: 'Free', time: '15 min' },
];

const popularProducts = [
    { id: 'c1047384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Chapatas', vendor: 'Fernanda Cristobal', price: '$25', rating: '4.9', image: '🥪' },
    { id: 'c1057384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Flan', vendor: 'El De Los Flanes', price: '$15', rating: '4.8', image: '🍮' },
];

// Search Results Data ("Food - Búsqueda")
const searchResultProducts = [
    { id: 'c1017384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Churritos', vendor: 'Victor Ortega', price: '$10', rating: '4.7', image: '🍟' },
    { id: 'c1067384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Hot-Nuts', vendor: 'Fernanda Cristobal', price: '$5', rating: '4.9', image: '🥜' },
    { id: 'c1027384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Cacahuates', vendor: 'Fernanda Cristobal', price: '$5', rating: '4.8', image: '🥜' },
    { id: 'c1077384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Semillas', vendor: 'Fernanda Cristobal', price: '$5', rating: '4.7', image: '🌻' },
];

export default function SearchScreen({ navigation }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
    const [sellerModalVisible, setSellerModalVisible] = useState(false);
    const [dynamicSuggestedVendors, setDynamicSuggestedVendors] = useState<any[]>([]);

    useEffect(() => {
        const loadDynamicSellers = async () => {
            try {
                const cachedProfiles = await syncService.getItems('profiles');
                const cachedProds = await syncService.getItems('products');
                const cachedReviews = await syncService.getItems('reviews');
                
                const activeSellers = cachedProfiles.filter(p => {
                    const isSellerRole = (p.role === 'seller' || p.role === 'mixed');
                    const isNotSelf = p.id !== user?.id;
                    return isSellerRole && isNotSelf;
                });

                const enriched = activeSellers.map((v: any) => {
                    const vendorReviews = cachedReviews.filter((r: any) => r.vendor_id === v.id);
                    let displayRating = 'Nuevo';
                    if (vendorReviews.length > 0) {
                        const total = vendorReviews.reduce((sum, r) => sum + r.rating, 0);
                        displayRating = (total / vendorReviews.length).toFixed(1);
                    }
                    return {
                        id: v.id,
                        name: v.full_name || 'Vendedor',
                        rating: displayRating,
                        avatar: v.avatar_url || '👤'
                    };
                });
                setDynamicSuggestedVendors(enriched);
            } catch (e) {
                console.warn('Failed to load dynamic suggested sellers in SearchScreen:', e);
            }
        };
        loadDynamicSellers();
    }, []);

    // Search Result Product Render ("Food - Búsqueda" Grid)
    const renderResultProductItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.resultProductCard}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        >
            <View style={styles.resultProductImageContainer}>
                <Text style={styles.resultProductEmoji}>{item.image}</Text>
            </View>
            <View style={styles.resultProductInfo}>
                <Text style={styles.resultProductName}>{item.name}</Text>
                <Text style={styles.resultProductVendor}>{item.vendor}</Text>
                <View style={styles.resultProductRow}>
                    <Text style={styles.resultProductPrice}>{item.price}</Text>
                    <TouchableOpacity 
                        style={styles.resultAddBtn}
                        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                    >
                        <Text style={styles.resultAddBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                
                {searchQuery === '' ? (
                    <>
                        <View style={styles.searchBarContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                placeholder="Buscar en ITAmbriados..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                            />
                        </View>
                        <TouchableOpacity style={styles.cartBadgeContainer}>
                            <Text style={styles.cartEmoji}>👜</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>2</Text>
                            </View>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.resultsHeaderRow}>
                        <TouchableOpacity style={styles.categoryDropdown}>
                            <Text style={styles.categoryDropdownText}>BOTANA ▾</Text>
                        </TouchableOpacity>
                        <View style={styles.resultsIconsRow}>
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.resultsHeaderIcon}>
                                <Text style={styles.resultsIconText}>🔍</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.resultsHeaderIcon}>
                                <Text style={styles.resultsIconText}>🎛️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {searchQuery === '' ? (
                // 1. Pre-search View (Search Screen)
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Recent Searches */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Busquedas Recientes</Text>
                        <View style={styles.chipsContainer}>
                            {recentSearches.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.chip}
                                    onPress={() => setSearchQuery(item)}
                                >
                                    <Text style={styles.chipText}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Suggested Sellers */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vendedores Sugeridos</Text>
                        {dynamicSuggestedVendors.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.suggestedVendorRow}
                                onPress={() => {
                                    setSelectedSellerId(item.id);
                                    setSellerModalVisible(true);
                                }}
                            >
                                <View style={styles.suggestedVendorAvatar}>
                                    {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                                        <Image source={{ uri: item.avatar }} style={styles.suggestedVendorAvatarImage} />
                                    ) : (
                                        <Text style={styles.suggestedVendorAvatarText}>{item.avatar || '👤'}</Text>
                                    )}
                                </View>
                                <View style={styles.suggestedVendorInfo}>
                                    <Text style={styles.suggestedVendorName}>{item.name}</Text>
                                    <Text style={styles.suggestedVendorRating}>
                                        {item.rating === 'Nuevo' ? '⭐ Nuevo' : `⭐ ${item.rating}`}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {dynamicSuggestedVendors.length === 0 && (
                            <View style={styles.chip}>
                                <Text style={styles.chipText}>No hay vendedores disponibles aún.</Text>
                            </View>
                        )}
                    </View>

                    {/* Popular Products */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Productos Populares</Text>
                        <View style={styles.popularProductsGrid}>
                            {popularProducts.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.popularProductGridCard}
                                    onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                                >
                                    <View style={styles.popularProductGridImageContainer}>
                                        <Text style={styles.popularProductGridEmoji}>{item.image}</Text>
                                    </View>
                                    <Text style={styles.popularProductGridName}>{item.name}</Text>
                                    <Text style={styles.popularProductGridVendor}>{item.vendor}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            ) : (
                // 2. Search Results View (Food - Búsqueda Screen)
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Botanas Populares */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Botanas Populares</Text>
                        <FlatList
                            data={searchResultProducts}
                            renderItem={renderResultProductItem}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.resultsGridRow}
                            contentContainerStyle={styles.resultsGrid}
                        />
                    </View>

                    {/* Vendedores Disponibles */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vendedores Disponibles</Text>
                        <TouchableOpacity
                            style={styles.availableVendorCard}
                            onPress={() => {
                                setSelectedSellerId('e9f90bb3-5b8d-4f11-9a74-d2e82e21b272');
                                setSellerModalVisible(true);
                            }}
                        >
                            <View style={styles.vendorBannerImagePlaceholder}>
                                <Text style={styles.bannerImageLogo}>ITAmbriados</Text>
                            </View>
                            <View style={styles.availableVendorDetails}>
                                <Text style={styles.availableVendorName}>Fernanda Cristobal</Text>
                                <View style={styles.availableVendorStats}>
                                    <Text style={styles.availableVendorStatText}>⭐ 4.9</Text>
                                    <Text style={styles.availableVendorStatText}>🚚 Free</Text>
                                    <Text style={styles.availableVendorStatText}>🕒 5 min</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {selectedSellerId && (
                <SellerProfileModal
                    visible={sellerModalVisible}
                    onClose={() => setSellerModalVisible(false)}
                    sellerId={selectedSellerId}
                    navigation={navigation}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 24 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backText: {
        fontSize: 24,
        color: '#1F2937',
        fontWeight: 'bold',
    },
    searchBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginRight: 12,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    cartBadgeContainer: {
        position: 'relative',
        padding: 6,
    },
    cartEmoji: {
        fontSize: 24,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#0B0E1E',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 16,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    chipText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    suggestedVendorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    suggestedVendorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E6F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    suggestedVendorAvatarText: {
        fontSize: 22,
    },
    suggestedVendorAvatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    suggestedVendorInfo: {
        flex: 1,
    },
    suggestedVendorName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    suggestedVendorRating: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    popularProductsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    popularProductGridCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    popularProductGridImageContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    popularProductGridEmoji: {
        fontSize: 48,
    },
    popularProductGridName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    popularProductGridVendor: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },

    // Results styles ("Food - Búsqueda")
    resultsHeaderRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryDropdown: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    categoryDropdownText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0B0E1E',
    },
    resultsIconsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultsHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0B0E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    resultsIconText: {
        color: '#FFF',
        fontSize: 16,
    },
    resultsGrid: {
        paddingBottom: 10,
    },
    resultsGridRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    resultProductCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    resultProductImageContainer: {
        height: 120,
        backgroundColor: '#E6F2F7',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultProductEmoji: {
        fontSize: 48,
    },
    resultProductInfo: {
        width: '100%',
    },
    resultProductName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 2,
    },
    resultProductVendor: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 8,
    },
    resultProductRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultProductPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FF7A00',
    },
    resultAddBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0B0E1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultAddBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // Available Vendor Card
    availableVendorCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    vendorBannerImagePlaceholder: {
        height: 150,
        backgroundColor: '#B0C4DE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerImageLogo: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        opacity: 0.8,
        letterSpacing: 1,
    },
    availableVendorDetails: {
        padding: 16,
    },
    availableVendorName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 6,
    },
    availableVendorStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availableVendorStatText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginRight: 16,
    },
});
