import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

// Import Context
import { AuthProvider, useAuth } from "./src/context/AuthContext";

// Import Screens
import LoginScreen from "./src/screens/auth/LoginScreen";
import OnboardingScreen from "./src/screens/auth/OnboardingScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import SplashScreen from "./src/screens/auth/SplashScreen";

// Import Navigators
import MainNavigator from "./src/navigation/MainNavigator";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  // ⚠️ CAMBIO CLAVE AQUÍ: Usamos userToken en lugar de session
  // Nota: Quité 'loading' temporalmente porque nuestro AuthContext actual no lo exporta,
  // así evitamos que te lance un error de "undefined".
  const { userToken } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        // User is signed in (El sistema entra aquí en automático al iniciar sesión)
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        // User is not signed in
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
