import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

// Distribución de datos ->
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // 'user' guarda los datos del perfil
    const [user, setUser] = useState(null);
    // 'token' busca si ya tiene un token dentro del local storage
    const [token, setToken] = useState(localStorage.getItem('token'));
    // 'loading' bloquea la pantalla hasta que se sepa si el usuario tiene permisos o no
    const [loading, setLoading] = useState(true);

    // se ejecuta al cargar la página o al cambiar el token
    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                // si hay un token lo inyectamos por defecto en todas las peticiones futuras
                axiosInstance.defaults.headers.common['Authorization'] = `Token ${token}`;
                try {
                    //pedimos los datos del user logeado
                    const response = await axiosInstance.get('me/');
                    const profile = response.data;
                    // Flatten structure: fusiona los datos del usuario base con los del profile 
                    // profile.user contiene los datos de django { first_name, last_name, email, username }
                    // profile contiene los datos extra { telefono, rol, ... }
                    setUser({ ...profile.user, ...profile });
                } catch (error) {
                    console.error("Error al obtener datos del usuario", error);
                    // Si falla el token (expirado, etc), hacemos logout
                    if (error.response && error.response.status === 401) {
                        logout();
                    }
                }
            } else {
                // Si no hay token limpiamos cualquier residuo que haya dejado
                delete axiosInstance.defaults.headers.common['Authorization'];
                setUser(null);
            }
            // Termina de cargar -> se muestra la interfaz 
            setLoading(false);
        };

        fetchUser();
    }, [token]);

    // Función para iniciar sesión
    const login = async (username, password) => {
        try {
            // Enviamos las credenciales al endpoint 
            const response = await axiosInstance.post('login/', { username, password });
            console.log("Login Response:", response.data);
            const { token } = response.data;
            if (!token) throw new Error("No token received");
            // Si hay exito se le otorga un token y lo guardamos en el localStorage
            setToken(token);
            localStorage.setItem('token', token);
            return { success: true };
        } catch (error) {
            console.error('Login failed', error);
            return { success: false, error: error.response?.data?.non_field_errors?.[0] || "Credenciales inválidas" };
        }
    };
    
    // Funcion para regitrar al user
    const register = async (userData) => {
        try {
            // Enviamos los datos del usuario al endpoint del backend
            console.log("Sending Register Data:", userData);
            const response = await axiosInstance.post('register/', userData);
            console.log("Register Response:", response.data);

            const { token } = response.data;
            if (!token) throw new Error("No token received from register");
            // Autologeamos al usuario inmediatamente despues del registro
            setToken(token);
            localStorage.setItem('token', token);
            return { success: true };
        } catch (error) {
            console.error('Registration failed', error);
            return { success: false, error: error.response?.data };
        }
    }

    // Cerrar sesión
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    // Envuelve a los componentes 'hijos' para darles el acceso a todas las funciones y variables
    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
