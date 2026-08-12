import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

function CommunicationDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('Verify Patient');

  // Verify Patient State
  const [searchNic, setSearchNic] = useState('');
  const [patientId, setPatientId] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedPatient, setVerifiedPatient] = useState(null);

  // Register Patient State
  const [registerData, setRegisterData] = useState({
    nicNumber: '', phoneNumber: '', password: 'dummyPassword123', fullName: '', age: '', gender: 'Male'
  });

  // Token Generation State
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isSpecialNeed, setIsSpecialNeed] = useState(false);

  useEffect(() => {
    if (verifiedPatient) {
      fetchDoctors();
    }
  }, [verifiedPatient]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/doctors/hospital/${user.hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        const availableDoctors = data.filter(doc => doc.available && doc.roomNumber !== "Unassigned");
        setDoctors(availableDoctors);
        if (availableDoctors.length > 0) {
          setSelectedDoctorId(availableDoctors[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!searchNic) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicNumber: searchNic })
      });
      const text = await res.text();
      if (text.includes("Error")) {
        Swal.fire('Error', text, 'error');
      } else {
        setOtpSent(true);
        toast.success("OTP sent to patient's mobile");
      }
    } catch (err) {
      Swal.fire('Error', 'Server connection failed', 'error');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicNumber: searchNic, otp: otpCode })
      });
      const text = await res.text();
      if (text.includes("Error")) {
        Swal.fire('Error', text, 'error');
      } else {
        Swal.fire('Verified', 'Patient has been verified via OTP.', 'success');
        // Extract patient ID
        const match = text.match(/PatientId: (\d+)/);
        if (match) {
          setPatientId(parseInt(match[1]));
          setVerifiedPatient({ nicNumber: searchNic });
        }
      }
    } catch (err) {
      Swal.fire('Error', 'Server connection failed', 'error');
    }
    setLoading(false);
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const text = await res.text();
      if (text.includes("Error")) {
        Swal.fire('Error', text, 'error');
      } else {
        Swal.fire('Success', 'Patient registered successfully. Now go to Verify Patient tab and authenticate them.', 'success');
        setActiveTab('Verify Patient');
        setSearchNic(registerData.nicNumber);
      }
    } catch (err) {
      Swal.fire('Error', 'Registration failed', 'error');
    }
    setLoading(false);
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !patientId) return;
    setLoading(true);
    
    try {
      const payload = {
        userId: patientId,
        doctorId: selectedDoctorId,
        isSpecialNeed: isSpecialNeed,
        isCommunicationCenter: true // Bypasses distance validation
      };
      
      const res = await fetch('http://localhost:8080/api/queue/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const ticket = await res.json();
        Swal.fire({
          title: 'Token Generated!',
          html: `
            <div class="text-left space-y-2 mt-4">
              <p><strong>Token:</strong> <span class="text-2xl font-black text-teal-600">${ticket.tokenNumber}</span></p>
              <p><strong>Doctor:</strong> ${ticket.doctorName}</p>
              <p><strong>Room:</strong> ${ticket.roomNumber}</p>
              <p><strong>Status:</strong> ${ticket.status}</p>
            </div>
            <p class="mt-4 text-sm text-slate-500">Please provide this ticket number to the patient.</p>
          `,
          icon: 'success'
        });
        // Reset patient context after generation
        setVerifiedPatient(null);
        setPatientId(null);
        setOtpSent(false);
        setSearchNic('');
        setOtpCode('');
      } else {
        const text = await res.text();
        Swal.fire('Error', text, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to generate token', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 p-6 bg-white border border-teal-100 shadow-sm rounded-3xl">
          <div className="p-4 bg-teal-100 rounded-2xl">
            <span className="text-4xl">📞</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Communication Center Dashboard</h2>
            <p className="font-medium text-slate-500">{user.centerName || 'Center'} - {user.hospitalId ? 'Hospital Attached' : 'No Hospital'}</p>
          </div>
        </div>

        {/* Tabs */}
        {!verifiedPatient && (
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('Verify Patient')}
              className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'Verify Patient' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              Verify Patient (OTP)
            </button>
            <button 
              onClick={() => setActiveTab('Register Patient')}
              className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'Register Patient' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              Register New Patient
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8">
          
          {verifiedPatient ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-teal-50 border border-teal-100 rounded-xl">
                <div>
                  <h3 className="text-lg font-black text-teal-800">Patient Verified</h3>
                  <p className="text-teal-600 font-medium text-sm">NIC: {verifiedPatient.nicNumber}</p>
                </div>
                <button 
                  onClick={() => { setVerifiedPatient(null); setOtpSent(false); setOtpCode(''); }}
                  className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-100 rounded-lg hover:bg-rose-200"
                >
                  Cancel / Start Over
                </button>
              </div>

              <form onSubmit={handleGenerateToken} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Select Doctor</label>
                  <select 
                    required 
                    value={selectedDoctorId} 
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="" disabled>Select a doctor...</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.doctorName} ({doc.specialization}) - Room: {doc.roomNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="specialNeed"
                    checked={isSpecialNeed}
                    onChange={(e) => setIsSpecialNeed(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="specialNeed" className="font-semibold text-amber-800">
                    Patient has special needs / Disability priority
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-teal-600 text-white font-black rounded-xl shadow-lg hover:bg-teal-700 transition"
                >
                  {loading ? 'Generating...' : 'Generate Queue Token'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {activeTab === 'Verify Patient' ? (
                <div className="space-y-6 max-w-md mx-auto">
                  <h3 className="text-xl font-black text-slate-800 text-center">Authenticate Patient</h3>
                  <p className="text-slate-500 text-center text-sm mb-4">You must authenticate the patient using their NIC and SMS OTP before generating a token.</p>
                  
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">Patient NIC Number</label>
                        <input 
                          type="text" required placeholder="Enter NIC"
                          className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500 text-center text-lg tracking-widest"
                          value={searchNic} onChange={e => setSearchNic(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit" disabled={loading || !searchNic}
                        className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg hover:bg-teal-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Send OTP via SMS'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">Enter OTP Code</label>
                        <input 
                          type="text" required placeholder="123456"
                          className="w-full px-4 py-4 font-black border-2 border-teal-200 rounded-xl bg-teal-50 focus:ring-2 focus:ring-teal-500 text-center text-2xl tracking-[0.5em]"
                          value={otpCode} onChange={e => setOtpCode(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit" disabled={loading || !otpCode}
                        className="w-full py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg hover:bg-teal-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify OTP & Proceed'}
                      </button>
                      <button 
                        type="button" onClick={() => setOtpSent(false)}
                        className="w-full py-2 text-slate-500 font-bold hover:text-slate-700"
                      >
                        Try different NIC
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRegisterPatient} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-xl font-black text-slate-800">Register New Patient</h3>
                    <p className="text-slate-500 text-sm">Register a patient without a smartphone. They will receive an OTP for authentication.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Full Name</label>
                    <input 
                      type="text" required placeholder="Patient Name"
                      className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50"
                      value={registerData.fullName} onChange={e => setRegisterData({...registerData, fullName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">NIC Number</label>
                    <input 
                      type="text" required placeholder="NIC"
                      className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50"
                      value={registerData.nicNumber} onChange={e => setRegisterData({...registerData, nicNumber: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Phone Number (For OTP)</label>
                    <input 
                      type="text" required placeholder="Mobile Number"
                      className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50"
                      value={registerData.phoneNumber} onChange={e => setRegisterData({...registerData, phoneNumber: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Age</label>
                    <input 
                      type="number" required placeholder="Age"
                      className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50"
                      value={registerData.age} onChange={e => setRegisterData({...registerData, age: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Gender</label>
                    <select 
                      className="w-full px-4 py-3 font-bold border rounded-xl border-slate-200 bg-slate-50"
                      value={registerData.gender} onChange={e => setRegisterData({...registerData, gender: e.target.value})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 mt-4">
                    <button 
                      type="submit" disabled={loading}
                      className="w-full py-4 bg-teal-600 text-white font-black rounded-xl shadow-lg hover:bg-teal-700 transition"
                    >
                      {loading ? 'Registering...' : 'Register Patient'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default CommunicationDashboard;
