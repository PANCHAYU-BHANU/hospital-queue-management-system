import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = "" }) => {
    const { i18n } = useTranslation();

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <div className={`z-50 ${className}`}>
            <select
                onChange={changeLanguage}
                defaultValue={i18n.language}
                className="px-3 py-2 text-sm font-semibold text-slate-700 bg-white border rounded-lg shadow-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
                <option value="en">🇬🇧 English</option>
                <option value="si">🇱🇰 සිංහල</option>
                <option value="ta">🇱🇰 தமிழ்</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
