import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Platform,
} from 'react-native';
import { syncService } from '../services/syncService';
import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { showSuccess, handleError } from '../utils/errorHandler';

export default function SellerProfileScreen({ route, navigation }: any) {
    const { sellerId } = route.params;
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState('Catálogo 🍽️');
    const [vendor, setVendor] = useState({
        id: sellerId,
        name: 'Victor Ortega',
        bio: 'Vendo principalmente churritos y botanas, usualmente estoy de 7:00 a.m. hasta las 3:00 p.m.',
        rating: 'Sin calificaciones',
        deliveryFee: 'Gratis',
        deliveryTime: '5 min',
        avatar: '👤'
    });

    const [products, setProducts] = useState<any[]>([]);

    // Review-specific states
    const [reviews, setReviews] = useState<any[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [loadingReview, setLoadingReview] = useState(false);

    useEffect(() => {
        const loadVendorData = async () => {
            try {
                // 1. Fetch vendor profile
                const cachedProfiles = await syncService.getItems('profiles', { id: sellerId });
                if (cachedProfiles && cachedProfiles.length > 0) {
                    const p = cachedProfiles[0];
                    setVendor(prev => ({
                        ...prev,
                        name: p.full_name || prev.name,
                        avatar: p.avatar_url || prev.avatar,
                    }));
                }

                // 2. Fetch products
                const cachedProducts = await syncService.getItems('products', { vendor_id: sellerId });
                if (cachedProducts && cachedProducts.length > 0) {
                    const mapped = cachedProducts.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.image || '🍔',
                        category: 'Todos'
                    }));
                    setProducts(mapped);
                }

                // 3. Fetch reviews and calculate average
                const cachedReviews = await syncService.getItems('reviews', { vendor_id: sellerId });
                
                // Enrich reviews with reviewer name
                const enrichedReviews = await Promise.all(
                    cachedReviews.map(async (r: any) => {
                        const profiles = await syncService.getItems('profiles', { id: r.reviewer_id });
                        const name = profiles.length > 0 ? profiles[0].full_name : 'Estudiante Hambriento';
                        return {
                            ...r,
                            reviewerName: name
                        };
                    })
                );

                // Sort reviews descending
                enrichedReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setReviews(enrichedReviews);

                if (enrichedReviews.length > 0) {
                    const total = enrichedReviews.reduce((sum, r) => sum + r.rating, 0);
                    const avg = (total / enrichedReviews.length).toFixed(1);
                    setVendor(prev => ({
                        ...prev,
                        rating: `${avg} (${enrichedReviews.length} reseñas)`
                    }));
                } else {
                    setVendor(prev => ({
                        ...prev,
                        rating: 'Sin calificaciones'
                    }));
                }
            } catch (e) {
                console.warn('Failed to load profile data from sync:', e);
            }
        };

        loadVendorData();
    }, [sellerId]);

    const handleSubmitReview = async () => {
        if (!newComment.trim() || !user) {
            handleError({ message: 'Por favor escribe un comentario para calificar.' });
            return;
        }

        setLoadingReview(true);
        try {
            const reviewData = {
                vendor_id: sellerId,
                reviewer_id: user.id,
                rating: newRating,
                comment: newComment.trim(),
                created_at: new Date().toISOString()
            };

            await syncService.saveItem('reviews', reviewData);
            showSuccess('¡Calificación guardada exitosamente!', 'Gracias');
            setNewComment('');
            setNewRating(5);
            
            // Reload
            const loadVendorData = async () => {
                const cachedProfiles = await syncService.getItems('profiles', { id: sellerId });
                if (cachedProfiles && cachedProfiles.length > 0) {
                    const p = cachedProfiles[0];
                    setVendor(prev => ({
                        ...prev,
                        name: p.full_name || prev.name,
                        avatar: p.avatar_url || prev.avatar,
                    }));
                }
                const cachedProducts = await syncService.getItems('products', { vendor_id: sellerId });
                if (cachedProducts && cachedProducts.length > 0) {
                    const mapped = cachedProducts.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.image || '🍔',
                        category: 'Todos'
                    }));
                    setProducts(mapped);
                }
                const cachedReviews = await syncService.getItems('reviews', { vendor_id: sellerId });
                const enrichedReviews = await Promise.all(
                    cachedReviews.map(async (r: any) => {
                        const profiles = await syncService.getItems('profiles', { id: r.reviewer_id });
                        const name = profiles.length > 0 ? profiles[0].full_name : 'Estudiante Hambriento';
                        return { ...r, reviewerName: name };
                    })
                );
                enrichedReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setReviews(enrichedReviews);
                if (enrichedReviews.length > 0) {
                    const total = enrichedReviews.reduce((sum, r) => sum + r.rating, 0);
                    const avg = (total / enrichedReviews.length).toFixed(1);
                    setVendor(prev => ({ ...prev, rating: `${avg} (${enrichedReviews.length} reseñas)` }));
                } else {
                    setVendor(prev => ({ ...prev, rating: 'Sin calificaciones' }));
                }
            };
            await loadVendorData();
        } catch (e: any) {
            handleError(e, 'Error al calificar');
        } finally {
            setLoadingReview(false);
        }
    };

    const tabs = ['Catálogo 🍽️', 'Reseñas ⭐'];

    const renderProductItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        >
            <View style={styles.productImageContainer}>
                <Text style={styles.productEmoji}>{item.image}</Text>
            </View>
            <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.productRow}>
                    <Text style={styles.productPrice}>${item.price}</Text>
                    <TouchableOpacity 
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                    >
                        <Text style={styles.addText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Transparent backdrop tap to close */}
            <TouchableOpacity 
                style={styles.backdrop} 
                activeOpacity={1} 
                onPress={() => navigation.goBack()} 
            />

            {/* Slide up Bottom Sheet Card */}
            <View style={styles.modalCard}>
                {/* Grab Handle Indicator */}
                <View style={styles.grabHandle} />

                {/* Modal Header with Title & Clean 'X' Close Button */}
                <View style={styles.modalHeader}>
                    <View style={styles.avatarPill}>
                        <Text style={styles.avatarEmoji}>{vendor.avatar}</Text>
                    </View>
                    <View style={styles.headerTitles}>
                        <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
                        <Text style={styles.vendorRoleLabel}>Vendedor Universitario</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Vendor Bio details */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.vendorBio}>{vendor.bio}</Text>

                    {/* Stats Pill Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>⭐</Text>
                            <Text style={styles.statText}>{vendor.rating}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>🚚</Text>
                            <Text style={styles.statText}>{vendor.deliveryFee}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>🕒</Text>
                            <Text style={styles.statText}>{vendor.deliveryTime}</Text>
                        </View>
                    </View>
                </View>

                {/* Tabs Selector */}
                <View style={styles.tabsContainer}>
                    <FlatList
                        data={tabs}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.tab, selectedTab === item && styles.activeTab]}
                                onPress={() => setSelectedTab(item)}
                            >
                                <Text style={[styles.tabText, selectedTab === item && styles.activeTabText]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsScroll}
                    />
                </View>

                {selectedTab === 'Catálogo 🍽️' ? (
                    /* Products Grid */
                    <FlatList
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.productRowWrapper}
                        contentContainerStyle={styles.catalogList}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No hay productos en el menú de este vendedor.</Text>
                            </View>
                        }
                    />
                ) : (
                    /* Reviews List & Submission Form inside Modal */
                    <FlatList
                        ListHeaderComponent={
                            <View>
                                {/* Write Review Form (Only for buyers, not for self) */}
                                {user?.id !== sellerId ? (
                                    <View style={styles.reviewFormCard}>
                                        <Text style={styles.reviewFormTitle}>Calificar a este Vendedor</Text>
                                        
                                        {/* Stars selector */}
                                        <View style={styles.starsSelectorContainer}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <TouchableOpacity 
                                                    key={star} 
                                                    onPress={() => setNewRating(star)}
                                                    style={styles.starTouch}
                                                >
                                                    <Text style={[styles.starText, star <= newRating ? styles.starActive : styles.starInactive]}>
                                                        ★
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <CustomInput
                                            placeholder="Escribe tu reseña (ejemplo: Excelente atención, muy sabroso)..."
                                            value={newComment}
                                            onChangeText={setNewComment}
                                            multiline
                                        />

                                        <CustomButton
                                            title="ENVIAR CALIFICACIÓN"
                                            onPress={handleSubmitReview}
                                            loading={loadingReview}
                                            variant="primary"
                                            style={styles.submitReviewBtn}
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.selfReviewInfo}>
                                        <Text style={styles.selfReviewInfoText}>ℹ️ Estás viendo tu propio perfil. Los compradores calificarán tu servicio aquí.</Text>
                                    </View>
                                )}

                                <Text style={styles.reviewsListHeader}>RESEÑAS DE ALUMNOS ({reviews.length})</Text>
                            </View>
                        }
                        data={reviews}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.reviewsScrollContainer}
                        renderItem={({ item }) => (
                            <View style={styles.reviewRowCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{item.reviewerName}</Text>
                                    <Text style={styles.reviewStars}>
                                        {'⭐'.repeat(item.rating)}
                                    </Text>
                                </View>
                                <Text style={styles.reviewComment}>{item.comment}</Text>
                                <Text style={styles.reviewTime}>
                                    {new Date(item.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                </Text>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Este vendedor aún no tiene reseñas.</Text>
                                <Text style={styles.emptySubtext}>¡Sé el primero en calificarlo!</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    bannerContainer: {
        height: 140,
        backgroundColor: '#B0C4DE',
        position: 'relative',
    },
    bannerBackground: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#B0C4DE',
    },
    bannerLogo: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        opacity: 0.6,
        letterSpacing: 1,
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 24 : 10,
        left: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    backText: {
        color: '#1F2937',
        fontSize: 24,
        fontWeight: 'bold',
    },
    moreBtn: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 24 : 10,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    moreText: {
        color: '#1F2937',
        fontSize: 10,
        fontWeight: '900',
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(11, 14, 30, 0.45)', // transparent dark backdrop
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
        height: '82%',
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    grabHandle: {
        width: 48,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1.0,
        borderColor: '#F3F4F6',
    },
    avatarPill: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E6F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    headerTitles: {
        flex: 1,
    },
    vendorName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 2,
    },
    vendorRoleLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#4B5563',
        fontSize: 14,
        fontWeight: 'bold',
    },
    detailsContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    productImageContainer: {
        height: 120,
        backgroundColor: '#E6F2F7',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    productEmoji: {
        fontSize: 48,
    },
    productDetails: {
        width: '100%',
    },
    productName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 8,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FF7A00',
    },
    addBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF7A00',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        width: '100%',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    reviewsScrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    reviewFormCard: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#FF7A00',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#FF7A00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    reviewFormTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 12,
        textAlign: 'center',
    },
    starsSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    starTouch: {
        padding: 4,
    },
    starText: {
        fontSize: 32,
    },
    starActive: {
        color: '#F59E0B',
    },
    starInactive: {
        color: '#D1D5DB',
    },
    submitReviewBtn: {
        marginTop: 10,
        backgroundColor: '#0B0E1E',
    },
    selfReviewInfo: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 24,
    },
    selfReviewInfoText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '600',
    },
    reviewsListHeader: {
        fontSize: 12,
        fontWeight: '900',
        color: '#9CA3AF',
        letterSpacing: 1.2,
        marginBottom: 14,
    },
    reviewsList: {
        gap: 12,
    },
    reviewRowCard: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937',
    },
    reviewStars: {
        fontSize: 12,
    },
    reviewComment: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        fontWeight: '600',
        marginBottom: 6,
    },
    reviewTime: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
    },
    emptySubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
});
