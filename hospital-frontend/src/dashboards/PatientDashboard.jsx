import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// 💡 App.jsx එකෙන් එන 'user' ප්‍රොප් එක මෙතනට ගන්නවා
function PatientDashboard({ user }) {
  const [selectedRoom, setSelectedRoom] = useState('OPD Room 01'); //
  const [isPriorityChecked, setIsPriorityChecked] = useState(false); //
  const [ticket, setTicket] = useState(null); // Active Ticket එක සෙට් කරන ස්ටේට් එක
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitTime, setWaitTime] = useState("Calculating...");
  const [userLocation, setUserLocation] = useState(null);

  // Get User Location on Load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (err) => console.log("Geolocation error:", err)
      );
    }
  }, []);

  // 🔄 පැනල් එක ලෝඩ් වෙද්දීම දැනට මේ පේෂන්ට්ගේ Active ටෝකන් එකක් තියෙනවද කියලා බලන්න පුළුවන් (Optional)
  useEffect(() => {
    if (user && user.id) {
      fetchActiveTicket();
    }
  }, [user]);

  useEffect(() => {
    if (ticket && ticket.doctor) {
      fetchWaitTime(ticket.doctor.id);
      const interval = setInterval(() => fetchWaitTime(ticket.doctor.id), 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [ticket]);

  const fetchWaitTime = async (doctorId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/queue/estimate-wait-time/${doctorId}`);
      const text = await res.text();
      setWaitTime(text);
    } catch (err) {
      console.error(err);
    }
  };

  // 📡 පේෂන්ට්ගේ දැනට තියෙන සක්‍රීය ටෝකන් එක ඇදලා ගන්නා මෙතඩ් එක
  const fetchActiveTicket = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/queue/active/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      }
    } catch (err) {
      console.error("Error fetching active ticket:", err);
    }
  };

  // 🎟️ GET LIVE TOKEN 🚀 බටන් එක ක්ලික් කරද්දී රන් වෙන මෙතඩ් එක
  const handleGetToken = async () => {
    setError(null);

    // 1. ලොග් වෙලා ඉන්න යූසර්ගේ ID එක චෙක් කරනවා
    if (!user || !user.id) {
      setError("යූසර්ගේ ID එක ලැබිලා නෑ මචන්! කරුණාකර නැවත ලොග් වෙන්න.");
      return;
    }

    setLoading(true);

    // 2. බැක්එන්ඩ් එකේ QueueGenerateRequest එකට හරියටම ගැලපෙන්න හැදූ බොඩි එක
    const tokenRequestData = {
      userId: user.id,               // 👈 ලොග් වුණු පේෂන්ට්ගේ ID එක (User Object එකෙන්)
      doctorId: 1,                      // 👈 දැනට ඩේටාබේස් එකේ ඉන්න දොස්තරගේ ID එක (Default: 1)
      isSpecialNeed: isPriorityChecked,  // 👈 බැක්එන්ඩ් එකේ තියෙන විදියටම 'isSpecialNeed' (true/false)
      latitude: userLocation ? userLocation.lat : null,
      longitude: userLocation ? userLocation.lon : null
    };

    try {
      const response = await fetch('http://localhost:8080/api/queue/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenRequestData), // 👈 JSON කරලා යැව්වා
      });

      if (response.ok) {
        const activeTicket = await response.json();
        setTicket(activeTicket); // 👈 ආපු ටෝකන් ඩේටා ටික දකුණු පැත්තේ කාඩ් එකට සෙට් කළා
        toast.success("ටෝකන් එක සාර්ථකව ගත්තා මචන්! 🎟️✅");
      } else {
        const errText = await response.text();
        setError(errText || "ටෝකන් එක ගන්න බැරි වුණා. සමහරවිට ඔයා දැනටමත් පෝලිමක ඇති!");
        toast.error("ටෝකන් එක ගන්න බැරි වුණා.");
      }
    } catch (err) {
      setError("Server එකට සම්බන්ධ වෙන්න බැහැ මචන්! Backend එක Run වෙනවද බලන්න.");
      console.error("Token generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!ticket) return;

    Swal.fire({
      title: 'Leave Queue?',
      text: "Are you sure you want to leave the queue?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, leave it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:8080/api/queue/leave/${ticket.id}`, {
            method: 'PUT'
          });
          const text = await res.text();
          if (res.ok) {
            toast.success(text);
            setTicket(null); // Clear ticket
          } else {
            toast.error("Failed to leave queue.");
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      
      {/* 🟣 වම් පැත්ත: REQUEST NEW TOKEN FORM */}
      <div className="p-8 space-y-6 bg-white border shadow-sm lg:col-span-6 rounded-3xl border-slate-200 h-fit">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">➕</span>
          <h3 className="text-2xl font-black text-slate-800">Request New Token</h3>
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div className="p-4 text-sm font-bold border text-rose-700 bg-rose-50 rounded-xl border-rose-100">
            ⚠️ {error}
          </div>
        )}

        {/* DEPARTMENT SELECT */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">Select Department / Clinic</label>
          <select 
            className="w-full px-4 py-3 font-bold border outline-none rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-teal-500"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            <option value="OPD Room 01">OPD Room 01 (සාමාන්‍ය රෝග)</option>
            <option value="OPD Room 02">OPD Room 02</option>
            <option value="Dental Clinic">Dental Clinic</option>
          </select>
        </div>

        {/* PRIORITY BOOKING CHECKBOX */}
        <div className="flex items-start p-4 space-x-3 border bg-amber-50/50 rounded-xl border-amber-100">
          <input 
            type="checkbox" 
            id="priority"
            className="w-4 h-4 mt-1 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            checked={isPriorityChecked}
            onChange={(e) => setIsPriorityChecked(e.target.checked)}
          />
          <label htmlFor="priority" className="text-xs font-medium leading-relaxed select-none text-slate-600">
            <strong className="text-amber-700 block font-bold mb-0.5">Priority Booking (විශේෂ ප්‍රමුඛතාවය)</strong>
            ඔබ ගර්භණී මවක්, ආබාධිත හෝ වයස අවුරුදු 65ට වැඩි ජ්‍යෙෂ්ඨ පුරවැසියෙක් නම් පමණක් මෙය සක්‍රීය කරන්න.
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          onClick={handleGetToken}
          disabled={loading}
          className="flex items-center justify-center w-full py-4 space-x-2 font-black text-white transition duration-200 bg-teal-600 shadow-lg hover:bg-teal-700 rounded-xl shadow-teal-600/20"
        >
          <span>{loading ? "Processing..." : "Get Live Token 🚀"}</span>
        </button>
      </div>

      {/* 🎫 දකුණු පැත්ත: YOUR ACTIVE TICKET CARD */}
      <div className="lg:col-span-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center h-fit min-h-[350px]">
        
        {!ticket ? (
          /* ටෝකන් එකක් නැති වෙලාවට පෙන්වන Screen එක */
          <div className="max-w-sm space-y-4 text-center">
            <span className="text-4xl">🎫</span>
            <p className="text-sm font-bold leading-relaxed text-slate-400">
              ඔබ තවමත් කිසිදු සායනයක් සඳහා ටෝකන් පතක් ලබාගෙන නැත මචන්.
            </p>
          </div>
        ) : (
          /* ටෝකන් එකක් සක්‍රීයව ඇති විට පෙන්වන ලස්සන Live Ticket එක 🎟️ */
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-800">🎟️ Your Active Ticket</h4>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                ticket.isSpecialNeed ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
              }`}>
                {ticket.isSpecialNeed ? 'PRIORITY' : 'REGULAR'}
              </span>
            </div>

            <div className="p-6 space-y-2 text-center text-white shadow-md bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl">
              <p className="text-xs font-bold tracking-wider text-teal-100 uppercase">Your Token Number</p>
              <h1 className="text-6xl font-black tracking-tight">{ticket.tokenNumber || 'T-00'}</h1>
              <p className="pt-2 text-sm font-medium text-teal-50/80">
                🏥 Room: <span className="font-bold">{ticket.roomNumber || 'OPD'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 border bg-slate-50 rounded-xl border-slate-100">
                <span className="block mb-1 text-xs font-bold text-slate-400">Current Queue No</span>
                <span className="text-xl font-black text-slate-700">{ticket.currentNumber || '0'}</span>
              </div>
              <div className="p-4 border bg-slate-50 rounded-xl border-slate-100">
                <span className="block mb-1 text-xs font-bold text-slate-400">Estimated Wait</span>
                <span className="text-xl font-black text-teal-600">{waitTime}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLeaveQueue}
              className="w-full mt-4 py-3 font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
            >
              Leave Queue
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default PatientDashboard;