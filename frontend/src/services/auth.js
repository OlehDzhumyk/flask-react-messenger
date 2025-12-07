import api from './api';

const authService = {
    // Login user and return data
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data; // Expected: { access_token: "...", user: {...} }
    },

    // Register new user
    register: async (username, email, password) => {
        const response = await api.post('/auth/register', { username, email, password });
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/profile');
        return response.data;
    },

    updateProfile: async (data) => {
        // data: { username, email, password (optional) }
        const response = await api.put('/profile', data);
        return response.data;
    },

    deleteAccount: async () => {
        const response = await api.delete('/profile');
        return response.data;
    }

};

export default authService;