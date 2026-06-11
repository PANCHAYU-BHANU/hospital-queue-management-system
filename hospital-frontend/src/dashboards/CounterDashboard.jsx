import React, { useState } from 'react';

function CounterDashboard({ user }) {
  // 🎟️ Counter එකට Approve කරන්න ඇවිත් තියෙන Online Tokens (Pending)
  const [pendingTokens, setPendingTokens] = useState([
    { token: '#12', name: "Suresh Perera", type: "Online Request", status: "Pending" },
    { token: '#13', name: "Nimali Rathnayake", type: "Online Request", status: "Pending" }
  ]);

  const handleApprove = (tokenToApprove) => {
    setPendingTokens(pendingTokens.filter(t => t.token !== tokenToApprove));
    alert(`Token ${tokenToApprove} Approved & Added to Live Queue!`);
  };

  return (
    <div className="w-full space-y-6">
      {/* 💳 Counter Header - Updated to Teal Gradient to match other dashboards */}
      <div className="p-6 text-white border shadow-lg bg-gradient-to-r from-teal-700 to-slate-800 rounded-2xl border-teal-600/20">
        <h2 className="text-2xl font-bold">Welcome, {user?.fullName || 'Counter Staff'}!</h2>
        <p className="mt-1 text-sm font-medium text-teal-100">
          Main Registration Desk | Patient Verification Panel
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* 📝 Left Side: Walk-in Patient Registration Form */}
        <div className="p-6 bg-white border shadow-xl rounded-2xl border-slate-100 md:col-span-1">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-slate-800">
            <span className="text-teal-600">➕</span> Walk-in Token Issue
          </h3>
          <p className="mb-4 text-xs font-semibold text-slate-400">Phone එකක් නැතුව කෙලින්ම හොස්පිට්ල් එකට එන ලෙඩ්ඩුන්ව ඇතුළත් කරන්න මචන්.</p>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Patient NIC / Phone</label>
              <input 
                type="text" 
                placeholder="Enter NIC Number"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Select Department</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition font-medium text-slate-700">
                <option>OPD Room 01</option>
                <option>OPD Room 02</option>
                <option>Dental Clinic</option>
              </select>
            </div>
            {/* Button changed to Teal */}
            <button className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition transform active:scale-[0.99]">
              Issue Walk-in Token
            </button>
          </form>
        </div>

        {/* 📋 Right Side: Online Token Approvals List */}
        <div className="p-6 bg-white border shadow-xl rounded-2xl border-slate-100 md:col-span-2">
          <h3 className="flex items-center justify-between mb-4 text-lg font-bold text-slate-800">
            <span className="flex items-center gap-2"><span>⏳</span> Online Token Requests</span>
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full font-bold">
              {pendingTokens.length} Pending Verification
            </span>
          </h3>

          <div className="space-y-3">
            {pendingTokens.length === 0 ? (
              <p className="py-12 text-sm font-medium text-center text-slate-400">No pending online requests at the moment!</p>
            ) : (
              pendingTokens.map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-4 transition border bg-slate-50 border-slate-100 rounded-xl hover:bg-slate-100/80">
                  <div className="flex items-center gap-4">
                    {/* Token bubble changed to Teal text & Slate/Teal soft bg */}
                    <span className="flex items-center justify-center w-12 h-12 text-lg font-black text-teal-600 bg-white border shadow-sm rounded-xl border-slate-100">
                      {patient.token}
                    </span>
                    <div>
                      <p className="font-bold text-slate-700">{patient.name}</p>
                      <p className="text-xs font-semibold text-slate-400">{patient.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Button changed to Emerald to match operational approvals */}
                    <button 
                      onClick={() => handleApprove(patient.token)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm transform active:scale-[0.97]"
                    >
                      Approve & Queue
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CounterDashboard;