import PropTypes from 'prop-types';
import { useUsers } from '../../context/UsersContext';

const SidebarItem = ({ userId, subText, onClick, isActive }) => {
    const { getUser } = useUsers();

    // Attempt to get user from Context (Memory Cache)
    const user = getUser(userId);

    const username = user?.username || 'Loading...';
    const email = user?.email || '';
    const initial = username[0]?.toUpperCase() || '?';

    // If we truly have no ID (e.g. 0), show Unknown
    const displayName = userId ? username : 'Unknown User';

    return (
        <div
            onClick={() => onClick(user)}
            className={`
                p-3 border-b border-gray-100 cursor-pointer flex items-center gap-3 transition-colors
                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
            `}
        >
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0
                ${isActive ? 'bg-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}
            `}>
                {initial}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <p className={`font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {displayName}
                    </p>
                </div>
                <p className="text-xs text-gray-500 truncate">
                    {subText || email}
                </p>
            </div>
        </div>
    );
};

SidebarItem.propTypes = {
    userId: PropTypes.number.isRequired,
    subText: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    isActive: PropTypes.bool,
};

export default SidebarItem;