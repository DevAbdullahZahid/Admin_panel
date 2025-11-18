// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { EmailIcon, LockIcon } from '../components/icons';

type FormInputs = {
    email: string;
    password: string;
};

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => { 
    const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>();
    const { login } = useAuth();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- (MODIFICATION) Print JWT Token from localStorage ---
    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        setIsLoading(true);
        setLoginError(null);
        
        try {
            const response = await login(data.email, data.password);
            
            console.log('Login Response:', response);
            
            // Print token from localStorage (common storage locations)
            const token = localStorage.getItem('token') || 
                         localStorage.getItem('authToken') || 
                         localStorage.getItem('jwt') ||
                         localStorage.getItem('access_token');
            
            console.log('JWT Token from localStorage:', token);
            
            // Also check sessionStorage
            const sessionToken = sessionStorage.getItem('token') || 
                                sessionStorage.getItem('authToken');
            console.log('JWT Token from sessionStorage:', sessionToken);
            
           
            
        } catch (error: any) {
            setLoginError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    // --- END OF MODIFICATION ---

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 to-secondary items-center justify-center p-12">
                <div className="text-white text-center">
                    <h1 className="text-5xl font-bold mb-4">IELTS Admin Portal</h1>
                    <p className="text-lg text-primary-100">Your all-in-one solution for managing IELTS content with ease and precision.</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
                        <p className="text-gray-500 mt-2">Please sign in to continue.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {loginError && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{loginError}</p>}
                        
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                   <EmailIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    {...register('email', { 
                                        required: 'Email is required', 
                                        pattern: { 
                                            value: /^\S+@\S+$/i, 
                                            message: 'Invalid email address' 
                                        } 
                                    })}
                                    className="w-full bg-white pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                   <LockIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    {...register('password', { required: 'Password is required' })}
                                    className="w-full bg-white pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="••••••••"
                                 />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 transition-colors duration-300"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                    
                </div>
            </div>
        </div>
    );
};

export default LoginPage;