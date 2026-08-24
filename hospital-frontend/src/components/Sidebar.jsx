import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

function Sidebar({ role, fullName, onLogout, activeTab, setActiveTab }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false); // Mobile එකේදී Sidebar එක open/close කරන්න

  const getMenuItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Manage Doctors', label: t('sidebar.manage_doctors', 'Manage Doctors'), icon: '👨‍⚕️' },
          { name: 'Manage Counters', label: t('sidebar.manage_counters', 'Manage Counters'), icon: '🧑‍💻' },
          { name: 'Manage Communication Centers', label: t('sidebar.manage_comm_centers', 'Manage Comm Centers'), icon: '📞' },
          { name: 'Manage OPD Rooms', label: t('sidebar.manage_opd', 'Manage OPD Rooms'), icon: '🚪' },
          { name: 'Manage Pharmacists', label: t('sidebar.manage_pharmacists', 'Manage Pharmacists'), icon: '💊' },
          { name: 'Hospital Settings', label: t('sidebar.hospital_settings', 'Hospital Settings'), icon: '⚙️' }
        ];
      case 'DOCTOR':
        return [
          { name: 'Live Queue', label: t('sidebar.live_queue', 'Live Queue'), icon: '👥' },
          { name: 'My Profile', label: t('sidebar.my_profile', 'My Profile'), icon: '👨‍⚕️' }
        ];
      case 'PHARMACIST':
        return [
          { name: 'Pharmacy Queue', label: t('sidebar.pharmacy_queue', 'Pharmacy Queue'), icon: '📋' },
          { name: 'Medicine Inventory', label: t('sidebar.medicine_inventory', 'Medicine Inventory'), icon: '💊' },
          { name: 'My Profile', label: t('sidebar.my_profile', 'My Profile'), icon: '🧑‍💼' }
        ];
      case 'COUNTER':
        return [
          { name: 'Pending Approvals', label: t('sidebar.pending_approvals', 'Pending Approvals'), icon: '⏳' },
          { name: 'All Tokens', label: t('sidebar.all_tokens', 'All Tokens'), icon: '🎟️' },
          { name: 'Hospital Stats', label: t('sidebar.hospital_stats', 'Hospital Stats'), icon: '📊' }
        ];
      case 'SUPER_ADMIN':
        return [
          { name: 'Hospital Management', label: t('sidebar.hospital_management', 'Hospital Management'), icon: '🏥' },
          { name: 'System Analytics', label: t('sidebar.system_analytics', 'System Analytics'), icon: '📈' },
          { name: 'Admin Management', label: t('sidebar.admin_management', 'Admin Management'), icon: '👨‍💼' },
          { name: 'Assign Doctors', label: t('sidebar.assign_doctors', 'Assign Doctors'), icon: '👨‍⚕️' },
          { name: 'Doctor Transfers', label: t('sidebar.doctor_transfers', 'Doctor Transfers'), icon: '🔄' },
          { name: 'Doctor Deletions', label: t('sidebar.doctor_deletions', 'Doctor Deletions'), icon: '🗑️' }
        ];
      case 'COMMUNICATION':
        return [
          { name: 'Communication Center', label: t('sidebar.communication_center', 'Communication Center'), icon: '📞' }
        ];
      case 'PATIENT':
      default:
        return [
          { name: 'Get Token', label: t('sidebar.get_token', 'Get Token'), icon: '🎫' },
          { name: 'My Queue Status', label: t('sidebar.my_queue_status', 'My Queue Status'), icon: '⏱️' },
          { name: 'Medical Records', label: t('sidebar.medical_records', 'Medical Records'), icon: '📁' },
          { name: 'My Profile', label: t('sidebar.my_profile', 'My Profile'), icon: '🧑‍💼' }
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* 📱 Mobile Toggle Button (ෆෝන් වලදී විතරක් පේන ඉරි කෑලි 3 බටන් එක) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-900 text-teal-400 rounded-xl shadow-lg border border-slate-800"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* 🔮 Background Overlay (Mobile එකේදී සයිඩ්බාර් එක ඇරුණාම ඉතිරි හරිය කළු වෙන්න) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 md:hidden bg-slate-950/40 backdrop-blur-sm z-35"
        />
      )}

      {/* 🏢 Main Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-4 shadow-xl transition-transform duration-300 ease-in-out
        md:sticky md:top-0 md:h-screen md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Hospital Branding */}
          <div className="flex items-center gap-3 px-2 py-4 mt-12 mb-6 border-b border-slate-800 md:mt-0">
            <span className="text-2xl">🏥</span>
            <div>
              <h2 className="text-lg font-bold leading-tight text-teal-400">Suwasetha</h2>
              <p className="text-xs font-medium text-slate-400">Queue Management</p>
            </div>
          </div>

          {/* User Info Card */}
          <div className="p-4 mb-4 border bg-slate-800/50 rounded-xl border-slate-800 relative">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mt-2">{t('sidebar.logged_in_as', 'Logged in as')}</p>
            <p className="font-bold text-slate-200 mt-0.5 truncate">{fullName || 'User Name'}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-md border border-teal-500/20">
              {role}
            </span>
          </div>

          <div className="mb-6">
            <LanguageSwitcher className="w-full bg-slate-800 text-slate-200 border-slate-700" />
          </div>

          {/* Dynamic Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.name);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-150 ${
                  activeTab === item.name 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center w-full gap-3 px-4 py-3 font-semibold text-left transition duration-150 text-rose-400 hover:bg-rose-500/10 rounded-xl"
        >
          <span>🚪</span>
          <span>{t('sidebar.logout', 'Logout')}</span>
        </button>
      </div>
    </>
  );
}

export default Sidebar;