import { useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import MessageItem from './MessageItem';

const MessageList = ({
                         messages,
                         currentUser,
                         loading,
                         onEditMessage,
                         onDeleteMessage,
                         onLoadMore, // 👈 New Prop: function to load history
                         hasMore     // 👈 New Prop: boolean, are there more messages?
                     }) => {
    const listRef = useRef(null);
    const prevHeightRef = useRef(0);
    const prevMessageCountRef = useRef(0);

    // 1. Scroll Management: Preserve position when old messages are loaded
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;

        // If we added messages to the TOP (pagination)
        if (messages.length > prevMessageCountRef.current && list.scrollTop === 0) {
            const newHeight = list.scrollHeight;
            const heightDifference = newHeight - prevHeightRef.current;

            // Restore scroll position so user doesn't jump to top
            list.scrollTop = heightDifference;
        }
        // If we added messages to the BOTTOM (new message sent/received), auto-scroll down
        else if (messages.length > prevMessageCountRef.current) {
            // Only auto-scroll if user was already near bottom
            const isNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 100;
            if (isNearBottom) {
                list.scrollTop = list.scrollHeight;
            }
        }

        // Update refs for next render
        prevHeightRef.current = list.scrollHeight;
        prevMessageCountRef.current = messages.length;
    }, [messages]);

    // 2. Initial auto-scroll to bottom on first load
    useEffect(() => {
        if (!loading && listRef.current && messages.length > 0 && prevMessageCountRef.current === 0) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [loading, messages]); // Runs only when loading finishes

    // 3. Handle Scroll to Top
    const handleScroll = (e) => {
        const { scrollTop } = e.target;
        if (scrollTop === 0 && hasMore && !loading) {
            // Save current height before fetching new data
            prevHeightRef.current = e.target.scrollHeight;
            onLoadMore();
        }
    };

    if (loading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2 relative"
        >
            {/* Loading Indicator for Pagination */}
            {loading && messages.length > 0 && (
                <div className="text-center py-2 text-xs text-gray-400">
                    Loading history...
                </div>
            )}

            {!hasMore && messages.length > 0 && (
                <div className="text-center py-4 text-xs text-gray-400 border-b border-gray-100 mb-4">
                    Start of conversation
                </div>
            )}

            {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">
                    No messages here yet. Say hello! 👋
                </div>
            ) : (
                messages.map((msg) => {
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
        </div>
    );
};

MessageList.propTypes = {
    messages: PropTypes.array.isRequired,
    currentUser: PropTypes.object,
    loading: PropTypes.bool,
    onEditMessage: PropTypes.func.isRequired,
    onDeleteMessage: PropTypes.func.isRequired,
    onLoadMore: PropTypes.func,
    hasMore: PropTypes.bool
};

export default MessageList;