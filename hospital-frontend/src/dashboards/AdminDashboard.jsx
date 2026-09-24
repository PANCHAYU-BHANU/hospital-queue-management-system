import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

function AdminDashboard({ user, activeTab }) {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [counters, setCounters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [centers, setCenters] = useState([]);
  const [assignments, setAssignments] = useState({});
  
  // Doctor Form State
  const [formData, setFormData] = useState({
    doctorName: '', specialization: '', 
    nicNumber: '', phoneNumber: '', password: '', isAvailable: true
  });

  const [roomName, setRoomName] = useState('');
  const [hospitals, setHospitals] = useState([]);

  // Counter Form State
  const [counterFormData, setCounterFormData] = useState({
    fullName: '', counterNumber: 'Counter 01',
    nicNumber: '', phoneNumber: '', password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchHospitals();
    if (activeTab === 'Manage Counters') {
      fetchCounters();
    } else if (activeTab === 'Manage OPD Rooms') {
      fetchRooms();
      fetchDoctors(); // Needed for assignment dropdown
    } else if (activeTab === 'Manage Communication Centers') {
      fetchCenters();
    } else {
      fetchDoctors();
    }
  }, [activeTab]);

  const fetchHospitals = async () => {
    try {
      const response = await fetch('/api/hospital/all');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch(err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/rooms/hospital/${user?.hospitalId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        data.forEach(room => fetchAssignments(room.id));
      }
    } catch (err) { console.error(err); }
  };

  const fetchAssignments = async (roomId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(prev => ({ ...prev, [roomId]: data }));
      }
    } catch (err) { console.error(err); }
  };

  const fetchCounters = async () => {
    try {
      const response = await fetch(`/api/counters/hospital/${user?.hospitalId}`);
      if (response.ok) {
        const data = await response.json();
        setCounters(data);
      }
    } catch (err) {
      console.error("Error fetching counters:", err);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await fetch(`/api/communication/hospital/${user?.hospitalId}`);
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      }
    } catch (err) {
      console.error("Error fetching centers:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`/api/doctors/hospital/${user?.hospitalId}`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const validateNIC = (nic) => {
    return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate NIC
    const currentNIC = activeTab === 'Manage Counters' || activeTab === 'Manage Communication Centers' 
      ? counterFormData.nicNumber 
      : formData.nicNumber;
      
    if (!validateNIC(currentNIC)) {
      setError(t('admin_dashboard.invalid_nic', 'Invalid NIC Number. Please enter a valid Sri Lankan NIC.'));
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'Manage Counters') {
        const payload = { ...counterFormData, hospitalId: user?.hospitalId };
        const response = await fetch('/api/counters/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), 
        });

        if (response.ok) {
          Swal.fire(t('admin_dashboard.swal_success', 'Success'), t('admin_dashboard.swal_counter_registered', 'Counter registered successfully! ✅'), 'success');
          setCounterFormData({ fullName: '', counterNumber: 'Counter 01', nicNumber: '', phoneNumber: '', password: '' });
          fetchCounters();
        } else {
          const errMsg = await response.text();
          setError(errMsg || "Counter Registration failed");
        }
      } else if (activeTab === 'Manage Communication Centers') {
        const payload = { ...counterFormData, hospitalId: user?.hospitalId, centerName: counterFormData.counterNumber };
        const response = await fetch('/api/communication/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), 
        });

        if (response.ok) {
          Swal.fire(t('admin_dashboard.swal_success', 'Success'), t('admin_dashboard.swal_center_registered', 'Communication Center registered successfully! ✅'), 'success');
          setCounterFormData({ fullName: '', counterNumber: 'Center 01', nicNumber: '', phoneNumber: '', password: '' });
          fetchCenters();
        } else {
          const errMsg = await response.text();
          setError(errMsg || "Communication Center Registration failed");
        }
      } else {
        const payload = { ...formData, hospitalId: user?.hospitalId };
        const response = await fetch('/api/doctors/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), 
        });

        if (response.ok) {
          Swal.fire(t('admin_dashboard.swal_success', 'Success'), t('admin_dashboard.swal_doctor_registered', 'Doctor registered successfully! ✅'), 'success');
          setFormData({ doctorName: '', specialization: '', nicNumber: '', phoneNumber: '', password: '', isAvailable: true });
          fetchDoctors();
        } else {
          const errMsg = await response.text();
          setError(errMsg || "Registration failed");
        }
      }
    } catch (err) {
      setError(t('admin_dashboard.swal_error', 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/hospital/${user?.hospitalId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
      });
      if (response.ok) {
        Swal.fire(t('admin_dashboard.swal_success', 'Success'), t('admin_dashboard.swal_room_added', 'OPD Room added successfully! ✅'), 'success');
        setRoomName('');
        fetchRooms();
      } else {
        Swal.fire(t('admin_dashboard.swal_error', 'Error'), t('admin_dashboard.swal_room_add_failed', 'Failed to add room!'), 'error');
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  const handleDeleteRoom = (id) => {
    Swal.fire({
      title: t('admin_dashboard.swal_delete_room_title', 'Are you sure?'), text: t('admin_dashboard.swal_delete_room_text', 'This will delete the room and its assignments!'), icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: t('admin_dashboard.swal_delete', 'Yes, delete it!')
    }).then(async (result) => {
      if (result.isConfirmed) {
         await fetch(`/api/rooms/delete/${id}`, { method: 'DELETE' });
         fetchRooms();
      }
    });
  };

  const handleAssignDoctor = (roomId) => {
    // Filter out doctors who are on leave
    const availableDoctors = doctors.filter(d => d.available !== false);
    const docOptions = availableDoctors.map(d => `<option value="${d.id}">${d.doctorName} (${d.specialization})</option>`).join('');
    
    if (availableDoctors.length === 0) {
      Swal.fire('Info', 'No active doctors available for assignment. They might be on leave.', 'info');
      return;
    }

    Swal.fire({
      title: 'Assign Doctor to Room',
      html: `
        <select id="swal-assign-doc" class="swal2-input mb-4">
           <option value="" disabled selected>Select Doctor</option>
           ${docOptions}
        </select>
        <div class="flex gap-2">
          <div class="flex-1 text-left">
            <label class="text-xs font-bold text-slate-500 uppercase">Start Time</label>
            <input type="time" id="swal-start-time" class="swal2-input mt-1 w-full" value="08:00">
          </div>
          <div class="flex-1 text-left">
            <label class="text-xs font-bold text-slate-500 uppercase">End Time</label>
            <input type="time" id="swal-end-time" class="swal2-input mt-1 w-full" value="12:00">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Assign',
      preConfirm: () => {
        const start = document.getElementById('swal-start-time').value;
        const end = document.getElementById('swal-end-time').value;
        
        // Convert 24hr to 12hr AM/PM for a nicer display string
        const formatTime = (timeStr) => {
           let [h, m] = timeStr.split(':');
           let ampm = 'AM';
           h = parseInt(h);
           if (h >= 12) { ampm = 'PM'; if (h > 12) h -= 12; }
           if (h === 0) h = 12;
           return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
        };

        const timePeriod = `${formatTime(start)} - ${formatTime(end)}`;

        return {
          doctorId: document.getElementById('swal-assign-doc').value,
          timePeriod: timePeriod
        }
      }
    }).then(async (result) => {
       if (result.isConfirmed && result.value.doctorId) {
         await fetch(`/api/rooms/${roomId}/assign-doctor`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(result.value)
         });
         fetchAssignments(roomId);
         Swal.fire(t('admin_dashboard.swal_assigned', 'Assigned!'), '', 'success');
       }
    });
  };

  const handleRemoveAssignment = async (assignmentId, roomId) => {
     await fetch(`/api/rooms/assignments/delete/${assignmentId}`, { method: 'DELETE' });
     fetchAssignments(roomId);
  };

  const handleRequestTransfer = (doctor) => {
    const hospitalOptions = hospitals
       .filter(h => h.id !== user?.hospitalId) // Don't show current hospital
       .map(h => `<option value="${h.id}">${h.name} (${h.district})</option>`).join('');

    if (!hospitalOptions) {
      Swal.fire('Info', 'No other hospitals available for transfer.', 'info');
      return;
    }

    Swal.fire({
      title: 'Request Doctor Transfer',
      html: `
        <p class="text-sm font-bold text-slate-500 mb-4">Select the target hospital to transfer Dr. ${doctor.doctorName}</p>
        <select id="swal-transfer-hospital" class="swal2-input">
           <option value="" disabled selected>Select Hospital</option>
           ${hospitalOptions}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Request Transfer',
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        return document.getElementById('swal-transfer-hospital').value;
      }
    }).then(async (result) => {
       if (result.isConfirmed && result.value) {
         try {
           const response = await fetch('/api/transfers/request', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                 adminUserId: user.id,
                 doctorId: doctor.id,
                 targetHospitalId: parseInt(result.value)
              })
           });
           if (response.ok) {
             Swal.fire(t('admin_dashboard.swal_success', 'Requested!'), t('admin_dashboard.swal_transfer_request_sent', 'Transfer request sent to Super Admin.'), 'success');
           } else {
             Swal.fire(t('admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
           }
         } catch(err) { Swal.fire(t('admin_dashboard.swal_error', 'Error'), 'Failed to request transfer.', 'error'); }
       }
    });
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
        const result = {
          fullName: document.getElementById('swal-fullName').value,
          counterNumber: document.getElementById('swal-counterNumber').value,
          nicNumber: document.getElementById('swal-nicNumber').value,
          phoneNumber: document.getElementById('swal-phoneNumber').value,
          password: document.getElementById('swal-password').value
        };
        if (!validateNIC(result.nicNumber)) {
          Swal.showValidationMessage(t('admin_dashboard.invalid_nic', 'Invalid NIC Number.'));
          return false;
        }
        return result;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await fetch(`/api/counters/update/${counter.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value)
          });
          if(response.ok) {
            Swal.fire(t('admin_dashboard.swal_success', 'Updated!'), 'Counter updated successfully', 'success');
            fetchCounters();
          } else {
            Swal.fire(t('admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
          }
        } catch(e) { Swal.fire(t('admin_dashboard.swal_error', 'Error'), 'Server error', 'error'); }
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
          const response = await fetch(`/api/counters/delete/${id}`, { method: 'DELETE' });
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

  const handleDeleteCenter = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the communication center and its login access!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/communication/${id}`, { method: 'DELETE' });
          if(response.ok) {
            Swal.fire('Deleted!', 'Communication Center has been deleted.', 'success');
            fetchCenters();
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
        <input id="swal-docNic" class="swal2-input" placeholder="NIC (Login)" value="${doc.nicNumber || ''}">
        <input id="swal-docPhone" class="swal2-input" placeholder="Phone" value="${doc.phoneNumber || ''}">
        <input id="swal-docPass" type="password" class="swal2-input" placeholder="New Password (Optional)">
        <select id="swal-docAvail" class="swal2-input">
          <option value="true" ${doc.available ? 'selected' : ''}>Available</option>
          <option value="false" ${!doc.available ? 'selected' : ''}>On Leave</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        const result = {
          doctorName: document.getElementById('swal-docName').value,
          specialization: document.getElementById('swal-docSpec').value,
          nicNumber: document.getElementById('swal-docNic').value,
          phoneNumber: document.getElementById('swal-docPhone').value,
          password: document.getElementById('swal-docPass').value,
          isAvailable: document.getElementById('swal-docAvail').value === 'true'
        };
        if (!validateNIC(result.nicNumber)) {
          Swal.showValidationMessage(t('admin_dashboard.invalid_nic', 'Invalid NIC Number.'));
          return false;
        }
        return result;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await fetch(`/api/doctors/update/${doc.id}`, {
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
      title: 'Request Doctor Deletion',
      text: "Please provide a reason to request deletion from the Super Admin.",
      input: 'textarea',
      inputPlaceholder: 'Enter reason here...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Submit Request',
      preConfirm: (reason) => {
        if (!reason) {
          Swal.showValidationMessage('Reason is required');
        }
        return reason;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const payload = {
            adminUserId: user?.id,
            doctorId: id,
            reason: result.value
          };
          const response = await fetch(`/api/doctor-deletes/request`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
          });
          if(response.ok) {
            Swal.fire(t('admin_dashboard.swal_success', 'Requested!'), 'Delete request sent to Super Admin.', 'success');
          } else {
            Swal.fire(t('admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
          }
        } catch(e) { Swal.fire(t('admin_dashboard.swal_error', 'Error'), 'Server error', 'error'); }
      }
    });
  };

  return (
    <div className="min-h-screen p-8 space-y-10 bg-slate-50">
      
      {activeTab === 'Manage OPD Rooms' ? (
        <div className="space-y-10">
          <div className="max-w-4xl p-8 mx-auto bg-white border shadow-sm rounded-3xl border-slate-200">
            <h3 className="mb-6 text-2xl font-black text-slate-800">{t('admin_dashboard.manage_opd_rooms', '🚪 Manage OPD Rooms')}</h3>
            <form onSubmit={handleAddRoom} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.room_name_label', 'Room Name')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.room_name_placeholder', 'e.g. OPD Room 01, Eye Clinic')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={roomName} onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="px-8 py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg">
                {t('admin_dashboard.add_room', 'Add Room')}
              </button>
            </form>
          </div>

          <div className="max-w-6xl mx-auto overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">{t('admin_dashboard.hospital_opd_rooms', 'Hospital OPD Rooms')}</h3>
            </div>
            <div className="p-6 space-y-6">
              {rooms.length === 0 ? (
                <p className="text-center text-slate-400 font-bold">{t('admin_dashboard.no_rooms_added', 'No OPD rooms have been added yet.')}</p>
              ) : (
                rooms.map(room => (
                  <div key={room.id} className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-black text-slate-700">{room.name}</h4>
                      <div className="space-x-2">
                        <button onClick={() => handleAssignDoctor(room.id)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">{t('admin_dashboard.assign_doctor', 'Assign Doctor')}</button>
                        <button onClick={() => handleDeleteRoom(room.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">{t('admin_dashboard.delete_room', 'Delete Room')}</button>
                      </div>
                    </div>
                    
                    {assignments[room.id] && assignments[room.id].length > 0 ? (
                      <div className="mt-4 space-y-2">
                        <h5 className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.assigned_doctors', 'Assigned Doctors:')}</h5>
                        {assignments[room.id].map(assign => (
                          <div key={assign.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div>
                              <span className="font-bold text-slate-700">{assign.doctor.doctorName}</span>
                              <span className="text-xs text-slate-500 ml-2">({assign.doctor.specialization})</span>
                              <span className="text-sm font-semibold text-teal-600 ml-4">🕒 {assign.timePeriod}</span>
                            </div>
                            <button onClick={() => handleRemoveAssignment(assign.id, room.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs">{t('admin_dashboard.remove', 'Remove')}</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-2">{t('admin_dashboard.no_doctors_assigned', 'No doctors assigned yet.')}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* REGISTER FORM */}
          <div className="max-w-4xl p-8 mx-auto bg-white border shadow-sm rounded-3xl border-slate-200">
        <h3 className="mb-6 text-2xl font-black text-slate-800">
          {activeTab === 'Manage Counters' ? t('admin_dashboard.register_counter_staff', '🧑‍💻 Register Counter Staff') : activeTab === 'Manage Communication Centers' ? t('admin_dashboard.register_communication_center', '📞 Register Communication Center') : t('admin_dashboard.register_new_doctor', '👨‍⚕️ Register New Doctor')}
        </h3>
        
        {error && (
          <div className="p-4 mb-4 text-sm font-bold text-rose-700 bg-rose-50 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {activeTab === 'Manage Counters' || activeTab === 'Manage Communication Centers' ? (
            <>
              {activeTab === 'Manage Counters' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.staff_full_name', 'Staff Full Name')}</label>
                  <input 
                    type="text" required placeholder={t('admin_dashboard.staff_name_placeholder', 'Saman Perera')}
                    className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                    value={counterFormData.fullName}
                    onChange={(e) => setCounterFormData({...counterFormData, fullName: e.target.value})}
                  />
                </div>
              ) : null}

              {activeTab === 'Manage Counters' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.assigned_counter_name', 'Assigned Counter Name')}</label>
                  <input 
                    type="text" required placeholder={t('admin_dashboard.counter_name_placeholder', 'e.g. Counter 01, Pharmacy Counter')}
                    className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                    value={counterFormData.counterNumber}
                    onChange={(e) => setCounterFormData({...counterFormData, counterNumber: e.target.value})}
                    list="counter-suggestions"
                  />
                  <datalist id="counter-suggestions">
                    <option value="Counter 01" />
                    <option value="Counter 02" />
                    <option value="Main Counter" />
                    <option value="Pharmacy Counter" />
                  </datalist>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.center_name_label', 'Center Name')}</label>
                  <input 
                    type="text" required placeholder={t('admin_dashboard.center_name_placeholder', 'e.g. Center 01, Super Comm')}
                    className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                    value={counterFormData.counterNumber}
                    onChange={(e) => setCounterFormData({...counterFormData, counterNumber: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.nic_number', 'NIC Number (For Login)')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.nic_placeholder', '199512345678')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={counterFormData.nicNumber}
                  onChange={(e) => setCounterFormData({...counterFormData, nicNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.phone_number', 'Phone Number')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.phone_placeholder', '0771234567')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={counterFormData.phoneNumber}
                  onChange={(e) => setCounterFormData({...counterFormData, phoneNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.login_password', 'Login Password')}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required placeholder="••••••••" 
                    className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                    value={counterFormData.password}
                    onChange={(e) => setCounterFormData({...counterFormData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-teal-600 focus:outline-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              
              <div className="flex items-end">
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg">
                  {loading ? t('admin_dashboard.saving', "Saving to Registry...") : (activeTab === 'Manage Counters' ? t('admin_dashboard.add_counter_staff', "Add Counter Staff") : t('admin_dashboard.add_communication_center', "Add Communication Center"))}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.doctor_name', 'Doctor Name')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.doctor_name_placeholder', 'Dr. Kavindu')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.specialization', 'Specialization')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.specialization_placeholder', 'Cardiologist')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.nic_number', 'NIC Number (For Login)')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.nic_placeholder', '199512345678')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={formData.nicNumber}
                  onChange={(e) => setFormData({...formData, nicNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.phone_number', 'Phone Number')}</label>
                <input 
                  type="text" required placeholder={t('admin_dashboard.phone_placeholder', '0771234567')}
                  className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('admin_dashboard.login_password', 'Login Password')}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required placeholder="••••••••" 
                    className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-teal-600 focus:outline-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-end">
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg mt-4">
                  {loading ? t('admin_dashboard.saving', "Saving to Registry...") : t('admin_dashboard.add_doctor', "Add Doctor to Registry")}
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
            {activeTab === 'Manage Counters' ? t('admin_dashboard.hospital_counter_staff', 'Hospital Counter Staff') : activeTab === 'Manage Communication Centers' ? t('admin_dashboard.communication_centers', 'Communication Centers') : t('admin_dashboard.hospital_medical_registry', 'Hospital Medical Registry')}
          </h3>
          <span className="px-4 py-1 text-xs font-black text-teal-700 uppercase bg-teal-100 rounded-full">
            {t('admin_dashboard.total', 'Total')}: {activeTab === 'Manage Counters' ? counters.length : activeTab === 'Manage Communication Centers' ? centers.length : doctors.length} {activeTab === 'Manage Counters' ? t('admin_dashboard.staff', 'Staff') : activeTab === 'Manage Communication Centers' ? t('admin_dashboard.centers', 'Centers') : t('admin_dashboard.doctors', 'Doctors')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase border-b text-slate-400 bg-slate-50/80 border-slate-100">
                {activeTab === 'Manage Counters' || activeTab === 'Manage Communication Centers' ? (
                  <>
                    <th className="p-6">{activeTab === 'Manage Counters' ? t('admin_dashboard.staff_name', 'Staff Name') : t('admin_dashboard.user', 'User')}</th>
                    <th className="p-6">{activeTab === 'Manage Counters' ? t('admin_dashboard.counter_number', 'Counter Number') : t('admin_dashboard.center_name_label', 'Center Name')}</th>
                    <th className="p-6">{t('admin_dashboard.phone_number', 'Phone Number')}</th>
                    <th className="p-6 text-right">{t('admin_dashboard.actions', 'Actions')}</th>
                  </>
                ) : (
                  <>
                    <th className="p-6">{t('admin_dashboard.doctor_name', 'Doctor Name')}</th>
                    <th className="p-6">{t('admin_dashboard.specialization', 'Specialization')}</th>
                    <th className="p-6">{t('admin_dashboard.room_number', 'Room Number')}</th>
                    <th className="p-6">{t('admin_dashboard.status', 'Status')}</th>
                    <th className="p-6 text-right">{t('admin_dashboard.actions', 'Actions')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'Manage Counters' ? (
                counters.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 font-bold text-center text-slate-400">
                      {t('admin_dashboard.no_counter_staff_in_registry', 'No counter staff in the registry currently!')}
                    </td>
                  </tr>
                ) : (
                  counters.map((counter) => (
                    <tr key={counter.id} className="transition hover:bg-slate-50/80">
                      <td className="p-6 font-bold text-slate-700">{counter.fullName || ''}</td>
                      <td className="p-6 font-semibold text-teal-700">{counter.counterNumber || ''}</td>
                      <td className="p-6 font-medium text-slate-500">{counter.user?.phoneNumber || ''}</td>
                      <td className="p-6 space-x-2 text-right">
                        <button onClick={() => handleEditCounter(counter)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">{t('admin_dashboard.edit', 'Edit')}</button>
                        <button onClick={() => handleDeleteCounter(counter.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">{t('admin_dashboard.delete', 'Delete')}</button>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'Manage Communication Centers' ? (
                centers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 font-bold text-center text-slate-400">
                      {t('admin_dashboard.no_centers_in_registry', 'No communication centers in the registry currently!')}
                    </td>
                  </tr>
                ) : (
                  centers.map((center) => (
                    <tr key={center.id} className="transition hover:bg-slate-50/80">
                      <td className="p-6 font-bold text-slate-700">{center.user?.nicNumber || ''}</td>
                      <td className="p-6 font-semibold text-teal-700">{center.centerName || ''}</td>
                      <td className="p-6 font-medium text-slate-500">{center.user?.phoneNumber || ''}</td>
                      <td className="p-6 space-x-2 text-right">
                        <button onClick={() => handleDeleteCenter(center.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">{t('admin_dashboard.delete', 'Delete')}</button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                doctors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 font-bold text-center text-slate-400">
                      {t('admin_dashboard.no_doctors_in_registry', 'No doctors in the registry currently!')}
                    </td>
                  </tr>
                ) : (
                  doctors.map((doc) => (
                    <tr key={doc.id} className="transition hover:bg-slate-50/80">
                      <td className="p-6 font-bold text-slate-700">{doc.doctorName || ''}</td>
                      <td className="p-6 font-medium text-slate-500">{doc.specialization || ''}</td>
                      <td className="p-6 font-semibold text-teal-700">{doc.roomNumber || ''}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          doc.available === true || doc.available === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {doc.available === true || doc.available === 1 ? t('admin_dashboard.available', 'AVAILABLE') : t('admin_dashboard.on_leave', 'ON LEAVE')}
                        </span>
                      </td>
                      <td className="p-6 space-x-2 text-right">
                        <button onClick={() => handleRequestTransfer(doc)} className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200">{t('admin_dashboard.transfer', 'Transfer')}</button>
                        <button onClick={() => handleEditDoctor(doc)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">{t('admin_dashboard.edit', 'Edit')}</button>
                        <button onClick={() => handleDeleteDoctor(doc.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">{t('admin_dashboard.delete', 'Delete')}</button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

    </div>
  );
}

export default AdminDashboard;
