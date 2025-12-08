import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import authService from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';

const SettingsModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    // State to toggle between Main Settings and Delete Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form for editing profile
    const formik = useFormik({
        initialValues: {
            username: user?.username || '',
            email: user?.email || '',
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            username: Yup.string().min(3, 'Too short').required('Required'),
            email: Yup.string().email('Invalid email').required('Required'),
        }),
        onSubmit: async (values) => {
            await toast.promise(
                authService.updateProfile(values),
                {
                    loading: 'Updating profile...',
                    success: 'Profile updated successfully! 🚀',
                    error: (err) => err.response?.data?.error || 'Failed to update profile 😔',
                }
            );
        },
    });

    const handleDeleteAccount = async () => {
        try {
            await authService.deleteAccount();

            // 1. Show message
            toast.success('Account deleted. Goodbye! 👋', { duration: 3000 });

            // 2. Close modal immediately to avoid confusion
            onClose();

            // 3. Wait a bit before logging out so user sees the message
            setTimeout(() => {
                logout();
            }, 2000);

        } catch (error) {
            console.error(error);
            toast.error('Failed to delete account.');
            setShowDeleteConfirm(false); // Go back on error
        }
    };

    // Reset view when modal closes
    const handleClose = () => {
        setShowDeleteConfirm(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={showDeleteConfirm ? "Confirm Deletion" : "Settings"}>

            {showDeleteConfirm ? (
                // --- DELETE CONFIRMATION VIEW ---
                <div className="animate-fade-in space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                        <p className="font-bold text-lg mb-2">⚠️ Danger Zone</p>
                        <p>
                            Are you absolutely sure you want to delete your account?
                            <strong> All your chats and messages will be permanently lost.</strong>
                        </p>
                        <p className="mt-2">This action cannot be undone.</p>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold shadow-sm transition-colors"
                        >
                            Yes, Delete My Account
                        </button>
                    </div>
                </div>
            ) : (
                // --- MAIN SETTINGS VIEW ---
                <>
                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                {...formik.getFieldProps('username')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            {formik.touched.username && formik.errors.username && (
                                <div className="text-red-500 text-xs mt-1">{formik.errors.username}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                {...formik.getFieldProps('email')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            {formik.touched.email && formik.errors.email && (
                                <div className="text-red-500 text-xs mt-1">{formik.errors.email}</div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={formik.isSubmitting || !formik.dirty}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>

                    <hr className="my-6 border-gray-200" />

                    <div>
                        <h4 className="text-red-600 font-bold text-sm uppercase mb-2">Danger Zone</h4>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)} // Switch to confirm view
                            className="w-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Account
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};

SettingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default SettingsModal;