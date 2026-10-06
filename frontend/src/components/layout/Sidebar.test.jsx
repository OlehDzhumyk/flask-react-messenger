import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersProvider } from '../../context/UsersContext';
import chatService from '../../services/chatService';
import Sidebar from './Sidebar';

vi.mock('../../context/AuthContext', () => {
    const auth = { user: { id: 1, username: 'Alice' }, logout: () => {} };   // stable, like real state
    return { useAuth: () => auth };
});
vi.mock('../../services/chatService', () => ({ default: { getAllChats: vi.fn() } }));

const lastMessage = (authorId, content) => ({
    id: 1, author_id: authorId, content, chat_id: 1, timestamp: new Date().toISOString(),
});

const chats = [
    { id: 10, participants: [{ id: 2, username: 'Bob' }], last_message: lastMessage(2, 'See you soon') },
    { id: 11, participants: [{ id: 3, username: 'Carol' }], last_message: lastMessage(1, 'Thanks!') },
    { id: 12, participants: [{ id: 4, username: 'Dan' }], last_message: null },
    { id: 13, last_message: lastMessage(null, 'Old message') },   // partner deleted their account
];

const renderSidebar = (props = {}) => render(
    <UsersProvider>
        <Sidebar onChatSelect={vi.fn()} {...props} />
    </UsersProvider>
);

beforeEach(() => {
    vi.clearAllMocks();
    chatService.getAllChats.mockResolvedValue(chats);
});

describe('Sidebar', () => {
    it('lists chats with a preview of the last message', async () => {
        renderSidebar();

        const bob = await screen.findByRole('button', { name: /Bob/ });
        expect(within(bob).getByText('See you soon')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Carol/ })).toHaveTextContent('You: Thanks!');
        expect(screen.getByRole('button', { name: /Dan/ })).toHaveTextContent('No messages yet');
        expect(screen.getByRole('button', { name: /Deleted Account/ })).toHaveTextContent('Old message');
    });

    it('highlights the open chat', async () => {
        renderSidebar({ activeChatId: 11 });

        expect(await screen.findByRole('button', { name: /Carol/ })).toHaveAttribute('aria-current', 'true');
        expect(screen.getByRole('button', { name: /Bob/ })).not.toHaveAttribute('aria-current');
    });

    it('filters chats by name', async () => {
        renderSidebar();
        await screen.findByRole('button', { name: /Bob/ });

        await userEvent.type(screen.getByPlaceholderText('Filter chats...'), 'car');

        expect(screen.getByRole('button', { name: /Carol/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Bob/ })).not.toBeInTheDocument();
    });

    it('opens a chat when it is clicked', async () => {
        const onChatSelect = vi.fn();
        renderSidebar({ onChatSelect });

        await userEvent.click(await screen.findByRole('button', { name: /Bob/ }));

        expect(onChatSelect).toHaveBeenCalledWith(chats[0]);
    });

    it('reloads the list when refreshKey changes', async () => {
        const { rerender } = renderSidebar({ refreshKey: 0 });
        await screen.findByRole('button', { name: /Bob/ });

        rerender(
            <UsersProvider>
                <Sidebar onChatSelect={vi.fn()} refreshKey={1} />
            </UsersProvider>
        );

        await vi.waitFor(() => expect(chatService.getAllChats).toHaveBeenCalledTimes(2));
    });
});
