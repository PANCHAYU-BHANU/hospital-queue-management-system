import React, { useState, useEffect } from 'react';

function PatientDashboard({ user }) {
  // 💡 ඔයාගේ dropdown එකේ පේන්න තියෙන text එකම value එක විදියට සෙට් කළා මචන්
  const [department, setDepartment] = useState('OPD Room 01');
  const [isPriority, setIsPriority] = useState(false);
  const [myToken, setMyToken] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  // 📢 Alerts වෙනුවට UI එක ඇතුළේම message පෙන්වන්න ස්ටේට් දෙකක්
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 🔄 1. ලෙඩාගේ ටෝකන් එකේ ලයිව් ස්ටේටස් එක ලෝඩ් කරන ලොජික් එක
  const checkMyQueueStatus = async () => {
    if (!user?.nicNumber) return;
    try {
      const response = await fetch(`http://localhost:8080/api/queue/patient/${user.nicNumber}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setMyToken(data[0]); 
        }
      }
    } catch (error) {
      console.error("Status load error:", error);
    }
  };

  useEffect(() => {
    checkMyQueueStatus();
    const interval = setInterval(checkMyQueueStatus, 5000);
    return () => clearInterval(interval);
  }, [user?.nicNumber]);


  // 🚀 2. "Get Live Token" බටන් එක එබුවාම ක්‍රියාත්මක වෙන ලොජික් එක
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const queueRequest = {
      patientNic: user?.nicNumber || "200109202793",
      patientName: user?.fullName || "Panchayu Mihisara",
      department: department, // eg: "OPD Room 01"
      isPriority: isPriority
    };

    try {
      const response = await fetch('http://localhost:8080/api/queue/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueRequest),
      });

      if (response.ok) {
        const tokenData = await response.json();
        setMyToken(tokenData);
        setSuccessMsg('ටෝකන් එක සාර්ථකව ලබාගත්තා මචන්! 🎉');
        
        // තත්පර 4කින් සාර්ථකයි කියන මැසේජ් එක ඔටෝ අයින් කරනවා
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        // ❌ අර කැත Alert එක වෙනුවට මෙතනදී රතු පාටින් UI එකේම පෙන්වනවා
        setErrorMsg('ටෝකන් එක ගන්න බැරි වුණා මචන්. සමහරවිට ඔයා දැනටමත් පෝලිමක ඇති! ⚠️');
      }
    } catch (error) {
      console.error("Queue generate error:", error);
      setErrorMsg('බැක්එන්ඩ් එක සම්බන්ධ කරගන්න බැරි වුණා මචන්! 🔌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
      
      {/* ➕ Card 1: Request New Token */}
      <div className="p-6 space-y-6 bg-white border shadow-sm md:p-8 rounded-3xl border-slate-200/60">
        <h3 className="flex items-center gap-2 pb-3 text-xl font-black border-b text-slate-800 border-slate-100">
          <span className="text-teal-600">➕</span> Request New Token
        </h3>

        <form onSubmit={handleJoinQueue} className="space-y-5">
          <div>
            <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-400">Select Department / Clinic</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 text-sm font-bold transition border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 text-slate-700"
            >
              {/* 💡 Backend එකේ බලාපොරොත්තු වෙන String එකම Value එකට දුන්නා මචන් */}
              <option value="OPD Room 01">OPD Room 01 (සාමාන්‍ය රෝග)</option>
              <option value="OPD Room 02">OPD Room 02 (උණ/කැස්ස)</option>
              <option value="Dental Clinic">Dental Clinic (දන්ත සායනය)</option>
            </select>
          </div>

          {/* 🤰 Priority Checkbox */}
          <div className="flex items-start gap-3 p-4 border bg-amber-50/50 border-amber-100 rounded-xl">
            <input
              type="checkbox"
              id="priority"
              checked={isPriority}
              onChange={(e) => setIsPriority(e.target.checked)}
              className="w-4 h-4 mt-1 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="priority" className="text-xs font-semibold cursor-pointer text-slate-600 selection:bg-transparent">
              <span className="font-bold text-amber-700 block mb-0.5">Priority Booking (විශේෂ ප්‍රමුඛතාවය)</span>
              ඔබ ගර්භණී මවක්, ආබාධිත හෝ වයස අවුරුදු 65ට වැඩි ජ්‍යෙෂ්ඨ පුරවැසියෙක් නම් පමණක් මෙය සක්‍රීය කරන්න.
            </label>
          </div>

          {/* 🟢 Custom Success Message Indicator */}
          {successMsg && (
            <div className="p-3 text-xs font-bold text-center border bg-emerald-50 text-emerald-700 border-emerald-100 rounded-xl animate-fade-in">
              {successMsg}
            </div>
          )}

          {/* 🔴 Custom Error Message Indicator */}
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-center border bg-rose-50 text-rose-600 border-rose-100 rounded-xl animate-pulse">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || myToken !== null}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg transition text-sm transform active:scale-[0.99]"
          >
            {loading ? 'Processing...' : myToken ? 'You are already in a Queue' : 'Get Live Token 🚀'}
          </button>
        </form>
      </div>

      {/* 🎫 Card 2: Your Active Ticket */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between min-h-[350px]">
        <h3 className="flex items-center gap-2 pb-3 text-xl font-black border-b text-slate-800 border-slate-100">
          <span className="text-teal-600">🎫</span> Your Active Ticket
        </h3>

        {myToken ? (
          <div className="flex flex-col justify-center flex-1 my-6 space-y-4 text-center animate-fade-in">
            <span className="block text-xs font-bold tracking-widest uppercase text-slate-400">Your Token Number</span>
            <h2 className="font-black tracking-tight text-teal-600 text-7xl">#{myToken.tokenNumber}</h2>
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">Clinic: <span className="text-teal-700">{myToken.department}</span></p>
              <p className="text-xs font-semibold text-slate-400">Status: 
                <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  myToken.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {myToken.status}
                </span>
              </p>
            </div>

            {myToken.status === 'PENDING' && (
              <p className="text-[11px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 animate-pulse max-w-xs mx-auto mt-2">
                ⏳ කරුණාකර කවුන්ටරය වෙත ගොස් ඔබේ ටෝකන් පත සක්‍රීය (Approve) කරගන්න මචන්.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-12 my-auto space-y-2 text-sm font-medium text-center text-slate-400">
            <span className="block mb-2 text-4xl">🎟️</span>
            <p className="px-6 text-slate-500">ඔබ තවමත් කිසිදු සායනයක් සඳහා ටෝකන් පතක් ලබාගෙන නැත මචන්.</p>
          </div>
        )}

        {myToken && (
          <button
            onClick={() => setMyToken(null)} 
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition text-xs mt-4"
          >
            Leave Queue / Reset
          </button>
        )}
      </div>

    </div>
  );
}

export default PatientDashboard;