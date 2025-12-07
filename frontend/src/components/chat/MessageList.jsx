import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const MessageList = ({ messages, currentUser, loading }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            console.log('[MessageList] First MSG structure:', messages[0]);
        }
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                    <span className="text-4xl mb-2">👋</span>
                    <p>No messages yet.</p>
                </div>
            ) : (
                messages.map((msg) => {
                    const authorId = msg.author_id || msg.author?.id;
                    const isMe = String(authorId) === String(currentUser.id);

                    const textToShow = msg.content || msg.message || msg.text || '';

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                            <div
                                className={`max-w-[70%] px-4 py-2.5 shadow-sm relative group break-words ${
                                    isMe
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100'
                                }`}
                            >
                                <p className="text-[15px] leading-relaxed">
                                    {textToShow}
                                </p>
                                <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                   {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={bottomRef} />
        </div>
    );
};

MessageList.propTypes = {
    messages: PropTypes.array.isRequired,
    currentUser: PropTypes.object.isRequired,
    loading: PropTypes.bool,
};

export default MessageList;