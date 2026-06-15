import React, { useState } from 'react';
import { loginUser } from '../services/api'; // ◄ අපි හදපු API සර්විස් එක ගත්තා

function Login({ onLoginSuccess, onSwitchToRegister, onSwitchToPublic }) {
    const [nicNumber, setNicNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // එරර් මැසේජ් පෙන්වන්න
    const [loading, setLoading] = useState(false); // බටන් එක ලෝඩ් වෙනවා පෙන්වන්න

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = await loginUser(nicNumber, password);
            console.log("Backend එකෙන් ආපු මුළු සේරම ඩේටා ටික මෙන්න:", userData);

            // 👑 App.jsx එකේ function එක රන් කරනවා. 
            // එකේදී එරර් එකක් throw වුණොත් කෙලින්ම පල්ලෙහා catch එකට පනිනවා!
            onLoginSuccess(userData);

        } catch (err) {
            // 🎯 දැන් බ්‍රවුසර් ඇලර්ට් වෙනුවට UI එකේම ලස්සනට එරර් එක වදිනවා!
            setError(typeof err === 'string' ? err : 'Invalid NIC or Password!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white border shadow-xl rounded-2xl border-slate-100">

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex p-3 mb-3 text-teal-600 rounded-full bg-teal-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
                    <p className="mt-1 font-medium text-slate-500">Hospital Queue Management System</p>
                </div>

                {/* ⚠️ Error Alert (එරර් එකක් ආවොත් විතරක් රතු පාටින් පේනවා) */}
                {error && (
                    <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold rounded-xl flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIC Number</label>
                        <input
                            type="text"
                            placeholder="e.g., 199912345678"
                            value={nicNumber}
                            onChange={(e) => setNicNumber(e.target.value)}
                            className="w-full px-4 py-3 transition border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 transition border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition duration-200 transform active:scale-[0.98]"
                    >
                        {loading ? 'Verifying...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        New Patient?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToRegister} // ◄ මේක දැම්මාම රෙජිස්ටර් පේජ් එකට පනිනවා මචන්!
                            className="font-bold text-teal-600 underline transition hover:text-teal-700"
                        >
                            Register Here
                        </button>
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onSwitchToPublic}
                            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-bold text-teal-700 transition bg-teal-50 border border-teal-100 rounded-xl hover:bg-teal-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            View Live Queue Status
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;