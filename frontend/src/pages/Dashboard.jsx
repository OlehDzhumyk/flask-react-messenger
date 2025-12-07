import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ChatHeader from '../components/chat/ChatHeader'; // Import Header directly here
import chatService from '../services/chatService';
import { useUsers } from '../context/UsersContext';
import { useAuth } from '../context/AuthContext';
import { getChatPartner } from '../utils/chatHelpers';

const Dashboard = () => {
    // State now stores IDs, not full objects. Single source of truth is Context.
    // Schema: { chatId: number, partnerId: number }
    const [activeChat, setActiveChat] = useState(null);

    const { cacheUsers } = useUsers();
    const { user: currentUser } = useAuth();

    const handleChatSelect = (chat) => {
        const partner = getChatPartner(chat, currentUser);
        cacheUsers([partner]);

        console.log('[Dashboard] Selected chat:', chat.id, 'Partner ID:', partner.id);
        setActiveChat({ chatId: chat.id, partnerId: partner.id });
    };

    const handleUserSelect = async (targetUser) => {
        try {
            cacheUsers([targetUser]);

            const chatData = await chatService.createChat(targetUser.id);

            if (!chatData || !chatData.id) return;

            console.log('[Dashboard] Created/Found chat:', chatData.id, 'Partner ID:', targetUser.id);
            setActiveChat({
                chatId: chatData.id,
                partnerId: targetUser.id
            });

        } catch (error) {
            console.error('[Dashboard] Failed to init chat', error);
        }
    };

    return (
        <MainLayout
            sidebar={
                <Sidebar onChatSelect={handleChatSelect} onUserSelect={handleUserSelect} />
            }
        >
            {activeChat ? (
                <div className="flex flex-col h-full w-full bg-white relative">

                    <ChatHeader userId={activeChat.partnerId} />

                    <div className="flex-1 overflow-hidden relative h-full">
                        <ChatWindow
                            key={activeChat.chatId}
                            activeChat={{ id: activeChat.chatId }} // ChatWindow expects object with id
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 select-none">
                    <div className="text-center">
                        <span className="text-6xl">💬</span>
                        <p className="mt-4 text-lg">Select a conversation to start</p>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Dashboard;