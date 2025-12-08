import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const UsersContext = createContext(null);

export const UsersProvider = ({ children }) => {
    const [usersCache, setUsersCache] = useState({});

    const cacheUsers = useCallback((usersArray) => {
        if (!Array.isArray(usersArray)) return;

        setUsersCache(prev => {
            const newCache = { ...prev };
            let changed = false;

            usersArray.forEach(user => {
                if (user && user.id) {
                    if (!prev[user.id] || prev[user.id].username !== user.username) {
                        newCache[user.id] = user;
                        changed = true;
                    }
                }
            });

            return changed ? newCache : prev;
        });
    }, []);

    const getUser = useCallback((id) => {
        return usersCache[id] || null;
    }, [usersCache]);

    return (
        <UsersContext.Provider value={{ usersCache, cacheUsers, getUser }}>
            {children}
        </UsersContext.Provider>
    );
};

UsersProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useUsers = () => useContext(UsersContext);