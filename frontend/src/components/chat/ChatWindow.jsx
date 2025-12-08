import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { DELETED_USER } from '../../utils/constants';

// Components
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Pagination State ---
    const [isFetchingOld, setIsFetchingOld] = useState(false); // Loader for history
    const [hasMore, setHasMore] = useState(true); // Is there more history to load?

    // Ref to track the ID of the last message we received (Smart Polling)
    const lastIdRef = useRef(0);

    const { user: currentUser } = useAuth();

    // Safely extract IDs
    const chatId = activeChat?.id;
    const rawPartnerId = activeChat?.partnerId;

    // Normalization: If partnerId is missing/null, assume it's a deleted user
    const resolvedPartnerId = rawPartnerId || DELETED_USER.id;

    // --- Lifecycle: Load & Poll ---
    useEffect(() => {
        if (!chatId) return;

        let isMounted = true;
        let intervalId = null;

        // Reset state for new chat
        setLoading(true);
        setMessages([]);
        setHasMore(true); // Assume there is history initially
        lastIdRef.current = 0;

        // 1. Initial Fetch
        const loadInitialHistory = async () => {
            try {
                const data = await chatService.getMessages(chatId, { limit: 50 });

                if (isMounted) {
                    const msgs = Array.isArray(data) ? data : [];
                    setMessages(msgs);

                    // If we received fewer messages than the limit, we reached the start
                    if (msgs.length < 50) {
                        setHasMore(false);
                    }

                    if (msgs.length > 0) {
                        lastIdRef.current = msgs[msgs.length - 1].id;
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error("[ChatWindow] Failed to load history", error);
                if (isMounted) setLoading(false);
            }
        };

        // 2. Polling Function
        const pollNewMessages = async () => {
            try {
                const newMsgs = await chatService.getMessages(chatId, {
                    after_id: lastIdRef.current
                });

                if (isMounted && Array.isArray(newMsgs) && newMsgs.length > 0) {
                    // Filter duplicates
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const uniqueNewMsgs = newMsgs.filter(m => !existingIds.has(m.id));
                        return [...prev, ...uniqueNewMsgs];
                    });

                    lastIdRef.current = newMsgs[newMsgs.length - 1].id;
                }
            } catch (error) {
                // Silent fail for polling
            }
        };

        loadInitialHistory();
        intervalId = setInterval(pollNewMessages, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [chatId]);

    // --- Pagination Handler ---
    const handleLoadOlderMessages = async () => {
        // Stop if already loading, no more messages, or chat is empty
        if (!hasMore || isFetchingOld || messages.length === 0) return;

        setIsFetchingOld(true);

        try {
            // The oldest message is the first one in the current array
            const oldestId = messages[0].id;

            const olderMsgs = await chatService.getMessages(chatId, {
                limit: 50,
                before_id: oldestId
            });

            if (olderMsgs.length < 50) {
                setHasMore(false); // We reached the beginning
            }

            if (olderMsgs.length > 0) {
                // Prepend older messages to the list
                setMessages(prev => [...olderMsgs, ...prev]);
            }
        } catch (error) {
            console.error("Failed to load history", error);
            toast.error("Could not load history");
        } finally {
            setIsFetchingOld(false);
        }
    };

    // --- Handlers ---

    const handleSendMessage = async (content) => {
        if (!chatId) return;

        try {
            const response = await chatService.sendMessage(chatId, content);
            if (response && response.id) {
                setMessages(prev => [...prev, response]);
                lastIdRef.current = response.id;
            }
        } catch (error) {
            console.error("[ChatWindow] Failed to send message", error);
            toast.error("Failed to send message ❌");
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, content: newContent } : msg
            ));
            await chatService.updateMessage(messageId, newContent);
            toast.success("Message updated");
        } catch (error) {
            console.error("Failed to edit", error);
            toast.error("Failed to update message");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            await chatService.deleteMessage(messageId);
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Failed to delete message");
        }
    };

    if (!chatId) return null;

    return (
        <div className="flex flex-col h-full bg-white relative">
            <ChatHeader userId={resolvedPartnerId} />

            <MessageList
                messages={messages}
                currentUser={currentUser}
                loading={loading}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onLoadMore={handleLoadOlderMessages}
                hasMore={hasMore}
            />

            <MessageInput
                onSend={handleSendMessage}
                disabled={loading}
            />
        </div>
    );
};

ChatWindow.propTypes = {
    activeChat: PropTypes.shape({
        id: PropTypes.number.isRequired,
        partnerId: PropTypes.number
    }).isRequired,
};

export default ChatWindow;