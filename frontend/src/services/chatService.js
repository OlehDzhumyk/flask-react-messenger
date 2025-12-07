import api from './api';

const chatService = {
    getAllChats: async () => {
        const response = await api.get('/chats');
        return response.data;
    },

    createChat: async (recipientId) => {
        const response = await api.post('/chats', { recipient_id: recipientId });
        return response.data;
    },

    getMessages: async (chatId) => {
        const response = await api.get(`/chats/${chatId}/messages`);
        return response.data;
    },

    sendMessage: async (chatId, content) => {
        const response = await api.post(`/chats/${chatId}/messages`, { content });
        return response.data;
    }
};

export default chatService;