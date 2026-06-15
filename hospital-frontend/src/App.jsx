import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import PatientDashboard from './dashboards/PatientDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import CounterDashboard from './dashboards/CounterDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import PublicDashboard from './dashboards/PublicDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isRegisterPage, setIsRegisterPage] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // 🛠️ Backend එකෙන් එන මැසේජ් එක නිවැරදිව ෆිල්ටර් කරමු
  const handleLoginSuccess = (backendMessage) => {
    
    // 🛑 Backend එකෙන් "Error" හෝ "Invalid" කියලා ආවොත් ලොගින් එක Fail කරනවා
    if (backendMessage.includes('Error') || backendMessage.includes('Invalid')) {
      // 🔮 alert එක අයින් කරලා මේ වැරදි මැසේජ් එක Login component එකට throw කරනවා
      throw backendMessage; 
    }

    let assignedRole = 'PATIENT'; // Default
    let defaultTab = 'Get Token';
    let hospitalId = null;

  if (backendMessage.includes('ROLE_SUPER_ADMIN')) {
    assignedRole = 'SUPER_ADMIN';
    defaultTab = 'Dashboard';
  } else if (backendMessage.includes('ROLE_ADMIN')) {
    assignedRole = 'ADMIN';
    defaultTab = 'Manage Doctors';
  } else if (backendMessage.includes('ROLE_DOCTOR')) {
    assignedRole = 'DOCTOR'; //
    defaultTab = 'Live Queue';
  } else if (backendMessage.includes('ROLE_COUNTER')) {
    assignedRole = 'COUNTER'; //
    defaultTab = 'Pending Approvals';
  } else if (backendMessage.includes('ROLE_PATIENT')) {
    assignedRole = 'PATIENT'; //
    defaultTab = 'Get Token';
  }
  setActiveTab(defaultTab);

    // Extract HospitalId if present
    const hospitalMatch = backendMessage.match(/HospitalId: (\d+)/);
    if (hospitalMatch) {
      hospitalId = parseInt(hospitalMatch[1]);
    }

    // Extract UserId
    let userId = null;
    const userMatch = backendMessage.match(/UserId: (\d+)/);
    if (userMatch) {
      userId = parseInt(userMatch[1]);
    }

    // Extract FullName
    let fullName = null;
    const nameMatch = backendMessage.match(/FullName: ([^,]+)/);
    if (nameMatch) {
      fullName = nameMatch[1].trim();
    }

    if (!fullName) {
      fullName = assignedRole === 'SUPER_ADMIN' ? 'Super Admin' : assignedRole === 'DOCTOR' ? 'Doctor' : assignedRole === 'COUNTER' ? 'Counter Staff' : assignedRole === 'ADMIN' ? 'Admin' : 'Patient';
    }

    setUser({
      id: userId,
      role: assignedRole,
      hospitalId: hospitalId,
      fullName: fullName
    });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('');
  };

  // 🔐 යූසර් ලොග් වෙලා නැත්නම් (Authentication Guards)
  if (!user) {
    if (isRegisterPage) {
      return <Register onSwitchToLogin={() => setIsRegisterPage(false)} />;
    }
    
    if (isPublicPage) {
      return <PublicDashboard onBackToLogin={() => setIsPublicPage(false)} />;
    }
    
    // ලොගින් පේජ් එකට අපේ Register එකට මාරු වෙන ලින්ක් එක පාස් කරනවා
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onSwitchToRegister={() => setIsRegisterPage(true)} 
        onSwitchToPublic={() => setIsPublicPage(true)}
      />
    );
  }

 return (
    <div className="flex flex-col min-h-screen bg-slate-50 md:flex-row">
      <Toaster position="top-right" />
      <Sidebar 
        role={user.role} 
        fullName={user.fullName} 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      {/* 🏢 Main Content Area */}
      <div className="flex-1 p-6 mt-16 md:p-8 md:mt-0">
        {['Get Token', 'Live Queue', 'Pending Approvals', 'Dashboard', 'Manage Doctors', 'Manage Counters'].includes(activeTab) || !activeTab ? (
          user.role === 'PATIENT' ? (
            <PatientDashboard user={user} />
          ) : user.role === 'DOCTOR' ? (
            <DoctorDashboard user={user} />
          ) : user.role === 'SUPER_ADMIN' ? (
            <SuperAdminDashboard user={user} />
          ) : user.role === 'ADMIN' ? (
            <AdminDashboard user={user} activeTab={activeTab} />
          ) : user.role === 'COUNTER' ? (
            <CounterDashboard user={user} />
          ) : (
            <div className="py-12 font-medium text-center text-slate-500">Invalid User Role!</div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <span className="text-6xl mb-4">🚧</span>
            <h2 className="text-2xl font-bold text-slate-700">Under Construction</h2>
            <p className="text-slate-500 mt-2">The <strong className="text-teal-600">{activeTab}</strong> page is currently being developed.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;