import { useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import MessageItem from './MessageItem';

const MessageList = ({
                         messages,
                         currentUser,
                         loading,
                         isFetchingOld,
                         onEditMessage,
                         onDeleteMessage,
                         onLoadMore,
                         hasMore
                     }) => {
    const listRef = useRef(null);

    const snapshotHeightRef = useRef(0);
    const snapshotScrollTopRef = useRef(0);

    const prevMessagesLengthRef = useRef(messages.length);
    const prevFirstMessageIdRef = useRef(null);

    // 1. Scroll Restoration Logic
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;

        const currentLength = messages.length;
        const prevLength = prevMessagesLengthRef.current;
        const firstMessageId = messages.length > 0 ? messages[0].id : null;

        if (currentLength > prevLength && firstMessageId !== prevFirstMessageIdRef.current) {
            const newScrollHeight = list.scrollHeight;
            const heightDifference = newScrollHeight - snapshotHeightRef.current;

            list.scrollTop = heightDifference + snapshotScrollTopRef.current;
        }

        else if (currentLength > prevLength) {
            const isUserNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 150;
            if (isUserNearBottom || prevLength === 0) {
                list.scrollTop = list.scrollHeight;
            }
        }

        prevMessagesLengthRef.current = currentLength;
        prevFirstMessageIdRef.current = firstMessageId;
    }, [messages]);

    // 2. Scroll Handler
    const handleScroll = (e) => {
        if (isFetchingOld || !hasMore || loading) return;

        const { scrollTop, scrollHeight } = e.target;

        if (scrollTop < 100) {
            snapshotHeightRef.current = scrollHeight;
            snapshotScrollTopRef.current = scrollTop;

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
            style={{ overflowAnchor: 'none' }}
        >
            {isFetchingOld && (
                <div className="flex justify-center py-2 h-8 overflow-hidden">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
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
    isFetchingOld: PropTypes.bool,
    onEditMessage: PropTypes.func.isRequired,
    onDeleteMessage: PropTypes.func.isRequired,
    onLoadMore: PropTypes.func,
    hasMore: PropTypes.bool
};

export default MessageList;