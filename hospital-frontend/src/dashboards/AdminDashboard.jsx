import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function AdminDashboard({ user, activeTab }) {
  const [doctors, setDoctors] = useState([]);
  const [counters, setCounters] = useState([]);
  
  // Doctor Form State
  const [formData, setFormData] = useState({
    doctorName: '', specialization: '', roomNumber: 'OPD Room 01',
    nicNumber: '', phoneNumber: '', password: '', isAvailable: true
  });

  // Counter Form State
  const [counterFormData, setCounterFormData] = useState({
    fullName: '', counterNumber: 'Counter 01',
    nicNumber: '', phoneNumber: '', password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'Manage Counters') {
      fetchCounters();
    } else {
      fetchDoctors();
    }
  }, [activeTab]);

  const fetchCounters = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/counters/all');
      if (response.ok) {
        const data = await response.json();
        setCounters(data);
      }
    } catch (err) {
      console.error("Error fetching counters:", err);
    }
  };

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
      if (activeTab === 'Manage Counters') {
        const payload = { ...counterFormData, hospitalId: user?.hospitalId };
        const response = await fetch('http://localhost:8080/api/counters/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), 
        });

        if (response.ok) {
          alert("කවුන්ටරය සාර්ථකව රෙජිස්ටර් කළා මචන්! ✅");
          setCounterFormData({ fullName: '', counterNumber: 'Counter 01', nicNumber: '', phoneNumber: '', password: '' });
          fetchCounters();
        } else {
          const errMsg = await response.text();
          setError(errMsg || "Counter Registration failed");
        }
      } else {
        const payload = { ...formData, hospitalId: user?.hospitalId };
        const response = await fetch('http://localhost:8080/api/doctors/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), 
        });

        if (response.ok) {
          alert("දොස්තරව සාර්ථකව රෙජිස්ටර් කළා මචන්! ✅");
          setFormData({ doctorName: '', specialization: '', roomNumber: 'OPD Room 01', nicNumber: '', phoneNumber: '', password: '', isAvailable: true });
          fetchDoctors();
        } else {
          const errMsg = await response.text();
          setError(errMsg || "Registration failed");
        }
      }
    } catch (err) {
      setError("Server Error!");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCounter = (counter) => {
    Swal.fire({
      title: 'Edit Counter Staff',
      html: `
        <input id="swal-fullName" class="swal2-input" placeholder="Full Name" value="${counter.fullName || ''}">
        <select id="swal-counterNumber" class="swal2-input">
          <option value="Counter 01" ${counter.counterNumber === 'Counter 01' ? 'selected' : ''}>Counter 01</option>
          <option value="Counter 02" ${counter.counterNumber === 'Counter 02' ? 'selected' : ''}>Counter 02</option>
          <option value="Main Counter" ${counter.counterNumber === 'Main Counter' ? 'selected' : ''}>Main Counter</option>
        </select>
        <input id="swal-nicNumber" class="swal2-input" placeholder="NIC (Login)" value="${counter.user?.nicNumber || ''}">
        <input id="swal-phoneNumber" class="swal2-input" placeholder="Phone" value="${counter.user?.phoneNumber || ''}">
        <input id="swal-password" type="password" class="swal2-input" placeholder="New Password (Optional)">
      `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        return {
          fullName: document.getElementById('swal-fullName').value,
          counterNumber: document.getElementById('swal-counterNumber').value,
          nicNumber: document.getElementById('swal-nicNumber').value,
          phoneNumber: document.getElementById('swal-phoneNumber').value,
          password: document.getElementById('swal-password').value
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/counters/update/${counter.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value)
          });
          if(response.ok) {
            Swal.fire('Updated!', 'Counter updated successfully', 'success');
            fetchCounters();
          } else {
            Swal.fire('Error', await response.text(), 'error');
          }
        } catch(e) { Swal.fire('Error', 'Server error', 'error'); }
      }
    });
  };

  const handleDeleteCounter = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the staff and their login access!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/counters/delete/${id}`, { method: 'DELETE' });
          if(response.ok) {
            Swal.fire('Deleted!', 'Counter staff has been deleted.', 'success');
            fetchCounters();
          } else {
            Swal.fire('Error', await response.text(), 'error');
          }
        } catch(e) { Swal.fire('Error', 'Server error', 'error'); }
      }
    });
  };

  const handleEditDoctor = (doc) => {
    Swal.fire({
      title: 'Edit Doctor',
      html: `
        <input id="swal-docName" class="swal2-input" placeholder="Doctor Name" value="${doc.doctorName || ''}">
        <input id="swal-docSpec" class="swal2-input" placeholder="Specialization" value="${doc.specialization || ''}">
        <select id="swal-docRoom" class="swal2-input">
          <option value="OPD Room 01" ${doc.roomNumber === 'OPD Room 01' ? 'selected' : ''}>OPD Room 01</option>
          <option value="OPD Room 02" ${doc.roomNumber === 'OPD Room 02' ? 'selected' : ''}>OPD Room 02</option>
          <option value="Dental Clinic" ${doc.roomNumber === 'Dental Clinic' ? 'selected' : ''}>Dental Clinic</option>
        </select>
        <input id="swal-docNic" class="swal2-input" placeholder="NIC (Login)" value="${doc.nicNumber || ''}">
        <input id="swal-docPhone" class="swal2-input" placeholder="Phone" value="${doc.phoneNumber || ''}">
        <input id="swal-docPass" type="password" class="swal2-input" placeholder="New Password (Optional)">
        <select id="swal-docAvail" class="swal2-input">
          <option value="true" ${doc.isAvailable ? 'selected' : ''}>Available</option>
          <option value="false" ${!doc.isAvailable ? 'selected' : ''}>On Leave</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        return {
          doctorName: document.getElementById('swal-docName').value,
          specialization: document.getElementById('swal-docSpec').value,
          roomNumber: document.getElementById('swal-docRoom').value,
          nicNumber: document.getElementById('swal-docNic').value,
          phoneNumber: document.getElementById('swal-docPhone').value,
          password: document.getElementById('swal-docPass').value,
          isAvailable: document.getElementById('swal-docAvail').value === 'true'
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/doctors/update/${doc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value)
          });
          if(response.ok) {
            Swal.fire('Updated!', 'Doctor updated successfully', 'success');
            fetchDoctors();
          } else {
            Swal.fire('Error', await response.text(), 'error');
          }
        } catch(e) { Swal.fire('Error', 'Server error', 'error'); }
      }
    });
  };

  const handleDeleteDoctor = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the doctor and their login access!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/doctors/delete/${id}`, { method: 'DELETE' });
          if(response.ok) {
            Swal.fire('Deleted!', 'Doctor has been deleted.', 'success');
            fetchDoctors();
          } else {
            Swal.fire('Error', await response.text(), 'error');
          }
        } catch(e) { Swal.fire('Error', 'Server error', 'error'); }
      }
    });
  };

  return (
    <div className="min-h-screen p-8 space-y-10 bg-slate-50">
      
      {/* REGISTER FORM */}
      <div className="max-w-4xl p-8 mx-auto bg-white border shadow-sm rounded-3xl border-slate-200">
        <h3 className="mb-6 text-2xl font-black text-slate-800">
          {activeTab === 'Manage Counters' ? '🧑‍💻 Register Counter Staff' : '👨‍⚕️ Register New Doctor'}
        </h3>
        
        {error && (
          <div className="p-4 mb-4 text-sm font-bold text-rose-700 bg-rose-50 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {activeTab === 'Manage Counters' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">Staff Full Name</label>
                <input 
                  type="text" required placeholder="Saman Perera"
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={counterFormData.fullName}
                  onChange={(e) => setCounterFormData({...counterFormData, fullName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">Assigned Counter</label>
                <select 
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 text-slate-700"
                  value={counterFormData.counterNumber}
                  onChange={(e) => setCounterFormData({...counterFormData, counterNumber: e.target.value})}
                >
                  <option value="Counter 01">Counter 01</option>
                  <option value="Counter 02">Counter 02</option>
                  <option value="Main Counter">Main Counter</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">NIC Number (For Login)</label>
                <input 
                  type="text" required placeholder="199512345678"
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={counterFormData.nicNumber}
                  onChange={(e) => setCounterFormData({...counterFormData, nicNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">Phone Number</label>
                <input 
                  type="text" required placeholder="0771234567"
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={counterFormData.phoneNumber}
                  onChange={(e) => setCounterFormData({...counterFormData, phoneNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">Login Password</label>
                <input 
                  type="password" required placeholder="••••••••" 
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={counterFormData.password}
                  onChange={(e) => setCounterFormData({...counterFormData, password: e.target.value})}
                />
              </div>
              
              <div className="flex items-end">
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg">
                  {loading ? "Saving to Registry..." : "Add Counter Staff"}
                </button>
              </div>
            </>
          ) : (
            <>
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
                </select>
              </div>

              <div className="flex items-end">
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg">
                  {loading ? "Saving to Registry..." : "Add Doctor to Registry"}
                </button>
              </div>
            </>
          )}

        </form>
      </div>

      {/* TABLE */}
      <div className="max-w-6xl mx-auto overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800">
            {activeTab === 'Manage Counters' ? 'Hospital Counter Staff' : 'Hospital Medical Registry'}
          </h3>
          <span className="px-4 py-1 text-xs font-black text-teal-700 uppercase bg-teal-100 rounded-full">
            Total: {activeTab === 'Manage Counters' ? counters.length : doctors.length} {activeTab === 'Manage Counters' ? 'Staff' : 'Doctors'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase border-b text-slate-400 bg-slate-50/80 border-slate-100">
                {activeTab === 'Manage Counters' ? (
                  <>
                    <th className="p-6">Staff Name</th>
                    <th className="p-6">Counter Number</th>
                    <th className="p-6">Phone Number</th>
                    <th className="p-6 text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="p-6">Doctor Name</th>
                    <th className="p-6">Specialization</th>
                    <th className="p-6">Room Number</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'Manage Counters' ? (
                counters.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 font-bold text-center text-slate-400">
                      Registry එකේ දැනට කවුන්ටර් Staff කවුරුත් නෑ මචන්!
                    </td>
                  </tr>
                ) : (
                  counters.map((counter) => (
                    <tr key={counter.id} className="transition hover:bg-slate-50/80">
                      <td className="p-6 font-bold text-slate-700">{counter.fullName || 'නමක් නෑ'}</td>
                      <td className="p-6 font-semibold text-teal-700">{counter.counterNumber || 'Counter නෑ'}</td>
                      <td className="p-6 font-medium text-slate-500">{counter.user?.phoneNumber || 'Phone නෑ'}</td>
                      <td className="p-6 space-x-2 text-right">
                        <button onClick={() => handleEditCounter(counter)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">Edit</button>
                        <button onClick={() => handleDeleteCounter(counter.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">Delete</button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                doctors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 font-bold text-center text-slate-400">
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
                      <td className="p-6 space-x-2 text-right">
                        <button onClick={() => handleEditDoctor(doc)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">Edit</button>
                        <button onClick={() => handleDeleteDoctor(doc.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">Delete</button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;