import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MessageList from './MessageList';

const message = (id, day, hour) => ({
    id,
    content: `Message ${id}`,
    author_id: id % 2 ? 1 : 2,
    timestamp: new Date(2020, 0, day, hour).toISOString(),
});

const renderList = (messages, props = {}) => render(
    <MessageList
        messages={messages}
        currentUser={{ id: 1 }}
        onEditMessage={vi.fn()}
        onDeleteMessage={vi.fn()}
        {...props}
    />
);

describe('MessageList', () => {
    it('adds a date separator before the first message of each day', () => {
        renderList([message(1, 6, 9), message(2, 6, 18), message(3, 7, 8)]);

        expect(screen.getAllByText(/Jan/)).toHaveLength(2);
        expect(screen.getByText('Message 3')).toBeInTheDocument();
    });

    it('shows a prompt for an empty chat', () => {
        renderList([]);

        expect(screen.getByText(/No messages here yet/)).toBeInTheDocument();
    });

    it('marks the start of the conversation once all history is loaded', () => {
        renderList([message(1, 6, 9)], { hasMore: false });

        expect(screen.getByText('Start of conversation')).toBeInTheDocument();
    });
});
