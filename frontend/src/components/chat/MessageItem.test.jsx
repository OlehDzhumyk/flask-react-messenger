import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MessageItem from './MessageItem';

const message = { id: 1, content: 'Hello', author_id: 1, timestamp: '2026-10-06T12:00:00+00:00' };

const renderItem = (props = {}) => {
    const handlers = { onEdit: vi.fn(), onDelete: vi.fn() };
    render(<MessageItem message={message} isOwn {...handlers} {...props} />);
    return handlers;
};

describe('MessageItem', () => {
    it('shows edit and delete actions only on your own messages', () => {
        const { rerender } = render(
            <MessageItem message={message} isOwn={false} onEdit={vi.fn()} onDelete={vi.fn()} />
        );
        expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();

        rerender(<MessageItem message={message} isOwn onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByTitle('Edit')).toBeInTheDocument();
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('saves a trimmed edit', async () => {
        const { onEdit } = renderItem();

        await userEvent.click(screen.getByTitle('Edit'));
        const box = screen.getByRole('textbox');
        await userEvent.clear(box);
        await userEvent.type(box, '  Hello again  ');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onEdit).toHaveBeenCalledWith(1, 'Hello again');
    });

    it('does not save an empty or unchanged edit', async () => {
        const { onEdit } = renderItem();

        await userEvent.click(screen.getByTitle('Edit'));
        await userEvent.clear(screen.getByRole('textbox'));
        await userEvent.type(screen.getByRole('textbox'), '   ');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await userEvent.click(screen.getByTitle('Edit'));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onEdit).not.toHaveBeenCalled();
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('asks for confirmation before deleting', async () => {
        const { onDelete } = renderItem();
        const confirm = vi.spyOn(window, 'confirm');

        confirm.mockReturnValueOnce(false);
        await userEvent.click(screen.getByTitle('Delete'));
        expect(onDelete).not.toHaveBeenCalled();

        confirm.mockReturnValueOnce(true);
        await userEvent.click(screen.getByTitle('Delete'));
        expect(onDelete).toHaveBeenCalledWith(1);
    });
});
