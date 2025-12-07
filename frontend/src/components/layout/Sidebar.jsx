import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ onSelectChat }) => {
    const [chats, setChats] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser, logout } = useAuth();

    // Load active chats on mount
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const data = await chatService.getAllChats();
                setChats(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load chats", error);
            }
        };
        fetchChats();
    }, []);

    // Handle global user search
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await userService.searchUsers(searchQuery);
                setSearchResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleUserClick = async (user) => {
        // When clicking a user from search, we need to create/get the chat session
        // Pass the user ID to the parent handler to init the chat
        onSelectChat(user.id, 'user');
        setSearchQuery(''); // Clear search to show chat list again
    };

    const handleChatClick = (chat) => {
        onSelectChat(chat.id, 'chat');
    };

    // Helper to find the "other" participant name in a chat
    const getChatName = (chat) => {
        if (!chat.participants) return 'Unknown Chat';
        const partner = chat.participants.find(p => p.id !== currentUser.id);
        return partner ? partner.username : 'Me';
    };

    const isSearching = searchQuery.trim().length > 0;

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80">
            <div className="p-4 bg-gray-50 border-b space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Messages</h2>
                    <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Logout
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                    // Search Results View
                    <>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Global Search
                        </div>
                        {loading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">No users found</div>
                        ) : (
                            searchResults.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => handleUserClick(user)}
                                    className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.username}</p>
                                        <p className="text-xs text-gray-500">Click to start chat</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                ) : (
                    // Chat List View
                    chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <p>No active chats.</p>
                            <p className="text-sm mt-2">Use search to find friends.</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatClick(chat)}
                                className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                                    {getChatName(chat)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-medium text-gray-900 truncate">{getChatName(chat)}</p>
                                        {/* Placeholder for timestamp if available */}
                                        <span className="text-xs text-gray-400">12:30</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {chat.last_message || 'No messages yet'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

Sidebar.propTypes = {
    onSelectChat: PropTypes.func.isRequired,
};

export default Sidebar;