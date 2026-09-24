import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

function DoctorDashboard({ user }) {
  const { t } = useTranslation();
  const [currentlyTreating, setCurrentlyTreating] = useState(null);
  const [upcomingPatients, setUpcomingPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  // Medical Records State
  const [records, setRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastFetchedNic, setLastFetchedNic] = useState('');
  const [hasSavedRecordForCurrentPatient, setHasSavedRecordForCurrentPatient] = useState(false);
  
  // Hospital Details
  const [hospitalDetails, setHospitalDetails] = useState(null);
  
  // Pharmacy API Integration
  const [availableMedicines, setAvailableMedicines] = useState([]);
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescriptionRows: [], // Array of { id, medicineId, name, frequency, days, totalQuantity }
    externalMedicines: [], // Array of { id, name, frequency, days }
    notes: ''
  });

  const [doctorId, setDoctorId] = useState(() => {
    return parseInt(localStorage.getItem('activeDoctorId')) || user?.doctorId || user?.id || 1;
  });
  const [hospitalId, setHospitalId] = useState(() => {
    return parseInt(localStorage.getItem('activeHospitalId')) || user?.hospitalId || 1;
  });
  const [doctorProfiles, setDoctorProfiles] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/doctors/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setDoctorProfiles(data);
          // Only auto-select if no hospital is currently selected in localStorage and it doesn't match
          const savedHospId = parseInt(localStorage.getItem('activeHospitalId'));
          if (data.length > 0 && !data.find(d => d.hospitalId === hospitalId) && !savedHospId) {
            setHospitalId(data[0].hospitalId);
            setDoctorId(data[0].doctorId);
            localStorage.setItem('activeHospitalId', data[0].hospitalId);
            localStorage.setItem('activeDoctorId', data[0].doctorId);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user?.id]);
  const doctorName = user?.fullName || 'Doctor';

  const fetchDoctorQueue = async () => {
    try {
      const response = await fetch(`/api/queue/doctor/${doctorId}`);
      if (!response.ok) return;
      const data = await response.json();
      
      const active = data.find(p => p.status === 'CALLED' || p.status === 'IN_CONSULTATION');
      setCurrentlyTreating(active || null);
      
      const pending = data.filter(p => p.status === 'PENDING' || p.status === 'PENDING_APPROVAL');
      setUpcomingPatients(pending);
    } catch (error) {
      console.error("Queue load failed:", error);
    }
  };

  const fetchHospitalDetails = async () => {
    try {
      const res = await fetch(`/api/hospital/${hospitalId}`);
      if (res.ok) {
        let data = await res.json();
        
        // If address is missing, fetch from OSM Nominatim using lat/lng
        if (!data.address && data.latitude && data.longitude) {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.latitude}&lon=${data.longitude}`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    data.address = geoData.display_name;
                }
            } catch(e) {
                console.error("Geocoding failed", e);
            }
        }
        
        setHospitalDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailableMedicines = async () => {
    try {
      const res = await fetch(`/api/medicines/hospital/${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableMedicines(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctorQueue();
    fetchAvailableMedicines();
    fetchHospitalDetails();
    const interval = setInterval(fetchDoctorQueue, 5000);
    return () => clearInterval(interval);
  }, [doctorId, hospitalId]);

  // Fetch Medical Records when consultation starts
  useEffect(() => {
    if (currentlyTreating && currentlyTreating.status === 'IN_CONSULTATION' && currentlyTreating.patientNic !== lastFetchedNic) {
      fetchRecords(currentlyTreating.patientNic);
      setLastFetchedNic(currentlyTreating.patientNic);
      setHasSavedRecordForCurrentPatient(false);
      setShowAddForm(false);
    }
  }, [currentlyTreating]);

  const fetchRecords = async (nic) => {
    try {
      const res = await fetch(`/api/medical-records/search?nic=${nic}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPatientDetailsFromNic = (nic) => {
    if (!nic || nic.length < 10) return null;
    let birthYear = 0;
    let dayOfYear = 0;
    if (nic.length === 10) {
      birthYear = parseInt("19" + nic.substring(0, 2));
      dayOfYear = parseInt(nic.substring(2, 5));
    } else if (nic.length === 12) {
      birthYear = parseInt(nic.substring(0, 4));
      dayOfYear = parseInt(nic.substring(4, 7));
    } else return null;

    let gender = "Male";
    if (dayOfYear > 500) {
      gender = "Female";
      dayOfYear -= 500;
    }

    const date = new Date(birthYear, 0); 
    date.setDate(dayOfYear);
    const dob = date.toLocaleDateString();

    const today = new Date();
    let ageYears = today.getFullYear() - birthYear;
    let ageMonths = today.getMonth() - date.getMonth();
    if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < date.getDate())) {
      ageYears--;
      ageMonths += 12;
    }

    return {
      dob, gender, ageString: `${ageYears} Y, ${ageMonths} M`, ageYears
    };
  };

  const handleCallNext = async () => {
    if (upcomingPatients.length === 0) {
      Swal.fire('Queue Empty', 'There are no pending patients in your queue.', 'info');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/queue/next/${doctorId}`);
      if (response.ok) {
        fetchDoctorQueue();
      } else {
        Swal.fire('Error', 'Failed to call the next patient.', 'error');
      }
    } catch (error) {
      console.error("Call next failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async () => {
    if (!currentlyTreating) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/queue/start/${currentlyTreating.id}`, { method: 'PUT' });
      if (response.ok) {
        fetchDoctorQueue();
        fetchAvailableMedicines(); // Fetch fresh medicines stock
      }
    } catch (error) {
      console.error("Start consultation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteConsultation = async (callNext = false) => {
    if (!currentlyTreating) return;
    
    if (!hasSavedRecordForCurrentPatient) {
      Swal.fire('Warning', 'You must save a medical record for this patient before completing the consultation!', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/queue/complete/${currentlyTreating.id}`, { method: 'PUT' });
      if (response.ok) {
        if (callNext) {
          await handleCallNext();
        } else {
          fetchDoctorQueue();
        }
      }
    } catch (error) {
      console.error("Complete consultation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !isAvailable;
    try {
      const res = await fetch(`/api/doctors/${doctorId}/status?isAvailable=${newStatus}`, { method: 'PUT' });
      if (res.ok) {
        setIsAvailable(newStatus);
        Swal.fire('Success', `Status changed to ${newStatus ? 'Active' : 'On Leave'}`, 'success');
      }
    } catch (err) {
      Swal.fire('Error', 'Server error', 'error');
    }
  };

  // 📝 Hospital Pharmacy Form Handlers
  const addPrescriptionRow = () => {
    fetchAvailableMedicines(); // Refresh stock before adding a row
    setFormData(prev => ({
      ...prev,
      prescriptionRows: [
        ...prev.prescriptionRows, 
        { id: Date.now(), medicineId: '', name: '', frequency: '8 Hourly', days: 3, totalQuantity: 0, mealTiming: 'After Meal' }
      ]
    }));
  };

  const removePrescriptionRow = (id) => {
    setFormData(prev => ({
      ...prev,
      prescriptionRows: prev.prescriptionRows.filter(row => row.id !== id)
    }));
  };

  const calculateTotalQuantity = (frequency, days) => {
    const d = parseInt(days) || 0;
    let timesPerDay = 1;
    switch (frequency) {
      case '6 Hourly': timesPerDay = 4; break;
      case '8 Hourly': timesPerDay = 3; break;
      case '12 Hourly': timesPerDay = 2; break;
      case 'Morning Only':
      case 'Night Only': timesPerDay = 1; break;
      case 'Morning & Night': timesPerDay = 2; break;
      default: timesPerDay = 1;
    }
    return timesPerDay * d;
  };

  const updatePrescriptionRow = (id, field, value) => {
    setFormData(prev => {
      const updatedRows = prev.prescriptionRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'medicineId') {
            const med = availableMedicines.find(m => m.id.toString() === value.toString());
            updatedRow.name = med ? med.name : '';
          }
          if (field === 'medicineId' || field === 'frequency' || field === 'days') {
            updatedRow.totalQuantity = calculateTotalQuantity(updatedRow.frequency, updatedRow.days);
          }
          return updatedRow;
        }
        return row;
      });
      return { ...prev, prescriptionRows: updatedRows };
    });
  };

  // 📝 External Medicine Handlers
  const addExternalMedicineRow = () => {
    setFormData(prev => ({
      ...prev,
      externalMedicines: [
        ...prev.externalMedicines, 
        { id: Date.now(), name: '', frequency: '8 Hourly', days: 3, mealTiming: 'After Meal' }
      ]
    }));
  };

  const removeExternalMedicineRow = (id) => {
    setFormData(prev => ({
      ...prev,
      externalMedicines: prev.externalMedicines.filter(row => row.id !== id)
    }));
  };

  const updateExternalMedicineRow = (id, field, value) => {
    setFormData(prev => {
      const updatedRows = prev.externalMedicines.map(row => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      });
      return { ...prev, externalMedicines: updatedRows };
    });
  };

  // 🖨️ Print Prescription
  const printPrescription = () => {
    if (formData.externalMedicines.length === 0 && formData.prescriptionRows.length === 0) {
      Swal.fire('Info', 'No medicines to print in the prescription.', 'info');
      return;
    }

    const patientDetails = getPatientDetailsFromNic(currentlyTreating.patientNic);
    const age = patientDetails ? patientDetails.ageYears : 'N/A';

    const printWindow = window.open('', '', 'height=800,width=800');
    
    // Clean up doctor name to avoid "Dr. Dr."
    const cleanDoctorName = doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;
    
    // Use hospital details if available
    const hospName = hospitalDetails?.name || 'Suwasetha Hospital';
    const hospAddress = hospitalDetails?.address || hospitalDetails?.district || '';
    const hospContact = hospitalDetails?.contactNumber || '011-2345678 / 071-2345678';

    printWindow.document.write(`
      <html>
      <head>
        <title>Prescription - ${currentlyTreating.patientName}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'Arial', sans-serif; color: #1e293b; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .prescription-container { max-width: 100%; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
          .hospital-name { font-size: 28px; font-weight: 900; color: #0f766e; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
          .hospital-address { font-size: 14px; color: #64748b; margin: 0 0 2px 0; }
          .hospital-contact { font-size: 14px; color: #64748b; margin: 0 0 15px 0; font-weight: bold; }
          .doctor-info { font-size: 16px; font-weight: bold; color: #334155; margin-bottom: 5px; }
          
          .patient-box { background: #f8fafc !important; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .patient-box div p { margin: 5px 0; font-size: 14px; }
          .patient-box div p strong { color: #475569; display: inline-block; width: 110px; }

          .rx-title { font-size: 32px; font-weight: 900; color: #0d9488; margin-bottom: 20px; font-style: italic; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px; background: #f1f5f9 !important; color: #475569; border-bottom: 2px solid #94a3b8; font-size: 14px; text-transform: uppercase; }
          td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #0f172a; font-weight: bold; }
          .meta-text { font-size: 13px; color: #64748b; font-weight: normal; margin-top: 4px; display: block; }
          
          .footer { margin-top: 80px; display: flex; justify-content: flex-end; page-break-inside: avoid; }
          .signature-box { text-align: center; width: 250px; }
          .signature-line { border-top: 1px dashed #94a3b8; margin-bottom: 10px; }
          .signature-box p { margin: 0; font-size: 14px; font-weight: bold; color: #475569; }
          .signature-box span { font-size: 12px; color: #94a3b8; display: block; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="prescription-container">
          <div class="header">
            <h1 class="hospital-name">${hospName}</h1>
            <p class="hospital-address">${hospAddress}</p>
            <p class="hospital-contact">📞 ${hospContact}</p>
            <p class="doctor-info">${cleanDoctorName}</p>
            <span style="font-size:14px; font-weight:normal; color:#64748b;">Consultant / OPD</span>
          </div>

        <div class="patient-box">
          <div>
            <p><strong>Patient Name:</strong> ${currentlyTreating.patientName}</p>
            <p><strong>Age:</strong> ${age} Years</p>
          </div>
          <div>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Token:</strong> #${currentlyTreating.tokenNumber}</p>
          </div>
        </div>

        <div class="rx-title">Rx</div>

        <table>
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Dosage Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${formData.externalMedicines.map(med => `
              <tr>
                <td>${med.name || 'Unnamed Medicine'}</td>
                <td>
                  ${med.frequency} <strong style="color:#0d9488;">(${med.mealTiming || 'After Meal'})</strong>
                  <span class="meta-text">Continue for ${med.days} days</span>
                </td>
              </tr>
            `).join('')}
            ${formData.externalMedicines.length === 0 ? '<tr><td colspan="2" style="text-align:center; color:#94a3b8; font-weight:normal;">No external medicines prescribed</td></tr>' : ''}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>${cleanDoctorName}</p>
            <span>Signature & Seal</span>
          </div>
        </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    // Allow styles to load before printing
    setTimeout(() => {
      printWindow.print();
      // Optional: printWindow.close();
    }, 250);
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!formData.diagnosis.trim()) {
      Swal.fire('Warning', 'Diagnosis is required.', 'warning');
      return;
    }

    const invalidMeds = formData.prescriptionRows.filter(r => !r.medicineId);
    if (invalidMeds.length > 0) {
      Swal.fire('Warning', 'Please select a valid medicine for all hospital pharmacy rows, or remove empty rows.', 'warning');
      return;
    }

    const invalidQtyMeds = formData.prescriptionRows.filter(r => r.totalQuantity <= 0);
    if (invalidQtyMeds.length > 0) {
      Swal.fire('Warning', 'Medicine quantity must be greater than zero. Please check frequency and days.', 'warning');
      return;
    }

    const outOfStockMeds = formData.prescriptionRows.filter(r => {
      const med = availableMedicines.find(m => m.id.toString() === r.medicineId.toString());
      return med && r.totalQuantity > med.availableQuantity;
    });

    if (outOfStockMeds.length > 0) {
      const names = outOfStockMeds.map(m => m.name).join(', ');
      Swal.fire('Warning', `The requested quantity for ${names} exceeds the available stock! Please reduce the days/frequency or move it to external medicines.`, 'warning');
      return;
    }

    const invalidExtMeds = formData.externalMedicines.filter(r => !r.name.trim());
    if (invalidExtMeds.length > 0) {
      Swal.fire('Warning', 'Please enter a name for all external medicines, or remove empty rows.', 'warning');
      return;
    }

    setLoading(true);
    const requestPayload = {
      nicNumber: currentlyTreating.patientNic,
      doctorId: doctorId,
      diagnosis: formData.diagnosis,
      pharmacyMedicines: JSON.stringify(formData.prescriptionRows),
      externalMedicines: JSON.stringify(formData.externalMedicines), // Now sending JSON instead of raw string
      notes: formData.notes
    };

    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (res.ok) {
        Swal.fire({
          title: 'Success',
          text: 'Medical Record saved successfully!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        // We do NOT hide the form or clear it yet, so the doctor can print it!
        setHasSavedRecordForCurrentPatient(true);
        fetchRecords(currentlyTreating.patientNic); 
        fetchAvailableMedicines(); // Refresh stock
      } else {
        const errText = await res.text();
        Swal.fire('Error', errText || 'Failed to save record.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Server error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPharmacyMedsForDisplay = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') {
          return parsed.join(', ');
        } else {
          return parsed.map(item => `${item.name} (${item.frequency} for ${item.days} days)`).join(' • ');
        }
      }
      return 'None';
    } catch (e) {
      return jsonString || 'None';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* 🏥 1. Top Bar */}
        <div className="flex flex-col items-center justify-between gap-4 p-6 bg-white border shadow-sm md:flex-row rounded-3xl border-slate-200 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('doctor_dashboard.title', 'Doctor Dashboard')}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
              <p className="text-slate-500 font-medium">{t('doctor_dashboard.subtitle', 'Manage your queue and patient consultations')}</p>
              {hospitalDetails && (
                <>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="text-teal-700 font-bold bg-teal-50 px-3 py-1 rounded-lg text-sm flex items-center gap-1 border border-teal-100">
                    🏥 {hospitalDetails.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleStatus}
              className={`px-6 py-2.5 rounded-xl font-bold transition shadow-sm border ${
                isAvailable 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isAvailable ? t('doctor_dashboard.active_accepting', '🟢 Active & Accepting') : t('doctor_dashboard.on_leave_paused', '⛔ On Leave / Paused')}
            </button>
          </div>
        </div>

        {/* 🏥 2. Queue Section */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          
          {/* Active Patient */}
          <div className="lg:col-span-2">
            <h3 className="mb-6 text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-teal-100 text-teal-600 rounded-full text-sm">🩺</span>
              {t('doctor_dashboard.currently_treating', 'Currently Treating')}
            </h3>
            
            {currentlyTreating ? (
              <div className="p-8 bg-white border-2 shadow-xl border-teal-500/20 rounded-3xl shadow-teal-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-24 h-24 text-4xl font-black text-white shadow-lg bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl shadow-teal-500/30">
                      #{currentlyTreating.tokenNumber}
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 mb-2 text-xs font-bold rounded-full ${
                        currentlyTreating.isPriority ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {currentlyTreating.isPriority ? t('doctor_dashboard.priority_patient', 'Priority Patient') : t('doctor_dashboard.standard_patient', 'Standard Patient')}
                      </span>
                      <h4 className="text-2xl font-black text-slate-800">{currentlyTreating.patientName}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm font-bold text-slate-500">
                        <span>{t('doctor_dashboard.status', 'Status:')} <span className="text-teal-600">{currentlyTreating.status}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {currentlyTreating.status === 'CALLED' ? (
                      <button
                        onClick={handleStartConsultation}
                        disabled={loading}
                        className="px-8 py-4 font-black text-white transition shadow-xl bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl hover:scale-105 shadow-teal-600/30 active:scale-95 disabled:opacity-50"
                      >
                        {loading ? t('doctor_dashboard.starting', 'Starting...') : t('doctor_dashboard.start_consultation', 'Start Consultation')}
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCompleteConsultation(false)}
                          disabled={loading}
                          className="px-6 py-3 font-bold text-slate-700 transition bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 shadow-sm active:scale-95 flex items-center gap-2"
                        >
                          {t('doctor_dashboard.pause', 'Pause ⏸️')}
                        </button>
                        <button
                          onClick={() => handleCompleteConsultation(true)}
                          disabled={loading}
                          className="px-6 py-3 font-black text-white transition shadow-lg bg-teal-600 rounded-xl hover:bg-teal-700 shadow-teal-600/30 active:scale-95 flex items-center gap-2"
                        >
                          {t('doctor_dashboard.done_call_next', '✅ Done & Call Next')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed rounded-3xl border-slate-300">
                <span className="mb-4 text-5xl">☕</span>
                <h4 className="text-xl font-bold text-slate-700">{t('doctor_dashboard.no_active_patient', 'No Active Patient')}</h4>
                <p className="mt-2 text-slate-500 font-medium">{t('doctor_dashboard.no_active_patient_desc', 'Click "Call Next Patient" to start serving the queue.')}</p>
                <button
                  onClick={handleCallNext}
                  disabled={loading || upcomingPatients.length === 0}
                  className="px-8 py-3 mt-6 font-bold text-white transition shadow-lg bg-slate-800 rounded-xl hover:bg-slate-700 shadow-slate-800/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? t('doctor_dashboard.calling', 'Calling...') : t('doctor_dashboard.call_next_patient', 'Call Next Patient 📢')}
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Patients */}
          <div>
            <h3 className="mb-6 text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm">⏳</span>
              {t('doctor_dashboard.up_next', 'Up Next')}
            </h3>
            <div className="p-2 space-y-3 bg-white border shadow-sm rounded-3xl border-slate-200 h-[350px] overflow-y-auto custom-scrollbar">
              {upcomingPatients.length > 0 ? (
                upcomingPatients.map((patient, index) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 transition border bg-slate-50 border-slate-100 rounded-2xl hover:bg-slate-100/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 text-lg font-black text-teal-600 border border-teal-100 bg-teal-50 rounded-xl">
                        #{patient.tokenNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">{patient.patientName}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{t('doctor_dashboard.position', 'Position:')} #{index + 1}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      patient.isPriority ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {patient.isPriority ? t('doctor_dashboard.priority', 'Priority') : t('doctor_dashboard.standard', 'Standard')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-sm font-medium text-center text-slate-400">
                  {t('doctor_dashboard.queue_empty', 'No patients waiting in the queue. 🎉')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🏥 3. Medical Records Section (Visible only when in consultation) */}
        {currentlyTreating && currentlyTreating.status === 'IN_CONSULTATION' && (
          <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 shadow-inner animate-fade-in">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-3">
                  <span className="text-2xl">📋</span> {t('doctor_dashboard.patient_history_prescription', 'Patient History & Prescription')}
                </h3>
                
                {/* Patient Important Details Extracted from NIC */}
                {(() => {
                  const details = getPatientDetailsFromNic(currentlyTreating.patientNic);
                  if (!details) return null;
                  return (
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        👤 {currentlyTreating.patientName}
                      </span>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        🎂 {t('doctor_dashboard.dob', 'DOB')}: {details.dob}
                      </span>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        ⏳ {t('doctor_dashboard.age', 'Age')}: {details.ageString}
                      </span>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        🚻 {details.gender}
                      </span>
                      {currentlyTreating.patientPhone && (
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                          📞 {currentlyTreating.patientPhone}
                        </span>
                      )}
                    </div>
                  );
                })()}

              </div>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setHasSavedRecordForCurrentPatient(false); // Reset so they can write again if needed
                }}
                className={`px-5 py-2.5 font-bold rounded-xl text-sm transition shadow-sm shrink-0 ${
                  showAddForm ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20'
                }`}
              >
                {showAddForm ? t('doctor_dashboard.cancel_prescription', 'Cancel Prescription') : t('doctor_dashboard.write_prescription', '+ Write Prescription')}
              </button>
            </div>

            {/* Add New Record Form */}
            {showAddForm && (
              <form onSubmit={handleSubmitRecord} className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 mb-6 space-y-5 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('doctor_dashboard.diagnosis_illness', 'Diagnosis / Illness')} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder={t('doctor_dashboard.diagnosis_placeholder', 'e.g. Viral Fever')}
                    value={formData.diagnosis}
                    onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Internal Pharmacy Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-600">{t('doctor_dashboard.smart_prescription', 'Smart Prescription (Hospital Pharmacy)')}</label>
                    <button 
                      type="button" 
                      onClick={addPrescriptionRow}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
                    >
                      {t('doctor_dashboard.add_medicine', '+ Add Medicine')}
                    </button>
                  </div>
                  
                  {formData.prescriptionRows.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center text-sm font-medium text-slate-400">
                      {t('doctor_dashboard.no_pharmacy_medicines', 'No pharmacy medicines added. Click "+ Add Medicine".')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.prescriptionRows.map((row, index) => (
                        <div key={row.id} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 border border-slate-200 rounded-xl bg-slate-50 relative">
                          <button 
                            type="button" 
                            onClick={() => removePrescriptionRow(row.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-full text-xs font-black flex items-center justify-center transition shadow-sm"
                          >
                            ×
                          </button>
                          
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.medicine_name', 'Medicine Name')}</label>
                            <input
                              required
                              list={`med-list-${row.id}`}
                              value={row.name || ''}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                const med = availableMedicines.find(m => m.name === selectedName);
                                updatePrescriptionRow(row.id, 'name', selectedName);
                                if (med) {
                                  updatePrescriptionRow(row.id, 'medicineId', med.id);
                                } else {
                                  updatePrescriptionRow(row.id, 'medicineId', '');
                                }
                              }}
                              placeholder="Type or select medicine..."
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                            <datalist id={`med-list-${row.id}`}>
                      {availableMedicines.map(med => (
                                <option key={med.id} value={med.name}>
                                  {med.availableQuantity > 0 ? `(${med.availableQuantity} ${med.unit} left)` : t('doctor_dashboard.out_of_stock', '(Out of stock)')}
                                </option>
                              ))}
                            </datalist>
                          </div>
                          
                          <div className="w-full md:w-40">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.frequency', 'Frequency')}</label>
                            <select 
                              value={row.frequency} 
                              onChange={(e) => updatePrescriptionRow(row.id, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-bold"
                            >
                              <option value="6 Hourly">{t('doctor_dashboard.freq_6h', '6 Hourly (QID)')}</option>
                              <option value="8 Hourly">{t('doctor_dashboard.freq_8h', '8 Hourly (TDS)')}</option>
                              <option value="12 Hourly">{t('doctor_dashboard.freq_12h', '12 Hourly (BD)')}</option>
                              <option value="Morning Only">{t('doctor_dashboard.freq_om', 'Morning Only (OM)')}</option>
                              <option value="Night Only">{t('doctor_dashboard.freq_on', 'Night Only (ON)')}</option>
                              <option value="Morning & Night">{t('doctor_dashboard.freq_bd', 'Morning & Night (BD)')}</option>
                            </select>
                          </div>

                          <div className="w-full md:w-32">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.meal_timing', 'Meal Timing')}</label>
                            <select
                              value={row.mealTiming || 'After Meal'}
                              onChange={(e) => updatePrescriptionRow(row.id, 'mealTiming', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-teal-700"
                            >
                              <option value="After Meal">{t('doctor_dashboard.after_meal', 'After Meal')}</option>
                              <option value="Before Meal">{t('doctor_dashboard.before_meal', 'Before Meal')}</option>
                              <option value="Empty Stomach">{t('doctor_dashboard.empty_stomach', 'Empty Stomach')}</option>
                            </select>
                          </div>

                          <div className="w-full md:w-24">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.days', 'Days')}</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={row.days}
                              onChange={(e) => updatePrescriptionRow(row.id, 'days', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-center font-bold"
                            />
                          </div>

                          {(() => {
                            const med = availableMedicines.find(m => m.id.toString() === row.medicineId?.toString());
                            const isOutOfStock = med && row.totalQuantity > med.availableQuantity;
                            const stockStatus = isOutOfStock 
                              ? <span className="text-rose-500 text-[10px] uppercase font-black">{t('doctor_dashboard.out_of_stock', 'Out of Stock')}</span> 
                              : <span className="text-slate-400 text-[10px]">{med ? med.availableQuantity + ' ' + t('doctor_dashboard.left', 'left') : ''}</span>;
                            return (
                              <div className="w-full md:w-24 text-right pt-2 md:pt-0">
                                <span className="block text-xs font-bold text-slate-400">{t('doctor_dashboard.qty', 'Qty:')}</span>
                                <span className={`text-lg font-black ${isOutOfStock ? 'text-rose-600' : 'text-teal-600'}`}>{row.totalQuantity}</span>
                                <div className="mt-1">{stockStatus}</div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* External Pharmacy Section */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <label className="block text-sm font-bold text-amber-700">{t('doctor_dashboard.external_prescription', 'External Prescription (Buy Outside)')}</label>
                    </div>
                    <button 
                      type="button" 
                      onClick={addExternalMedicineRow}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
                    >
                      {t('doctor_dashboard.add_medicine', '+ Add Medicine')}
                    </button>
                  </div>
                  
                  {formData.externalMedicines.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center text-sm font-medium text-slate-400">
                      {t('doctor_dashboard.no_external_medicines', 'No external medicines added.')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.externalMedicines.map((row) => (
                        <div key={row.id} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 border border-amber-200 rounded-xl bg-amber-50/50 relative">
                          <button 
                            type="button" 
                            onClick={() => removeExternalMedicineRow(row.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-full text-xs font-black flex items-center justify-center transition shadow-sm"
                          >
                            ×
                          </button>
                          
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.medicine_name', 'Medicine Name')} <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              list="external-medicines-list"
                              placeholder={t('doctor_dashboard.med_placeholder', 'e.g. Amoxicillin 500mg')}
                              value={row.name}
                              onChange={(e) => updateExternalMedicineRow(row.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <datalist id="external-medicines-list">
                              {availableMedicines.map(med => (
                                <option key={med.id} value={med.name} />
                              ))}
                            </datalist>
                          </div>
                          
                          <div className="w-full md:w-32">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.frequency', 'Frequency')}</label>
                            <select 
                              value={row.frequency} 
                              onChange={(e) => updateExternalMedicineRow(row.id, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-bold"
                            >
                              <option value="6 Hourly">{t('doctor_dashboard.freq_6h', '6 Hourly (QID)')}</option>
                              <option value="8 Hourly">{t('doctor_dashboard.freq_8h', '8 Hourly (TDS)')}</option>
                              <option value="12 Hourly">{t('doctor_dashboard.freq_12h', '12 Hourly (BD)')}</option>
                              <option value="Morning Only">{t('doctor_dashboard.freq_om', 'Morning Only (OM)')}</option>
                              <option value="Night Only">{t('doctor_dashboard.freq_on', 'Night Only (ON)')}</option>
                              <option value="Morning & Night">{t('doctor_dashboard.freq_bd', 'Morning & Night (BD)')}</option>
                            </select>
                          </div>

                          <div className="w-full md:w-32">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.meal_timing', 'Meal Timing')}</label>
                            <select
                              value={row.mealTiming || 'After Meal'}
                              onChange={(e) => updateExternalMedicineRow(row.id, 'mealTiming', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-700"
                            >
                              <option value="After Meal">{t('doctor_dashboard.after_meal', 'After Meal')}</option>
                              <option value="Before Meal">{t('doctor_dashboard.before_meal', 'Before Meal')}</option>
                              <option value="Empty Stomach">{t('doctor_dashboard.empty_stomach', 'Empty Stomach')}</option>
                            </select>
                          </div>

                          <div className="w-full md:w-24">
                            <label className="block text-xs font-bold text-slate-500 mb-1">{t('doctor_dashboard.days', 'Days')}</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={row.days}
                              onChange={(e) => updateExternalMedicineRow(row.id, 'days', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-600 mb-1">{t('doctor_dashboard.notes', 'Doctor\'s Notes')}</label>
                  <textarea
                    rows="2"
                    placeholder={t('doctor_dashboard.notes_placeholder', 'Any additional remarks...')}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm custom-scrollbar"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={printPrescription}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>🖨️</span> {t('doctor_dashboard.print_current_prescription', 'Print Prescription')}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition shadow-md shadow-teal-600/20 disabled:bg-slate-400 active:scale-95 flex items-center justify-center"
                  >
                    {loading ? t('doctor_dashboard.saving', 'Saving...') : t('doctor_dashboard.save_and_print', 'Save Record ✅')}
                  </button>
                </div>
              </form>
            )}

            {/* Past Records List */}
            <div>
              <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">{t('doctor_dashboard.past_medical_records', 'Past Consultation History')}</h4>
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {records.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-300">
                    {t('doctor_dashboard.no_past_records', 'No past medical records found for this patient.')}
                  </div>
                ) : (
                  records.map(record => (
                    <div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md hover:border-slate-300">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-black text-lg text-slate-800">{record.diagnosis}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {new Date(record.createdAt).toLocaleDateString()} • Dr. {record.doctorName} • {record.hospitalName}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                          Age: {record.patientAgeAtConsultation}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                          <span className="block font-bold text-teal-700 mb-1 text-xs uppercase tracking-wider">{t('doctor_dashboard.smart_prescription', 'Pharmacy Medicines')}:</span>
                          <p className="text-teal-900 font-medium">{formatPharmacyMedsForDisplay(record.pharmacyMedicines)}</p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                          <span className="block font-bold text-indigo-700 mb-1 text-xs uppercase tracking-wider">{t('doctor_dashboard.external_prescription', 'External Medicines')}:</span>
                          <p className="text-indigo-900 font-medium">{formatPharmacyMedsForDisplay(record.externalMedicines)}</p>
                        </div>
                        {record.notes && (
                          <div className="md:col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <span className="block font-bold text-amber-700 mb-1 text-xs uppercase tracking-wider">{t('doctor_dashboard.notes', 'Doctor\'s Notes')}:</span>
                            <p className="text-amber-900 font-medium">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default DoctorDashboard;
