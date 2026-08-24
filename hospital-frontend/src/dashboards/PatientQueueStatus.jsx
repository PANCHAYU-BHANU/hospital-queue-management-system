import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation, Trans } from 'react-i18next';

function PatientQueueStatus({ user }) {
  const [activeTicket, setActiveTicket] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const previousStatus = useRef(null);

  const fetchActiveTicketAndStatus = async () => {
    try {
      // Get the active ticket first
      const ticketRes = await fetch(`http://localhost:8080/api/queue/active/${user.id}`);
      if (ticketRes.ok) {
        const ticketData = await ticketRes.text();
        if (ticketData) {
          const ticket = JSON.parse(ticketData);
          setActiveTicket(ticket);

          // Get the live queue status for this ticket
          const statusRes = await fetch(`http://localhost:8080/api/queue/status/${ticket.id}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setQueueStatus(statusData);
          }
        } else {
          setActiveTicket(null);
          setQueueStatus(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTicketAndStatus();
    // Poll every 10 seconds
    const interval = setInterval(fetchActiveTicketAndStatus, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    if (activeTicket) {
      import('sweetalert2').then((Swal) => {
        if (activeTicket.status === 'CALLED' && previousStatus.current !== 'CALLED') {
          Swal.default.fire({
            title: t('patient_dashboard.status_called', 'ඔබගේ වාරය පැමිණ ඇත! 🔔'),
            text: t('patient_dashboard.status_called', 'කරුණාකර වෛද්‍යවරයාගේ කාමරයට යන්න (Please proceed to the doctor\'s room)'),
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0d9488'
          });
        }
        
        if (activeTicket.status === 'PHARMACY_QUEUE' && previousStatus.current !== 'PHARMACY_QUEUE') {
          Swal.default.fire({
            title: t('patient_dashboard.status_pharmacy', 'බෙහෙත් වට්ටෝරුව සූදානම්! 💊'),
            text: t('patient_dashboard.status_pharmacy', 'කරුණාකර රෝහලේ ෆාමසිය වෙත ගොස් ඔබගේ බෙහෙත් ලබාගන්න. (Please proceed to the Pharmacy)'),
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0d9488'
          });
        }
        
        if (activeTicket.status === 'PENDING_PAYMENT' && previousStatus.current !== 'PENDING_PAYMENT') {
          Swal.default.fire({
            title: t('patient_dashboard.status_pending_payment', 'බෙහෙත් නිකුත් කර ඇත! 🎁'),
            text: t('patient_dashboard.status_pending_payment', 'ඔබගේ බෙහෙත් පාර්සලය සූදානම්. කරුණාකර ෆාමසියෙන් ලබාගන්න.'),
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0d9488'
          });
        }
      });
      previousStatus.current = activeTicket.status;
    }
  }, [activeTicket]);

  if (loading) {
    return <div className="p-8 font-bold text-center text-slate-500">{t('patient_queue_status.loading', 'Loading Queue Status...')}</div>;
  }

  if (!activeTicket) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
        <span className="text-6xl mb-4 text-slate-300">🎫</span>
        <h2 className="text-2xl font-bold text-slate-700">{t('patient_queue_status.no_active_tokens', 'No Active Tokens')}</h2>
        <p className="mt-2 text-slate-500">{t('patient_queue_status.no_active_tokens_desc', "You don't have any active appointments right now.")}</p>
        <p className="text-sm text-slate-400">{t('patient_queue_status.request_new_token_hint', 'Go to "Get Token" to request a new token.')}</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CALLED': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'IN_CONSULTATION': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'PHARMACY_QUEUE': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PENDING_PAYMENT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* TICKET HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-1">{t('patient_queue_status.your_token_number', 'Your Token Number')}</h2>
          <div className="text-5xl font-extrabold text-slate-800">#{activeTicket.tokenNumber}</div>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold border ${getStatusColor(activeTicket.status)}`}>
          {activeTicket.status === 'PHARMACY_QUEUE' ? t('patient_queue_status.at_pharmacy', 'AT PHARMACY') : 
           activeTicket.status === 'PENDING_PAYMENT' ? t('patient_queue_status.ready_for_pickup', 'READY FOR PICKUP') : 
           activeTicket.status}
        </div>
      </div>

      {/* QUEUE LIVE STATUS */}
      {queueStatus && !['PHARMACY_QUEUE', 'PENDING_PAYMENT'].includes(activeTicket.status) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">{t('patient_queue_status.people_ahead', 'People Ahead of You')}</h3>
            <div className="text-5xl font-black text-teal-600">
              {queueStatus.positionInQueue}
            </div>
            <p className="text-xs font-medium text-slate-400 mt-2">{t('patient_queue_status.currently_waiting', 'Currently waiting')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">{t('patient_queue_status.estimated_wait_time', 'Estimated Wait Time')}</h3>
            <div className="text-5xl font-black text-amber-500">
              {queueStatus.estimatedWaitTimeMinutes} <span className="text-2xl font-bold">{t('patient_queue_status.min', 'min')}</span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-2">{t('patient_queue_status.mins_per_patient', { time: queueStatus.avgTimePerPatient, defaultValue: `~${queueStatus.avgTimePerPatient} mins per patient` })}</p>
          </div>
        </div>
      )}

      {/* PRIORITY WARNING */}
      {queueStatus && !queueStatus.priority && queueStatus.status === 'PENDING' && queueStatus.maxPrioritySlots > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
          <div className="text-2xl mt-1">⚠️</div>
          <div>
            <h4 className="font-bold text-rose-800 mb-1">{t('patient_queue_status.notice_normal_tokens', 'Notice for Normal Tokens')}</h4>
            <p className="text-sm text-rose-700 leading-relaxed font-medium">
              <Trans i18nKey="patient_queue_status.notice_normal_desc1">
                Since you have a <strong>NORMAL</strong> token, priority patients (like seniors or emergencies) may be called before you.
              </Trans>
            </p>
            <div className="mt-3 bg-white/60 p-3 rounded-lg border border-rose-100 text-sm text-rose-800">
              <Trans i18nKey="patient_queue_status.notice_normal_desc2_1" values={{ slots: queueStatus.maxPrioritySlots }}>
                Based on your position, up to <strong>{{slots}}</strong> priority patient(s) could potentially join ahead of you.
              </Trans>
              <br/>
              {queueStatus.maxPrioritySlots === 1 ? (
                <Trans i18nKey="patient_queue_status.notice_normal_desc2_2" values={{ addedTime: queueStatus.maxPrioritySlots * queueStatus.avgTimePerPatient }}>
                  If that happens, it would add approximately <strong>{{addedTime}} minutes</strong> to your wait time.
                </Trans>
              ) : (
                <Trans i18nKey="patient_queue_status.notice_normal_desc2_3" values={{ addedTime: queueStatus.maxPrioritySlots * queueStatus.avgTimePerPatient }}>
                  If they all arrive, it would add approximately <strong>{{addedTime}} minutes</strong> to your wait time.
                </Trans>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR & ROOM INFO */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <span className="text-sm font-bold text-slate-400 uppercase">{t('patient_queue_status.doctor', 'Doctor')}</span>
          <span className="font-bold text-slate-700">Dr. {activeTicket.doctorName}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <span className="text-sm font-bold text-slate-400 uppercase">{t('patient_queue_status.room', 'Room')}</span>
          <span className="font-bold text-slate-700">{activeTicket.roomNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-400 uppercase">{t('patient_queue_status.queue_type', 'Queue Type')}</span>
          <span className={`font-bold text-sm px-2 py-1 rounded-lg ${activeTicket.queueType === 'PRIORITY' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
            {activeTicket.queueType === 'PRIORITY' ? t('patient_dashboard.priority', 'PRIORITY') : t('patient_dashboard.regular', 'REGULAR')}
          </span>
        </div>
      </div>

      {/* ACCEPT MEDICINES ACTION */}
      {activeTicket.status === 'PENDING_PAYMENT' && (
        <div className="mt-8 text-center animate-fade-in">
          <button
            onClick={async () => {
              import('sweetalert2').then(async (Swal) => {
                const result = await Swal.default.fire({
                  title: t('patient_queue_status.swal_received_title', 'Have you received your medicines?'),
                  text: t('patient_queue_status.swal_received_text', 'Confirm only after you have physically received your medicines from the pharmacy.'),
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonText: t('patient_queue_status.swal_received_btn', 'Yes, I received them!'),
                  confirmButtonColor: '#0d9488'
                });
                
                if (result.isConfirmed) {
                  try {
                    const res = await fetch(`http://localhost:8080/api/queue/payment-complete/${activeTicket.id}`, { method: 'PUT' });
                    if (res.ok) {
                      Swal.default.fire(
                        t('patient_queue_status.swal_completed_title', 'Completed!'),
                        t('patient_queue_status.swal_completed_text', 'Thank you. Have a safe recovery!'),
                        'success'
                      );
                      fetchActiveTicketAndStatus();
                    }
                  } catch (e) {
                    console.error("Failed to complete:", e);
                  }
                }
              });
            }}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-1"
          >
            {t('patient_queue_status.btn_received', '✅ I Received My Medicines')}
          </button>
        </div>
      )}
    </div>
  );
}

export default PatientQueueStatus;
