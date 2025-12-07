import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

// Import Child Components
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    const chatId = activeChat?.id;

    // Lifecycle Log
    useEffect(() => {
        console.log(`[ChatWindow] Mounted for Chat ID: ${chatId}`);
    }, [chatId]);

    // Fetch Logic
    useEffect(() => {
        if (!chatId) return;

        let isMounted = true;
        setLoading(true);

        const fetchMessages = async () => {
            try {
                const data = await chatService.getMessages(chatId);
                if (isMounted) {
                    const msgs = Array.isArray(data) ? data : [];
                    console.log(`[ChatWindow] Loaded ${msgs.length} messages`);
                    setMessages(msgs);
                    setLoading(false);
                }
            } catch (error) {
                console.error("[ChatWindow] Failed to fetch messages", error);
                if (isMounted) setLoading(false);
            }
        };

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [chatId]);

    // Send Logic
    const handleSendMessage = async (content) => {
        if (!chatId) return;
        try {
            await chatService.sendMessage(chatId, content);
            const data = await chatService.getMessages(chatId);
            setMessages(data);
        } catch (error) {
            console.error("[ChatWindow] Failed to send message", error);
        }
    };

    if (!chatId) return null;

    return (
        <div className="flex flex-col h-full bg-white relative">

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
    activeChat: PropTypes.object.isRequired,
};

export default ChatWindow;