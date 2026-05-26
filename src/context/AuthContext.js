import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // ── INICIAR SESIÓN ──────────────────────────────────────
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      await AsyncStorage.setItem("userToken", data.session.access_token);
      setUserToken(data.session.access_token);
      setUserData(data.user);

      return { error: null };
    } catch (err) {
      console.error("Error en signIn:", err);
      return { error: { message: "Error de red. Revisa tu conexión." } };
    }
  };

  // ── REGISTRARSE (LA FUNCIÓN QUE FALTABA) ─────────────────
  const signUp = async (email, password, metadata) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Aquí enviamos el 'full_name' y el 'user_role'
        },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      // Supabase requiere que el usuario confirme su correo por defecto.
      // Si la sesión es null, significa que se envió el correo de confirmación.
      if (data.session) {
        await AsyncStorage.setItem("userToken", data.session.access_token);
        setUserToken(data.session.access_token);
        setUserData(data.user);
      }

      return { error: null, data };
    } catch (err) {
      console.error("Error en signUp:", err);
      return { error: { message: "Error de red al intentar registrarte." } };
    }
  };

  // ── CERRAR SESIÓN ───────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("userToken");
    setUserToken(null);
    setUserData(null);
  };

  return (
    // ¡Aquí está la clave! Exportamos signUp en el value del Provider
    <AuthContext.Provider
      value={{ signIn, signUp, signOut, userToken, userData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
