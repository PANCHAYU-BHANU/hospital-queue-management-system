import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [doctorQueueData, setDoctorQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/hospital/all');
      const data = await res.json();
      setHospitals(data);
      if (data.length > 0) {
        setSelectedHospital(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load hospitals", err);
    }
  };

  const handleCheckQueue = async () => {
    if (!selectedHospital) return;
    setLoading(true);
    setError(null);
    setDoctorQueueData(null);
    
    // In a real scenario, we might select a specific doctor/room from the hospital.
    // For this prototype, we'll assume doctor ID 1 is the main OPD doctor.
    // Ideally, we fetch doctors for this hospital. Let's hardcode doctorId 1 for now or 
    // we could fetch all doctors. For simplicity, we just fetch wait time for doctorId 1.
    const doctorId = 1;

    try {
      // Get estimated wait time
      const waitRes = await fetch(`http://localhost:8080/api/queue/estimate-wait-time/${doctorId}`);
      const waitText = await waitRes.text();

      // Get current queue
      const queueRes = await fetch(`http://localhost:8080/api/queue/doctor/${doctorId}`);
      const queueData = await queueRes.json();
      
      const pendingCount = queueData.filter(q => q.status === 'PENDING').length;
      
      setDoctorQueueData({
        waitTime: waitText,
        pendingCount: pendingCount
      });
      
    } catch (err) {
      setError("Failed to fetch queue data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 bg-white shadow-sm flex items-center justify-between border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-800">🏥 Live OPD Queue Status</h1>
        <button 
          onClick={onBackToLogin}
          className="text-sm font-bold text-slate-500 hover:text-slate-800 transition"
        >
          &larr; Back to Login
        </button>
      </header>
      
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase text-slate-400 mb-2">Select Hospital</label>
            <select 
              className="w-full px-4 py-3 font-bold border outline-none rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-teal-500"
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
            >
              <option value="">-- Choose Hospital --</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} - {h.district}</option>
              ))}
            </select>
          </div>

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
                        setSelectedHospital(h.id);
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
            disabled={loading || !selectedHospital}
            className="w-full py-4 text-white font-black bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-lg shadow-teal-600/20 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Live Queue"}
          </button>
          
          {error && <p className="text-red-500 font-bold">{error}</p>}
          
          {doctorQueueData && (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-black text-slate-800 mb-6 text-center">General OPD Room 01</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 text-center">
                  <span className="block text-sm font-bold text-slate-400 mb-2">Patients Waiting</span>
                  <span className="text-4xl font-black text-slate-700">{doctorQueueData.pendingCount}</span>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 text-center">
                  <span className="block text-sm font-bold text-slate-400 mb-2">Estimated Wait Time</span>
                  <span className="text-2xl font-black text-teal-600">{doctorQueueData.waitTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PublicDashboard;
