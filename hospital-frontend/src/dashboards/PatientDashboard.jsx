import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

function PatientDashboard({ user }) {
  const { t } = useTranslation();
  const [isPriorityChecked, setIsPriorityChecked] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitTime, setWaitTime] = useState("Calculating...");
  const [patientProfile, setPatientProfile] = useState(null);
  const previousStatus = useRef(null);
  
  // Geolocation & Hospital states
  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('checking'); // 'checking', 'granted', 'denied', 'unsupported', 'too_far'
  const [nearestHospital, setNearestHospital] = useState(null);
  const [allHospitals, setAllHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  
  // Doctors states
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);
  
  const isOpdClosed = selectedHospitalId && !isFetchingDoctors && doctors.length === 0;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setGpsStatus('granted');
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          // If not a mobile device OR accuracy is worse than 2km, fallback to manual selection
          if (!isMobile || accuracy > 2000) {
              setGpsStatus('low_accuracy');
              setUserLocation({ lat, lon, accuracy });
              fetchAllHospitals();
              return;
          }

          setUserLocation({ lat, lon, accuracy });
          
          try {
             const res = await fetch(`http://localhost:8080/api/hospital/nearest?lat=${lat}&lon=${lon}`);
             if (res.ok) {
                 const hospital = await res.json();
                 if (hospital && hospital.id) {
                     // Calculate distance
                     const R = 6371; 
                     const dLat = (hospital.latitude - lat) * Math.PI / 180;
                     const dLon = (hospital.longitude - lon) * Math.PI / 180;
                     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                               Math.cos(lat * Math.PI / 180) * Math.cos(hospital.latitude * Math.PI / 180) *
                               Math.sin(dLon/2) * Math.sin(dLon/2);
                     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                     const distance = R * c;
                     
                     setNearestHospital(hospital);
                     
                     if (distance <= 5.0) {
                         setSelectedHospitalId(hospital.id);
                         fetchDoctors(hospital.id);
                     } else {
                         setGpsStatus('too_far');
                     }
                 } else {
                     setGpsStatus('too_far');
                 }
             } else {
                 setGpsStatus('too_far'); // Fallback if API fails
             }
          } catch(err) {
             console.error("Error fetching nearest hospital:", err);
             setError("Failed to fetch nearest hospital.");
          }
        },
        (err) => {
          console.log("Geolocation error:", err);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (!isMobile) {
            setGpsStatus('unsupported');
            fetchAllHospitals();
          } else {
            setGpsStatus('denied');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsStatus('unsupported');
      fetchAllHospitals();
    }
  }, []);

  const fetchAllHospitals = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/hospital/all`);
      if (res.ok) {
        const data = await res.json();
        setAllHospitals(data);
      }
    } catch (err) {
      console.error("Failed to fetch all hospitals:", err);
    }
  };

  const fetchDoctors = async (hospitalId) => {
    setIsFetchingDoctors(true);
    try {
      const res = await fetch(`http://localhost:8080/api/doctors/hospital/${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        const availableDoctors = data.filter(doc => doc.available && doc.roomNumber !== "Unassigned");
        setDoctors(availableDoctors);
        if (availableDoctors.length > 0) {
          setSelectedDoctorId(availableDoctors[0].id);
        } else {
          setSelectedDoctorId('');
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setIsFetchingDoctors(false);
    }
  };

  // Handle manual hospital selection (for devices without GPS)
  const handleManualHospitalChange = (e) => {
    const hId = e.target.value;
    setSelectedHospitalId(hId);
    if (hId) {
      fetchDoctors(hId);
    } else {
      setDoctors([]);
      setSelectedDoctorId('');
    }
  };

  const fetchActiveTicket = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/queue/active/${user.id}`);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          setTicket(data);
        } else {
          setTicket(null);
        }
      } else {
        setTicket(null);
      }
    } catch (err) {
      console.error("Error fetching active ticket:", err);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchActiveTicket();
      
      // Poll active ticket every 5 seconds so patient gets real-time status updates (CALLED, IN_CONSULTATION)
      const interval = setInterval(fetchActiveTicket, 5000);
      
      const fetchPatientProfile = async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/patients/profile/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setPatientProfile(data);
            if (data.age >= 60) {
              setIsPriorityChecked(true);
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }
      };
      
      fetchPatientProfile();
      
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (ticket && ticket.doctor) {
      fetchWaitTime(ticket.doctor.id);
      const interval = setInterval(() => fetchWaitTime(ticket.doctor.id), 60000);
      return () => clearInterval(interval);
    }
  }, [ticket]);
  useEffect(() => {
    if (ticket) {
      if (ticket.status === 'CALLED' && previousStatus.current !== 'CALLED') {
        Swal.fire({
          title: '🔔',
          text: t('patient_dashboard.status_called', "Please proceed to the doctor's room! 🔔"),
          icon: 'info',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d9488'
        });
      }
      
      if (ticket.status === 'PHARMACY_QUEUE' && previousStatus.current !== 'PHARMACY_QUEUE') {
        Swal.fire({
          title: '💊',
          text: t('patient_dashboard.status_pharmacy', "Please proceed to the Pharmacy 💊"),
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d9488'
        });
      }
      
      if (ticket.status === 'PENDING_PAYMENT' && previousStatus.current !== 'PENDING_PAYMENT') {
        Swal.fire({
          title: '🎁',
          text: t('patient_dashboard.status_pending_payment', "Medicines Ready (Pending Payment) 💵"),
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d9488'
        });
      }
      
      previousStatus.current = ticket.status;
    }
  }, [ticket]);

  const fetchWaitTime = async (doctorId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/queue/estimate-wait-time/${doctorId}`);
      if (res.ok) {
        const text = await res.text();
        setWaitTime(text);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetToken = async () => {
    setError(null);

    if (!user || !user.id) {
      setError(t('patient_dashboard.error_no_user_id', "User ID not found! Please log in again."));
      return;
    }

    if (!selectedDoctorId) {
      setError(t('patient_dashboard.error_select_doctor', "Please select a room/doctor!"));
      return;
    }

    setLoading(true);

    const tokenRequestData = {
      userId: user.id,
      doctorId: selectedDoctorId,
      specialNeed: isPriorityChecked,
      latitude: (gpsStatus === 'granted' && userLocation) ? userLocation.lat : null,
      longitude: (gpsStatus === 'granted' && userLocation) ? userLocation.lon : null
    };

    try {
      const response = await fetch('http://localhost:8080/api/queue/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenRequestData),
      });

      if (response.ok) {
        const activeTicket = await response.json();
        setTicket(activeTicket);
        toast.success(t('patient_dashboard.token_success', "Token generated successfully! 🎟️✅"));
      } else {
        const errText = await response.text();
        setError(t('patient_dashboard.error_token_failed', "Failed to generate token. You might already be in a queue!"));
        toast.error(t('patient_dashboard.error_token_failed', "Failed to generate token. You might already be in a queue!"));
      }
    } catch (err) {
      setError(t('patient_dashboard.error_server', "Cannot connect to the server! Please check if backend is running."));
      console.error("Token generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!ticket) return;

    Swal.fire({
      title: t('patient_dashboard.leave_queue_title', 'Leave Queue?'),
      text: t('patient_dashboard.leave_queue_desc', 'Are you sure you want to leave the queue?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: t('patient_dashboard.yes_leave', 'Yes, leave it!'),
      cancelButtonText: t('patient_dashboard.cancel', 'Cancel')
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:8080/api/queue/leave/${ticket.id}`, { method: 'PUT' });
          if (res.ok) {
            const text = await res.text();
            toast.success(text);
            setTicket(null);
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
          <h3 className="text-2xl font-black text-slate-800">{t('patient_dashboard.request_new_token', 'Request New Token')}</h3>
        </div>

        {isOpdClosed && (
          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-4 shadow-sm animate-pulse">
            <div className="text-rose-500 bg-white p-3 rounded-full shadow-sm flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-800 mb-1">{t('public_dashboard.opd_closed', 'OPD is Currently Closed')}</h3>
              <p className="text-xs text-rose-600 font-medium">{t('public_dashboard.opd_closed_desc', 'The OPD is closed at this time. Please check back during operating hours.')}</p>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div className="p-4 text-sm font-bold border text-rose-700 bg-rose-50 rounded-xl border-rose-100">
            ⚠️ {error}
          </div>
        )}

        {/* GPS STATUS ALERTS */}
        {gpsStatus === 'checking' && (
          <div className="p-4 text-sm font-bold border text-blue-700 bg-blue-50 rounded-xl border-blue-100 flex items-center gap-2">
            <span className="animate-spin text-xl">⏳</span> {t('patient_dashboard.checking_location', 'Checking location...')}
          </div>
        )}

        {gpsStatus === 'denied' && (
          <div className="p-4 text-sm font-bold border text-rose-700 bg-rose-50 rounded-xl border-rose-100">
            🚫 {t('patient_dashboard.error_gps_denied', 'Location (GPS) is disabled! Please grant location access. You must be within 5km of the hospital to get a token.')}
          </div>
        )}

        {gpsStatus === 'too_far' && (
          <div className="p-4 text-sm font-bold border text-rose-700 bg-rose-50 rounded-xl border-rose-100">
            <p>🏥 {t('patient_dashboard.error_too_far', 'You are outside the 5km radius of the hospital. You can only get a token when you are near the hospital.')}</p>
            {nearestHospital && userLocation && (
              <div className="mt-2 text-xs opacity-75 font-mono">
                <p>ඔබගේ GPS ස්ථානය: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}</p>
                <p>රෝහලේ ({nearestHospital.name}) ස්ථානය: {nearestHospital.latitude.toFixed(4)}, {nearestHospital.longitude.toFixed(4)}</p>
                <p>ගණනය කළ දුර: <strong>{
                  (6371 * 2 * Math.atan2(
                    Math.sqrt(Math.sin((nearestHospital.latitude - userLocation.lat) * Math.PI / 360) * Math.sin((nearestHospital.latitude - userLocation.lat) * Math.PI / 360) +
                    Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(nearestHospital.latitude * Math.PI / 180) *
                    Math.sin((nearestHospital.longitude - userLocation.lon) * Math.PI / 360) * Math.sin((nearestHospital.longitude - userLocation.lon) * Math.PI / 360)),
                    Math.sqrt(1 - (Math.sin((nearestHospital.latitude - userLocation.lat) * Math.PI / 360) * Math.sin((nearestHospital.latitude - userLocation.lat) * Math.PI / 360) +
                    Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(nearestHospital.latitude * Math.PI / 180) *
                    Math.sin((nearestHospital.longitude - userLocation.lon) * Math.PI / 360) * Math.sin((nearestHospital.longitude - userLocation.lon) * Math.PI / 360)))
                  )).toFixed(2)
                } km</strong></p>
              </div>
            )}
            {!nearestHospital && userLocation && (
              <div className="mt-2 text-xs opacity-75 font-mono">
                <p>ඔබගේ GPS ස්ථානය: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}</p>
                <p>දෝෂය: ළඟම රෝහලක් සොයා ගැනීමට නොහැකි විය. (Database එකේ Hospitals නැද්ද?)</p>
              </div>
            )}
          </div>
        )}

        {gpsStatus === 'granted' && nearestHospital && (
          <div className="p-4 text-sm font-bold border text-teal-700 bg-teal-50 rounded-xl border-teal-100">
            📍 {t('patient_dashboard.nearest_hospital_found', 'Nearest Hospital: {{name}} ({{district}}) - You are within 5km!', { name: nearestHospital.name, district: nearestHospital.district })}
          </div>
        )}

        {gpsStatus === 'low_accuracy' && (
          <div className="p-4 text-sm font-bold border text-amber-700 bg-amber-50 rounded-xl border-amber-100">
            ⚠️ {t('patient_dashboard.error_low_accuracy', 'Your device cannot provide an accurate GPS location. Please select the hospital manually below.')}
          </div>
        )}

        {/* MANUAL HOSPITAL SELECTION (For Desktop, Low Accuracy, or No GPS) */}
        {(gpsStatus === 'unsupported' || gpsStatus === 'low_accuracy') && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">{t('patient_dashboard.select_hospital_manual', 'Select Hospital (Manual)')}</label>
            <select 
              className="w-full px-4 py-3 font-bold border outline-none rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-teal-500"
              value={selectedHospitalId}
              onChange={handleManualHospitalChange}
            >
              <option value="">{t('patient_dashboard.select_hospital_placeholder', '-- Select a Hospital --')}</option>
              {allHospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} - {h.district}</option>
              ))}
            </select>
          </div>
        )}

        {/* DEPARTMENT / DOCTOR SELECT */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">{t('patient_dashboard.select_dept_doctor', 'Select Department & Doctor')}</label>
          <select 
            className="w-full px-4 py-3 font-bold border outline-none rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            disabled={gpsStatus === 'denied' || gpsStatus === 'too_far' || gpsStatus === 'checking' || doctors.length === 0}
          >
            {doctors.length === 0 ? (
              <option value="">{t('patient_dashboard.no_doctors_available', 'No doctors/rooms available')}</option>
            ) : (
              doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.roomNumber} - Dr. {doc.doctorName} ({doc.specialization})
                </option>
              ))
            )}
          </select>
        </div>

        {/* PRIORITY BOOKING CHECKBOX */}
        <div className="flex flex-col p-4 space-y-3 border bg-amber-50/50 rounded-xl border-amber-100">
          <div className="flex items-start space-x-3">
            <input 
              type="checkbox" 
              id="priority"
              className="w-4 h-4 mt-1 text-teal-600 rounded border-slate-300 focus:ring-teal-500 disabled:opacity-50"
              checked={isPriorityChecked}
              onChange={(e) => setIsPriorityChecked(e.target.checked)}
              disabled={gpsStatus === 'denied' || gpsStatus === 'too_far' || gpsStatus === 'checking' || (patientProfile && patientProfile.age >= 60)}
            />
            <label htmlFor="priority" className="text-xs font-medium leading-relaxed select-none text-slate-600">
              <strong className="text-amber-700 block font-bold mb-0.5">{t('patient_dashboard.priority_booking', 'Priority Booking')}</strong>
              {t('patient_dashboard.priority_desc', 'Enable this only if you are pregnant, disabled, or a senior citizen over 60 years.')}
            </label>
          </div>
          
          {/* GENDER SPECIFIC OPTIONS */}
          {isPriorityChecked && patientProfile && patientProfile.age < 60 && (
            <div className="pl-7 pt-2 border-t border-amber-100/50">
              {patientProfile.gender === 'Female' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-amber-800">කරුණාකර හේතුව තෝරන්න:</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input type="radio" name="priorityReason" value="Pregnant" className="text-amber-600 focus:ring-amber-500" defaultChecked />
                      <span>ගර්භණී (Pregnant)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input type="radio" name="priorityReason" value="SpecialNeeds" className="text-amber-600 focus:ring-amber-500" />
                      <span>විශේෂ අවශ්‍යතා (Special Needs)</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-amber-800 bg-amber-100/50 px-3 py-2 rounded-lg inline-block border border-amber-200">
                  ✓ විශේෂ අවශ්‍යතා (Special Needs) ලෙස සලකුණු විය
                </div>
              )}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          onClick={handleGetToken}
          disabled={loading || gpsStatus === 'denied' || gpsStatus === 'too_far' || gpsStatus === 'checking' || !selectedDoctorId}
          className="flex items-center justify-center w-full py-4 space-x-2 font-black text-white transition duration-200 bg-teal-600 shadow-lg hover:bg-teal-700 rounded-xl shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? t('patient_dashboard.processing', 'Processing...') : t('patient_dashboard.get_live_token', 'Get Live Token 🚀')}</span>
        </button>
      </div>

      {/* 🎫 දකුණු පැත්ත: YOUR ACTIVE TICKET CARD */}
      <div className="lg:col-span-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center h-fit min-h-[350px]">
        
        {!ticket ? (
          <div className="max-w-sm space-y-4 text-center">
            <span className="text-4xl">🎫</span>
            <p className="text-sm font-bold leading-relaxed text-slate-400">
              {t('patient_dashboard.no_active_token', "You haven't requested any tokens yet.")}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-800">🎟️ {t('patient_dashboard.active_ticket', 'Your Active Ticket')}</h4>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                ticket.queueType === 'PRIORITY' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
              }`}>
                {ticket.queueType === 'PRIORITY' ? t('patient_dashboard.priority', 'PRIORITY') : t('patient_dashboard.regular', 'REGULAR')}
              </span>
            </div>

            <div className={`p-6 space-y-2 text-center text-white shadow-md rounded-2xl ${
              ticket.queueType === 'PRIORITY' ? 'bg-gradient-to-br from-rose-500 to-rose-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'
            }`}>
              <p className={`text-xs font-bold tracking-wider uppercase ${
                ticket.queueType === 'PRIORITY' ? 'text-rose-100' : 'text-teal-100'
              }`}>
                {ticket.status === 'PENDING_APPROVAL' && t('patient_dashboard.status_pending_approval', 'Sent to Counter (Pending Approval) ⏳')}
                {ticket.status === 'PENDING' && t('patient_dashboard.status_pending', 'Added to Queue ✅')}
                {ticket.status === 'CALLED' && t('patient_dashboard.status_called', 'Please proceed to the doctor\'s room! 🔔')}
                {ticket.status === 'IN_CONSULTATION' && t('patient_dashboard.status_in_consultation', 'In Consultation 👨‍⚕️')}
                {ticket.status === 'PHARMACY_QUEUE' && t('patient_dashboard.status_pharmacy', 'Please proceed to the Pharmacy 💊')}
                {ticket.status === 'PENDING_PAYMENT' && t('patient_dashboard.status_pending_payment', 'Medicines Ready (Pending Payment) 💵')}
                {ticket.status === 'COMPLETED' && t('patient_dashboard.status_completed', 'Consultation Completed 🎉')}
              </p>
              <h1 className="text-6xl font-black tracking-tight">{ticket.tokenNumber || 'T-00'}</h1>
              <p className={`pt-2 text-sm font-medium ${
                ticket.queueType === 'PRIORITY' ? 'text-rose-50/80' : 'text-teal-50/80'
              }`}>
                🏥 {t('patient_dashboard.room', 'Room')}: <span className="font-bold">{ticket.roomNumber || t('patient_dashboard.opd', 'OPD')}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 border bg-slate-50 rounded-xl border-slate-100">
                <span className="block mb-1 text-xs font-bold text-slate-400">{t('patient_dashboard.current_queue_no', 'Current Queue No')}</span>
                <span className="text-xl font-black text-slate-700">{ticket.currentNumber || '0'}</span>
              </div>
              <div className="p-4 border bg-slate-50 rounded-xl border-slate-100">
                <span className="block mb-1 text-xs font-bold text-slate-400">{t('patient_dashboard.estimated_wait', 'Estimated Wait')}</span>
                <span className="text-xl font-black text-teal-600">{waitTime}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLeaveQueue}
              className="w-full mt-4 py-3 font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
            >
              {t('patient_dashboard.leave_queue', 'Leave Queue')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default PatientDashboard;