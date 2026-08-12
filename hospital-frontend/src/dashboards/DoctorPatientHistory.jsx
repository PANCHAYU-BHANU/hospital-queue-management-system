import React, { useState } from 'react';
import Swal from 'sweetalert2';

// 💊 Mock list of pharmacy medicines
const PHARMACY_MEDICINES = [
  'Paracetamol 500mg',
  'Amoxicillin 250mg',
  'Amoxicillin 500mg',
  'Vitamin C',
  'Ibuprofen 400mg',
  'Omeprazole 20mg',
  'Losartan 50mg',
  'Metformin 500mg',
  'Atorvastatin 20mg',
  'Cetirizine 10mg'
];

function DoctorPatientHistory({ user }) {
  const [searchNic, setSearchNic] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    diagnosis: '',
    selectedMedicines: [],
    externalMedicines: '',
    notes: ''
  });

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchNic.trim()) {
      Swal.fire('Warning', 'Please enter a NIC number to search.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/medical-records/search?nic=${searchNic.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        setSearched(true);
        setShowAddForm(false);
      } else {
        Swal.fire('Error', 'Failed to fetch patient records.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Server connection failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMedicine = (med) => {
    setFormData(prev => {
      const isSelected = prev.selectedMedicines.includes(med);
      if (isSelected) {
        return { ...prev, selectedMedicines: prev.selectedMedicines.filter(m => m !== med) };
      } else {
        return { ...prev, selectedMedicines: [...prev.selectedMedicines, med] };
      }
    });
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!formData.diagnosis.trim()) {
      Swal.fire('Warning', 'Diagnosis is required.', 'warning');
      return;
    }

    setLoading(true);
    const requestPayload = {
      nicNumber: searchNic.trim(),
      doctorId: user.doctorId || user.id,
      diagnosis: formData.diagnosis,
      pharmacyMedicines: JSON.stringify(formData.selectedMedicines),
      externalMedicines: formData.externalMedicines,
      notes: formData.notes
    };

    try {
      const res = await fetch('http://localhost:8080/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (res.ok) {
        Swal.fire('Success', 'Medical Record added successfully!', 'success');
        setShowAddForm(false);
        setFormData({ diagnosis: '', selectedMedicines: [], externalMedicines: '', notes: '' });
        handleSearch(); // Refresh the list
      } else {
        const errText = await res.text();
        Swal.fire('Error', errText || 'Failed to add record.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Server connection failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 mb-4">🔍 Search Patient History</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Patient NIC (e.g., 982132332V)"
            value={searchNic}
            onChange={(e) => setSearchNic(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md shadow-teal-600/20 disabled:bg-slate-400"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Add New Record Form */}
      {searched && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-700">Patient Records</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 font-bold rounded-lg text-sm transition ${
                showAddForm ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
              }`}
            >
              {showAddForm ? 'Cancel Adding' : '+ Add New Record'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmitRecord} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Diagnosis / Illness <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Viral Fever"
                  value={formData.diagnosis}
                  onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Hospital Pharmacy Medicines (Click to select)</label>
                <div className="flex flex-wrap gap-2">
                  {PHARMACY_MEDICINES.map((med, idx) => {
                    const isSelected = formData.selectedMedicines.includes(med);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleMedicine(med)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition border ${
                          isSelected 
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-300 hover:border-teal-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{med}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">External Medicines / Manual Entry</label>
                <textarea
                  rows="2"
                  placeholder="Write medicines not found in the pharmacy list..."
                  value={formData.externalMedicines}
                  onChange={e => setFormData({...formData, externalMedicines: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Doctor's Notes</label>
                <textarea
                  rows="2"
                  placeholder="Any additional remarks..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md disabled:bg-slate-400"
                >
                  {loading ? 'Saving...' : 'Save Medical Record'}
                </button>
              </div>
            </form>
          )}

          {/* Records List */}
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-300">
                No past medical records found for this patient.
              </div>
            ) : (
              records.map(record => {
                const formatMeds = (jsonString) => {
                  try {
                    const parsed = JSON.parse(jsonString || '[]');
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      if (typeof parsed[0] === 'string') {
                        return parsed.join(', ');
                      } else {
                        return parsed.map(item => `${item.name} (${item.frequency} for ${item.days} days)`).join(' • ');
                      }
                    }
                    return 'None';
                  } catch (e) {
                    return jsonString && jsonString !== '[]' ? jsonString : 'None';
                  }
                };
                return (
                <div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-lg text-slate-800">{record.diagnosis}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {new Date(record.createdAt).toLocaleDateString()} • Dr. {record.doctorName} • {record.hospitalName}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      Age: {record.patientAgeAtConsultation}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="block font-bold text-slate-500 mb-1">Pharmacy Medicines:</span>
                      <p className="text-slate-700">{formatMeds(record.pharmacyMedicines)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="block font-bold text-slate-500 mb-1">External Medicines:</span>
                      <p className="text-slate-700">{formatMeds(record.externalMedicines)}</p>
                    </div>
                    {record.notes && (
                      <div className="md:col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <span className="block font-bold text-amber-700 mb-1">Doctor's Notes:</span>
                        <p className="text-amber-900">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPatientHistory;
