import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // LOGGING: Check initialization start
            console.log('[AuthContext] Initializing. Token exists:', !!token);

            if (token) {
                try {
                    const { data } = await api.get('/profile');
                    // LOGGING: Profile loaded successfully
                    console.log('[AuthContext] User loaded:', data);
                    setUser(data);
                } catch (error) {
                    console.error('[AuthContext] Session expired or invalid:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } else {
                console.log('[AuthContext] No token found.');
            }
            setLoading(false);
        };

        initAuth();
    }, [token]);

    const login = (userData, accessToken) => {
        console.log('[AuthContext] Login called for:', userData.username);
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        setUser(userData);
    };

    const logout = () => {
        console.log('[AuthContext] Logout called');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    // LOGGING: Check if hook is used outside provider
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};