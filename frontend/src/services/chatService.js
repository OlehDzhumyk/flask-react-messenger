import api from './api';

const chatService = {
    getAllChats: async () => {
        const response = await api.get('/chats');
        return response.data;
    },

    createChat: async (recipientId) => {
        console.log(`[API] createChat called for recipient: ${recipientId}`);

        const response = await api.post('/chats', { recipient_id: recipientId });
        const rawData = response.data;

        console.log('[API] createChat RAW response:', rawData);

        // Normalize: Backend might return [chatObject] or chatObject
        let chatObj = Array.isArray(rawData) ? rawData[0] : rawData;

        // Adapter: Fix missing 'id' if 'chat_id' is present
        if (chatObj && chatObj.chat_id && !chatObj.id) {
            console.log('[API] Applying Adapter: chat_id -> id');
            chatObj = { ...chatObj, id: chatObj.chat_id };
        }

        console.log('[API] createChat FINAL object:', chatObj);
        return chatObj;
    },

    getMessages: async (chatId) => {
        if (!chatId) {
            console.error('[API] getMessages called with NULL/UNDEFINED chatId');
            return [];
        }
        // LOGGING: Trace fetch start
        console.log(`[API] Fetching messages for Chat ID: ${chatId}`);

        const response = await api.get(`/chats/${chatId}/messages`);

        // LOGGING: Trace fetch result
        console.log(`[API] Messages received for Chat ${chatId}:`, response.data?.length || 0);

        return response.data;
    },

    sendMessage: async (chatId, content) => {
        console.log(`[API] Sending message to Chat ${chatId}:`, content);
        const response = await api.post(`/chats/${chatId}/messages`, { content });
        return response.data;
    }
};

export default chatService;