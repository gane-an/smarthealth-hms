import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Upload, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '@/services/api';

interface DepartmentDto {
  id: string;
  name: string;
  doctors: {
    id: string;
    name: string;
    availabilitySchedule?: string | null;
    degrees?: string | null;
  }[];
}

const BookAppointment: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    departmentId: '',
    doctorId: '',
    date: '',
    time: '',
    isEmergency: false,
    reasonForVisit: '',
  });

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [booking, setBooking] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityCache, setAvailabilityCache] = useState<
    Record<string, { unavailable: string[]; fetchedAt: number }>
  >({});
  const [medicalFiles, setMedicalFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reasonTrimmed = formData.reasonForVisit.trim();
  const hasReasonError =
    reasonTrimmed.length > 0 && (reasonTrimmed.length < 10 || reasonTrimmed.length > 500);

  const filteredDoctors =
    departments.find(d => d.id === formData.departmentId)?.doctors ?? [];

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get<DepartmentDto[]>('/patient/departments');
        setDepartments(res.data);
      } catch {
        toast.error('Failed to load departments');
      }
    };
    loadDepartments();
  }, []);

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const base = new Date();
    base.setHours(9, 0, 0, 0);

    while (slots.length < 12) {
      const hours = base.getHours();
      const minutes = base.getMinutes();
      if (!(hours === 12 && minutes >= 0 && minutes < 45)) {
        slots.push(
          base.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        );
      }
      base.setMinutes(base.getMinutes() + 25);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isPastSlot = (slot: string, isoDate: string) => {
    if (!isoDate) return false;
    const now = new Date();
    const slotDate = new Date(isoDate + 'T00:00:00');
    if (
      slotDate.getFullYear() !== now.getFullYear() ||
      slotDate.getMonth() !== now.getMonth() ||
      slotDate.getDate() !== now.getDate()
    ) {
      return false;
    }

    const [timePart, period] = slot.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime.getTime() < now.getTime();
  };

  useEffect(() => {
    setUnavailableSlots([]);
    if (!formData.doctorId || !formData.date) {
      return;
    }

    let cancelled = false;
    const cacheKey = `${formData.doctorId}-${formData.date}`;

    const loadAvailability = async () => {
      try {
        const cached = availabilityCache[cacheKey];
        const now = Date.now();
        if (cached && now - cached.fetchedAt < 10000) {
          if (!cancelled) {
            setUnavailableSlots(cached.unavailable);
          }
          return;
        }

        setLoadingSlots(true);
        const res = await api.get<{ unavailable: string[] }>('/patient/appointments/availability', {
          params: {
            doctorId: formData.doctorId,
            date: formData.date,
          },
        });
        if (!cancelled) {
          const unavailable = res.data.unavailable || [];
          setUnavailableSlots(unavailable);
          setAvailabilityCache((prev) => ({
            ...prev,
            [cacheKey]: { unavailable, fetchedAt: Date.now() },
          }));
        }
      } catch {
        if (!cancelled) {
          setUnavailableSlots([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    };

    loadAvailability();
    const interval = window.setInterval(loadAvailability, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [formData.doctorId, formData.date]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const maxFiles = 5;
    const maxSizeBytes = 5 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const existingCount = medicalFiles.length;
    const incoming = Array.from(files);
    const remaining = Math.max(maxFiles - existingCount, 0);
    const limited = incoming.slice(0, remaining);

    const valid: File[] = [];

    for (const file of limited) {
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPG and PNG files are allowed.');
        continue;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
        continue;
      }
      valid.push(file);
    }

    if (!valid.length) return;

    setMedicalFiles((prev) => [...prev, ...valid]);
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setBooking(true);
    setUploadProgress(null);
    try {
      const validate = await api.get<{ allowed: boolean; message?: string }>('/patient/appointments/validate', {
        params: {
          departmentId: formData.departmentId,
          doctorId: formData.doctorId,
          date: formData.date,
          timeSlot: formData.time,
        },
      });
      if (!validate.data.allowed) {
        toast.error(validate.data.message || 'This appointment conflicts with your existing bookings');
        setBooking(false);
        return;
      }
      const appointmentRes = await api.post<{ id: string }>('/patient/appointments', {
        departmentId: formData.departmentId,
        doctorId: formData.doctorId,
        date: formData.date,
        timeSlot: formData.time,
        isEmergency: formData.isEmergency,
        reasonForVisit: formData.reasonForVisit.trim(),
      });

      const appointmentId = appointmentRes.data.id;

      if (appointmentId && medicalFiles.length > 0) {
        const uploadData = new FormData();
        medicalFiles.forEach((file) => {
          uploadData.append('files', file);
        });
        await api.post(`/patient/appointments/${appointmentId}/records`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (event) => {
            if (!event.total) {
              setUploadProgress(null);
              return;
            }
            const percent = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(percent);
          },
        });
      }

      toast.success('Appointment booked successfully');
      navigate('/patient/appointments');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to book appointment';
      toast.error(message);
    } finally {
      setBooking(false);
      setUploadProgress(null);
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
          <Alert className="bg-muted/40 border-muted">
            <AlertTitle>{t('booking_rules_title')}</AlertTitle>
            <AlertDescription>
              {t('booking_rules_description')}
            </AlertDescription>
          </Alert>
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid gap-2">
                <Label>{t('departments')}</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, departmentId: v, doctorId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>{t('doctor')}</Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(v) => setFormData({ ...formData, doctorId: v })}
                  disabled={!formData.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
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

              <div className="grid gap-2">
                <Label>Reason for Visit / Symptoms (Optional)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Describe your main symptoms, when they started, and any relevant history..."
                  value={formData.reasonForVisit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reasonForVisit: e.target.value,
                    })
                  }
                />
                <p className={`text-xs ${hasReasonError ? 'text-destructive' : 'text-muted-foreground'}`}>
                  Optional, but if provided use between 10 and 500 characters.
                </p>
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
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isSelected = formData.date === date.toISOString().split('T')[0];
                    const disabled = isWeekend;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          !disabled &&
                          setFormData({
                            ...formData,
                            date: date.toISOString().split('T')[0],
                          })
                        }
                        className={`flex flex-col items-center justify-center min-w-[80px] h-24 rounded-xl border-2 transition-all ${
                          disabled
                            ? 'bg-muted/40 border-muted text-muted-foreground cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-card border-muted hover:border-primary/50'
                        }`}
                      >
                        <span className="text-xs opacity-80">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-xl font-bold">{date.getDate()}</span>
                        <span className="text-xs opacity-80">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
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
                    const isUnavailable = unavailableSlots.includes(slot);
                    const past = isPastSlot(slot, formData.date);
                    const disabled =
                      !formData.date ||
                      !formData.doctorId ||
                      isUnavailable ||
                      loadingSlots ||
                      past;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        title={
                          isUnavailable
                            ? 'This timeslot already booked'
                            : past
                            ? 'This timeslot has already passed'
                            : undefined
                        }
                        onClick={() =>
                          !disabled &&
                          setFormData({
                            ...formData,
                            time: slot,
                          })
                        }
                        className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                          disabled && (isUnavailable || past)
                            ? 'bg-muted/40 border-muted text-muted-foreground cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 border-transparent hover:border-primary/30'
                        }`}
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
                  <span className="font-bold">
                    {filteredDoctors.find(d => d.id === formData.doctorId)?.name || ''}
                  </span>
                </div>
                {filteredDoctors.find(d => d.id === formData.doctorId)?.degrees && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Degrees:</span>
                    <span className="font-bold">
                      {filteredDoctors.find(d => d.id === formData.doctorId)?.degrees}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-bold">
                    {departments.find(d => d.id === formData.departmentId)?.name || ''}
                  </span>
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
                {formData.reasonForVisit && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Reason for Visit:</span>
                    <span className="font-bold max-w-[60%] text-right line-clamp-3">
                      {formData.reasonForVisit}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Attach Medical Records (Optional)
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div
                  className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Click to upload or drag & drop</p>
                  <p className="text-xs opacity-50 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                  {medicalFiles.length > 0 && (
                    <p className="text-xs mt-2">
                      {medicalFiles.length} file{medicalFiles.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                  {uploadProgress !== null && (
                    <p className="text-xs mt-1">Uploading... {uploadProgress}%</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            aria-label={step === 3 ? 'Confirm appointment' : 'Next step'}
            aria-disabled={
              (step === 1 && (!formData.departmentId || !formData.doctorId)) ||
              (step === 2 && (!formData.date || !formData.time)) ||
              (step === 3 && booking)
            }
            aria-busy={step === 3 && booking}
            disabled={
              (step === 1 && (!formData.departmentId || !formData.doctorId)) ||
              (step === 2 && (!formData.date || !formData.time)) ||
              (step === 3 && booking)
            }
          >
            {step === 3 ? (booking ? 'Booking...' : 'Confirm Appointment') : 'Next Step'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BookAppointment;
