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
                // Cache user if valid and not already cached (or if updated)
                if (user && user.id) {
                    // Simple check to see if we actually need to update the object ref
                    // In a real app, you might do a deep comparison
                    if (!prev[user.id] || prev[user.id].username !== user.username) {
                        newCache[user.id] = user;
                        changed = true;
                        addedCount++;
                    }
                }
            });

            if (changed) {
                console.log(`[UsersContext] Cached ${addedCount} new/updated users.`);
            }
            return changed ? newCache : prev;
        });
    }, []);

    const getUser = useCallback((id) => {
        // Return null if not found.
        // Do NOT return a dummy object like { username: 'Unknown' },
        // because that breaks the "Deleted Account" detection logic in UI components.
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