import api from './api';

/**
 * Normalizes backend chat objects to frontend standard.
 * Handles both Swagger format (partner_id) and full object format (participants).
 */
const _normalizeChat = (chatData, currentUserId) => {
    // 1. If backend returns flat structure (Swagger style)
    if (chatData.partner_id && !chatData.participants) {
        return {
            ...chatData,
            participants: [
                {
                    id: chatData.partner_id,
                    username: chatData.partner_username || 'Unknown',
                    email: chatData.partner_email || '' // If available
                }
            ],
            // Ensure we have a consistent name for UI
            name: chatData.partner_username
        };
    }

    // 2. If backend returns full structure (Already has participants)
    return chatData;
};

const chatService = {
    getAllChats: async () => {
        const response = await api.get('/chats');
        const data = response.data;

        if (!Array.isArray(data)) return [];

        // Normalize each chat object immediately
        return data.map(chat => _normalizeChat(chat));
    },

    createChat: async (recipientId) => {
        const response = await api.post('/chats', { recipient_id: recipientId });
        const data = response.data;

        const chatObj = Array.isArray(data) ? data[0] : data;
        return _normalizeChat(chatObj);
    },

    /**
     * Fetch messages with optional smart polling and pagination.
     * @param {number} chatId
     * @param {Object} params - { after_id, limit }
     */
    getMessages: async (chatId, params = {}) => {
        if (!chatId) return [];
        const response = await api.get(`/chats/${chatId}/messages`, { params });
        return response.data;
    },

    sendMessage: async (chatId, content) => {
        const response = await api.post(`/chats/${chatId}/messages`, { content });
        return response.data;
    },

    updateMessage: async (messageId, content) => {
        const response = await api.put(`/messages/${messageId}`, { content });
        return response.data;
    },

    deleteMessage: async (messageId) => {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    }
};

export default chatService;