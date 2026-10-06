import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
    it('sends the trimmed text and clears the input', async () => {
        const onSend = vi.fn();
        render(<MessageInput onSend={onSend} />);
        const input = screen.getByPlaceholderText('Type a message...');

        await userEvent.type(input, '  Hi there  {enter}');

        expect(onSend).toHaveBeenCalledWith('Hi there');
        expect(input).toHaveValue('');
    });

    it('does not send blank messages', async () => {
        const onSend = vi.fn();
        render(<MessageInput onSend={onSend} />);

        await userEvent.type(screen.getByPlaceholderText('Type a message...'), '   {enter}');

        expect(onSend).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
});
