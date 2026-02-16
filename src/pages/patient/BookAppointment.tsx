import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Upload, AlertTriangle } from 'lucide-react';
import { departments, doctors } from '@/utils/mockData';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const BookAppointment: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    date: '',
    time: '',
    isEmergency: false,
    notes: ''
  });

  const filteredDoctors = doctors.filter(d => d.dept === formData.department);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM'
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      toast.success("Appointment Booked Successfully!");
      navigate('/patient');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <span className={`text-sm hidden sm:inline ${step === s ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Details' : s === 2 ? 'Schedule' : 'Confirm'}
            </span>
            {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'} hidden sm:block`} />}
          </div>
        ))}
      </div>

      <Card className="medical-card border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{t('book_appointment')}</CardTitle>
          <CardDescription>Follow the steps to schedule your visit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid gap-2">
                <Label>{t('departments')}</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v, doctor: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.name}>{language === 'en' ? d.name : d.taName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>{t('doctor')}</Label>
                <Select value={formData.doctor} onValueChange={(v) => setFormData({...formData, doctor: v})} disabled={!formData.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map(d => (
                      <SelectItem key={d.id} value={d.name}>{language === 'en' ? d.name : d.taName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-accent/5 rounded-lg border border-accent/20">
                <Checkbox 
                  id="emergency" 
                  checked={formData.isEmergency} 
                  onCheckedChange={(v) => setFormData({...formData, isEmergency: v as boolean})} 
                />
                <Label htmlFor="emergency" className="flex items-center gap-2 text-accent font-bold cursor-pointer">
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Appointment?
                </Label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-2">
                <Label>Select Date</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {[0, 1, 2, 3, 4].map((i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isSelected = formData.date === date.toISOString().split('T')[0];
                    return (
                      <button
                        key={i}
                        onClick={() => setFormData({...formData, date: date.toISOString().split('T')[0]})}
                        className={`flex flex-col items-center justify-center min-w-[80px] h-24 rounded-xl border-2 transition-all ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-muted hover:border-primary/50'}`}
                      >
                        <span className="text-xs opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-xl font-bold">{date.getDate()}</span>
                        <span className="text-xs opacity-80">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Select Time Slot</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = formData.time === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setFormData({...formData, time: slot})}
                        className={`p-2 rounded-lg border text-sm font-medium transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-transparent hover:border-primary/30'}`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-muted/30 p-6 rounded-xl space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="font-bold">{formData.doctor}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-bold">{formData.department}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-bold">{formData.date}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-bold">{formData.time}</span>
                </div>
                {formData.isEmergency && (
                  <div className="flex justify-between border-b pb-2 text-accent">
                    <span className="font-bold">Type:</span>
                    <span className="font-bold uppercase">Emergency</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Attach Medical Records (Optional)
                </Label>
                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Click to upload or drag & drop</p>
                  <p className="text-xs opacity-50 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={(step === 1 && (!formData.department || !formData.doctor)) || (step === 2 && (!formData.date || !formData.time))}>
            {step === 3 ? 'Confirm Appointment' : 'Next Step'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BookAppointment;
