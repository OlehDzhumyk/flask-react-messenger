import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Temporary Dashboard Component
const Dashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold">Hello, {user?.username}!</h1>
            <button
                onClick={logout}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
                Logout
            </button>
        </div>
    );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<div>Register Page TODO</div>} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;