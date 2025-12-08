import PropTypes from 'prop-types';
import { useUsers } from '../../context/UsersContext';
import { DELETED_USER } from '../../utils/constants';

const SidebarItem = ({ userId, subText, onClick, isActive }) => {
    const { getUser } = useUsers();

    const realUser = getUser(userId);

    // Fallback to Deleted User if ID exists but user not found
    const displayUser = realUser || (userId ? DELETED_USER : null);

    if (!displayUser) return null; // Or render a skeleton loader

    const isDeleted = displayUser.isDeleted;
    const initial = displayUser.username?.[0]?.toUpperCase() || '?';
    const bgColor = isDeleted
        ? DELETED_USER.color
        : (isActive ? 'bg-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600');

    return (
        <div
            onClick={() => onClick(displayUser)}
            className={`
                p-3 border-b border-gray-100 cursor-pointer flex items-center gap-3 transition-colors
                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
            `}
        >
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0
                ${bgColor}
            `}>
                {initial}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <p className={`font-medium truncate ${isActive ? 'text-blue-700' : (isDeleted ? 'text-gray-400 italic' : 'text-gray-900')}`}>
                        {displayUser.username}
                    </p>
                </div>
                <p className="text-xs text-gray-500 truncate">
                    {subText || displayUser.email}
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