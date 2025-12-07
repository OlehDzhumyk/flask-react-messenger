import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MessageItem from './MessageItem';

const MessageList = ({ messages, currentUser, loading, onEditMessage, onDeleteMessage }) => {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
            {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">
                    No messages here yet. Say hello! 👋
                </div>
            ) : (
                messages.map((msg) => {
                    // Determine ownership safely
                    // msg.author_id comes from DB, msg.author might be nested depending on normalization
                    const authorId = msg.author_id || msg.author?.id;
                    const isOwn = authorId === currentUser?.id;

                    return (
                        <MessageItem
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            onEdit={onEditMessage}
                            onDelete={onDeleteMessage}
                        />
                    );
                })
            )}
            <div ref={bottomRef} />
        </div>
    );
};

MessageList.propTypes = {
    messages: PropTypes.array.isRequired,
    currentUser: PropTypes.object,
    loading: PropTypes.bool,
    onEditMessage: PropTypes.func.isRequired,
    onDeleteMessage: PropTypes.func.isRequired,
};

export default MessageList;