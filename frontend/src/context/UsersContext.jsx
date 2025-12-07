import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const UsersContext = createContext(null);

export const UsersProvider = ({ children }) => {
    const [usersCache, setUsersCache] = useState({});

    const cacheUsers = useCallback((usersArray) => {
        if (!Array.isArray(usersArray)) {
            console.warn('[UsersContext] cacheUsers called with non-array:', usersArray);
            return;
        }

        setUsersCache(prev => {
            const newCache = { ...prev };
            let changed = false;
            let addedCount = 0;

            usersArray.forEach(user => {
                if (user && user.id && !newCache[user.id]) {
                    newCache[user.id] = user;
                    changed = true;
                    addedCount++;
                }
            });

            if (changed) {
                console.log(`[UsersContext] Cached ${addedCount} new users. Total: ${Object.keys(newCache).length}`);
            }
            return changed ? newCache : prev;
        });
    }, []);

    const getUser = useCallback((id) => {
        const user = usersCache[id];
        // LOGGING: Optional - uncomment if you suspect cache misses
        // if (!user) console.warn(`[UsersContext] Cache MISS for ID: ${id}`);
        return user || { username: 'Unknown', email: '' };
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