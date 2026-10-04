import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loginUser } from '../services/api'; // ◄ අපි හදපු API සර්විස් එක ගත්තා
import LanguageSwitcher from '../components/LanguageSwitcher';

function Login({ onLoginSuccess, onSwitchToRegister, onSwitchToPublic }) {
    const { t } = useTranslation();
    const [nicNumber, setNicNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(''); // එරර් මැසේජ් පෙන්වන්න
    const [loading, setLoading] = useState(false); // බටන් එක ලෝඩ් වෙනවා පෙන්වන්න

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = await loginUser(nicNumber, password);
            console.log("Backend එකෙන් ආපු මුළු සේරම ඩේටා ටික මෙන්න:", userData);

            // 📍 Patient කෙනෙක් නම් අනිවාර්යයෙන්ම GPS ලොකේෂන් එක දෙන්න ඕනේ!
            if (userData.role === 'PATIENT') {
                if (!navigator.geolocation) {
                    throw "ඔයාගේ බ්‍රවුසරෙන් GPS වැඩ කරන්නේ නෑ!";
                }

                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            console.log("GPS Location ගත්තා:", position.coords);
                            // ඕන නම් userData එකට මේ ලොකේෂන් එක දාන්න පුළුවන්
                            resolve();
                        },
                        (error) => {
                            reject("Patient කෙනෙක් විදිහට Log වෙන්න අනිවාර්යයෙන්ම GPS Location (Location Access) දෙන්න ඕනේ!");
                        }
                    );
                });
            }

            // 👑 App.jsx එකේ function එක රන් කරනවා. 
            // එකේදී එරර් එකක් throw වුණොත් කෙලින්ම පල්ලෙහා catch එකට පනිනවා!
            onLoginSuccess(userData);

        } catch (err) {
            // 🎯 දැන් බ්‍රවුසර් ඇලර්ට් වෙනුවට UI එකේම ලස්සනට එරර් එක වදිනවා!
            if (typeof err === 'string') {
                setError(err);
            } else if (err && err.status === 401) {
                setError(t('login.invalid_nic_pass'));
            } else {
                setError(err?.error || err?.message || 'Server Error: Database connection failed or server is down.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="relative w-full max-w-md p-8 bg-white border shadow-xl rounded-2xl border-slate-100">
                <LanguageSwitcher className="absolute top-6 right-6" />

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex p-3 mb-3 text-teal-600 rounded-full bg-teal-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">{t('login.welcome_back')}</h2>
                    <p className="mt-1 font-medium text-slate-500">{t('login.hospital_system')}</p>
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
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('login.nic_number')}</label>
                        <input
                            type="text"
                            placeholder={t('login.nic_placeholder')}
                            value={nicNumber}
                            onChange={(e) => setNicNumber(e.target.value)}
                            className="w-full px-4 py-3 transition border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('login.password')}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('login.password_placeholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 transition border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-teal-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition duration-200 transform active:scale-[0.98]"
                    >
                        {loading ? t('login.verifying') : t('login.sign_in')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        {t('login.new_patient')}{' '}
                        <button
                            type="button"
                            onClick={onSwitchToRegister} // ◄ මේක දැම්මාම රෙජිස්ටර් පේජ් එකට පනිනවා!
                            className="font-bold text-teal-600 underline transition hover:text-teal-700"
                        >
                            {t('login.register_here')}
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
                            {t('login.view_live_queue')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;
