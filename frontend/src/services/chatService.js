import api from './api';

/**
 * Normalizes backend chat objects to frontend standard.
 * Handles both Swagger format (partner_id) and full object format (participants).
 */
const _normalizeChat = (chatData) => {
    // 1. If backend returns flat structure (Swagger style: partner_id, partner_username)
    if (chatData.partner_id && !chatData.participants) {
        return {
            ...chatData,
            participants: [
                {
                    id: chatData.partner_id,
                    username: chatData.partner_username || 'Unknown',
                    email: chatData.partner_email || ''
                }
            ],
            name: chatData.partner_username
        };
    }

    // 2. If backend returns full structure (Already has participants array)
    return chatData;
};

const chatService = {
    getAllChats: async () => {
        const response = await api.get('/chats');
        const data = response.data;

        if (!Array.isArray(data)) return [];

        return data.map(chat => _normalizeChat(chat));
    },

    createChat: async (recipientId) => {
        const response = await api.post('/chats', { recipient_id: recipientId });
        const data = response.data;

        // Backend might return { message: "Existed", chat_id: 1 } OR full object
        // If it returns just ID, we might need to fetch/construct the object,
        // but currently our logic handles the object if returned.
        const chatObj = Array.isArray(data) ? data[0] : data;

        // Note: If backend returns simplified response for existing chat,
        // the Sidebar refresh will handle getting full data.
        return _normalizeChat(chatObj);
    },

    /**
     * Fetch messages with pagination support.
     * @param {number} chatId
     * @param {Object} params
     * @param {number} [params.limit=50] - Number of messages to fetch
     * @param {number} [params.after_id] - Fetch messages newer than ID (Polling)
     * @param {number} [params.before_id] - Fetch messages older than ID (Pagination)
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