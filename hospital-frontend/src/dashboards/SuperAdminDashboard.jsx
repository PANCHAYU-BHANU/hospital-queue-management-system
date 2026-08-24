import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Swal from 'sweetalert2';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import SuperAdminAnalytics from './SuperAdminAnalytics';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function SuperAdminDashboard({ activeTab }) {
  const { t } = useTranslation();
  const [hospitals, setHospitals] = useState([]);
  const [hospitalForm, setHospitalForm] = useState({ name: '', district: '', latitude: '', longitude: '' });
  const [adminForm, setAdminForm] = useState({ fullName: '', nicNumber: '', phoneNumber: '', password: '', hospitalId: '' });
  
  const [admins, setAdmins] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [deletes, setDeletes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [hLoading, setHLoading] = useState(false);
  const [aLoading, setALoading] = useState(false);
  const [assignDocLoading, setAssignDocLoading] = useState(false);
  const [uniqueDoctors, setUniqueDoctors] = useState([]);
  const [assignDocForm, setAssignDocForm] = useState({ userId: '', hospitalId: '', specialization: '' });
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchHospitals();
    fetchAdmins();
    if (activeTab === 'Doctor Transfers') {
      fetchTransfers();
    } else if (activeTab === 'Doctor Deletions') {
      fetchDeletes();
    } else if (activeTab === 'Assign Doctors') {
      fetchUniqueDoctors();
    }
  }, [activeTab]);

  const fetchUniqueDoctors = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/doctors/unique');
      if (response.ok) {
        const data = await response.json();
        setUniqueDoctors(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    setAssignDocLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/doctors/assign-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignDocForm)
      });
      if (response.ok) {
        Swal.fire(t('super_admin_dashboard.swal_success', 'Success'), t('super_admin_dashboard.swal_doctor_assigned', 'Doctor assigned successfully!'), 'success');
        setAssignDocForm({ userId: '', hospitalId: '', specialization: '' });
        fetchUniqueDoctors();
      } else {
        const errText = await response.text();
        Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), errText || t('super_admin_dashboard.swal_assign_doctor_failed', 'Failed to assign doctor'), 'error');
      }
    } catch (err) {
      Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server Error'), 'error');
    } finally {
      setAssignDocLoading(false);
    }
  };

  const filteredDocs = uniqueDoctors.filter(d => 
    d.doctorName.toLowerCase().includes(docSearchQuery.toLowerCase()) || 
    d.mainSpecialization.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    d.nicNumber.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/superadmin/all');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (err) { console.error(err); }
  };

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

  const fetchTransfers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/transfers/pending');
      if (response.ok) {
        const data = await response.json();
        setTransfers(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchDeletes = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/doctor-deletes/pending');
      if (response.ok) {
        const data = await response.json();
        setDeletes(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleApproveRejectTransfer = async (id, isApproved) => {
    try {
      const response = await fetch(`http://localhost:8080/api/transfers/${id}/handle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      });
      if (response.ok) {
        Swal.fire(t('super_admin_dashboard.swal_success', 'Success'), isApproved ? t('super_admin_dashboard.swal_transfer_approved', 'Transfer Approved!') : t('super_admin_dashboard.swal_transfer_rejected', 'Transfer Rejected!'), 'success');
        fetchTransfers();
      } else {
        Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
      }
    } catch(err) { Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server Error'), 'error'); }
  };

  const handleApproveRejectDelete = async (id, isApproved) => {
    try {
      const response = await fetch(`http://localhost:8080/api/doctor-deletes/${id}/handle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      });
      if (response.ok) {
        Swal.fire(t('super_admin_dashboard.swal_success', 'Success'), isApproved ? t('super_admin_dashboard.swal_delete_approved', 'Delete Approved!') : t('super_admin_dashboard.swal_delete_rejected', 'Delete Rejected!'), 'success');
        fetchDeletes();
      } else {
        Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
      }
    } catch (err) { Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server Error'), 'error'); }
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
        showMessage(t('super_admin_dashboard.hospital_added_successfully', "Hospital added successfully! ✅"));
        setHospitalForm({ name: '', district: '', latitude: '', longitude: '' });
        fetchHospitals();
      } else {
        showMessage(t('super_admin_dashboard.failed_to_add_hospital', "Failed to add hospital."), true);
      }
    } catch (err) {
      showMessage(t('super_admin_dashboard.swal_server_error', "Server error."), true);
    } finally {
      setHLoading(false);
    }
  };

  const handleEditHospital = (hospital) => {
    Swal.fire({
      title: t('super_admin_dashboard.edit_hospital', 'Edit Hospital'),
      html: `
        <input id="swal-hName" class="swal2-input" placeholder="${t('super_admin_dashboard.hospital_name', 'Hospital Name')}" value="${hospital.name || ''}">
        <input id="swal-hDistrict" class="swal2-input" placeholder="${t('super_admin_dashboard.district', 'District')}" value="${hospital.district || ''}">
        <input id="swal-hLat" type="number" step="any" class="swal2-input" placeholder="${t('super_admin_dashboard.latitude', 'Latitude')}" value="${hospital.latitude || ''}">
        <input id="swal-hLon" type="number" step="any" class="swal2-input" placeholder="${t('super_admin_dashboard.longitude', 'Longitude')}" value="${hospital.longitude || ''}">
      `,
      showCancelButton: true,
      confirmButtonText: t('super_admin_dashboard.update', 'Update'),
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        return {
          name: document.getElementById('swal-hName').value,
          district: document.getElementById('swal-hDistrict').value,
          latitude: parseFloat(document.getElementById('swal-hLat').value),
          longitude: parseFloat(document.getElementById('swal-hLon').value)
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/hospital/update/${hospital.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value)
          });
          if (response.ok) {
            Swal.fire(t('super_admin_dashboard.updated', 'Updated!'), t('super_admin_dashboard.hospital_updated_successfully', 'Hospital updated successfully'), 'success');
            fetchHospitals();
          } else {
            Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
          }
        } catch (e) { Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server error'), 'error'); }
      }
    });
  };

  const handleDeleteHospital = (id) => {
    Swal.fire({
      title: t('super_admin_dashboard.swal_are_you_sure', 'Are you sure?'),
      text: t('super_admin_dashboard.swal_delete_hospital_text', "This will delete the hospital and ALL associated admins, doctors, and tickets! This action cannot be undone."),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: t('super_admin_dashboard.swal_yes_delete_everything', 'Yes, delete everything!')
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/hospital/delete/${id}`, { method: 'DELETE' });
          if (response.ok) {
            Swal.fire(t('super_admin_dashboard.deleted', 'Deleted!'), t('super_admin_dashboard.hospital_deleted', 'Hospital has been deleted.'), 'success');
            fetchHospitals();
          } else {
            const data = await response.json();
            Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), data.error || t('super_admin_dashboard.failed_to_delete', 'Failed to delete'), 'error');
          }
        } catch (e) { Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server error'), 'error'); }
      }
    });
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
        showMessage(t('super_admin_dashboard.admin_added_successfully', "Hospital Admin added successfully! ✅"));
        setAdminForm({ fullName: '', nicNumber: '', phoneNumber: '', password: '', hospitalId: hospitals.length > 0 ? hospitals[0].id : '' });
        fetchAdmins();
      } else {
        showMessage(text, true);
      }
    } catch (err) {
      showMessage(t('super_admin_dashboard.swal_server_error', "Server error."), true);
    } finally {
      setALoading(false);
    }
  };

  const handleEditAdmin = (admin) => {
    const hospitalOptions = hospitals.map(h => `<option value="${h.id}" ${admin.hospital?.id === h.id ? 'selected' : ''}>${h.name}</option>`).join('');
    Swal.fire({
      title: t('super_admin_dashboard.edit_hospital_admin', 'Edit Hospital Admin'),
      html: `
        <input id="swal-fullName" class="swal2-input" placeholder="${t('super_admin_dashboard.full_name', 'Full Name')}" value="${admin.fullName || ''}">
        <select id="swal-hospitalId" class="swal2-input">
          ${hospitalOptions}
        </select>
        <input id="swal-nicNumber" class="swal2-input" placeholder="${t('super_admin_dashboard.nic_login', 'NIC (Login)')}" value="${admin.user?.nicNumber || ''}">
        <input id="swal-phoneNumber" class="swal2-input" placeholder="${t('super_admin_dashboard.phone', 'Phone')}" value="${admin.user?.phoneNumber || ''}">
        <input id="swal-password" type="password" class="swal2-input" placeholder="${t('super_admin_dashboard.new_password_optional', 'New Password (Optional)')}">
      `,
      showCancelButton: true,
      confirmButtonText: t('super_admin_dashboard.update', 'Update'),
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        return {
          fullName: document.getElementById('swal-fullName').value,
          hospitalId: document.getElementById('swal-hospitalId').value,
          nicNumber: document.getElementById('swal-nicNumber').value,
          phoneNumber: document.getElementById('swal-phoneNumber').value,
          password: document.getElementById('swal-password').value
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/superadmin/update/${admin.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value)
          });
          if(response.ok) {
            Swal.fire(t('super_admin_dashboard.updated', 'Updated!'), t('super_admin_dashboard.admin_updated_successfully', 'Admin updated successfully'), 'success');
            fetchAdmins();
          } else {
            Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
          }
        } catch(e) { Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server error'), 'error'); }
      }
    });
  };

  const handleDeleteAdmin = (id) => {
    Swal.fire({
      title: t('super_admin_dashboard.swal_are_you_sure', 'Are you sure?'),
      text: t('super_admin_dashboard.swal_delete_admin_text', "This will delete the admin and their login access!"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: t('super_admin_dashboard.swal_yes_delete', 'Yes, delete it!')
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8080/api/superadmin/delete/${id}`, { method: 'DELETE' });
          if(response.ok) {
            Swal.fire(t('super_admin_dashboard.deleted', 'Deleted!'), t('super_admin_dashboard.admin_deleted', 'Admin has been deleted.'), 'success');
            fetchAdmins();
          } else {
            Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), await response.text(), 'error');
          }
        } catch(e) { Swal.fire(t('super_admin_dashboard.swal_error', 'Error'), t('super_admin_dashboard.swal_server_error', 'Server error'), 'error'); }
      }
    });
  };

  const filteredAdmins = admins.filter(admin => {
    const query = searchQuery.toLowerCase();
    const hName = admin.hospital?.name?.toLowerCase() || '';
    const aName = admin.fullName?.toLowerCase() || '';
    return hName.includes(query) || aName.includes(query);
  });

  const filteredHospitals = hospitals.filter(h => {
    const query = searchQuery.toLowerCase();
    return h.name?.toLowerCase().includes(query) || h.district?.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen p-8 space-y-10 bg-slate-50">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800">
          👑 {activeTab === 'Admin Management' ? t('super_admin_dashboard.admin_management', 'Admin Management') : activeTab === 'Doctor Transfers' ? t('super_admin_dashboard.doctor_transfers', 'Doctor Transfers') : activeTab === 'Doctor Deletions' ? t('super_admin_dashboard.doctor_deletions', 'Doctor Deletions') : activeTab === 'System Analytics' ? t('super_admin_dashboard.system_analytics', 'System Analytics') : t('super_admin_dashboard.hospital_management', 'Hospital Management')}
        </h2>
      </div>

      {error && <div className="p-4 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">⚠️ {error}</div>}
      {success && <div className="p-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">✅ {success}</div>}

      {activeTab === 'System Analytics' ? (
        <SuperAdminAnalytics />
      ) : activeTab === 'Doctor Transfers' ? (
        <div className="space-y-10">
          <div className="max-w-6xl mx-auto overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">{t('super_admin_dashboard.pending_transfer_requests', 'Pending Transfer Requests')}</h3>
            </div>
            <div className="p-6 space-y-4">
              {transfers.length === 0 ? (
                <p className="text-center text-slate-400 font-bold">{t('super_admin_dashboard.no_pending_transfers', 'No pending transfer requests.')}</p>
              ) : (
                transfers.map(tData => (
                  <div key={tData.id} className="flex justify-between items-center p-6 border border-slate-200 rounded-2xl bg-slate-50">
                    <div>
                      <h4 className="text-lg font-black text-slate-700">{t('super_admin_dashboard.doctor_nic', 'Doctor NIC')}: {tData.doctorUser.nicNumber}</h4>
                      <p className="text-sm font-semibold text-slate-500 mt-1">{t('super_admin_dashboard.from', 'From')}: <span className="text-rose-600">{tData.fromHospital?.name || 'N/A'}</span> ➡️ {t('super_admin_dashboard.to', 'To')}: <span className="text-teal-600">{tData.toHospital.name}</span></p>
                      <p className="text-xs text-slate-400 mt-2">{t('super_admin_dashboard.requested_by_admin_id', 'Requested by Admin ID')}: {tData.requestedByAdmin.id} {t('super_admin_dashboard.at', 'at')} {new Date(tData.requestedAt).toLocaleString()}</p>
                    </div>
                    <div className="space-x-3">
                      <button onClick={() => handleApproveRejectTransfer(tData.id, true)} className="px-6 py-2 font-black text-white bg-teal-600 rounded-xl shadow hover:bg-teal-700 transition">{t('super_admin_dashboard.approve', 'Approve')}</button>
                      <button onClick={() => handleApproveRejectTransfer(tData.id, false)} className="px-6 py-2 font-black text-rose-600 bg-rose-100 rounded-xl shadow hover:bg-rose-200 transition">{t('super_admin_dashboard.reject', 'Reject')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'Doctor Deletions' ? (
        <div className="space-y-10">
          <div className="max-w-6xl mx-auto overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">{t('super_admin_dashboard.pending_delete_requests', 'Pending Delete Requests')}</h3>
            </div>
            <div className="p-6 space-y-4">
              {deletes.length === 0 ? (
                <p className="text-center text-slate-400 font-bold">{t('super_admin_dashboard.no_pending_deletes', 'No pending delete requests.')}</p>
              ) : (
                deletes.map(d => (
                  <div key={d.id} className="flex justify-between items-center p-6 border border-slate-200 rounded-2xl bg-slate-50">
                    <div>
                      <h4 className="text-lg font-black text-slate-700">{t('super_admin_dashboard.doctor', 'Doctor')}: {d.doctor?.doctorName} ({t('super_admin_dashboard.nic', 'NIC')}: {d.doctor?.user?.nicNumber})</h4>
                      <p className="text-sm font-semibold text-slate-500 mt-1">{t('super_admin_dashboard.reason', 'Reason')}: <span className="text-rose-600">{d.reason}</span></p>
                      <p className="text-xs text-slate-400 mt-2">{t('super_admin_dashboard.requested_by_admin_id', 'Requested by Admin ID')}: {d.requestedByAdmin?.id} {t('super_admin_dashboard.at', 'at')} {new Date(d.requestedAt).toLocaleString()}</p>
                    </div>
                    <div className="space-x-3">
                      <button onClick={() => handleApproveRejectDelete(d.id, true)} className="px-6 py-2 font-black text-white bg-teal-600 rounded-xl shadow hover:bg-teal-700 transition">{t('super_admin_dashboard.approve', 'Approve')}</button>
                      <button onClick={() => handleApproveRejectDelete(d.id, false)} className="px-6 py-2 font-black text-rose-600 bg-rose-100 rounded-xl shadow hover:bg-rose-200 transition">{t('super_admin_dashboard.reject', 'Reject')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'Hospital Management' ? (
        /* ============================== */
        /*     HOSPITAL MANAGEMENT        */
        /* ============================== */
        <div className="space-y-10">
          {/* ADD HOSPITAL FORM */}
          <div className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200 max-w-4xl">
            <h3 className="mb-6 text-xl font-black text-slate-800">{t('super_admin_dashboard.add_new_hospital', '🏥 Add New Hospital')}</h3>
            <form onSubmit={handleAddHospital} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.hospital_name', 'Hospital Name')}</label>
                <input required type="text" value={hospitalForm.name} onChange={e => setHospitalForm({...hospitalForm, name: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder={t('super_admin_dashboard.hospital_name_placeholder', 'e.g. National Hospital Colombo')} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.district', 'District')}</label>
                <input required type="text" value={hospitalForm.district} onChange={e => setHospitalForm({...hospitalForm, district: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder={t('super_admin_dashboard.district_placeholder', 'e.g. Colombo')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.latitude', 'Latitude')}</label>
                  <input required type="number" step="any" value={hospitalForm.latitude} onChange={e => setHospitalForm({...hospitalForm, latitude: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. 6.919" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.longitude', 'Longitude')}</label>
                  <input required type="number" step="any" value={hospitalForm.longitude} onChange={e => setHospitalForm({...hospitalForm, longitude: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="e.g. 79.869" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.click_map_location', 'Or Click on the Map to Select Location')}</label>
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
                {hLoading ? t('super_admin_dashboard.adding', "Adding...") : t('super_admin_dashboard.add_hospital', "Add Hospital")}
              </button>
            </form>
          </div>

          {/* HOSPITAL TABLE WITH SEARCH */}
          <div className="max-w-6xl overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 gap-4">
              <h3 className="text-xl font-black text-slate-800">
                {t('super_admin_dashboard.registered_hospitals', 'Registered Hospitals')}
              </h3>
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder={t('super_admin_dashboard.search_hospital_district', 'Search by Hospital or District...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-72 px-4 py-2 text-sm font-bold border rounded-xl border-slate-200 focus:ring-teal-500 outline-none"
                />
                <span className="px-4 py-1 text-xs font-black text-slate-700 uppercase bg-slate-200 rounded-full shrink-0">
                  {t('super_admin_dashboard.total', 'Total')}: {filteredHospitals.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold uppercase border-b text-slate-400 bg-slate-50/80 border-slate-100">
                    <th className="p-6">{t('super_admin_dashboard.hospital_name', 'Hospital Name')}</th>
                    <th className="p-6">{t('super_admin_dashboard.district', 'District')}</th>
                    <th className="p-6">{t('super_admin_dashboard.location_lat_lon', 'Location (Lat, Lon)')}</th>
                    <th className="p-6 text-right">{t('super_admin_dashboard.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHospitals.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-10 font-bold text-center text-slate-400">
                        {t('super_admin_dashboard.no_hospitals_found', 'No hospitals found.')}
                      </td>
                    </tr>
                  ) : (
                    filteredHospitals.map((h) => (
                      <tr key={h.id} className="transition hover:bg-slate-50/80">
                        <td className="p-6 font-bold text-slate-700">{h.name}</td>
                        <td className="p-6 font-medium text-slate-500">{h.district}</td>
                        <td className="p-6 font-mono text-sm text-slate-500">{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</td>
                        <td className="p-6 space-x-2 text-right">
                          <button onClick={() => handleEditHospital(h)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">{t('super_admin_dashboard.edit', 'Edit')}</button>
                          <button onClick={() => handleDeleteHospital(h.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">{t('super_admin_dashboard.delete', 'Delete')}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'Admin Management' ? (
        /* ============================== */
        /*      ADMIN MANAGEMENT          */
        /* ============================== */
        <div className="space-y-10">
          {/* ADD ADMIN FORM */}
          <div className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200 max-w-4xl">
            <h3 className="mb-6 text-xl font-black text-slate-800">{t('super_admin_dashboard.assign_hospital_admin', '👨‍💼 Assign Hospital Admin')}</h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.assign_to_hospital', 'Assign to Hospital')}</label>
                <select required value={adminForm.hospitalId} onChange={e => setAdminForm({...adminForm, hospitalId: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 outline-none">
                  <option value="" disabled>{t('super_admin_dashboard.select_hospital', 'Select Hospital')}</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.district})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.full_name', 'Full Name')}</label>
                <input required type="text" value={adminForm.fullName} onChange={e => setAdminForm({...adminForm, fullName: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder={t('super_admin_dashboard.full_name_placeholder', 'e.g. Kamal Perera')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.nic_number', 'NIC Number')}</label>
                  <input required type="text" value={adminForm.nicNumber} onChange={e => setAdminForm({...adminForm, nicNumber: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder={t('super_admin_dashboard.nic', 'NIC')} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.phone_number', 'Phone')}</label>
                  <input required type="text" value={adminForm.phoneNumber} onChange={e => setAdminForm({...adminForm, phoneNumber: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="07xxxxxxxx" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.password', 'Password')}</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder="••••••••" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-teal-600 focus:outline-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button disabled={aLoading || hospitals.length === 0} type="submit" className="w-full py-4 mt-4 font-black text-white transition bg-slate-800 rounded-xl hover:bg-slate-900 shadow-lg disabled:opacity-50">
                {aLoading ? t('super_admin_dashboard.assigning', "Assigning...") : t('super_admin_dashboard.assign_admin', "Assign Admin")}
              </button>
            </form>
          </div>

          {/* ADMIN TABLE WITH SEARCH */}
          <div className="max-w-6xl overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 gap-4">
              <h3 className="text-xl font-black text-slate-800">
                {t('super_admin_dashboard.registered_hospital_admins', 'Registered Hospital Admins')}
              </h3>
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder={t('super_admin_dashboard.search_hospital_name', 'Search by Hospital or Name...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-72 px-4 py-2 text-sm font-bold border rounded-xl border-slate-200 focus:ring-teal-500 outline-none"
                />
                <span className="px-4 py-1 text-xs font-black text-slate-700 uppercase bg-slate-200 rounded-full shrink-0">
                  {t('super_admin_dashboard.total', 'Total')}: {filteredAdmins.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold uppercase border-b text-slate-400 bg-slate-50/80 border-slate-100">
                    <th className="p-6">{t('super_admin_dashboard.admin_name', 'Admin Name')}</th>
                    <th className="p-6">{t('super_admin_dashboard.assigned_hospital', 'Assigned Hospital')}</th>
                    <th className="p-6">{t('super_admin_dashboard.nic_phone', 'NIC / Phone')}</th>
                    <th className="p-6 text-right">{t('super_admin_dashboard.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-10 font-bold text-center text-slate-400">
                        {t('super_admin_dashboard.no_admins_found', 'No admins found matching your search.')}
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="transition hover:bg-slate-50/80">
                        <td className="p-6 font-bold text-slate-700">{admin.fullName || 'N/A'}</td>
                        <td className="p-6 font-semibold text-teal-700">{admin.hospital?.name || t('super_admin_dashboard.no_hospital', 'No Hospital')}</td>
                        <td className="p-6 font-medium text-slate-500">
                          <div>{admin.user?.nicNumber || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{admin.user?.phoneNumber || 'N/A'}</div>
                        </td>
                        <td className="p-6 space-x-2 text-right">
                          <button onClick={() => handleEditAdmin(admin)} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">{t('super_admin_dashboard.edit', 'Edit')}</button>
                          <button onClick={() => handleDeleteAdmin(admin.id)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200">{t('super_admin_dashboard.delete', 'Delete')}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'Assign Doctors' ? (
        /* ============================== */
        /*        ASSIGN DOCTORS          */
        /* ============================== */
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 max-w-xl">
              <div className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200">
                <h3 className="mb-6 text-xl font-black text-slate-800">{t('super_admin_dashboard.assign_existing_doctor', '👨‍⚕️ Assign Existing Doctor to New Hospital')}</h3>
                <form onSubmit={handleAssignDoctor} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.assign_to_hospital', 'Assign to Hospital')}</label>
                    <select required value={assignDocForm.hospitalId} onChange={e => setAssignDocForm({...assignDocForm, hospitalId: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 outline-none">
                      <option value="" disabled>{t('super_admin_dashboard.select_hospital', 'Select Hospital')}</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.district})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.select_doctor_table', 'Select Doctor (Select from table)')}</label>
                    <div className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-100 text-slate-600">
                      {assignDocForm.userId ? `${t('super_admin_dashboard.selected_user_id', 'Selected User ID')}: ${assignDocForm.userId}` : t('super_admin_dashboard.please_select_doctor', 'Please select a doctor from the list')}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400">{t('super_admin_dashboard.specialization_hospital', 'Specialization (at this hospital)')}</label>
                    <input required type="text" value={assignDocForm.specialization} onChange={e => setAssignDocForm({...assignDocForm, specialization: e.target.value})} className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-teal-500 outline-none" placeholder={t('super_admin_dashboard.specialization_placeholder', 'e.g. OPD, Surgeon')} />
                  </div>
                  <button disabled={assignDocLoading || !assignDocForm.userId || !assignDocForm.hospitalId} type="submit" className="w-full py-4 mt-4 font-black text-white transition bg-teal-600 rounded-xl hover:bg-teal-700 shadow-lg disabled:opacity-50">
                    {assignDocLoading ? t('super_admin_dashboard.assigning', "Assigning...") : t('super_admin_dashboard.assign_doctors', "Assign Doctors")}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <input 
                    type="text" 
                    placeholder={t('super_admin_dashboard.search_name_nic_spec', 'Search by Name, NIC, or Specialization...')}
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm font-bold border rounded-xl border-slate-200 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="overflow-y-auto max-h-[500px]">
                  {filteredDocs.map(d => (
                    <div key={d.userId} className="p-4 border-b border-slate-100 hover:bg-slate-50 flex justify-between items-center transition">
                      <div>
                        <div className="font-bold text-slate-700">{d.doctorName}</div>
                        <div className="text-xs text-slate-500">{d.nicNumber} | {d.mainSpecialization}</div>
                        <div className="text-[10px] text-teal-600 mt-1 font-bold truncate max-w-[200px]">{d.assignedHospitals.join(', ')}</div>
                      </div>
                      <button onClick={() => setAssignDocForm({...assignDocForm, userId: d.userId, specialization: d.mainSpecialization})} className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">
                        {t('super_admin_dashboard.select', 'Select')}
                      </button>
                    </div>
                  ))}
                  {filteredDocs.length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-bold">{t('super_admin_dashboard.no_doctors_found', 'No doctors found.')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SuperAdminDashboard;
