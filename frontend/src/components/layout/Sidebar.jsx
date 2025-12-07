import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UsersContext';
import { getChatPartner } from '../../utils/chatHelpers';
import SidebarItem from './SidebarItem';
import SettingsModal from './SettingsModal';
import { DELETED_USER } from '../../utils/constants';

const Sidebar = ({ onChatSelect, onUserSelect }) => {
    const [chats, setChats] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // State for Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { user: currentUser, logout } = useAuth();
    const { cacheUsers } = useUsers();

    // 1. Fetch active chats & Cache Users on mount
    useEffect(() => {
        let isMounted = true;

        const fetchChats = async () => {
            try {
                const data = await chatService.getAllChats();

                if (isMounted) {
                    const chatList = Array.isArray(data) ? data : [];
                    setChats(chatList);

                    // Extract all participants from all chats
                    const allParticipants = chatList.flatMap(c => c.participants || []);

                    if (allParticipants.length > 0) {
                        // Filter out null/undefined IDs before caching to avoid errors
                        const validParticipants = allParticipants.filter(p => p && p.id);
                        if (validParticipants.length > 0) {
                            console.log('[Sidebar] Caching users:', validParticipants.length);
                            cacheUsers(validParticipants);
                        }
                    }
                }
            } catch (error) {
                console.error("[Sidebar] Failed to load chats", error);
            }
        };

        if (currentUser) {
            fetchChats();
        }

        return () => { isMounted = false; };
    }, [currentUser, cacheUsers]);

    // 2. Search Logic (Debounced)
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

                // Cache search results so SidebarItem can find them by ID
                if (results.length > 0) {
                    cacheUsers(results);
                }
            } catch (error) {
                console.error("[Sidebar] Search failed", error);
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
                    <h2 className="font-bold text-gray-700 text-xl">Chats</h2>

                    <div className="flex items-center gap-1">
                        {/* Settings Button */}
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                            title="Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                    <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 uppercase">
                            Global Search
                        </div>
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
                        {chats.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No chats yet. <br/> Search to start a conversation.
                            </div>
                        )}
                        {chats.map(chat => {
                            const partner = getChatPartner(chat, currentUser);
                            // Fallback to DELETED_USER ID (-1) if partner ID is missing (null/undefined)
                            const displayId = partner.id || DELETED_USER.id;

                            return (
                                <SidebarItem
                                    key={chat.id}
                                    userId={displayId}
                                    subText={'Click to view messages'}
                                    onClick={() => onChatSelect(chat)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};

Sidebar.propTypes = {
    onChatSelect: PropTypes.func.isRequired,
    onUserSelect: PropTypes.func.isRequired,
};

export default Sidebar;