import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check if token exists on mount and restore session
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    // Verify token and get user data
                    const { data } = await api.get('/profile');
                    setUser(data);
                } catch (error) {
                    console.error("Session expired", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [token]);

    const login = (userData, accessToken) => {
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        setUser(userData);
    };

    const logout = () => {
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

// Custom hook for easy access
export const useAuth = () => {
    return useContext(AuthContext);
};