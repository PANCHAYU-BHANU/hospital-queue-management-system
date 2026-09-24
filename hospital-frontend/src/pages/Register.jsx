import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

function Register({ onSwitchToLogin }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nicNumber: '',
    fullName: '',
    phoneNumber: '',
    password: '',
    gender: '',
    age: '',
    role: 'ROLE_PATIENT'
  });
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // ◄ Custom Success එක පෙන්වන්න
  const [phoneError, setPhoneError] = useState('');   // ◄ Phone Validation Error එකට
  const [showPassword, setShowPassword] = useState(false);

  // 📝 NIC Parser Logic
  useEffect(() => {
    const nic = formData.nicNumber.trim();
    if (nic.length === 9 || nic.length === 12) {
      let year = "";
      let days = 0;
      let gender = "MALE";

      if (nic.length === 9 && !isNaN(nic.substring(0, 2))) {
        year = "19" + nic.substring(0, 2);
        days = parseInt(nic.substring(2, 5));
      } 
      else if (nic.length === 12 && !isNaN(nic.substring(0, 4))) {
        year = nic.substring(0, 4);
        days = parseInt(nic.substring(4, 7));
      } else {
        return;
      }

      if (days > 500) {
        gender = "FEMALE";
        days = days - 500;
      }

      if (days > 0 && days <= 366) {
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - parseInt(year);

        setFormData(prev => ({
          ...prev,
          gender: gender,
          age: calculatedAge.toString()
        }));
      }
    }
  }, [formData.nicNumber]);

  // 📞 Phone Number Validation Logic (Live Checking)
  useEffect(() => {
    const phone = formData.phoneNumber.trim();
    if (phone === '') {
      setPhoneError('');
      return;
    }

    // ලංකාවේ Phone Number Regex (ඉලක්කම් 10ක් විය යුතුයි, 0න් පටන් ගත යුතුයි)
    const srilankaPhoneRegex = /^(0)[0-9]{9}$/;

    if (!srilankaPhoneRegex.test(phone)) {
      setPhoneError(t('register.invalid_phone', 'Please enter a valid phone number (eg: 0771234567)'));
    } else {
      setPhoneError('');
    }
  }, [formData.phoneNumber]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phoneError) return; // Phone එකේ වැරැද්දක් තිබ්බොත් සබ්මිට් වෙන්න දෙන්නේ නෑ
    
    setLoading(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const message = await response.text();

      if (message.includes('Error')) {
        Swal.fire('Error', message, 'error');
      } else {
        setIsSuccess(true); // ◄ මෙතනදී Custom Success ස්ක්‍රීන් එක ඔන් කරනවා!
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Swal.fire('Error', t('register.backend_connection_failed', 'Failed to connect to the backend server!'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 font-sans bg-slate-100">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full min-h-[500px] flex flex-col justify-center transition-all duration-300">
        
        {/* 🎉 1. Registration Successful වුණාම පෙනෙන Premium Card එක */}
        {isSuccess ? (
          <div className="py-6 space-y-6 text-center animate-fade-in">
            <div className="inline-flex p-4 text-4xl border rounded-full shadow-sm bg-emerald-50 text-emerald-500 border-emerald-100 animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">{t('register.registration_successful', 'Registration Successful!')}</h2>
              <p className="px-4 text-sm font-medium text-slate-500">
                {t('register.account_created_success', 'Your account has been created successfully. You can now login to the system.')}
              </p>
            </div>
            <button
              onClick={onSwitchToLogin}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.99] text-sm"
            >
              {t('register.go_to_login', 'Go to Login Page 🚀')}
            </button>
          </div>
        ) : (
          
          /* 📝 2. සාමාන්‍යයෙන් ලෝඩ් වෙන Registration Form එක */
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <div className="inline-flex p-3 text-2xl text-teal-600 border border-teal-100 bg-teal-50 rounded-2xl">🏥</div>
              <h2 className="text-3xl font-black tracking-tight text-slate-800">{t('register.create_account', 'Create Account')}</h2>
              <p className="text-sm font-semibold text-slate-400">{t('register.system_name', 'Suwasetha Queue Management System')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-slate-400">{t('register.full_name', 'Full Name')}</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t('register.enter_full_name', 'Enter your full name')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition font-medium text-slate-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-slate-400">{t('register.nic_number', 'NIC Number')}</label>
                  <input
                    type="text"
                    name="nicNumber"
                    required
                    value={formData.nicNumber}
                    onChange={handleChange}
                    placeholder={t('register.nic_placeholder', 'eg: 20010920...')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition font-medium text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-slate-400">{t('register.phone_number', 'Phone Number')}</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder={t('register.phone_placeholder', 'eg: 0771234567')}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 bg-slate-50 transition font-medium text-slate-700 text-sm ${
                      phoneError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* ⚠️ Phone Number Error Text */}
              {phoneError && (
                <p className="text-[11px] text-red-500 font-bold bg-red-50/50 p-2 rounded-lg border border-red-100 animate-pulse">
                  {phoneError}
                </p>
              )}

              {/* 🕶️ Auto-generated Display Fields */}
              {formData.gender && formData.age && (
                <div className="grid grid-cols-2 gap-4 p-3 text-center border border-teal-100 bg-teal-50/50 rounded-xl">
                  <div>
                    <span className="block text-[10px] font-bold text-teal-600 uppercase">{t('register.gender', 'Gender')}</span>
                    <span className="text-sm font-bold text-slate-700">{formData.gender === 'MALE' ? t('counter_dashboard.male', 'Male') : formData.gender === 'FEMALE' ? t('counter_dashboard.female', 'Female') : formData.gender}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-teal-600 uppercase">{t('register.calculated_age', 'Calculated Age')}</span>
                    <span className="text-sm font-bold text-slate-700">{formData.age} {t('register.yrs', 'Yrs')}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1 text-xs font-bold tracking-wider uppercase text-slate-400">{t('register.password', 'Password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition font-medium text-slate-700 text-sm"
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
                disabled={loading || !!phoneError}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition transform active:scale-[0.99] disabled:bg-slate-300 text-sm"
              >
                {loading ? t('register.registering', 'Registering...') : t('register.register_account', 'Register Account 🚀')}
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-sm font-medium text-slate-500">
                {t('register.already_have_account', 'Already have an account? ')}
                <button onClick={onSwitchToLogin} className="font-bold text-teal-600 underline transition hover:text-teal-700">
                  {t('register.login_here', 'Login Here')}
                </button>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Register;
