import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UsersContext';
import { getChatPartner } from '../../utils/chatHelpers';
import SidebarItem from './SidebarItem';

const Sidebar = ({ onChatSelect, onUserSelect }) => {
    const [chats, setChats] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const { user: currentUser, logout } = useAuth();
    const { cacheUsers } = useUsers();

    // 1. Fetch active chats & Cache Users on mount
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const data = await chatService.getAllChats();

                console.log('[Sidebar] GET /chats response:', data);
                if (data.length > 0) {
                    console.log('[Sidebar] First chat participants:', data[0].participants);
                }

                const chatList = Array.isArray(data) ? data : [];
                setChats(chatList);

                // Витягуємо всіх учасників і кладемо в кеш контексту
                const allParticipants = chatList.flatMap(c => c.participants || []);
                if (allParticipants.length > 0) cacheUsers(allParticipants);
            } catch (error) {
                console.error("Failed to load chats", error);
            }
        };
        fetchChats();
    }, [cacheUsers]);

    // 2. Search Logic
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const data = await userService.searchUsers(searchQuery);
                const results = Array.isArray(data) ? data : [];
                setSearchResults(results);
                // Кешуємо результати пошуку
                cacheUsers(results);
            } catch (error) {
                console.error("Search failed", error);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, cacheUsers]);

    const handleUserClick = (targetUser) => {
        setSearchQuery('');
        setIsSearching(false);
        onUserSelect(targetUser);
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Chats</h2>
                    <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 font-medium">Logout</button>
                </div>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                    <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 uppercase">Global Search</div>
                        {searchResults.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">No users found</div>
                        ) : (
                            searchResults.map(user => (
                                <SidebarItem
                                    key={user.id}
                                    userId={user.id}
                                    subText={user.email}
                                    onClick={() => handleUserClick(user)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div>
                        {chats.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No chats yet</div>}
                        {chats.map(chat => {
                            const partner = getChatPartner(chat, currentUser);
                            return (
                                <SidebarItem
                                    key={chat.id}
                                    userId={partner.id}
                                    subText={chat.last_message || 'History available'}
                                    onClick={() => onChatSelect(chat)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

Sidebar.propTypes = {
    onChatSelect: PropTypes.func.isRequired,
    onUserSelect: PropTypes.func.isRequired,
};

export default Sidebar;