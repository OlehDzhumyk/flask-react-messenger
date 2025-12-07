import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/auth.js';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';

const SettingsModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [message, setMessage] = useState({ type: '', text: '' });

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
            try {
                setMessage({ type: '', text: '' });
                await authService.updateProfile(values);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Note: ideally update UserContext/AuthContext with new data here
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        },
    });

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you ABSOLUTELY sure? This action cannot be undone. All your messages will be lost.')) {
            try {
                await authService.deleteAccount();
                logout(); // Log out and redirect
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to delete account.' });
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            {/* Feedback Message */}
            {message.text && (
                <div className={`p-3 rounded mb-4 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Edit Profile Form */}
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

            {/* Danger Zone */}
            <div>
                <h4 className="text-red-600 font-bold text-sm uppercase mb-2">Danger Zone</h4>
                <p className="text-gray-500 text-xs mb-3">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="w-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                >
                    Delete Account
                </button>
            </div>
        </Modal>
    );
};

SettingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default SettingsModal;