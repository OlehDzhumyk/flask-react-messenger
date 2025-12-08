import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { DELETED_USER } from '../../utils/constants';

import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingOld, setIsFetchingOld] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const lastIdRef = useRef(0);
    const { user: currentUser } = useAuth();

    const chatId = activeChat?.id;
    const resolvedPartnerId = activeChat?.partnerId || DELETED_USER.id;

    // --- Lifecycle: Load & Poll ---
    useEffect(() => {
        if (!chatId) return;

        let isMounted = true;
        let intervalId = null;

        console.log(`[DEBUG] ChatWindow mounted for chat: ${chatId}`);
        setLoading(true);
        setMessages([]);
        setHasMore(true);
        lastIdRef.current = 0;

        const loadInitialHistory = async () => {
            try {
                // Initial Fetch
                const data = await chatService.getMessages(chatId, { limit: 50 });
                console.log(`[DEBUG] Initial load count: ${data.length}`);

                if (isMounted) {
                    const msgs = Array.isArray(data) ? data : [];
                    setMessages(msgs);

                    if (msgs.length > 0) {
                        console.log(`[DEBUG] First Msg ID: ${msgs[0].id}, Last Msg ID: ${msgs[msgs.length - 1].id}`);
                        lastIdRef.current = msgs[msgs.length - 1].id;
                    }

                    // Check boundaries
                    if (msgs.length < 50) {
                        console.log('[DEBUG] Less than 50 messages, setting hasMore = false');
                        setHasMore(false);
                    } else {
                        setHasMore(true);
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
                    console.log(`[DEBUG] Polling received: ${newMsgs.length} new messages`);
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const uniqueNewMsgs = newMsgs.filter(m => !existingIds.has(m.id));
                        return [...prev, ...uniqueNewMsgs];
                    });
                    lastIdRef.current = newMsgs[newMsgs.length - 1].id;
                }
            } catch (error) {
                // Silent fail
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
        console.log('[DEBUG] handleLoadOlderMessages triggered');
        console.log(`[DEBUG] State check -> hasMore: ${hasMore}, isFetchingOld: ${isFetchingOld}, msgs length: ${messages.length}`);

        if (!hasMore || isFetchingOld || messages.length === 0) {
            console.log('[DEBUG] Fetch aborted due to state check');
            return;
        }

        setIsFetchingOld(true);

        try {
            const oldestId = messages[0].id;
            console.log(`[DEBUG] Fetching messages BEFORE ID: ${oldestId}`);

            const olderMsgs = await chatService.getMessages(chatId, {
                limit: 50,
                before_id: oldestId
            });

            console.log(`[DEBUG] Received ${olderMsgs.length} older messages`);

            if (olderMsgs.length < 50) {
                console.log('[DEBUG] Reached beginning of history (received < 50)');
                setHasMore(false);
            }

            if (olderMsgs.length > 0) {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const uniqueOlder = olderMsgs.filter(m => !existingIds.has(m.id));

                    console.log(`[DEBUG] Merging. Unique new items: ${uniqueOlder.length}`);

                    if (uniqueOlder.length === 0) {
                        console.warn('[DEBUG] All received messages were duplicates!');
                        return prev;
                    }

                    return [...uniqueOlder, ...prev];
                });
            } else {
                console.log('[DEBUG] No older messages returned.');
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load history", error);
            toast.error("Could not load history");
        } finally {
            setIsFetchingOld(false);
        }
    };

    // --- Handlers (Send/Edit/Delete) ---
    const handleSendMessage = async (content) => {
        if (!chatId) return;
        try {
            const response = await chatService.sendMessage(chatId, content);
            if (response && response.id) {
                setMessages(prev => [...prev, response]);
                lastIdRef.current = response.id;
            }
        } catch (error) {
            console.error(error);
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
            toast.error("Failed to update message");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            await chatService.deleteMessage(messageId);
        } catch (error) {
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
                isFetchingOld={isFetchingOld}
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