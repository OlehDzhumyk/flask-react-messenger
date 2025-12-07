import PropTypes from 'prop-types';
import { useUsers } from '../../context/UsersContext';

const ChatHeader = ({ userId }) => {
    const { getUser } = useUsers();

    // Component fetches data itself based on ID
    const user = getUser(userId);

    // Fallback for loading or missing data
    const username = user?.username || 'Loading...';
    const initial = username[0]?.toUpperCase() || '?';

    return (
        <header className="bg-white border-b px-6 py-3 shadow-sm flex items-center gap-3 shrink-0 h-16 z-10">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                {initial}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
                <h3 className="font-bold text-gray-800 leading-tight">
                    {username}
                </h3>
                {/* Mock status for now */}
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-gray-500 font-medium">Online</span>
                </div>
            </div>
        </header>
    );
};

ChatHeader.propTypes = {
    userId: PropTypes.number.isRequired,
};

export default ChatHeader;