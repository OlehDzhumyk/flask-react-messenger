import api from './api';

const userService = {
    searchUsers: async (query) => {
        const response = await api.get('/users', {
            params: { q: query }
        });
        return response.data;
    }
};

export default userService;