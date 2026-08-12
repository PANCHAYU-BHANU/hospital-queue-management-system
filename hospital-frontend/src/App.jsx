import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import PatientDashboard from './dashboards/PatientDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import DoctorProfile from './dashboards/DoctorProfile';
import CounterDashboard from './dashboards/CounterDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import PublicDashboard from './dashboards/PublicDashboard';
import PatientProfile from './dashboards/PatientProfile';
import PatientQueueStatus from './dashboards/PatientQueueStatus';
import PatientMedicalRecords from './dashboards/PatientMedicalRecords';
import DoctorPatientHistory from './dashboards/DoctorPatientHistory';
import ManagePharmacists from './dashboards/ManagePharmacists';
import PharmacistDashboard from './dashboards/PharmacistDashboard';
import CommunicationDashboard from './dashboards/CommunicationDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isRegisterPage, setIsRegisterPage] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // 🔄 Check for existing session on page load
  useEffect(() => {
    const sessionStr = localStorage.getItem('hms_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const now = Date.now();
        const diffMinutes = (now - session.loginTimestamp) / 1000 / 60;
        
        if (diffMinutes < 5) {
          // Session is valid. Update timestamp to extend session for another 5 minutes
          session.loginTimestamp = Date.now();
          localStorage.setItem('hms_session', JSON.stringify(session));
          setUser(session);
          
          const savedTab = localStorage.getItem('hms_activeTab');
          if (savedTab) setActiveTab(savedTab);
        } else {
          // Expired
          localStorage.removeItem('hms_session');
          localStorage.removeItem('hms_activeTab');
          // No toast here as it might show up repeatedly on load
        }
      } catch (e) {
        localStorage.removeItem('hms_session');
      }
    }
  }, []);

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
    defaultTab = 'Hospital Management';
  } else if (backendMessage.includes('ROLE_ADMIN')) {
    assignedRole = 'ADMIN';
    defaultTab = 'Manage Doctors';
  } else if (backendMessage.includes('ROLE_DOCTOR')) {
    assignedRole = 'DOCTOR'; //
    defaultTab = 'Live Queue';
  } else if (backendMessage.includes('ROLE_COUNTER')) {
    assignedRole = 'COUNTER';
    defaultTab = 'Pending Approvals';
  } else if (backendMessage.includes('ROLE_PHARMACIST')) {
    assignedRole = 'PHARMACIST';
    defaultTab = 'Pharmacy Queue';
  } else if (backendMessage.includes('ROLE_COMMUNICATION')) {
    assignedRole = 'COMMUNICATION';
    defaultTab = 'Communication Center';
  } else if (backendMessage.includes('ROLE_PATIENT')) {
    assignedRole = 'PATIENT';
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
      fullName = assignedRole === 'SUPER_ADMIN' ? 'Super Admin' : assignedRole === 'DOCTOR' ? 'Doctor' : assignedRole === 'COUNTER' ? 'Counter Staff' : assignedRole === 'ADMIN' ? 'Admin' : assignedRole === 'PHARMACIST' ? 'Pharmacist' : 'Patient';
    }

    // Extract DoctorId
    let doctorId = null;
    const docIdMatch = backendMessage.match(/DoctorId: (\d+)/);
    if (docIdMatch) {
      doctorId = parseInt(docIdMatch[1]);
    }

    // Extract RoomName
    let roomName = null;
    const roomMatch = backendMessage.match(/RoomName: ([^,]+)/);
    if (roomMatch) {
      roomName = roomMatch[1].trim();
    }

    // Extract IsAvailable
    let isAvailable = true;
    const availMatch = backendMessage.match(/IsAvailable: (true|false)/);
    if (availMatch) {
      isAvailable = availMatch[1] === 'true';
    }

    // Extract NIC
    let nicNumber = null;
    const nicMatch = backendMessage.match(/NIC: ([^,]+)/);
    if (nicMatch) {
      nicNumber = nicMatch[1].trim();
    }

    const loggedUser = {
      id: userId,
      role: assignedRole,
      hospitalId: hospitalId,
      fullName: fullName,
      doctorId: doctorId,
      roomName: roomName,
      isAvailable: isAvailable,
      nicNumber: nicNumber,
      loginTimestamp: Date.now()
    };
    
    setUser(loggedUser);
    localStorage.setItem('hms_session', JSON.stringify(loggedUser));
    localStorage.setItem('hms_activeTab', defaultTab);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('');
    localStorage.removeItem('hms_session');
    localStorage.removeItem('hms_activeTab');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('hms_activeTab', tab);
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
        setActiveTab={handleTabChange}
      />
      
      {/* 🏢 Main Content Area */}
      <div className="flex-1 p-6 mt-16 md:p-8 md:mt-0">
        {['Get Token', 'Live Queue', 'Pending Approvals', 'Dashboard', 'Manage Doctors', 'Manage Counters', 'Manage Communication Centers', 'Manage OPD Rooms', 'Doctor Transfers', 'Doctor Deletions', 'Pharmacy Queue', 'Medicine Inventory', 'Hospital Management', 'Admin Management', 'Assign Doctors', 'My Profile', 'All Tokens', 'Hospital Stats', 'Communication Center', 'Manage Pharmacists'].includes(activeTab) || !activeTab ? (
          user.role === 'PATIENT' ? (
            activeTab === 'My Profile' ? (
              <PatientProfile user={user} />
            ) : (
              <PatientDashboard user={user} />
            )
          ) : user.role === 'DOCTOR' ? (
            activeTab === 'My Profile' ? (
              <DoctorProfile user={user} />
            ) : (
              <DoctorDashboard user={user} />
            )
          ) : user.role === 'SUPER_ADMIN' ? (
            <SuperAdminDashboard user={user} activeTab={activeTab} />
          ) : user.role === 'ADMIN' ? (
            activeTab === 'Manage Pharmacists' ? (
              <ManagePharmacists hospitalId={user.hospitalId || 1} />
            ) : (
              <AdminDashboard user={user} activeTab={activeTab} />
            )
          ) : user.role === 'COUNTER' ? (
            <CounterDashboard user={user} />
          ) : user.role === 'PHARMACIST' ? (
            <PharmacistDashboard user={user} activeTab={activeTab} />
          ) : user.role === 'COMMUNICATION' ? (
            <CommunicationDashboard user={user} />
          ) : (
            <div className="py-12 font-medium text-center text-slate-500">Invalid User Role!</div>
          )
        ) : activeTab === 'My Queue Status' && user.role === 'PATIENT' ? (
          <PatientQueueStatus user={user} />
        ) : activeTab === 'Medical Records' && user.role === 'PATIENT' ? (
          <PatientMedicalRecords user={user} />
        ) : activeTab === 'Patient History' && user.role === 'DOCTOR' ? (
          <DoctorPatientHistory user={user} />
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