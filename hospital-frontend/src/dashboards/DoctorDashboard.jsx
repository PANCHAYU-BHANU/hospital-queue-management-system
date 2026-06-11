import React, { useState, useEffect } from 'react';

// 💡 user ප්‍රොප් එක ඇතුළේ දැනට ලොග් වෙලා ඉන්න Doctor ගේ විස්තර (ID එක ඇතුළුව) එනවා කියලා හිතමු
function DoctorDashboard({ user }) {
  const [currentlyTreating, setCurrentlyTreating] = useState(null);
  const [upcomingPatients, setUpcomingPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🆔 දැනට Hardcode කරලා හරි නැත්නම් user එකෙන් එන Doctor ID එක (eg: 1)
  const doctorId = user?.id || 1; 

  // 📋 1. දොස්තරගේ අද පෝලිම (Upcoming Patients) Backend එකෙන් ලෝඩ් කරන Function එක
  const fetchDoctorQueue = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/queue/doctor/${doctorId}`);
      const data = await response.json();
      setUpcomingPatients(data); // Backend එකෙන් එන List<QueueResponse> එක ස්ටේට් එකට දානවා
    } catch (error) {
      console.error("Queue එක load කරගන්න බැරි වුණා මචන්:", error);
    }
  };

  // පේජ් එක ලෝඩ් වෙද්දීම පෝලිම ඔටෝ ලෝඩ් වෙන්න දානවා
  useEffect(() => {
    fetchDoctorQueue();
    
    // 🔄 ලයිව් අප්ඩේට් වෙන්න ඕනේ නිසා හැම තත්පර 5කට සැරයක්ම පෝලිම Refresh කරනවා (Polling)
    const interval = setInterval(fetchDoctorQueue, 5000);
    return () => clearInterval(interval);
  }, [doctorId]);


  // 📢 2. "Call Next Patient" බටන් එක එබුවාම ක්‍රියාත්මක වෙන මෙතඩ් එක
  const handleCallNext = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/queue/next/${doctorId}`);
      
      if (response.ok) {
        // බඩුම තමයි, ඊළඟ ලෙඩාගේ ඩේටා එක (QueueResponse) එනවා
        const nextPatient = await response.json();
        setCurrentlyTreating(nextPatient);
        
        // පෝලිම ආපහු Refresh කරනවා
        fetchDoctorQueue();
      } else {
        alert("පෝලිමේ ඊළඟට ලෙඩ්ඩු කවුරුත් නැහැ මචන්! 🏁");
        setCurrentlyTreating(null);
      }
    } catch (error) {
      console.error("Next patient කෝල් කරන්න බැරි වුණා:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar එක (උඹ කලින් ලස්සනට හදලා තිබ්බ එක මෙතන තියෙන්න ඇරපන් මචන්) */}
      
      {/* Main Content Area */}
      <div className="flex-1 p-8 space-y-6">
        
        {/* 🏢 Welcome Banner */}
        <div className="p-6 text-white bg-teal-900 shadow-sm rounded-2xl">
          <h1 className="text-2xl font-black">Welcome, {user?.fullName || 'Doctor User'}!</h1>
          <p className="mt-1 text-sm font-medium text-teal-200">OPD Room No: 03 | Live Queue Management Panel</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* 🎯 1. Currently Treating Card (වම් පැත්තේ තියෙන ලොකු එක) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between items-center min-h-[350px]">
            <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full bg-rose-50 text-rose-500 animate-pulse">
              🔴 Currently Treating
            </span>

            {currentlyTreating ? (
              <div className="my-6 space-y-2 text-center animate-fade-in">
                <span className="block text-xs font-bold tracking-widest uppercase text-slate-400">Token Number</span>
                <h2 className="text-6xl font-black text-slate-800">#{currentlyTreating.tokenNumber}</h2>
                <p className="text-lg font-bold text-slate-600">{currentlyTreating.patientName}</p>
              </div>
            ) : (
              <div className="my-6 text-sm font-medium text-center text-slate-400">
                දැනට කිසිම ලෙඩෙක් පරික්ෂා කරමින් නැත. <br/> "Call Next" ඔබන්න.
              </div>
            )}

            <button
              onClick={handleCallNext}
              disabled={loading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition transform active:scale-[0.98] shadow-md shadow-teal-600/10"
            >
              {loading ? 'Calling...' : 'Call Next Patient 📢'}
            </button>
          </div>

          {/* 👥 2. Upcoming Patients List (දකුණු පැත්තේ ලිස්ට් එක) */}
          <div className="p-6 space-y-4 bg-white border shadow-sm rounded-3xl border-slate-100 md:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
                👥 Upcoming Patients
              </h3>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                {upcomingPatients.length} Waiting
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {upcomingPatients.length > 0 ? (
                upcomingPatients.map((patient, index) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 transition border bg-slate-50 border-slate-100 rounded-2xl hover:bg-slate-100/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 text-lg font-black text-teal-600 border border-teal-100 bg-teal-50 rounded-xl">
                        #{patient.tokenNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">{patient.patientName}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Position: #{index + 1}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      patient.isPriority ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {patient.isPriority ? 'Priority (ගර්භණී/වැඩිහිටි)' : 'Standard (OPD)'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-sm font-medium text-center text-slate-400">
                  පෝලිමේ ඉදිරියට පැමිණීමට ලෙඩ්ඩු කවුරුත් නැත මචන්. 🎉
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;