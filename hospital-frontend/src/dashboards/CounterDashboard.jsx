import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function CounterDashboard({ user }) {
  const { t } = useTranslation();
  const [pendingTokens, setPendingTokens] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Offline Registration State
  const [offlineNic, setOfflineNic] = useState('');
  const [offlineName, setOfflineName] = useState('');
  const [offlineAge, setOfflineAge] = useState('');
  const [offlineGender, setOfflineGender] = useState('Male');
  const [offlinePriority, setOfflinePriority] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);

  const hospitalId = user?.hospitalId || 1;

  // 🔄 1. Pending Approvals & Payments Backend එකෙන් ගන්න ලොජික් එක
  const fetchData = async () => {
    try {
      // Pending Approvals
      const response = await fetch('http://localhost:8080/api/queue/pending-approvals');
      if (response.ok) {
        const data = await response.json();
        setPendingTokens(data);
      }

      // Pending Payments
      const paymentResponse = await fetch(`http://localhost:8080/api/queue/pending-payments/${hospitalId}`);
      if (paymentResponse.ok) {
        const pData = await paymentResponse.json();
        setPendingPayments(pData);
      }

    } catch (error) {
      console.error("Fetch pending error:", error);
      setErrorMsg(t('counter_dashboard.server_not_connected', 'Server not connected! 🔌'));
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  // 🚀 2. "Approve" බටන් එක
  const handleApprove = async (queueId) => {
    setActionLoading(queueId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8080/api/queue/approve/${queueId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuccessMsg(t('counter_dashboard.token_approved', 'Token approved successfully! ✅'));
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(t('counter_dashboard.failed_to_approve', 'Failed to approve token.'));
      }
    } catch (error) {
      console.error("Approve error:", error);
      setErrorMsg(t('counter_dashboard.server_issue', 'Server issue!'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (queueId) => {
    setActionLoading(queueId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8080/api/queue/reject/${queueId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuccessMsg(t('counter_dashboard.token_rejected', 'Token rejected successfully! ❌'));
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(t('counter_dashboard.failed_to_reject', 'Failed to reject token.'));
      }
    } catch (error) {
      console.error("Reject error:", error);
      setErrorMsg(t('counter_dashboard.server_issue', 'Server issue!'));
    } finally {
      setActionLoading(null);
    }
  };

  // 💰 3. Complete Payment
  const handleCompletePayment = async (queueId) => {
    setActionLoading(`pay-${queueId}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8080/api/queue/payment-complete/${queueId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuccessMsg(t('counter_dashboard.payment_completed', 'Payment completed! Patient consultation fully complete! ✅'));
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(t('counter_dashboard.failed_to_complete_payment', 'Failed to complete payment.'));
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMsg(t('counter_dashboard.server_issue', 'Server issue!'));
    } finally {
      setActionLoading(null);
    }
  };

  // 📝 4. Offline Patient Registration
  const handleOfflineRegistration = async (e) => {
    e.preventDefault();
    setOfflineLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const requestData = {
      nicNumber: offlineNic,
      fullName: offlineName,
      age: parseInt(offlineAge),
      gender: offlineGender,
      doctorId: 1, // Default OPD doctor
      specialNeed: offlinePriority
    };

    try {
      const response = await fetch('http://localhost:8080/api/queue/offline-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const text = await response.text();
      if (response.ok) {
        setSuccessMsg(`✅ ${text}`);
        setOfflineNic('');
        setOfflineName('');
        setOfflineAge('');
        setOfflinePriority(false);
        fetchData();
      } else {
        setErrorMsg(t('counter_dashboard.error_prefix', 'Error: ') + text);
      }
    } catch (err) {
      setErrorMsg(t('counter_dashboard.server_error', 'Server Error!'));
      console.error(err);
    } finally {
      setOfflineLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in p-8">
      
      {/* 📢 Live Feedback Notifications */}
      {successMsg && (
        <div className="p-4 text-sm font-bold text-center border shadow-sm bg-emerald-50 text-emerald-700 border-emerald-100 rounded-2xl animate-fade-in">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 text-sm font-bold text-center border shadow-sm bg-rose-50 text-rose-600 border-rose-100 rounded-2xl animate-pulse">
          {errorMsg}
        </div>
      )}

      {/* 📋 Pending Approvals Table Card */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200/60">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
            <span className="text-teal-600">⏳</span> {t('counter_dashboard.token_approval_list', 'Token Approval Queue List').replace('⏳ ', '')}
          </h3>
          <button 
            onClick={fetchData}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm"
          >
            {t('counter_dashboard.refresh_list', '🔄 Refresh List')}
          </button>
        </div>

        {pendingTokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold tracking-wider uppercase border-b border-slate-100 text-slate-400 bg-slate-50/30">
                  <th className="px-6 py-4">{t('counter_dashboard.token_no', 'Token No')}</th>
                  <th className="px-6 py-4">{t('counter_dashboard.patient_name', 'Patient Name')}</th>
                  <th className="px-6 py-4">{t('counter_dashboard.nic_number', 'NIC Number')}</th>
                  <th className="px-6 py-4">{t('counter_dashboard.department', 'Department')}</th>
                  <th className="px-6 py-4">{t('counter_dashboard.priority', 'Priority')}</th>
                  <th className="px-6 py-4 text-right">{t('counter_dashboard.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-slate-100 text-slate-700">
                {pendingTokens.map((token) => (
                  <tr key={token.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-black text-teal-700 rounded-lg bg-teal-50">
                        #{token.tokenNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{token.patientName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{token.patientNic}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-600">{token.department}</span>
                    </td>
                    <td className="px-6 py-4">
                      {token.queueType === 'PRIORITY' ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black rounded uppercase tracking-wider">
                          {t('counter_dashboard.high_priority', '⚠️ HIGH')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded uppercase">
                          {t('counter_dashboard.normal_priority', 'Normal')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(token.id)}
                          disabled={actionLoading === token.id}
                          className="px-4 py-2 text-xs font-black text-white transition bg-rose-500 shadow-md hover:bg-rose-600 disabled:bg-slate-200 rounded-xl"
                        >
                          {actionLoading === token.id ? t('counter_dashboard.processing_dots', '...') : t('counter_dashboard.reject_btn', '✕ Reject')}
                        </button>
                        <button
                          onClick={() => handleApprove(token.id)}
                          disabled={actionLoading === token.id}
                          className="px-4 py-2 text-xs font-black text-white transition bg-teal-600 shadow-md hover:bg-teal-700 disabled:bg-slate-200 rounded-xl"
                        >
                          {actionLoading === token.id ? t('counter_dashboard.approving', 'Approving...') : t('counter_dashboard.approve_btn', '✓ Approve')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 space-y-2 text-center text-slate-400">
            <span className="block text-5xl">☕</span>
            <p className="font-bold text-slate-500">{t('counter_dashboard.no_pending_tokens', 'No pending tokens at the moment!')}</p>
            <p className="max-w-xs text-xs text-slate-400">{t('counter_dashboard.token_added_live', 'When a patient gets a token, it will be added to this list live.')}</p>
          </div>
        )}
      </div>

      {/* 💰 Pending Payments Table Card */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-3xl border-teal-200 shadow-teal-500/5 mt-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-teal-100 bg-teal-50/50">
          <h3 className="flex items-center gap-2 text-lg font-black text-teal-800">
            <span className="text-2xl">💰</span> {t('counter_dashboard.pending_pharmacy_payments', 'Pending Pharmacy Payments').replace('💰 ', '')}
          </h3>
        </div>

        {pendingPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold tracking-wider uppercase border-b border-teal-100 text-teal-600 bg-teal-50/30">
                  <th className="px-6 py-4">{t('counter_dashboard.token_no', 'Token No')}</th>
                  <th className="px-6 py-4">{t('counter_dashboard.patient_name', 'Patient Name')}</th>
                  <th className="px-6 py-4">{t('counter_dashboard.doctor', 'Doctor')}</th>
                  <th className="px-6 py-4 text-right">{t('counter_dashboard.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-teal-50 text-slate-700">
                {pendingPayments.map((token) => (
                  <tr key={token.id} className="transition hover:bg-teal-50/40">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-black text-teal-700 rounded-lg bg-teal-50">
                        #{token.tokenNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{token.patientName}</td>
                    <td className="px-6 py-4 text-slate-500">Dr. {token.doctorName}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCompletePayment(token.id)}
                        disabled={actionLoading === `pay-${token.id}`}
                        className="px-6 py-2.5 text-xs font-black text-white transition bg-teal-600 shadow-md hover:bg-teal-700 disabled:bg-slate-300 rounded-xl"
                      >
                        {actionLoading === `pay-${token.id}` ? t('counter_dashboard.processing', 'Processing...') : t('counter_dashboard.payment_received', '💵 Payment Received')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 space-y-2 text-center text-slate-400">
             <span className="block text-4xl">🎉</span>
             <p className="font-bold text-slate-500">{t('counter_dashboard.no_pending_payments', 'No pending payments for pharmacy.')}</p>
          </div>
        )}
      </div>

      {/* 🏥 Offline Registration Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm mt-8">
        <h3 className="flex items-center gap-2 text-lg font-black text-slate-800 mb-6">
          <span className="text-teal-600">📝</span> {t('counter_dashboard.register_walkin_patient', 'Register Walk-in Patient').replace('📝 ', '')}
        </h3>
        
        <form onSubmit={handleOfflineRegistration} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('counter_dashboard.nic_number', 'NIC Number')}</label>
            <input required type="text" value={offlineNic} onChange={e => setOfflineNic(e.target.value)} className="w-full px-4 py-3 border rounded-xl border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder={t('counter_dashboard.nic_placeholder', 'e.g., 901234567V')}/>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('counter_dashboard.full_name', 'Full Name')}</label>
            <input required type="text" value={offlineName} onChange={e => setOfflineName(e.target.value)} className="w-full px-4 py-3 border rounded-xl border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder={t('counter_dashboard.full_name', 'Patient Name')}/>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('counter_dashboard.age', 'Age')}</label>
            <input required type="number" value={offlineAge} onChange={e => setOfflineAge(e.target.value)} className="w-full px-4 py-3 border rounded-xl border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" placeholder={t('counter_dashboard.age_placeholder', 'e.g., 45')}/>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('counter_dashboard.gender', 'Gender')}</label>
            <select value={offlineGender} onChange={e => setOfflineGender(e.target.value)} className="w-full px-4 py-3 border rounded-xl border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="Male">{t('counter_dashboard.male', 'Male')}</option>
              <option value="Female">{t('counter_dashboard.female', 'Female')}</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <input type="checkbox" id="offlinePriority" checked={offlinePriority} onChange={e => setOfflinePriority(e.target.checked)} className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"/>
            <label htmlFor="offlinePriority" className="text-sm font-bold text-slate-700">{t('counter_dashboard.special_need_priority', 'Special Need / Priority (Senior / Disabled)')}</label>
          </div>
          <div className="md:col-span-2 pt-4 border-t border-slate-100">
            <button disabled={offlineLoading} type="submit" className="w-full py-4 text-white font-black bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-lg shadow-teal-600/20 disabled:bg-slate-300">
              {offlineLoading ? t('counter_dashboard.registering', 'Registering...') : t('counter_dashboard.register_patient_btn', 'Register Patient & Generate Token 🎟️')}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default CounterDashboard;