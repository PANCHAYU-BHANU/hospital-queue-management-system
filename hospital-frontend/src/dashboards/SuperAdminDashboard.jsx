import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function SuperAdminDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [hospitalForm, setHospitalForm] = useState({ name: '', district: '', latitude: '', longitude: '' });
  const [adminForm, setAdminForm] = useState({ fullName: '', nicNumber: '', phoneNumber: '', password: '', hospitalId: '' });
  
  const [hLoading, setHLoading] = useState(false);
  const [aLoading, setALoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/hospital/all');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
        if (data.length > 0 && !adminForm.hospitalId) {
          setAdminForm(prev => ({ ...prev, hospitalId: data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
    setTimeout(() => { setError(null); setSuccess(null); }, 5000);
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    setHLoading(true);
    try {
      const payload = {
        name: hospitalForm.name,
        district: hospitalForm.district,
        latitude: parseFloat(hospitalForm.latitude),
        longitude: parseFloat(hospitalForm.longitude)
      };
      const res = await fetch('http://localhost:8080/api/hospital/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showMessage("Hospital added successfully! ✅");
        setHospitalForm({ name: '', district: '', latitude: '', longitude: '' });
        fetchHospitals();
      } else {
        showMessage("Failed to add hospital.", true);
      }
    } catch (err) {
      showMessage("Server error.", true);
    } finally {
      setHLoading(false);
    }
  };

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        setHospitalForm({
          ...hospitalForm,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      },
    });

    useEffect(() => {
      if (hospitalForm.latitude && hospitalForm.longitude && !isNaN(hospitalForm.latitude) && !isNaN(hospitalForm.longitude)) {
        map.flyTo([hospitalForm.latitude, hospitalForm.longitude], map.getZoom(), { duration: 0.5 });
      }
    }, [hospitalForm.latitude, hospitalForm.longitude, map]);

    return hospitalForm.latitude && hospitalForm.longitude && !isNaN(hospitalForm.latitude) && !isNaN(hospitalForm.longitude) ? (
      <Marker position={[hospitalForm.latitude, hospitalForm.longitude]} />
    ) : null;
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setALoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/superadmin/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      const text = await res.text();
      if (res.ok && !text.includes("Error")) {
        showMessage("Hospital Admin added successfully! ✅");
        setAdminForm({ fullName: '', nicNumber: '', phoneNumber: '', password: '', hospitalId: hospitals.length > 0 ? hospitals[0].id : '' });
      } else {
        showMessage(text, true);
      }
    } catch (err) {
      showMessage("Server error.", true);
    } finally {
      setALoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-10 bg-slate-50">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800">👑 Super Admin Control Panel</h2>
      </div>

      {error && <div className="p-4 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">⚠️ {error}</div>}
      {success && <div className="p-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">✅ {success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ADD HOSPITAL FORM */}
        <div className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200">
          <h3 className="mb-6 text-xl font-black text-slate-800">🏥 Add New Hospital</h3>
          <form onSubmit={handleAddHospital} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Hospital Name</label>
              <input required type="text" value={hospitalForm.name} onChange={e => setHospitalForm({...hospitalForm, name: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. National Hospital Colombo" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">District</label>
              <input required type="text" value={hospitalForm.district} onChange={e => setHospitalForm({...hospitalForm, district: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. Colombo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Latitude</label>
                <input required type="number" step="any" value={hospitalForm.latitude} onChange={e => setHospitalForm({...hospitalForm, latitude: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. 6.919" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Longitude</label>
                <input required type="number" step="any" value={hospitalForm.longitude} onChange={e => setHospitalForm({...hospitalForm, longitude: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. 79.869" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Or Click on the Map to Select Location</label>
              <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative">
                <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <LocationMarker />
                </MapContainer>
              </div>
            </div>
            
            <button disabled={hLoading} type="submit" className="w-full py-4 mt-4 font-black text-white transition bg-teal-600 rounded-xl hover:bg-teal-700 shadow-lg disabled:opacity-50">
              {hLoading ? "Adding..." : "Add Hospital"}
            </button>
          </form>
        </div>

        {/* ADD ADMIN FORM */}
        <div className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200">
          <h3 className="mb-6 text-xl font-black text-slate-800">👨‍💼 Assign Hospital Admin</h3>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Assign to Hospital</label>
              <select required value={adminForm.hospitalId} onChange={e => setAdminForm({...adminForm, hospitalId: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 outline-none">
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.district})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Full Name</label>
              <input required type="text" value={adminForm.fullName} onChange={e => setAdminForm({...adminForm, fullName: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. Kamal Perera" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">NIC Number</label>
                <input required type="text" value={adminForm.nicNumber} onChange={e => setAdminForm({...adminForm, nicNumber: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="NIC" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Phone</label>
                <input required type="text" value={adminForm.phoneNumber} onChange={e => setAdminForm({...adminForm, phoneNumber: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="07xxxxxxxx" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Password</label>
              <input required type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="••••••••" />
            </div>
            <button disabled={aLoading || hospitals.length === 0} type="submit" className="w-full py-4 mt-4 font-black text-white transition bg-slate-800 rounded-xl hover:bg-slate-900 shadow-lg disabled:opacity-50">
              {aLoading ? "Assigning..." : "Assign Admin"}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

export default SuperAdminDashboard;
