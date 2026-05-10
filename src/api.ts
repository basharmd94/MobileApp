import axios from 'axios';

declare const __API_URL__: string | undefined;

// Determine base URL based on environment:
// - Development: Use relative path '/api/v1' (Vite proxy routes to http://206.191.180.106:8500)
// - Production: Use absolute URL with full API endpoint (e.g., http://206.191.180.106:8500/api/v1)
const baseURL = typeof __API_URL__ !== 'undefined' && __API_URL__
  ? `${__API_URL__}/api/v1`
  : '/api/v1';

const api = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Cache for user data to prevent redundant API calls
let userDataCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        // For login endpoint, ensure proper content type
        if (config.url === '/users/login') {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        // For all other POST requests, ensure proper data formatting
        else if (config.method === 'post') {
            if (!config.headers['Content-Type']) {
                config.headers['Content-Type'] = 'application/json';
            }
            if (config.headers['Content-Type'] === 'application/x-www-form-urlencoded' && typeof config.data === 'object') {
                const formData = new URLSearchParams();
                Object.entries(config.data).forEach(([key, value]) => {
                    formData.append(key, value as string);
                });
                config.data = formData.toString();
            }
        }

        // Use cached user data for /users/me endpoint if available and not expired
        if (config.url === '/users/me' && userDataCache && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            // Return a custom response to prevent actual API call
            config.adapter = () => {
                return Promise.resolve({
                    data: userDataCache,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                    request: {},
                } as any);
            };
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Cache user data from /users/me endpoint
        if (response.config.url === '/users/me' && response.data) {
            userDataCache = response.data;
            lastFetchTime = Date.now();
        }
        return response;
    },
    async (error) => {
        // Handle token expiration
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Use query parameter for refresh token as expected by the backend
                const response = await axios.post(
                    `${baseURL}/users/refresh-token?refresh_token=${encodeURIComponent(refreshToken)}`,
                    null,
                    { 
                        headers: { 
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        }
                    }
                );
                
                const { access_token } = response.data;
                localStorage.setItem('accessToken', access_token);
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                userDataCache = null; // Clear cache on auth error
                
                // Redirect user to login page
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Function to clear the cache (use when logging out)
export const clearApiCache = () => {
    userDataCache = null;
    lastFetchTime = 0;
};

export default api;
