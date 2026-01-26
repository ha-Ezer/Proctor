import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useExamStore } from '@/stores/examStore';
import { AlertCircle, Loader2, ShieldCheck, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const setStudent = useExamStore((state) => state.setStudent);

  // Login state
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Profile completion state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.studentLogin(email);
      const { token, student, needsProfileCompletion } = response.data.data;

      // Clear any admin token first (to prevent token conflict)
      localStorage.removeItem('proctor_admin_token');

      if (needsProfileCompletion) {
        // Student needs to complete profile
        setTempToken(token);
        setShowProfileModal(true);
        setIsLoading(false);
      } else {
        // Student has already completed profile - proceed to exam
        storage.set(STORAGE_KEYS.TOKEN, token);
        storage.set(STORAGE_KEYS.STUDENT, student);
        setStudent(student);
        navigate('/exam');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !tempToken) return;

    setIsCompletingProfile(true);

    try {
      // Set token temporarily to make authenticated request
      storage.set(STORAGE_KEYS.TOKEN, tempToken);

      // Complete profile
      const response = await authApi.completeProfile(fullName.trim());
      const updatedStudent = response.data.data;

      // Store updated student data
      storage.set(STORAGE_KEYS.STUDENT, updatedStudent);
      setStudent(updatedStudent);

      // Show success message
      toast.success('Profile completed! Starting exam...', {
        duration: 2000,
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      });

      // Navigate to exam after brief delay
      setTimeout(() => {
        navigate('/exam');
      }, 1000);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to complete profile';
      toast.error(message);
      setIsCompletingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proctored Exam System</h1>
          <p className="text-gray-600">Enter your email to access the exam</p>
        </div>

        {/* Login Card */}
        <div className="card animate-slide-in">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="input"
                disabled={isLoading}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-danger-50 border border-danger-200 rounded-lg animate-shake">
                <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-danger-800">Login Failed</p>
                  <p className="text-sm text-danger-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Access Exam</span>
              )}
            </button>
          </form>

          {/* Important Notes */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your email must be authorized to access the exam</li>
              <li>• The exam is proctored - violations will be tracked</li>
              <li>• Do not switch tabs or open developer tools</li>
              <li>• Your progress will be auto-saved every 5 seconds</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-gray-600">Need help? Contact your instructor</p>

          {/* Admin Login Button */}
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
          >
            Admin Login
          </button>
        </div>
      </div>

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slide-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
                  <p className="text-sm text-gray-600">Just one more step before starting the exam</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCompleteProfile} className="p-6 space-y-4">
              {/* Email Display (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="input bg-gray-50 text-gray-600 cursor-not-allowed">
                  {email}
                </div>
              </div>

              {/* Full Name Input */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input"
                  disabled={isCompletingProfile}
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be used to identify you in exam reports
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCompletingProfile || !fullName.trim()}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isCompletingProfile ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Continue to Exam</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
