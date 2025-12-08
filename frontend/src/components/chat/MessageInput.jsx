import { useState } from 'react';
import PropTypes from 'prop-types';

const MessageInput = ({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim() || disabled) return;

        onSend(text);
        setText('');
    };

    return (
        <div className="bg-white p-4 border-t border-gray-200 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={disabled}
                    autoFocus // UX improvement: Focus input automatically
                    className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || disabled}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                >
                    <span>Send</span>
                    <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

MessageInput.propTypes = {
    onSend: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default MessageInput;