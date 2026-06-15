import React, { useState, useEffect } from 'react';

function AdminDashboard({ user }) {
  const [doctors, setDoctors] = useState([]);
  
  // 💡 Phone Number එකත් ස්ටේට් එකට එකතු කළා මචන්
  const [formData, setFormData] = useState({
    doctorName: '',
    specialization: '',
    roomNumber: 'OPD Room 01',
    nicNumber: '',
    phoneNumber: '',  // 👈 මෙන්න අලුතින් දැම්මා
    password: '',
    isAvailable: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/doctors/all');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = { ...formData, hospitalId: user?.hospitalId };
      const response = await fetch('http://localhost:8080/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });

      if (response.ok) {
        alert("දොස්තරව සාර්ථකව රෙජිස්ටර් කළා මචන්! ✅");
        setFormData({
          doctorName: '', specialization: '', roomNumber: 'OPD Room 01', nicNumber: '', phoneNumber: '', password: '', isAvailable: true
        });
        fetchDoctors();
      } else {
        const errMsg = await response.text();
        setError(errMsg || "Registration failed");
      }
    } catch (err) {
      setError("Server Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-10 bg-slate-50">
      
      {/* REGISTER FORM */}
      <div className="max-w-4xl p-8 mx-auto bg-white border shadow-sm rounded-3xl border-slate-200">
        <h3 className="mb-6 text-2xl font-black text-slate-800">👨‍⚕️ Register New Doctor</h3>
        
        {error && (
          <div className="p-4 mb-4 text-sm font-bold text-rose-700 bg-rose-50 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Doctor Name</label>
            <input 
              type="text" required placeholder="Dr. Kavindu"
              className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
              value={formData.doctorName}
              onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Specialization</label>
            <input 
              type="text" required placeholder="Cardiologist" 
              className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
              value={formData.specialization}
              onChange={(e) => setFormData({...formData, specialization: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">NIC Number (For Login)</label>
            <input 
              type="text" required placeholder="199512345678"
              className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
              value={formData.nicNumber}
              onChange={(e) => setFormData({...formData, nicNumber: e.target.value})}
            />
          </div>

          {/* 📞 NEW INPUT: PHONE NUMBER */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Phone Number</label>
            <input 
              type="text" required placeholder="0771234567"
              className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Login Password</label>
            <input 
              type="password" required placeholder="••••••••" 
              className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Assigned Room</label>
            <select 
              className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 text-slate-700"
              value={formData.roomNumber}
              onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
            >
              <option value="OPD Room 01">OPD Room 01 (සාමාන්‍ය රෝග)</option>
              <option value="OPD Room 02">OPD Room 02</option>
              <option value="Dental Clinic">Dental Clinic</option>
              <option value="Counter 01">Counter 01</option>
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg">
              {loading ? "Saving to Registry..." : "Add Doctor to Registry"}
            </button>
          </div>

        </form>
      </div>

      {/* TABLE */}
      <div className="max-w-6xl mx-auto overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800">Hospital Medical Registry</h3>
          <span className="px-4 py-1 text-xs font-black text-teal-700 uppercase bg-teal-100 rounded-full">
            Total: {doctors.length} Doctors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase border-b text-slate-400 bg-slate-50/80 border-slate-100">
                <th className="p-6">Doctor Name</th>
                <th className="p-6">Specialization</th>
                <th className="p-6">Room Number</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 font-bold text-center text-slate-400">
                    Registry එකේ දැනට දොස්තරලා කවුරුත් නෑ මචන්!
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-slate-50/80">
                    <td className="p-6 font-bold text-slate-700">{doc.doctorName || 'නමක් නෑ'}</td>
                    <td className="p-6 font-medium text-slate-500">{doc.specialization || 'විශේෂඥතාවක් නෑ'}</td>
                    <td className="p-6 font-semibold text-teal-700">{doc.roomNumber || 'කාමරයක් නෑ'}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        doc.isAvailable === true || doc.isAvailable === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {doc.isAvailable === true || doc.isAvailable === 1 ? 'AVAILABLE' : 'ON LEAVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;