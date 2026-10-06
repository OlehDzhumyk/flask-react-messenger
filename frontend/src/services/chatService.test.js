import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import chatService from './chatService';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe('chatService', () => {
    it('turns the partner fields of each chat into a participants list', async () => {
        api.get.mockResolvedValue({
            data: [{ id: 1, partner_id: 2, partner_username: 'Bob', last_message: null }],
        });

        const chats = await chatService.getAllChats();

        expect(api.get).toHaveBeenCalledWith('/chats');
        expect(chats[0].participants).toEqual([{ id: 2, username: 'Bob', email: '' }]);
        expect(chats[0].last_message).toBeNull();
    });

    it('keeps chats whose partner deleted their account', async () => {
        api.get.mockResolvedValue({ data: [{ id: 1, partner_id: null, partner_username: null }] });

        const [chat] = await chatService.getAllChats();

        expect(chat.id).toBe(1);
        expect(chat.participants).toBeUndefined();
    });

    it('returns a chat that can be opened straight after creating it', async () => {
        api.post.mockResolvedValue({
            data: { id: 7, chat_id: 7, partner_id: 3, partner_username: 'Carol', message: 'Chat created' },
        });

        const chat = await chatService.createChat(3);

        expect(api.post).toHaveBeenCalledWith('/chats', { recipient_id: 3 });
        expect(chat.id).toBe(7);
        expect(chat.participants[0]).toMatchObject({ id: 3, username: 'Carol' });
    });

    it('passes pagination parameters when loading messages', async () => {
        api.get.mockResolvedValue({ data: [] });

        await chatService.getMessages(5, { limit: 50, before_id: 120 });

        expect(api.get).toHaveBeenCalledWith('/chats/5/messages', { params: { limit: 50, before_id: 120 } });
    });
});
