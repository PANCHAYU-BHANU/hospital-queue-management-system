import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

function PharmacistDashboard({ user, activeTab: propTab }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(propTab === 'Medicine Inventory' ? 'INVENTORY' : 'QUEUE'); // 'INVENTORY' or 'QUEUE'
  
  useEffect(() => {
    if (propTab === 'Medicine Inventory') {
      setActiveTab('INVENTORY');
    } else if (propTab === 'Pharmacy Queue') {
      setActiveTab('QUEUE');
    }
  }, [propTab]);
  
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [pharmacyQueue, setPharmacyQueue] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pills'
  });

  const hospitalId = user?.hospitalId || 1;

  useEffect(() => {
    if (activeTab === 'INVENTORY') {
      fetchMedicines(hospitalId);
    } else {
      fetchPharmacyQueue();
    }
  }, [activeTab]);

  useEffect(() => {
    // Polling for queue
    const interval = setInterval(() => {
      if (activeTab === 'QUEUE') {
        fetchPharmacyQueue();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchMedicines = async (hospitalId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/medicines/hospital/${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPharmacyQueue = async () => {
    try {
      const res1 = await fetch(`http://localhost:8080/api/queue/pharmacy-queue/${hospitalId}`);
      const res2 = await fetch(`http://localhost:8080/api/queue/pending-payments/${hospitalId}`);
      
      let data = [];
      if (res1.ok) {
        data = [...data, ...(await res1.json())];
      }
      if (res2.ok) {
        data = [...data, ...(await res2.json())];
      }
      
      // Sort by consultation end time so the earliest comes first
      data.sort((a, b) => new Date(a.consultationEndTime) - new Date(b.consultationEndTime));
        
        // Fetch medical record for each queue item to get the prescribed medicines
        const updatedData = await Promise.all(data.map(async (queueItem) => {
          try {
             // To get the medicines, we fetch the medical records of the patient.
             // We just need the most recent one.
             const recordsRes = await fetch(`http://localhost:8080/api/medical-records/search?nic=${queueItem.patientNic}`);
             if (recordsRes.ok) {
                const records = await recordsRes.json();
                if (records && records.length > 0) {
                  // Assuming the first one is the most recent (sorted descending in backend)
                  const latestRecord = records[0]; 
                  return { ...queueItem, latestRecord };
                }
             }
          } catch(e) { console.error(e) }
          return queueItem;
        }));

        setPharmacyQueue(updatedData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/medicines/hospital/${hospitalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        Swal.fire(t('pharmacist_dashboard.swal_success', 'Success'), t('pharmacist_dashboard.swal_medicine_added', 'Medicine added successfully!'), 'success');
        setShowAddForm(false);
        setFormData({ name: '', quantity: '', unit: 'pills' });
        fetchMedicines(hospitalId);
      } else {
        const errText = await res.text();
        Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), errText || t('pharmacist_dashboard.swal_medicine_add_failed', 'Failed to add medicine.'), 'error');
      }
    } catch (err) {
      Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), t('pharmacist_dashboard.swal_server_error', 'Server error.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (medicineId, currentQuantity) => {
    const { value: quantityToAdd } = await Swal.fire({
      title: t('pharmacist_dashboard.swal_update_stock_title', 'Update Stock'),
      input: 'number',
      inputLabel: t('pharmacist_dashboard.swal_update_stock_label', 'Enter quantity to ADD (use negative to remove)'),
      inputPlaceholder: t('pharmacist_dashboard.swal_update_stock_placeholder', 'e.g. 100'),
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || isNaN(value)) {
          return t('pharmacist_dashboard.swal_invalid_number', 'Please enter a valid number!');
        }
      }
    });

    if (quantityToAdd) {
      const qty = parseInt(quantityToAdd);
      if (currentQuantity + qty < 0) {
        Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), t('pharmacist_dashboard.swal_negative_stock', 'Stock cannot be negative!'), 'error');
        return;
      }

      try {
        const res = await fetch(`http://localhost:8080/api/medicines/${medicineId}/stock`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantityToAdd: qty })
        });

        if (res.ok) {
          Swal.fire(t('pharmacist_dashboard.swal_success', 'Success'), t('pharmacist_dashboard.swal_stock_updated', 'Stock updated!'), 'success');
          fetchMedicines(hospitalId);
        } else {
          Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), t('pharmacist_dashboard.swal_stock_update_failed', 'Failed to update stock.'), 'error');
        }
      } catch (err) {
        Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), t('pharmacist_dashboard.swal_server_error', 'Server error.'), 'error');
      }
    }
  };

  const handlePackAndComplete = async (queueId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/queue/pharmacy-complete/${queueId}`, {
        method: 'PUT'
      });
      if (res.ok) {
        Swal.fire({
          title: t('pharmacist_dashboard.swal_success', 'Success'),
          text: t('pharmacist_dashboard.swal_dispensed', 'Medicines dispensed successfully!'),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchPharmacyQueue();
      } else {
        Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), t('pharmacist_dashboard.swal_complete_failed', 'Failed to complete process.'), 'error');
      }
    } catch (err) {
      Swal.fire(t('pharmacist_dashboard.swal_error', 'Error'), t('pharmacist_dashboard.swal_server_error', 'Server error.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPharmacyMedsForDisplay = (jsonString) => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-8 bg-slate-50 min-h-screen">
      
      {/* 🏢 Welcome Banner */}
      <div className="p-6 text-white bg-slate-800 shadow-sm rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">{t('pharmacist_dashboard.welcome', 'Welcome,')} {user?.fullName || t('pharmacist_dashboard.pharmacist_default_name', 'Pharmacist')}!</h1>
          <p className="mt-1 text-sm font-medium text-slate-300">
            {t('pharmacist_dashboard.hospital_pharmacy_ops', 'Hospital Pharmacy Operations')}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-700/50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('QUEUE')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'QUEUE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
          >
            {t('pharmacist_dashboard.tab_pharmacy_queue', '📋 Pharmacy Queue')}
          </button>
          <button 
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'INVENTORY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
          >
            {t('pharmacist_dashboard.tab_medicine_inventory', '💊 Medicine Inventory')}
          </button>
        </div>
      </div>

      {activeTab === 'QUEUE' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="text-3xl">📋</span> {t('pharmacist_dashboard.tab_pharmacy_queue', 'Pharmacy Queue').replace('📋 ', '')}
            </h2>
            <p className="text-slate-500 mt-1">{t('pharmacist_dashboard.patients_waiting', 'Patients waiting to collect their medicines.')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pharmacyQueue.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                 <span className="text-4xl">☕</span>
                 <h3 className="text-lg font-bold text-slate-600 mt-4">{t('pharmacist_dashboard.queue_is_empty', 'Queue is Empty')}</h3>
                 <p className="text-sm text-slate-400">{t('pharmacist_dashboard.no_patients_waiting', 'No patients are waiting at the pharmacy.')}</p>
              </div>
            ) : (
              pharmacyQueue.map(patient => {
                const prescribedMeds = patient.latestRecord ? formatPharmacyMedsForDisplay(patient.latestRecord.pharmacyMedicines) : [];
                return (
                  <div key={patient.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl flex items-center justify-center font-black text-xl">
                            #{patient.tokenNumber}
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-slate-800">{patient.patientName}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('pharmacist_dashboard.dr', 'Dr.')} {patient.doctorName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">{t('pharmacist_dashboard.prescribed_medicines', 'Prescribed Medicines')}</h4>
                        {prescribedMeds.length > 0 ? (
                          <ul className="space-y-3">
                            {prescribedMeds.map((med, idx) => {
                              // Handle both new format (object) and old format (string)
                              if (typeof med === 'string') {
                                return <li key={idx} className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="text-teal-500">✓</span> {med}</li>;
                              }
                              return (
                                <li key={idx} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                  <span className="font-bold text-slate-700">{med.name}</span>
                                  <div className="text-right">
                                    <span className="block text-xs text-slate-500">{med.frequency} <strong className="text-teal-600">({med.mealTiming || t('pharmacist_dashboard.after_meal', 'After Meal')})</strong> x {med.days} {t('pharmacist_dashboard.days', 'Days')}</span>
                                    <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-black rounded mt-1">{t('pharmacist_dashboard.qty', 'QTY:')} {med.totalQuantity}</span>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400 font-medium">{t('pharmacist_dashboard.no_pharmacy_meds', 'No pharmacy medicines prescribed.')}</p>
                        )}
                      </div>
                    </div>
                    
                    {patient.status === 'PENDING_PAYMENT' ? (
                      <button
                        disabled
                        className="w-full py-3 bg-amber-100 text-amber-700 font-black rounded-xl cursor-not-allowed border border-amber-200"
                      >
                        {t('pharmacist_dashboard.waiting_for_patient', '⏳ Waiting for Patient to Accept...')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePackAndComplete(patient.id)}
                        disabled={loading}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {loading ? t('pharmacist_dashboard.processing', 'Processing...') : t('pharmacist_dashboard.pack_and_complete', 'Pack & Complete 🚀')}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <span className="text-3xl">💊</span> {t('pharmacist_dashboard.tab_medicine_inventory', 'Medicine Inventory').replace('💊 ', '')}
              </h2>
              <p className="text-slate-500 mt-1">{t('pharmacist_dashboard.manage_medicines', 'Manage medicines and track available stock.')}</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-5 py-2.5 font-bold rounded-xl text-sm transition shadow-sm ${
                showAddForm ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-800/20'
              }`}
            >
              {showAddForm ? t('pharmacist_dashboard.cancel', 'Cancel') : t('pharmacist_dashboard.add_new_medicine', '+ Add New Medicine')}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddMedicine} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('pharmacist_dashboard.medicine_name', 'Medicine Name')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('pharmacist_dashboard.medicine_name_placeholder', 'e.g. Paracetamol 500mg')}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('pharmacist_dashboard.initial_quantity', 'Initial Quantity')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder={t('pharmacist_dashboard.initial_quantity_placeholder', 'e.g. 1000')}
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('pharmacist_dashboard.unit', 'Unit')}</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="pills">{t('pharmacist_dashboard.unit_pills', 'Pills / Tablets')}</option>
                    <option value="bottles">{t('pharmacist_dashboard.unit_bottles', 'Bottles')}</option>
                    <option value="tubes">{t('pharmacist_dashboard.unit_tubes', 'Tubes')}</option>
                    <option value="vials">{t('pharmacist_dashboard.unit_vials', 'Vials')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
              <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md disabled:bg-slate-400"
                >
                  {loading ? t('pharmacist_dashboard.adding', 'Adding...') : t('pharmacist_dashboard.add_medicine', 'Add Medicine')}
                </button>
              </div>
            </form>
          )}

          {/* SEARCH BAR */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder={t('pharmacist_dashboard.search_medicines', 'Search medicines by name...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {medicines.filter(med => med.name.toLowerCase().includes(searchQuery.toLowerCase())).map(med => (
              <div key={med.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-teal-200 transition">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg text-slate-800 line-clamp-2">{med.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      med.availableQuantity <= 50 ? 'bg-rose-100 text-rose-600' : 
                      med.availableQuantity <= 200 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {med.availableQuantity <= 50 ? t('pharmacist_dashboard.low_stock', 'Low Stock') : t('pharmacist_dashboard.in_stock', 'In Stock')}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-700 mt-4 mb-1">
                    {med.availableQuantity} <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t(`pharmacist_dashboard.unit_${med.unit}`, med.unit)}</span>
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleUpdateStock(med.id, med.availableQuantity)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-bold rounded-xl transition text-sm"
                  >
                    {t('pharmacist_dashboard.update_stock_btn', 'Update Stock 🔄')}
                  </button>
                </div>
              </div>
            ))}
            {medicines.length === 0 && (
              <div className="col-span-3 py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
                {t('pharmacist_dashboard.no_medicines_found', 'No medicines found in the inventory.')}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default PharmacistDashboard;
