import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Image,
} from 'react-native';
import { syncService } from '../services/syncService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import CustomInput from './CustomInput';
import CustomButton from './CustomButton';
import { showSuccess, handleError } from '../utils/errorHandler';
import * as ImagePicker from 'expo-image-picker';

interface SellerProfileModalProps {
    visible: boolean;
    onClose: () => void;
    sellerId: string;
    navigation: any;
}

export default function SellerProfileModal({ visible, onClose, sellerId, navigation }: SellerProfileModalProps) {
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState('Catálogo 🍽️');
    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState({
        id: sellerId,
        name: 'Cargando...',
        bio: 'Sin descripción disponible.',
        rating: 'Sin calificaciones',
        deliveryFee: 'Gratis',
        deliveryTime: '5 min',
        avatar: '👤'
    });

    const [products, setProducts] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [loadingReview, setLoadingReview] = useState(false);

    // Profile editor states (used if viewing self profile)
    const [editProfileName, setEditProfileName] = useState('');
    const [editProfileBio, setEditProfileBio] = useState('');
    const [editProfileAvatar, setEditProfileAvatar] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const loadVendorData = async () => {
        if (!sellerId) return;
        setLoading(true);
        try {
            // 1. Fetch vendor profile (Real-time live fetch with offline fallback)
            let p: any = null;
            if (syncService.isOnline()) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sellerId)
                    .single();
                if (!error && data) {
                    p = data;
                }
            }
            if (!p) {
                const cachedProfiles = await syncService.getItems('profiles', { id: sellerId });
                if (cachedProfiles && cachedProfiles.length > 0) {
                    p = cachedProfiles[0];
                }
            }

            if (p) {
                setVendor(prev => ({
                    ...prev,
                    name: p.full_name || 'Vendedor del Campus',
                    bio: p.bio || '¡Hola! Soy vendedor en el campus de ITAmbriados. ¡Apoya el comercio local!',
                    avatar: p.avatar_url || '👤',
                }));
                setEditProfileName(p.full_name || '');
                setEditProfileBio(p.bio || '');
                setEditProfileAvatar(p.avatar_url || '👤');
            }

            // 2. Fetch products (Real-time live fetch with offline fallback)
            let prodData: any[] = [];
            if (syncService.isOnline()) {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('vendor_id', sellerId);
                if (!error && data) {
                    prodData = data;
                }
            }
            if (prodData.length === 0) {
                prodData = await syncService.getItems('products', { vendor_id: sellerId });
            }
            const mapped = prodData.map(prod => ({
                id: prod.id,
                name: prod.name,
                price: prod.price,
                image: prod.image || '🍔',
                category: prod.category || 'Otros'
            }));
            setProducts(mapped);

            // 3. Fetch reviews (Real-time live fetch with offline fallback)
            let revData: any[] = [];
            if (syncService.isOnline()) {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('vendor_id', sellerId);
                if (!error && data) {
                    revData = data;
                }
            }
            if (revData.length === 0) {
                revData = await syncService.getItems('reviews', { vendor_id: sellerId });
            }
            const enrichedReviews = await Promise.all(
                revData.map(async (r: any) => {
                    let name = 'Estudiante Hambriento';
                    if (syncService.isOnline()) {
                        const { data, error } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', r.reviewer_id)
                            .single();
                        if (!error && data) {
                            name = data.full_name;
                        }
                    } else {
                        const profiles = await syncService.getItems('profiles', { id: r.reviewer_id });
                        name = profiles.length > 0 ? profiles[0].full_name : 'Estudiante Hambriento';
                    }
                    return {
                        ...r,
                        reviewerName: name
                    };
                })
            );

            // Sort reviews descending by date
            enrichedReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setReviews(enrichedReviews);

            if (enrichedReviews.length > 0) {
                const total = enrichedReviews.reduce((sum, r) => sum + r.rating, 0);
                const avg = (total / enrichedReviews.length).toFixed(1);
                setVendor(prev => ({
                    ...prev,
                    rating: `${avg} ⭐ (${enrichedReviews.length} reseñas)`
                }));
            } else {
                setVendor(prev => ({
                    ...prev,
                    rating: 'Sin calificaciones'
                }));
            }
        } catch (e) {
            console.warn('Failed to load vendor data inside modal:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && sellerId) {
            loadVendorData();
        }
    }, [visible, sellerId]);

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
            
            // Reload review data
            await loadVendorData();
        } catch (e: any) {
            handleError(e, 'Error al calificar');
        } finally {
            setLoadingReview(false);
        }
    };

    const handlePickProfileImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                showSuccess('Se requieren permisos de galería para subir tu foto.', 'Aviso');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.15,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                const dataUrl = `data:${selectedAsset.mimeType || 'image/jpeg'};base64,${selectedAsset.base64}`;
                setEditProfileAvatar(dataUrl);
                showSuccess('¡Nueva foto seleccionada!', 'Foto Cargada');
            }
        } catch (e: any) {
            handleError(e, 'Error al elegir foto');
        }
    };

    const handleSaveProfileChanges = async () => {
        if (!editProfileName.trim()) {
            handleError({ message: 'El nombre completo es requerido.' });
            return;
        }

        setSavingProfile(true);
        try {
            const updatedProfile = {
                id: sellerId,
                full_name: editProfileName.trim(),
                bio: editProfileBio.trim(),
                avatar_url: editProfileAvatar,
                updated_at: new Date().toISOString()
            };

            await syncService.saveItem('profiles', updatedProfile);
            showSuccess('Perfil actualizado con éxito.', 'Perfil Guardado');
            
            // Reload local state
            await loadVendorData();
        } catch (e: any) {
            handleError(e, 'Error al guardar perfil');
        } finally {
            setSavingProfile(false);
        }
    };

    const tabs = user?.id === sellerId 
        ? ['Catálogo 🍽️', 'Reseñas ⭐', 'Mi Perfil ⚙️'] 
        : ['Catálogo 🍽️', 'Reseñas ⭐'];

    const renderProductItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => {
                onClose();
                navigation.navigate('ProductDetails', { productId: item.id });
            }}
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
                        onPress={() => {
                            onClose();
                            navigation.navigate('ProductDetails', { productId: item.id });
                        }}
                    >
                        <Text style={styles.addText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                {/* Transparent Backdrop touch to close */}
                <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />

                {/* Keyboard Avoiding Container */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardContainer}
                >
                    <View style={styles.modalCard}>
                        {/* Grab Handle */}
                        <View style={styles.grabHandle} />

                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.avatarPill}>
                                {vendor.avatar && (vendor.avatar.startsWith('http') || vendor.avatar.startsWith('data:image')) ? (
                                    <Image source={{ uri: vendor.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarEmoji}>{vendor.avatar}</Text>
                                )}
                            </View>
                            <View style={styles.headerTitles}>
                                <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
                                <Text style={styles.vendorRoleLabel}>Vendedor Universitario</Text>
                            </View>
                            {/* Circular Close Button with 'X' */}
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FF7A00" />
                                <Text style={styles.loadingText}>Cargando perfil...</Text>
                            </View>
                        ) : (
                            <View style={styles.contentContainer}>
                                {/* Vendor Details Summary */}
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.vendorBio}>{vendor.bio}</Text>

                                    {/* Stats Row */}
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

                                {/* Tabs Navigation */}
                                <View style={styles.tabsContainer}>
                                    {tabs.map((tab) => (
                                        <TouchableOpacity
                                            key={tab}
                                            style={[styles.tab, selectedTab === tab && styles.activeTab]}
                                            onPress={() => setSelectedTab(tab)}
                                        >
                                            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                                                {tab}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {selectedTab === 'Catálogo 🍽️' ? (
                                    /* Catalog Grid */
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
                                ) : selectedTab === 'Reseñas ⭐' ? (
                                    /* Reviews View with header input + flatlist */
                                    <FlatList
                                        data={reviews}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={styles.reviewsScrollContainer}
                                        ListHeaderComponent={
                                            <View>
                                                {/* Write Review Form (Only for other users, not for self) */}
                                                {user?.id !== sellerId ? (
                                                    <View style={styles.reviewFormCard}>
                                                        <Text style={styles.reviewFormTitle}>Calificar a este Vendedor</Text>
                                                        
                                                        {/* Stars Selector */}
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
                                                        <Text style={styles.selfReviewInfoText}>ℹ️ Estás viendo tu propio perfil. Tus compradores te calificarán aquí.</Text>
                                                    </View>
                                                )}
 
                                                <Text style={styles.reviewsListHeader}>RESEÑAS DE ALUMNOS ({reviews.length})</Text>
                                            </View>
                                        }
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
                                ) : (
                                    /* Profile Editor View */
                                    <ScrollView contentContainerStyle={styles.profileEditorContainer}>
                                        <Text style={styles.profileEditorTitle}>Editar Mi Información</Text>
                                        
                                        {/* Name Input */}
                                        <CustomInput
                                            label="NOMBRE COMPLETO"
                                            placeholder="Introduce tu nombre"
                                            value={editProfileName}
                                            onChangeText={setEditProfileName}
                                        />

                                        {/* Bio Input */}
                                        <CustomInput
                                            label="DESCRIPCIÓN / BIO"
                                            placeholder="Cuéntanos un poco sobre ti, horarios, etc..."
                                            value={editProfileBio}
                                            onChangeText={setEditProfileBio}
                                            multiline
                                        />

                                        {/* Avatar / Photo Selection */}
                                        <Text style={styles.avatarEditorLabel}>FOTO DE PERFIL / AVATAR</Text>
                                        <View style={styles.imagePickerRow}>
                                            <TouchableOpacity 
                                                style={styles.pickDeviceImageBtn}
                                                onPress={handlePickProfileImage}
                                                disabled={savingProfile}
                                            >
                                                <Text style={styles.pickDeviceImageBtnText}>📸 SUBIR NUEVA FOTO</Text>
                                            </TouchableOpacity>

                                            {editProfileAvatar && (editProfileAvatar.startsWith('http') || editProfileAvatar.startsWith('data:image')) ? (
                                                <View style={styles.pickedPhotoPreview}>
                                                    <Image source={{ uri: editProfileAvatar }} style={styles.pickedPhotoPreviewImage} />
                                                    <Text style={styles.pickedPhotoPreviewText}>Actual ✓</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.pickedPhotoPreview}>
                                                    <Text style={styles.avatarEmoji}>{editProfileAvatar || '👤'}</Text>
                                                </View>
                                            )}
                                        </View>

                                        <CustomButton
                                            title="GUARDAR CAMBIOS"
                                            onPress={handleSaveProfileChanges}
                                            loading={savingProfile}
                                            variant="primary"
                                            style={styles.saveProfileBtn}
                                        />
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(11, 14, 30, 0.45)', // Premium dark translucent backdrop
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardContainer: {
        width: '100%',
        maxWidth: 600, // beautiful premium centered overlay on web
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    modalCard: {
        width: '100%',
        height: '82%',
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 24,
        overflow: 'hidden',
    },
    grabHandle: {
        width: 48,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1.5,
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
        overflow: 'hidden',
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#4B5563',
        fontSize: 14,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    contentContainer: {
        flex: 1,
    },
    detailsContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    vendorBio: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 15,
        marginRight: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0B0E1E',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        borderBottomWidth: 1.5,
        borderColor: '#F3F4F6',
        marginBottom: 12,
        gap: 16,
    },
    tab: {
        paddingVertical: 10,
        marginRight: 16,
        borderBottomWidth: 3,
        borderColor: 'transparent',
    },
    activeTab: {
        borderColor: '#FF7A00',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    activeTabText: {
        color: '#FF7A00',
        fontWeight: '800',
    },
    catalogList: {
        paddingHorizontal: 18,
        paddingBottom: 40,
    },
    productRowWrapper: {
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    productCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        borderRadius: 20,
        padding: 12,
    },
    productImageContainer: {
        height: 110,
        backgroundColor: '#E6F2F7',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    productEmoji: {
        fontSize: 40,
    },
    productDetails: {
        width: '100%',
    },
    productName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 6,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FF7A00',
    },
    addBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FF7A00',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        color: '#FFF',
        fontSize: 14,
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
    emptySubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    reviewsScrollContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    reviewFormCard: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#FF7A00',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#FF7A00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    reviewFormTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 8,
        textAlign: 'center',
    },
    starsSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    starTouch: {
        padding: 2,
    },
    starText: {
        fontSize: 28,
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
        paddingVertical: 12,
    },
    selfReviewInfo: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    selfReviewInfoText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
        fontWeight: '600',
    },
    reviewsListHeader: {
        fontSize: 11,
        fontWeight: '950',
        color: '#9CA3AF',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    reviewRowCard: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    reviewerName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1F2937',
    },
    reviewStars: {
        fontSize: 11,
    },
    reviewComment: {
        fontSize: 12,
        color: '#4B5563',
        lineHeight: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    reviewTime: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '700',
    },
    profileEditorContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    profileEditorTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 16,
        textAlign: 'center',
    },
    avatarEditorLabel: {
        fontSize: 11,
        fontWeight: '850',
        color: '#0B0E1E',
        letterSpacing: 1.1,
        marginTop: 10,
        marginBottom: 8,
    },
    imagePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    pickDeviceImageBtn: {
        flex: 1,
        backgroundColor: '#0B0E1E',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pickDeviceImageBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    pickedPhotoPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    pickedPhotoPreviewImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#FF7A00',
    },
    pickedPhotoPreviewText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#FF7A00',
        marginTop: 4,
        textAlign: 'center',
    },
    saveProfileBtn: {
        marginTop: 10,
        backgroundColor: '#FF7A00',
        paddingVertical: 14,
    },
});
