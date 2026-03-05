'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';

interface LoginFormProps {
    password: string;
    showPassword: boolean;
    loading: boolean;
    error: string;
    isEnabled: boolean;
    onPasswordChange: (value: string) => void;
    onTogglePassword: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
    password,
    showPassword,
    loading,
    error,
    isEnabled,
    onPasswordChange,
    onTogglePassword,
    onSubmit
}: LoginFormProps) {
    return (
        <form className="space-y-6" onSubmit={onSubmit}>
            <div>
                <label htmlFor="password" className="sr-only">
                    Password
                </label>
                <div className="flex gap-2">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={!isEnabled}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        disabled={!isEnabled}
                        className="flex items-center justify-center px-3 border border-gray-300 rounded-md bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-sm text-center" role="alert">
                    {error}
                </div>
            )}

            <div>
                <button
                    type="submit"
                    disabled={!isEnabled || loading}
                    className={`group w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isEnabled
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                    {loading ? (
                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Lock className="h-4 w-4 text-blue-200" />
                    )}
                    <span suppressHydrationWarning>
                        {loading
                            ? 'Signing in...'
                            : !isEnabled
                            ? 'Aktifkan Lokasi untuk Login'
                            : 'Sign in'}
                    </span>
                </button>
            </div>
        </form>
    );
}
