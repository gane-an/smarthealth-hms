import React, { useState } from 'react';
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

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      if (formData.role === 'doctor') {
        setSuccess(true);
      } else {
        navigate('/patient');
      }
    } catch (error) {
      console.error(error);
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
            <Alert className="bg-primary/5 border-primary/20">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertTitle className="text-xs font-semibold">Verification Required</AlertTitle>
              <AlertDescription className="text-[10px]">
                Doctor accounts require manual approval by an administrator.
              </AlertDescription>
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
