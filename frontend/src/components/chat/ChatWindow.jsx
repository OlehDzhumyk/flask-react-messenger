import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const lastIdRef = useRef(0);
    const { user: currentUser } = useAuth();

    // Deconstruct for clarity
    const chatId = activeChat?.id;
    const partnerId = activeChat?.partnerId;

    // Lifecycle Log
    useEffect(() => {
        console.log(`[ChatWindow] Mounted for Chat ID: ${chatId}`);
    }, [chatId]);

    // 1. Initial Load & Polling Logic
    useEffect(() => {
        if (!chatId) return;

        let isMounted = true;

        // Reset state when switching chats
        setLoading(true);
        setMessages([]);
        lastIdRef.current = 0;

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

        const pollNewMessages = async () => {
            try {
                const newMsgs = await chatService.getMessages(chatId, {
                    after_id: lastIdRef.current
                });

                if (isMounted && Array.isArray(newMsgs) && newMsgs.length > 0) {
                    setMessages(prev => [...prev, ...newMsgs]);
                    lastIdRef.current = newMsgs[newMsgs.length - 1].id;
                }
            } catch (error) {
                // Silent fail for polling errors
            }
        };

        loadInitialHistory();
        const intervalId = setInterval(pollNewMessages, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [chatId]);

    // 2. Send Logic
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
            alert("Failed to send message");
        }
    };

    if (!chatId) return null;

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header is now correctly placed INSIDE the window logic */}
            {partnerId && <ChatHeader userId={partnerId} />}

            <MessageList
                messages={messages}
                currentUser={currentUser}
                loading={loading}
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
        partnerId: PropTypes.number // Optional initially, but good to have
    }).isRequired,
};

export default ChatWindow;