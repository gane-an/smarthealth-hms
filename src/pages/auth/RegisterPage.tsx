import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/services/api';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    email: '',
    password: '',
    role: 'patient' as UserRole,
    departmentId: '',
    licenseId: '',
    availabilitySchedule: '',
    degrees: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [doctorDocument, setDoctorDocument] = useState<File | null>(null);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get<{ id: string; name: string }[]>('/auth/departments');
        setDepartments(res.data);
      } catch {
      }
    };
    loadDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.dateOfBirth) {
        setError('Date of birth is required');
        setLoading(false);
        return;
      }
      if (!formData.gender) {
        setError('Gender is required');
        setLoading(false);
        return;
      }

      if (formData.role === 'doctor' && !doctorDocument) {
        setError('Approval document is required for doctor registration');
        setLoading(false);
        return;
      }

      await register({
        ...formData,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender || 'other',
        doctorDocument,
      });
      if (formData.role === 'doctor') {
        setSuccess(true);
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="medical-card border-none shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Registration Pending</CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            Your doctor profile has been submitted for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Our administration team will review your credentials. You will receive an email once your account is approved.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="medical-card border-none shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t('register')}</CardTitle>
        <CardDescription className="text-center">
          Join our medical network today
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Dr. Jane Smith" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(v) =>
                setFormData({ ...formData, gender: v as 'male' | 'female' | 'other' })
              }
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">{t('role')}</Label>
            <Select 
              value={formData.role} 
              onValueChange={(v) => setFormData({...formData, role: v as UserRole})}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">{t('patient')}</SelectItem>
                <SelectItem value="doctor">{t('doctor')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.role === 'doctor' && (
            <>
              <Alert className="bg-primary/5 border-primary/20">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold">Verification Required</AlertTitle>
                <AlertDescription className="text-[10px]">
                  Doctor accounts require manual approval by an administrator.
                </AlertDescription>
              </Alert>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="degrees">Degrees / Qualifications</Label>
                <Input
                  id="degrees"
                  placeholder="MBBS, MD, DM"
                  value={formData.degrees}
                  onChange={(e) => setFormData({ ...formData, degrees: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="license">License ID (optional)</Label>
                <Input
                  id="license"
                  placeholder="LC-12345"
                  value={formData.licenseId}
                  onChange={(e) => setFormData({ ...formData, licenseId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availability">Availability Schedule (optional)</Label>
                <Input
                  id="availability"
                  placeholder="Mon-Fri 10:00-16:00"
                  value={formData.availabilitySchedule}
                  onChange={(e) => setFormData({ ...formData, availabilitySchedule: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="approvalDocument">Approval Document (PDF, JPG, PNG, max 5MB)</Label>
                <Input
                  id="approvalDocument"
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                    setDoctorDocument(file);
                  }}
                />
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@hospital.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('register')}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('login')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterPage;
