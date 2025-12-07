import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState(null);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().required('Required'),
        }),
        onSubmit: async (values) => {
            setError(null);
            try {
                const data = await authService.login(values.email, values.password);
                // data structure depends on your backend response for /auth/login
                // assuming it returns { access_token: "...", user: {...} }
                login(data.user, data.access_token);
                navigate('/'); // Redirect to dashboard
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to login');
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Welcome Back
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...formik.getFieldProps('email')}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                formik.touched.email && formik.errors.email
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                            }`}
                        />
                        {formik.touched.email && formik.errors.email ? (
                            <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            {...formik.getFieldProps('password')}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                formik.touched.password && formik.errors.password
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                            }`}
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div className="text-red-500 text-sm mt-1">
                                {formik.errors.password}
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={formik.isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                    >
                        {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-500">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;