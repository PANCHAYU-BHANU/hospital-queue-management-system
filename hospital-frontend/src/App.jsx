import React, { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import PatientDashboard from './dashboards/PatientDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import CounterDashboard from './dashboards/CounterDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isRegisterPage, setIsRegisterPage] = useState(false);

  // 🛠️ Backend එකෙන් එන මැසේජ් එක නිවැරදිව ෆිල්ටර් කරමු
  const handleLoginSuccess = (backendMessage) => {
    
    // 🛑 Backend එකෙන් "Error" හෝ "Invalid" කියලා ආවොත් ලොගින් එක Fail කරනවා
    if (backendMessage.includes('Error') || backendMessage.includes('Invalid')) {
      // 🔮 alert එක අයින් කරලා මේ වැරදි මැසේජ් එක Login component එකට throw කරනවා
      throw backendMessage; 
    }

    let assignedRole = 'PATIENT';
    
    if (backendMessage.includes('ROLE_DOCTOR')) {
      assignedRole = 'DOCTOR';
    } else if (backendMessage.includes('ROLE_COUNTER')) {
      assignedRole = 'COUNTER';
    } else if (backendMessage.includes('ROLE_PATIENT')) {
      assignedRole = 'PATIENT';
    }

    setUser({
      role: assignedRole,
      fullName: assignedRole === 'DOCTOR' ? 'Doctor User' : assignedRole === 'COUNTER' ? 'Counter Staff' : 'Patient User'
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  // 🔐 යූසර් ලොග් වෙලා නැත්නම් (Authentication Guards)
  if (!user) {
    if (isRegisterPage) {
      return <Register onSwitchToLogin={() => setIsRegisterPage(false)} />;
    }
    
    // ලොගින් පේජ් එකට අපේ Register එකට මාරු වෙන ලින්ක් එක පාස් කරනවා
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onSwitchToRegister={() => setIsRegisterPage(true)} 
      />
    );
  }

 return (
    <div className="flex flex-col min-h-screen bg-slate-50 md:flex-row">
      <Sidebar 
        role={user.role} 
        fullName={user.fullName} 
        onLogout={handleLogout} 
      />
      
      {/* 🏢 Main Content Area */}
      <div className="flex-1 p-6 mt-16 md:p-8 md:mt-0">
        {user.role === 'PATIENT' ? (
          <PatientDashboard user={user} />
        ) : user.role === 'DOCTOR' ? (
          <DoctorDashboard user={user} />
        ) : user.role === 'COUNTER' ? (
          <CounterDashboard user={user} /> // ◄ ඔන්න Counter එකත් ගින්දර වගේ වැදුණා!
        ) : (
          <div className="py-12 font-medium text-center text-slate-500">Invalid User Role!</div>
        )}
      </div>
    </div>
  );
}

export default App;