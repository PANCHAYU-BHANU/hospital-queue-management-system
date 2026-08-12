import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function ManagePharmacists({ hospitalId }) {
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    nicNumber: '',
    phoneNumber: '',
    password: ''
  });

  const fetchPharmacists = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/pharmacists/hospital/${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setPharmacists(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (hospitalId) {
      fetchPharmacists();
    }
  }, [hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8080/api/pharmacists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hospitalId
        })
      });

      if (res.ok) {
        Swal.fire('Success', 'Pharmacist registered successfully!', 'success');
        setShowAddForm(false);
        setFormData({ fullName: '', nicNumber: '', phoneNumber: '', password: '' });
        fetchPharmacists();
      } else {
        const errText = await res.text();
        Swal.fire('Error', errText || 'Failed to register pharmacist.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Server error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800">💊 Manage Pharmacists</h2>
          <p className="text-slate-500 mt-1">Register and manage pharmacy staff for your hospital.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-5 py-2.5 font-bold rounded-xl text-sm transition shadow-sm ${
            showAddForm ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20'
          }`}
        >
          {showAddForm ? 'Cancel' : '+ Add New Pharmacist'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">NIC Number</label>
              <input
                type="text"
                required
                value={formData.nicNumber}
                onChange={e => setFormData({...formData, nicNumber: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md disabled:bg-slate-400"
            >
              {loading ? 'Saving...' : 'Register Pharmacist'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">NIC Number</th>
              <th className="px-6 py-4">Phone Number</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pharmacists.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium">
                  No pharmacists registered yet.
                </td>
              </tr>
            ) : (
              pharmacists.map(pharmacist => (
                <tr key={pharmacist.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{pharmacist.fullName}</td>
                  <td className="px-6 py-4">{pharmacist.user.nicNumber}</td>
                  <td className="px-6 py-4">{pharmacist.user.phoneNumber}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 text-xs font-bold rounded-full border border-teal-100">Active</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagePharmacists;
