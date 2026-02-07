import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useExamStore } from '@/stores/examStore';
import { AlertCircle, Loader2, ShieldCheck, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Proctored Exam System</h1>
          <p className="text-muted-foreground">Enter your email to access the exam</p>
        </div>

        {/* Login Card */}
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle>Student Login</CardTitle>
            <CardDescription>Enter your email address to begin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="animate-shake">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Access Exam'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="w-full pt-4 border-t">
              <h3 className="text-sm font-medium text-foreground mb-2">Important Notes:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your email must be authorized to access the exam</li>
                <li>• The exam is proctored - violations will be tracked</li>
                <li>• Do not switch tabs or open developer tools</li>
                <li>• Your progress will be auto-saved every 5 seconds</li>
              </ul>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Need help? Contact your instructor</p>

          {/* Admin Login Button */}
          <Button
            type="button"
            onClick={() => navigate('/admin/login')}
            variant="link"
            className="text-sm"
          >
            Admin Login
          </Button>
        </div>
      </div>

      {/* Profile Completion Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Complete Your Profile</DialogTitle>
                <DialogDescription>Just one more step before starting the exam</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            {/* Email Display (Read-only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isCompletingProfile}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be used to identify you in exam reports
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isCompletingProfile || !fullName.trim()}
                className="w-full"
                size="lg"
              >
                {isCompletingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Continue to Exam
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
