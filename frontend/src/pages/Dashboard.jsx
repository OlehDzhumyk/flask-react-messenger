import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useUsers } from '../context/UsersContext';
import { useAuth } from '../context/AuthContext';
import { getChatPartner } from '../utils/chatHelpers';

const Dashboard = () => {
    // State stores IDs. Single source of truth is Context.
    // Schema: { chatId: number, partnerId: number }
    const [activeChat, setActiveChat] = useState(null);

    const { cacheUsers } = useUsers();
    const { user: currentUser } = useAuth();

    const handleChatSelect = (chat) => {
        const partner = getChatPartner(chat, currentUser);
        // Ensure partner is cached so ChatHeader can find it by ID later
        cacheUsers([partner]);

        console.log('[Dashboard] Selected chat:', chat.id, 'Partner ID:', partner.id);
        setActiveChat({ chatId: chat.id, partnerId: partner.id });
    };

    return (
        <MainLayout
            sidebar={
                <Sidebar onChatSelect={handleChatSelect} />
            }
        >
            {activeChat ? (
                <div className="flex flex-col h-full w-full bg-white relative">
                    <div className="flex-1 overflow-hidden relative h-full">
                        {/* ChatWindow fetches its own messages; partnerId is used for the header. */}
                        <ChatWindow
                            key={activeChat.chatId}
                            activeChat={{
                                id: activeChat.chatId,
                                partnerId: activeChat.partnerId
                            }}
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