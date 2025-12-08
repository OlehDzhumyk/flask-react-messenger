import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UsersContext';
import { getChatPartner } from '../../utils/chatHelpers';
import { DELETED_USER } from '../../utils/constants';

// Components
import SidebarItem from './SidebarItem';
import SettingsModal from './SettingsModal';
import NewChatModal from './NewChatModal';

const Sidebar = ({ onChatSelect, onUserSelect }) => {
    const [chats, setChats] = useState([]);

    // Local Filter State
    const [filterQuery, setFilterQuery] = useState('');

    // Modals State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    const { user: currentUser, logout } = useAuth();
    const { cacheUsers } = useUsers();

    // 1. Fetch Chats Logic
    const fetchChats = async () => {
        try {
            const data = await chatService.getAllChats();
            const chatList = Array.isArray(data) ? data : [];
            setChats(chatList);

            const allParticipants = chatList.flatMap(c => c.participants || []);
            const validParticipants = allParticipants.filter(p => p && p.id);
            if (validParticipants.length > 0) {
                cacheUsers(validParticipants);
            }
        } catch (error) {
            console.error("[Sidebar] Failed to load chats", error);
        }
    };

    useEffect(() => {
        if (currentUser) fetchChats();
    }, [currentUser, cacheUsers]);


    // 2. Local Filter Logic
    const filteredChats = chats.filter(chat => {
        const partner = getChatPartner(chat, currentUser);
        const name = partner.username || '';
        return name.toLowerCase().includes(filterQuery.toLowerCase());
    });

    // 3. Handle new chat
    const handleChatCreated = (newChat) => {
        fetchChats();
        onChatSelect(newChat);
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-700 text-xl">Chats</h2>

                    <div className="flex items-center gap-1">
                        {/* New Chat Button (+) */}
                        <button
                            onClick={() => setIsNewChatOpen(true)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-all"
                            title="New Chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>

                        {/* Settings Button (Gear) */}
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            title="Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Logout Button (Restored) */}
                        <button
                            onClick={logout}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Local Filter Input */}
                <input
                    type="text"
                    placeholder="Filter chats..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-50 focus:bg-white"
                />
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        {filterQuery ? 'No chats found' : 'No chats yet'}
                    </div>
                ) : (
                    filteredChats.map(chat => {
                        const partner = getChatPartner(chat, currentUser);
                        const displayId = partner.id || DELETED_USER.id;

                        return (
                            <SidebarItem
                                key={chat.id}
                                userId={displayId}
                                subText={'Click to view messages'}
                                onClick={() => onChatSelect(chat)}
                            />
                        );
                    })
                )}
            </div>

            {/* Modals */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <NewChatModal
                isOpen={isNewChatOpen}
                onClose={() => setIsNewChatOpen(false)}
                onChatCreated={handleChatCreated}
            />
        </div>
    );
};

Sidebar.propTypes = {
    onChatSelect: PropTypes.func.isRequired,
    onUserSelect: PropTypes.func.isRequired,
};

export default Sidebar;