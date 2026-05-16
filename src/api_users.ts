import api, { clearApiCache } from './api';

const AUTH_STATE_EVENT = 'auth-state-changed';

export const login = async (username?: string, password?: string) => {
    if (!username || !password) {
        throw new Error('Username and password are required');
    }

    try {
        const formData = new URLSearchParams();
        formData.append('username', username.trim());
        formData.append('password', password);

        const response = await api.post('/users/login', formData);
        
        // Assuming response.data returns the tokens
        if (response.data.access_token) {
            localStorage.setItem('accessToken', response.data.access_token);
        }
        if (response.data.refresh_token) {
            localStorage.setItem('refreshToken', response.data.refresh_token);
        }

        // Notify background services, such as location tracking, that authentication is now available.
        window.dispatchEvent(new Event(AUTH_STATE_EVENT));

        return response.data;
    } catch (error: any) {
        if (error.response?.data?.detail) {
            throw new Error(error.response.data.detail);
        } else if (error.message === 'Network Error') {
            throw new Error('Network Error: Unable to connect to the server. Please check your internet connection and server availability.');
        }
        throw new Error('Login failed. Please check your credentials and try again.');
    }
};

export const logout = async () => {
    try {
        const response = await api.post('/users/logout');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        clearApiCache();
        // Notify background services so they can stop authenticated work and clear timers.
        window.dispatchEvent(new Event(AUTH_STATE_EVENT));
        return response.data;
    } catch (error) {
        // Even if logout fails on server, clear local state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        clearApiCache();
        // Notify background services even when the server logout fails because local auth is gone.
        window.dispatchEvent(new Event(AUTH_STATE_EVENT));
        throw error;
    }
};

export const getCurrentUser = async () => {
    const response = await api.get('/users/me');
    return response.data;
};
