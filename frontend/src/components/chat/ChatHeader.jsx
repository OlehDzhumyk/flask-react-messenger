import PropTypes from 'prop-types';
import { useUsers } from '../../context/UsersContext';
import { DELETED_USER } from '../../utils/constants';

const ChatHeader = ({ userId }) => {
    const { getUser } = useUsers();

    // 1. Try to get real user from cache
    const realUser = getUser(userId);

    // 2. Determine who to display
    // Priority: Real User -> Deleted User Constant -> Loading/Null
    let displayUser = realUser;

    // Check if it matches our "Deleted" flag ID (usually -1) or if ID exists but user not found
    if (!realUser && (userId === DELETED_USER.id || userId > 0)) {
        displayUser = DELETED_USER;
    }

    // 3. Loading State
    // If we have no user object yet, show Skeleton
    if (!displayUser) {
        return (
            <header className="bg-white border-b px-6 py-3 shadow-sm flex items-center gap-3 shrink-0 h-16 z-10">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </header>
        );
    }

    // 4. Extract visual data
    const isDeleted = displayUser.isDeleted;
    const username = displayUser.username || 'Unknown';
    const initial = username[0]?.toUpperCase() || '?';

    // Dynamic styles based on state
    const bgColor = isDeleted
        ? DELETED_USER.color
        : 'bg-gradient-to-r from-blue-500 to-indigo-600';

    const textColor = isDeleted ? 'text-gray-400 italic' : 'text-gray-800';

    return (
        <header className="bg-white border-b px-6 py-3 shadow-sm flex items-center gap-3 shrink-0 h-16 z-10 transition-all">
            {/* Avatar */}
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md
                ${bgColor}
            `}>
                {initial}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
                <h3 className={`font-bold leading-tight ${textColor}`}>
                    {username}
                </h3>

                {/* Status Indicator (Only for active users) */}
                {!isDeleted && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-gray-500 font-medium">Online</span>
                    </div>
                )}
            </div>
        </header>
    );
};

ChatHeader.propTypes = {
    userId: PropTypes.number,
};

export default ChatHeader;