import axios from 'axios';

// Creamos la instancia centralizada de Axios
const axiosClient = axios.create({
    // Vite inyecta automáticamente la variable de entorno aquí
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // 10 segundos de espera máxima por si el servidor de Render tarda en despertar
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor opcional: Útil por si a futuro necesitas agregar tokens de seguridad automáticamente
axiosClient.interceptors.request.use(
    (config) => {
        // Ejemplo: Si existiera un token en localStorage, se inyectaría acá
        // const token = localStorage.getItem('token');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient;