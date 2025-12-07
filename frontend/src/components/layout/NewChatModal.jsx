import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import userService from '../../services/userService';
import chatService from '../../services/chatService';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setFoundUser(null);

        try {
            // This calls the backend strict search (Exact Email)
            const results = await userService.searchUsers(email);
            if (Array.isArray(results) && results.length > 0) {
                setFoundUser(results[0]);
            } else {
                toast.error('User not found. Check the email.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Search failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async () => {
        if (!foundUser) return;

        try {
            const newChat = await chatService.createChat(foundUser.id);
            onChatCreated(newChat); // Callback to update Sidebar
            onClose();
            toast.success(`Chat started with ${foundUser.username}`);
            // Reset state
            setEmail('');
            setFoundUser(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to start chat.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Chat">
            <div className="space-y-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="email"
                        placeholder="Enter exact email address..."
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setFoundUser(null); // Reset result on typing
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {loading ? '...' : 'Find'}
                    </button>
                </form>

                {/* Result Area */}
                {foundUser && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                        <p className="text-sm text-gray-500 mb-2">User found:</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {foundUser.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{foundUser.username}</p>
                                    <p className="text-xs text-gray-500">{foundUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartChat}
                                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 shadow-sm"
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

NewChatModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onChatCreated: PropTypes.func.isRequired,
};

export default NewChatModal;