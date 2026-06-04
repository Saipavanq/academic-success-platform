import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  User, Mail, Phone, Building2, GraduationCap, BookOpen,
  Medal, Target, Shield, Camera, CheckCircle, XCircle,
  Save, Lock, Bell, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = '';

export default function Profile() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', department: '', year_of_study: '',
    email_notifications: true, sms_notifications: false,
    push_notifications: true, in_app_notifications: true,
  });
  const [studentForm, setStudentForm] = useState({
    student_id: '', gpa: '', target_gpa: '', academic_goal: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: '', new_password: '', confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      department: user.department || '',
      year_of_study: user.year_of_study || '',
      email_notifications: user.email_notifications ?? true,
      sms_notifications: user.sms_notifications ?? false,
      push_notifications: user.push_notifications ?? true,
      in_app_notifications: user.in_app_notifications ?? true,
    });
    loadStudentProfile();
  }, [user]);

  const loadStudentProfile = async () => {
    try {
      const res = await authAPI.getStudentProfile();
      const data = res.data;
      setStudentProfile(data);
      setStudentForm({
        student_id: data.student_id || '',
        gpa: data.gpa || '',
        target_gpa: data.target_gpa || '',
        academic_goal: data.academic_goal || '',
      });
    } catch {}
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.append('avatar', file);
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(fd);
      setUser(res.data);
      setAvatarPreview(null);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfilePartial({
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, department: form.department,
        year_of_study: form.year_of_study ? parseInt(form.year_of_study) : null,
      });
      setUser(res.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStudent = async () => {
    setSaving(true);
    try {
      const data = { ...studentForm };
      data.gpa = data.gpa ? parseFloat(data.gpa) : null;
      data.target_gpa = data.target_gpa ? parseFloat(data.target_gpa) : null;
      const res = await authAPI.updateStudentProfile(data);
      setStudentProfile(res.data);
      toast.success('Academic info updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfilePartial({
        email_notifications: form.email_notifications,
        sms_notifications: form.sms_notifications,
        push_notifications: form.push_notifications,
        in_app_notifications: form.in_app_notifications,
      });
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = avatarPreview || (user?.avatar ? `${API_BASE}${user.avatar}` : null);

  const tabs = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'academic', label: 'Academic', icon: GraduationCap },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-10 text-white">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white/70" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
              <p className="text-primary-100 capitalize">{user?.role}</p>
              <div className="flex gap-3 mt-2">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${user?.is_verified ? 'bg-green-400/30 text-green-200' : 'bg-yellow-400/30 text-yellow-200'}`}>
                  {user?.is_verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {user?.is_verified ? 'Email Verified' : 'Email Unverified'}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${user?.is_phone_verified ? 'bg-green-400/30 text-green-200' : 'bg-yellow-400/30 text-yellow-200'}`}>
                  {user?.is_phone_verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {user?.is_phone_verified ? 'Phone Verified' : 'Phone Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-8">
          {activeTab === 'personal' && (
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="input bg-gray-50 text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {user?.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+1234567890" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                  <select value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })} className="input">
                    <option value="">Select year</option>
                    {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button onClick={handleSavePersonal} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input type="text" value={studentForm.student_id} onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} className="input" placeholder="e.g. STU-2024-0001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current GPA</label>
                  <input type="number" step="0.01" min="0" max="4" value={studentForm.gpa} onChange={(e) => setStudentForm({ ...studentForm, gpa: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target GPA</label>
                  <input type="number" step="0.01" min="0" max="4" value={studentForm.target_gpa} onChange={(e) => setStudentForm({ ...studentForm, target_gpa: e.target.value })} className="input" placeholder="4.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Goal</label>
                <textarea value={studentForm.academic_goal} onChange={(e) => setStudentForm({ ...studentForm, academic_goal: e.target.value })} className="input min-h-[100px]" placeholder="What do you want to achieve this semester?" />
              </div>
              <div className="pt-4">
                <button onClick={handleSaveStudent} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Academic Info'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-xl space-y-4">
              {[
                { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: Mail },
                { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive updates via text message', icon: Phone },
                { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive browser push alerts', icon: Bell },
                { key: 'in_app_notifications', label: 'In-App Notifications', desc: 'Show notifications within the app', icon: Shield },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => setForm({ ...form, [item.key]: !form[item.key] })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form[item.key] ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form[item.key] ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                );
              })}
              <div className="pt-4">
                <button onClick={handleSaveNotifications} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-md space-y-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      className="input pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="input" minLength={8} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="input" minLength={8} required />
                </div>
                <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}