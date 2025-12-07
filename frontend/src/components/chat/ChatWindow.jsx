import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
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
        lastIdRef.current = 0;

        // 1. Initial Fetch
        const loadInitialHistory = async () => {
            try {
                const data = await chatService.getMessages(chatId, { limit: 50 });

                if (isMounted) {
                    const msgs = Array.isArray(data) ? data : [];
                    setMessages(msgs);

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
            alert("Failed to send message.");
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, content: newContent } : msg
            ));
            await chatService.updateMessage(messageId, newContent);
        } catch (error) {
            console.error("Failed to edit", error);
            alert("Failed to save changes.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            await chatService.deleteMessage(messageId);
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete message.");
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