import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function PatientMedicalRecords({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/medical-records/search?nic=${user.nicNumber}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        } else {
          console.error("Failed to fetch medical records");
        }
      } catch (err) {
        console.error("Server error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user.id]);

  const handleCardClick = (record) => {
    const formatMeds = (jsonString) => {
      try {
        const parsed = JSON.parse(jsonString || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            return parsed.map(item => `<li>${item}</li>`).join('');
          } else {
            return parsed.map(item => `<li><strong>${item.name}</strong> (${item.frequency} for ${item.days} days)</li>`).join('');
          }
        }
        return '';
      } catch (e) {
        return jsonString && jsonString !== '[]' ? `<li>${jsonString}</li>` : '';
      }
    };

    const pharmacyHtmlContent = formatMeds(record.pharmacyMedicines);
    const pharmacyHtml = pharmacyHtmlContent 
      ? `<div style="text-align: left; background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
           <strong style="color: #475569;">Pharmacy Medicines:</strong>
           <ul style="margin: 5px 0 0 20px; color: #0f172a; list-style-type: disc;">${pharmacyHtmlContent}</ul>
         </div>`
      : '';

    const externalHtmlContent = formatMeds(record.externalMedicines);
    const externalHtml = externalHtmlContent 
      ? `<div style="text-align: left; background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
           <strong style="color: #475569;">External Medicines:</strong>
           <ul style="margin: 5px 0 0 20px; color: #0f172a; list-style-type: disc;">${externalHtmlContent}</ul>
         </div>`
      : '';

    const notesHtml = record.notes 
      ? `<div style="text-align: left; background: #fffbeb; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
           <strong style="color: #b45309;">Doctor's Notes:</strong>
           <p style="margin: 5px 0 0 0; color: #78350f;">${record.notes}</p>
         </div>`
      : '';

    Swal.fire({
      title: `<h3 style="color: #0f172a; margin: 0;">${record.diagnosis}</h3>`,
      html: `
        <div style="font-size: 14px; text-align: left;">
          <p style="color: #64748b; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            <strong>Date:</strong> ${new Date(record.createdAt).toLocaleDateString()} <br/>
            <strong>Doctor:</strong> Dr. ${record.doctorName} <br/>
            <strong>Hospital:</strong> ${record.hospitalName} <br/>
            <strong>Your Age:</strong> ${record.patientAgeAtConsultation}
          </p>
          ${pharmacyHtml}
          ${externalHtml}
          ${notesHtml}
          ${!pharmacyHtml && !externalHtml ? '<p style="color: #94a3b8; text-align: center;">No medicines prescribed.</p>' : ''}
        </div>
      `,
      confirmButtonColor: '#0d9488',
      confirmButtonText: 'Close',
      width: '500px'
    });
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-bold">Loading your medical history...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800">📁 My Medical Records</h2>
        <p className="text-slate-500 mt-1">View your past consultation history, diagnosis, and prescriptions.</p>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-6xl mb-4 block">📋</span>
          <h3 className="text-xl font-bold text-slate-700">No Records Found</h3>
          <p className="text-slate-500 mt-2">You don't have any past medical records yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => (
            <div 
              key={record.id} 
              onClick={() => handleCardClick(record)}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🩺
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-slate-800 mb-1 line-clamp-1">{record.diagnosis}</h3>
              
              <div className="space-y-1.5 mt-4 text-sm font-medium text-slate-500">
                <p className="flex items-center gap-2">
                  <span>👨‍⚕️</span> Dr. {record.doctorName}
                </p>
                <p className="flex items-center gap-2">
                  <span>🏥</span> {record.hospitalName}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end text-teal-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition">
                View Details →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientMedicalRecords;
