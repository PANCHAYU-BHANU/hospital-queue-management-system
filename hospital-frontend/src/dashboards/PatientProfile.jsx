import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

function PatientProfile({ user }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    fullName: '',
    nicNumber: '',
    phoneNumber: '',
    age: '',
    gender: '',
    profilePictureBase64: '',
    homeAddress: '',
    alternateAddress: '',
    bloodGroup: '',
    emergencyContact: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && user.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/profile/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        toast.error("Failed to load profile details.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB limit
        toast.error("Image size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profilePictureBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    // Sri Lanka phone number validation (basic)
    const phoneRegex = /^(?:0|94|\+94)?(?:7[0-9]{8}|[1-9][0-9]{8})$/;
    
    if (profile.phoneNumber && !phoneRegex.test(profile.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = "Invalid phone number format";
    }
    
    if (profile.emergencyContact && !phoneRegex.test(profile.emergencyContact.replace(/\s/g, ''))) {
      newErrors.emergencyContact = "Must be a valid telephone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfile = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/patients/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        toast.success("Profile updated successfully! ✅");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      toast.error("Network error. Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <span className="text-4xl">🧑‍💼</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">{t('patient_profile.my_profile', 'My Profile')}</h2>
            <p className="text-teal-100 font-medium mt-1">{t('patient_profile.manage_info', 'Manage your personal information and contact details')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            
            {/* Beautiful Avatar Section */}
            <div className="relative group mb-6">
              <div 
                onClick={triggerFileInput}
                className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-50 flex items-center justify-center relative z-10 cursor-pointer transition-transform duration-300 group-hover:scale-105"
              >
                {profile.profilePictureBase64 ? (
                  <img src={profile.profilePictureBase64} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-6xl text-slate-300">👤</span>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="text-white text-xs font-bold tracking-wider uppercase">Change Photo</span>
                </div>
              </div>
              
              {/* Decorative rings behind avatar */}
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 scale-110 -z-0"></div>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{profile.fullName || 'Patient Name'}</h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-xs font-bold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Patient Account
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">{t('patient_profile.security_info', 'Security Info')}</h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">{t('patient_profile.nic_number', 'NIC Number')}</label>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-700">{profile.nicNumber || 'Not Provided'}</span>
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">{t('patient_profile.nic_verified', 'Your NIC is verified and cannot be changed for security purposes.')}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form Inputs */}
        <div className="xl:col-span-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          
          <div className="space-y-8">
            {/* Section 1: Contact Details */}
            <div>
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>📞</span> {t('patient_profile.contact_info', 'Contact Information')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('patient_profile.phone_number', 'Phone Number')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      name="phoneNumber"
                      value={profile.phoneNumber || ''}
                      onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.phoneNumber ? 'border-rose-300 bg-rose-50' : 'border-slate-200'} rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm`}
                      placeholder="07X XXX XXXX"
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-rose-500 font-bold ml-1">{errors.phoneNumber}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('patient_profile.emergency_contact', 'Emergency Contact (Phone Number)')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      name="emergencyContact"
                      value={profile.emergencyContact || ''}
                      onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.emergencyContact ? 'border-rose-300 bg-rose-50' : 'border-slate-200'} rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all shadow-sm`}
                      placeholder="07X XXX XXXX"
                    />
                  </div>
                  {errors.emergencyContact && <p className="text-xs text-rose-500 font-bold ml-1">{errors.emergencyContact}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Addresses */}
            <div>
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>📍</span> {t('patient_profile.location_details', 'Location Details')}
              </h4>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('patient_profile.home_address', 'Home Address')}</label>
                  <textarea 
                    name="homeAddress"
                    rows="2"
                    value={profile.homeAddress || ''}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm resize-none"
                    placeholder="Enter your permanent residence address..."
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('patient_profile.alternate_address', 'Alternate Address')}</label>
                  <textarea 
                    name="alternateAddress"
                    rows="2"
                    value={profile.alternateAddress || ''}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm resize-none"
                    placeholder="Workplace or temporary address..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section 3: Medical Info */}
            <div>
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>🩸</span> {t('patient_profile.medical_info', 'Medical Info')}
              </h4>
              <div className="w-full md:w-1/2 pr-0 md:pr-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('patient_profile.blood_group', 'Blood Group')}</label>
                  <div className="relative">
                    <select 
                      name="bloodGroup"
                      value={profile.bloodGroup || ''}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="" className="text-slate-400">Select Blood Group</option>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action Area */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">
              Your details are kept secure
            </p>
            <button 
              onClick={saveProfile}
              disabled={saving}
              className="group relative px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('patient_profile.saving_changes', 'Saving Changes...')}</span>
                </>
              ) : (
                <>
                  <span>{t('patient_profile.save_changes', 'Save Changes')}</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PatientProfile;
