import React, { useState, useEffect, useRef } from 'react';

function DoctorProfile({ user }) {
  const [profilePicture, setProfilePicture] = useState(null);
  const [doctorProfiles, setDoctorProfiles] = useState([]);
  const [activeHospitalId, setActiveHospitalId] = useState(() => {
    return parseInt(localStorage.getItem('activeHospitalId')) || user?.hospitalId || 1;
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Doctor Profiles and Profile Picture
  useEffect(() => {
    if (user?.id) {
      // Fetch Doctor Profiles (Hospitals)
      fetch(`http://localhost:8080/api/doctors/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setDoctorProfiles(data);
        })
        .catch(err => console.error(err));

      // Fetch Profile Picture
      fetch(`http://localhost:8080/api/users/${user.id}/profile-picture`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePicture) {
            setProfilePicture(data.profilePicture);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user?.id]);

  const handleHospitalChange = (hospitalId) => {
    const profile = doctorProfiles.find(d => d.hospitalId === parseInt(hospitalId));
    if (profile) {
      setActiveHospitalId(profile.hospitalId);
      localStorage.setItem('activeHospitalId', profile.hospitalId);
      localStorage.setItem('activeDoctorId', profile.doctorId);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert("Image size must be less than 1MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        saveProfilePicture(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfilePicture = async (base64String) => {
    setUploading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/users/${user.id}/profile-picture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePicture: base64String })
      });
      if (res.ok) {
        setProfilePicture(base64String);
        alert("Profile picture updated successfully! ✅");
      } else {
        alert("Failed to update profile picture.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Bar */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">My Profile</h2>
          <p className="mt-1 text-slate-500 font-medium">Manage your personal information and hospital assignments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Photo & Basic Info */}
          <div className="col-span-1">
            <div className="p-6 bg-white border shadow-sm rounded-3xl border-slate-200 flex flex-col items-center">
              <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current.click()}>
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-100 flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-slate-300">👨‍⚕️</span>
                  )}
                </div>
                
                {/* Overlay for upload */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold text-center px-2">
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                />
              </div>

              <h3 className="text-xl font-black text-slate-800 text-center">{user?.fullName || 'Dr. Hemantha'}</h3>
              <p className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full mt-2">Doctor Profile</p>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">NIC Number</span>
                  <span className="font-medium text-slate-700">{user?.nicNumber || 'N/A'}</span>
                </div>
                {user?.phoneNumber && (
                  <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</span>
                    <span className="font-medium text-slate-700">{user?.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Hospital Switching */}
          <div className="col-span-1 md:col-span-2">
            <div className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-sm">🏥</span>
                Active Hospital Assignment
              </h3>
              
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-slate-600 mb-6 font-medium">Select the hospital you are currently working at. This will update your Live Queue dashboard.</p>
                
                {doctorProfiles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {doctorProfiles.map(p => (
                      <div 
                        key={p.hospitalId} 
                        onClick={() => handleHospitalChange(p.hospitalId)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          activeHospitalId === p.hospitalId 
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                            activeHospitalId === p.hospitalId ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            🏥
                          </div>
                          <div>
                            <h4 className={`font-black text-lg ${activeHospitalId === p.hospitalId ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {p.hospitalName}
                            </h4>
                            <p className={`text-sm font-bold ${activeHospitalId === p.hospitalId ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {p.mainSpecialization}
                            </p>
                          </div>
                        </div>
                        
                        {activeHospitalId === p.hospitalId && (
                          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 font-medium text-center">
                    You are not assigned to any hospitals yet.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DoctorProfile;
