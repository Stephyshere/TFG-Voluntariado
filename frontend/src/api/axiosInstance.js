import axios from 'axios';

const axiosInstance = axios.create({
    // Usamos una variable de entorno para la URL de la API, o localhost en desarrollo
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/', 
    timeout: 10000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export default axiosInstance;