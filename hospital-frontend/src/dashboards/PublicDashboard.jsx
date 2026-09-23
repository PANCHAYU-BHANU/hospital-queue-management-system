import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Fix for default Leaflet icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function PublicDashboard({ onBackToLogin }) {
  const { t } = useTranslation();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorQueueData, setDoctorQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);

  const isOpdClosed = selectedHospital && !isFetchingDoctors && doctors.length === 0;

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/hospital/all');
      const data = await res.json();
      setHospitals(data);
      if (data.length > 0) {
        handleHospitalChange({ target: { value: data[0].id } });
      }
    } catch (err) {
      console.error("Failed to load hospitals", err);
    }
  };

  const handleHospitalChange = async (e) => {
    const hId = e.target.value;
    setSelectedHospital(hId);
    if (hId) {
      setIsFetchingDoctors(true);
      try {
        const res = await fetch(`http://localhost:8080/api/doctors/hospital/${hId}`);
        if (res.ok) {
          const data = await res.json();
          const availableDoctors = data.filter(doc => doc.available && doc.roomNumber !== "Unassigned");
          setDoctors(availableDoctors);
          if (availableDoctors.length > 0) setSelectedDoctorId(availableDoctors[0].id);
          else setSelectedDoctorId('');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingDoctors(false);
      }
    } else {
      setDoctors([]);
      setSelectedDoctorId('');
    }
  };

  const handleCheckQueue = async () => {
    if (!selectedDoctorId) {
      setError(t('public_dashboard.error_select_first'));
      return;
    }
    setLoading(true);
    setError(null);
    setDoctorQueueData(null);
    
    try {
      // Get estimated wait time
      const waitRes = await fetch(`http://localhost:8080/api/queue/estimate-wait-time/${selectedDoctorId}`);
      const waitText = await waitRes.text();

      // Get current queue
      const queueRes = await fetch(`http://localhost:8080/api/queue/doctor/${selectedDoctorId}`);
      const queueData = await queueRes.json();
      
      const pendingNormalCount = queueData.filter(q => q.status === 'PENDING' && q.queueType === 'NORMAL').length;
      const pendingPriorityCount = queueData.filter(q => q.status === 'PENDING' && q.queueType === 'PRIORITY').length;
      const pendingCount = pendingNormalCount + pendingPriorityCount;
      
      const selectedDoc = doctors.find(d => d.id == selectedDoctorId);
      
      setDoctorQueueData({
        roomName: selectedDoc ? `${selectedDoc.roomNumber} - Dr. ${selectedDoc.doctorName}` : "Selected Room",
        waitTime: waitText,
        pendingCount,
        pendingNormalCount,
        pendingPriorityCount
      });
      
    } catch (err) {
      setError(t('public_dashboard.error_fetch'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 bg-white shadow-sm flex items-center justify-between border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-800">🏥 {t('public_dashboard.title')}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button 
            onClick={onBackToLogin}
            className="text-sm font-bold text-slate-500 hover:text-slate-800 transition relative z-10"
          >
            &larr; {t('public_dashboard.back_to_login')}
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        {isOpdClosed && (
          <div className="mb-6 p-6 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-4 shadow-sm animate-pulse">
            <div className="text-rose-500 bg-white p-3 rounded-full shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-800 mb-1">{t('public_dashboard.opd_closed')}</h3>
              <p className="text-rose-600 font-medium">{t('public_dashboard.opd_closed_desc')}</p>
            </div>
          </div>
        )}
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase text-slate-400 mb-2">{t('public_dashboard.select_hospital')}</label>
            <select 
              className="w-full px-4 py-3 font-bold border outline-none rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-teal-500"
              value={selectedHospital}
              onChange={handleHospitalChange}
            >
              <option value="">{t('public_dashboard.choose_hospital')}</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} - {h.district}</option>
              ))}
            </select>
          </div>

          {doctors.length > 0 && (
            <div>
              <label className="block text-sm font-bold uppercase text-slate-400 mb-2">{t('public_dashboard.select_dept_doctor')}</label>
              <select 
                className="w-full px-4 py-3 font-bold border outline-none rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-teal-500"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.roomNumber} - Dr. {doc.doctorName} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Leaflet Map */}
          {hospitals.length > 0 && (
            <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative">
              <MapContainer 
                center={[7.8731, 80.7718]} // Center of Sri Lanka
                zoom={7} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {hospitals.map(h => (
                  <Marker 
                    key={h.id} 
                    position={[h.latitude || 0, h.longitude || 0]}
                    eventHandlers={{
                      click: () => {
                        handleHospitalChange({ target: { value: h.id } });
                      },
                    }}
                  >
                    <Popup>
                      <strong>{h.name}</strong><br/>
                      {h.district}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
          
          <button 
            onClick={handleCheckQueue}
            disabled={loading || !selectedDoctorId}
            className="w-full py-4 text-white font-black bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-lg shadow-teal-600/20 disabled:opacity-50"
          >
            {loading ? t('public_dashboard.checking') : t('public_dashboard.check_live_queue')}
          </button>
          
          {error && <p className="text-red-500 font-bold">{error}</p>}
          
          {doctorQueueData && (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-black text-slate-800 mb-6 text-center">{doctorQueueData.roomName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 text-center">
                  <span className="block text-sm font-bold text-slate-400 mb-2">{t('public_dashboard.normal_queue')}</span>
                  <span className="text-3xl font-black text-slate-700">{doctorQueueData.pendingNormalCount}</span>
                </div>
                <div className="p-6 bg-rose-50 rounded-xl shadow-sm border border-rose-100 text-center">
                  <span className="block text-sm font-bold text-rose-500 mb-2">{t('public_dashboard.priority_queue')}</span>
                  <span className="text-3xl font-black text-rose-600">{doctorQueueData.pendingPriorityCount}</span>
                </div>
                <div className="p-6 bg-slate-800 rounded-xl shadow-sm border border-slate-700 text-center">
                  <span className="block text-sm font-bold text-slate-400 mb-2">{t('public_dashboard.total_waiting')}</span>
                  <span className="text-3xl font-black text-white">{doctorQueueData.pendingCount}</span>
                </div>
              </div>
              <div className="p-6 bg-teal-50 rounded-xl shadow-sm border border-teal-100 text-center">
                <span className="block text-sm font-bold text-teal-600 mb-2">{t('public_dashboard.estimated_wait_time')}</span>
                <span className="text-2xl font-black text-teal-700">{doctorQueueData.waitTime}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PublicDashboard;
