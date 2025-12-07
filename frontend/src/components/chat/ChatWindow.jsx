import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

// Components
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ref to track the ID of the last message we received.
    // Needed for "Smart Polling" to ask backend only for updates.
    const lastIdRef = useRef(0);

    const { user: currentUser } = useAuth();

    // Safely extract IDs
    const chatId = activeChat?.id;
    const partnerId = activeChat?.partnerId;

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

                    // Update ref to the latest message ID
                    if (msgs.length > 0) {
                        lastIdRef.current = msgs[msgs.length - 1].id;
                    }

                    console.log(`[ChatWindow] Initial load: ${msgs.length} messages.`);
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
                    console.log(`[ChatWindow] Polling: Received ${newMsgs.length} new messages.`);

                    // Append only unique new messages to avoid duplicates
                    setMessages(prev => {
                        // Safety check: ensure we don't add duplicates if polling overlaps
                        const existingIds = new Set(prev.map(m => m.id));
                        const uniqueNewMsgs = newMsgs.filter(m => !existingIds.has(m.id));
                        return [...prev, ...uniqueNewMsgs];
                    });

                    lastIdRef.current = newMsgs[newMsgs.length - 1].id;
                }
            } catch (error) {
                // Silent fail is expected for polling (e.g. network blip)
            }
        };

        // Execution
        loadInitialHistory();
        intervalId = setInterval(pollNewMessages, 3000); // Poll every 3 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [chatId]);

    // --- Handlers: Send, Edit, Delete ---

    const handleSendMessage = async (content) => {
        if (!chatId) return;

        try {
            const response = await chatService.sendMessage(chatId, content);

            // Optimistic Append: If server returns the created message, add it immediately
            // This makes the UI feel "instant" without waiting for the next poll
            if (response && response.id) {
                setMessages(prev => [...prev, response]);
                lastIdRef.current = response.id;
            }
        } catch (error) {
            console.error("[ChatWindow] Failed to send message", error);
            alert("Failed to send message. Please try again.");
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            // 1. Optimistic Update (Update UI immediately)
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, content: newContent } : msg
            ));

            // 2. API Call
            await chatService.updateMessage(messageId, newContent);
            console.log(`[ChatWindow] Message ${messageId} updated.`);
        } catch (error) {
            console.error("Failed to edit message", error);
            alert("Failed to save changes.");
            // Ideally: Revert optimistic update here on error
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            // 1. Optimistic Update (Remove from UI immediately)
            setMessages(prev => prev.filter(msg => msg.id !== messageId));

            // 2. API Call
            await chatService.deleteMessage(messageId);
            console.log(`[ChatWindow] Message ${messageId} deleted.`);
        } catch (error) {
            console.error("Failed to delete message", error);
            alert("Failed to delete message.");
        }
    };

    if (!chatId) return null;

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header: Displays Partner Info */}
            {partnerId && <ChatHeader userId={partnerId} />}

            {/* List: Displays Messages & Handles Actions */}
            <MessageList
                messages={messages}
                currentUser={currentUser}
                loading={loading}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
            />

            {/* Input: Text Area for new messages */}
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