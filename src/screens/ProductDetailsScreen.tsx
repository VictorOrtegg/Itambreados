import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Alert,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import { syncService } from '../services/syncService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { handleError, showSuccess } from '../utils/errorHandler';
import SellerProfileModal from '../components/SellerProfileModal';

export default function ProductDetailsScreen({ route, navigation }: any) {
    const { productId } = route.params;
    const { user, profile } = useAuth();
    const [quantity, setQuantity] = useState(2);
    const [product, setProduct] = useState<any>({
        id: productId,
        name: 'Churritos',
        price: 20,
        description: 'Palitos de maíz fritos con sal.',
        image: '🍟',
        rating: '4.7',
        delivery: 'Free',
        time: '10 min',
        vendor: {
            id: 'd3b07384-d113-4ec5-a5ae-be2d1645e5cf',
            name: 'Victor Ortega',
            rating: '4.7',
            delivery: 'Free',
            time: '10 min',
            avatar: '👤'
        }
    });

    const [isFavorite, setIsFavorite] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [loadingAdmin, setLoadingAdmin] = useState(false);
    const [sellerModalVisible, setSellerModalVisible] = useState(false);

    const handleAdminDeleteProduct = () => {
        const performDelete = async () => {
            setLoadingAdmin(true);
            try {
                await syncService.deleteItem('products', productId);
                showSuccess('Producto eliminado exitosamente por el Administrador.', 'Moderación Exitosa');
                navigation.goBack();
            } catch (e: any) {
                handleError(e, 'Error de Moderación');
            } finally {
                setLoadingAdmin(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Estás seguro que deseas ELIMINAR este producto como Administrador? Esta acción no se puede deshacer.')) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Moderación de Administrador',
                '¿Estás seguro que deseas ELIMINAR este producto del campus? Esta acción retirará el producto del catálogo permanentemente.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar del Campus', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    const handleAdminTogglePriority = async () => {
        setLoadingAdmin(true);
        try {
            const isFeatured = !!product.featured;
            
            // Extract the fields we want to save
            const saveFields = {
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                image: product.image,
                category: product.category || 'Otros',
                vendor_id: product.vendor.id,
                featured: !isFeatured,
                priority: !isFeatured
            };

            await syncService.saveItem('products', saveFields);
            
            setProduct((prev: any) => ({
                ...prev,
                featured: !isFeatured
            }));

            showSuccess(
                !isFeatured ? 'Producto destacado con prioridad en el catálogo!' : 'Prioridad retirada exitosamente.', 
                'Moderación Exitosa'
            );
        } catch (e: any) {
            handleError(e, 'Error de Prioridad');
        } finally {
            setLoadingAdmin(false);
        }
    };

    useEffect(() => {
        const loadProductDetails = async () => {
            try {
                const cachedProducts = await syncService.getItems('products', { id: productId });
                if (cachedProducts && cachedProducts.length > 0) {
                    const p = cachedProducts[0];
                    let vendorDetails = { id: 'd3b07384-d113-4ec5-a5ae-be2d1645e5cf', name: 'Victor Ortega', rating: '4.7', delivery: 'Free', time: '10 min', avatar: '👤' };
                    if (p.vendor_id) {
                        const vendors = await syncService.getItems('profiles', { id: p.vendor_id });
                        if (vendors && vendors.length > 0) {
                            vendorDetails = {
                                id: vendors[0].id,
                                name: vendors[0].full_name || 'Vendedor',
                                rating: '4.7',
                                delivery: 'Free',
                                time: '10 min',
                                avatar: '👤'
                            };
                        }
                    }
                    setProduct({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        description: p.description || 'Palitos de maíz fritos con sal.',
                        image: '🍟',
                        rating: '4.7',
                        delivery: 'Free',
                        time: '10 min',
                        vendor: vendorDetails
                    });
                }
            } catch (e) {
                console.warn('Could not load dynamic product from syncService:', e);
            }
        };

        loadProductDetails();
    }, [productId]);

    const handleChatWithSeller = async () => {
        if (!user) {
            handleError({ message: 'Inicia sesión para chatear con el vendedor.' });
            return;
        }

        if (user.id === product.vendor.id) {
            handleError({ message: 'No puedes chatear contigo mismo.' });
            return;
        }

        setLoadingChat(true);
        try {
            let conversation: any = null;
            const cachedConversations = await syncService.getItems('conversations');
            const found = cachedConversations.find(
                c => (c.buyer_id === user.id && c.seller_id === product.vendor.id) ||
                     (c.seller_id === user.id && c.buyer_id === product.vendor.id)
            );

            if (found) {
                conversation = found;
            } else if (syncService.isOnline()) {
                const { data, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`and(buyer_id.eq.${user.id},seller_id.eq.${product.vendor.id}),and(buyer_id.eq.${product.vendor.id},seller_id.eq.${user.id})`);
                
                if (!error && data && data.length > 0) {
                    conversation = data[0];
                    await syncService.saveItem('conversations', conversation);
                } else {
                    const newConv = {
                        buyer_id: user.id,
                        seller_id: product.vendor.id,
                        last_message: `Hola, me interesan tus ${product.name}!`,
                        last_message_at: new Date().toISOString()
                    };
                    const saved = await syncService.saveItem('conversations', newConv);
                    conversation = saved;
                }
            } else {
                const newConv = {
                    buyer_id: user.id,
                    seller_id: product.vendor.id,
                    last_message: `Hola, me interesan tus ${product.name}!`,
                    last_message_at: new Date().toISOString()
                };
                const saved = await syncService.saveItem('conversations', newConv);
                conversation = saved;
            }

            navigation.navigate('ChatRoom', {
                conversationId: conversation.id,
                recipientName: product.vendor.name,
                recipientId: product.vendor.id
            });
        } catch (err) {
            handleError(err, 'Error de Chat');
        } finally {
            setLoadingChat(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRoundBtn}>
                    <Text style={styles.backArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalles</Text>
                <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.headerRoundBtn}>
                    <Text style={styles.favHeart}>{isFavorite ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                {/* Visual Image representation */}
                <View style={styles.imageContainer}>
                    <Text style={styles.productEmoji}>{product.image}</Text>
                    {/* Floating Heart Icon on Image Bottom-Right */}
                    <TouchableOpacity style={styles.imageHeartBtn} onPress={() => setIsFavorite(!isFavorite)}>
                        <Text style={styles.imageHeartText}>{isFavorite ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Container */}
                <View style={styles.infoContainer}>
                    {/* Vendor Pill Selector */}
                    <TouchableOpacity 
                        style={styles.vendorPill}
                        onPress={() => setSellerModalVisible(true)}
                    >
                        <Text style={styles.vendorPillText}>{product.vendor.name}</Text>
                    </TouchableOpacity>

                    {/* Product Name */}
                    <Text style={styles.productName}>{product.name}</Text>

                    {/* Short Description */}
                    <Text style={styles.productDescription}>{product.description}</Text>
                    
                    {/* Stats Row: Rating | Delivery | Time */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>⭐</Text>
                            <Text style={styles.statText}>{product.rating}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>🚚</Text>
                            <Text style={styles.statText}>{product.delivery}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>🕒</Text>
                            <Text style={styles.statText}>{product.time}</Text>
                        </View>
                    </View>

                    {/* Detailed Product Description Section */}
                    <Text style={styles.sectionTitle}>DESCRIPCIÓN DETALLADA</Text>
                    <View style={styles.descriptionCard}>
                        <Text style={styles.descriptionCardText}>
                            {product.description || 'Este producto está elaborado higiénicamente por el vendedor del campus. Es una opción fresca, deliciosa y económica para recargar energías entre clases.'}
                        </Text>
                        <View style={styles.availabilityRow}>
                            <Text style={styles.availabilityLabel}>📍 Punto de entrega:</Text>
                            <Text style={styles.availabilityValue}>Pasillos Principales o Edificio A</Text>
                        </View>
                    </View>

                    {/* Contact Button */}
                    <TouchableOpacity style={styles.chatLinkRow} onPress={handleChatWithSeller}>
                        <Text style={styles.chatLinkText}>💬 Chatear con el Vendedor</Text>
                    </TouchableOpacity>

                    {/* Admin Moderation Controls */}
                    {profile?.role === 'admin' && (
                        <View style={styles.adminContainer}>
                            <Text style={styles.adminTitle}>🛡️ CONTROLES DE ADMINISTRADOR</Text>
                            
                            <TouchableOpacity 
                                style={[styles.adminBtn, product.featured ? styles.adminPriorityActiveBtn : styles.adminPriorityBtn]} 
                                onPress={handleAdminTogglePriority}
                                disabled={loadingAdmin}
                            >
                                <Text style={[styles.adminBtnText, product.featured ? styles.adminPriorityActiveText : styles.adminPriorityText]}>
                                    {product.featured ? '⭐ QUITAR DESTACADO' : '🔥 MARCAR COMO DESTACADO'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.adminBtn, styles.adminDeleteBtn]} 
                                onPress={handleAdminDeleteProduct}
                                disabled={loadingAdmin}
                            >
                                <Text style={[styles.adminBtnText, styles.adminDeleteText]}>
                                    🗑️ ELIMINAR DEL CAMPUS
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Custom Details Footer Bar */}
            <View style={styles.footerBar}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Precio</Text>
                    <Text style={styles.priceValue}>${product.price * quantity}</Text>
                </View>

                {/* Quantity Stepper */}
                <View style={styles.stepperContainer}>
                    <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{quantity}</Text>
                    <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setQuantity(quantity + 1)}
                    >
                        <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Add to Cart button */}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => {
                        showSuccess(`${product.name} añadido al carrito!`);
                    }}
                >
                    <Text style={styles.addButtonText}>AÑADIR</Text>
                </TouchableOpacity>
            </View>

            {product.vendor.id && (
                <SellerProfileModal
                    visible={sellerModalVisible}
                    onClose={() => setSellerModalVisible(false)}
                    sellerId={product.vendor.id}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 24 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    headerRoundBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    favHeart: {
        fontSize: 18,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0B0E1E',
    },
    scrollContainer: {
        paddingBottom: 120, // space for fixed footer
    },
    imageContainer: {
        height: 250,
        backgroundColor: '#B0C4DE',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        position: 'relative',
    },
    productEmoji: {
        fontSize: 110,
    },
    imageHeartBtn: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#FFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    imageHeartText: {
        fontSize: 16,
    },
    infoContainer: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    vendorPill: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    vendorPillText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0B0E1E',
    },
    productName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0B0E1E',
        marginBottom: 6,
    },
    productDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    statIcon: {
        fontSize: 15,
        marginRight: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    descriptionCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        marginBottom: 24,
    },
    descriptionCardText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        fontWeight: '600',
        marginBottom: 12,
    },
    availabilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        paddingTop: 10,
    },
    availabilityLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '700',
        marginRight: 6,
    },
    availabilityValue: {
        fontSize: 13,
        color: '#FF7A00',
        fontWeight: '800',
    },
    chatLinkRow: {
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        borderRadius: 16,
    },
    chatLinkText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0B0E1E',
    },

    // Footer Bar
    footerBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        backgroundColor: '#FFF',
        borderTopWidth: 1.5,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    priceContainer: {
        justifyContent: 'center',
    },
    priceLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '800',
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FF7A00',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B0E1E',
        borderRadius: 25,
        padding: 4,
        width: 110,
        justifyContent: 'space-between',
    },
    stepperBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    stepperQty: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    },
    addButton: {
        backgroundColor: '#0B0E1E',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    adminContainer: {
        marginTop: 20,
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#FEB2B2',
    },
    adminTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#C53030',
        letterSpacing: 1,
        marginBottom: 10,
        textAlign: 'center',
    },
    adminBtn: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1.5,
    },
    adminBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    adminPriorityBtn: {
        backgroundColor: '#FFFDF5',
        borderColor: '#F59E0B',
    },
    adminPriorityText: {
        color: '#D97706',
    },
    adminPriorityActiveBtn: {
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
    },
    adminPriorityActiveText: {
        color: '#FFF',
    },
    adminDeleteBtn: {
        backgroundColor: '#FFF5F5',
        borderColor: '#E53E3E',
        marginBottom: 0,
    },
    adminDeleteText: {
        color: '#E53E3E',
    },
});
