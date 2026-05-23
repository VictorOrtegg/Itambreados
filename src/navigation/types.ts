import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    Verification: { email: string };
    LocationAccess: undefined;
    Home: undefined;
    Search: undefined;
    ProductDetails: { productId: string };
    SellerProfile: { sellerId: string };
    ChatList: undefined;
    ChatRoom: { conversationId: string; recipientName: string; recipientId: string };
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

