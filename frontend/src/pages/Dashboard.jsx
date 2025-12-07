import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Sidebar from '../components/layout/Sidebar';
import chatService from '../services/chatService';

const Dashboard = () => {
    const [activeChat, setActiveChat] = useState(null);

    const handleSelectChat = async (id, type) => {
        try {
            let chatData;

            if (type === 'user') {
                // Create new chat or get existing one by recipient ID
                chatData = await chatService.createChat(id);
            } else {
                // ID is already a chat ID (we will fetch details/messages later)
                // For now, we simulate the chat object structure if simpler
                // Ideally, we might need a getChatById, but usually createChat handles both.
                // Let's rely on the fact we probably have the chat object in Sidebar,
                // but for now, let's treat it simple:
                // Since we don't have getChatById yet, we'll assume we reload messages
                chatData = { id: id };
            }

            setActiveChat(chatData);
            console.log("Active Chat Set:", chatData);
        } catch (error) {
            console.error("Failed to select chat", error);
        }
    };

    return (
        <MainLayout
            sidebar={<Sidebar onSelectChat={handleSelectChat} />}
        >
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-gray-50 h-full">
                    <header className="bg-white border-b p-4 shadow-sm">
                        <h3 className="font-bold text-gray-800">Chat #{activeChat.id}</h3>
                    </header>

                    <div className="flex-1 p-4 flex items-center justify-center text-gray-400">
                        Messages loading logic goes here...
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 select-none">
                    <div className="text-center">
                        <span className="text-6xl">💬</span>
                        <p className="mt-4 text-lg">Select a chat to start messaging</p>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Dashboard;