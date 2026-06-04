import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { GraduationCap, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('No email to verify'); return; }
    setLoading(true);
    try {
      const response = await authAPI.verifyEmail({ email, otp });
      const { tokens, user } = response.data;
      localStorage.setItem('tokens', JSON.stringify(tokens));
      setUser(user);
      toast.success('Email verified!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('No email to resend to'); return; }
    setResending(true);
    try {
      await authAPI.resendOTP(email);
      toast.success('New OTP sent to your email.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-gray-800">{email || 'your email'}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input text-center text-2xl tracking-[0.5em]"
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn-primary py-3 disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={handleResend} disabled={resending} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            {resending ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
        </div>

        <p className="text-center mt-4 text-gray-600 text-sm">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}