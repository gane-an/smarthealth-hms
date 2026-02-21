import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  MoreVertical, 
  ShieldAlert,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import api from '@/services/api';
import { toast } from 'sonner';

type QueueStateMessage = {
  doctorId: string;
  day: string;
  items: {
    id: string;
    queueNumber: number;
    status: string;
    isEmergency: boolean;
    position: number | null;
    timeSlot?: string;
    patientName?: string | null;
  }[];
  currentServingId: string | null;
  currentServingQueueNumber: number | null;
  waitingCount: number;
  completedCount: number;
  averageConsultationMinutes: number;
};

type CurrentAppointmentDto = {
  id: string;
  date: string;
  timeSlot: string;
  status: 'booked' | 'in_consultation' | 'completed' | 'cancelled';
  isEmergency: boolean;
  queueNumber: number;
  reasonForVisit?: string | null;
  patient: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    dateOfBirth?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
  };
};

type MedicalRecordDto = {
  id: string;
  appointmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
};

declare global {
  interface Window {
    io?: (url?: string) => any;
  }
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [currentlyServing, setCurrentlyServing] = useState<number | null>(null);
  const [waitingCount, setWaitingCount] = useState<number | null>(null);
  const [queueDoctorId, setQueueDoctorId] = useState<string | null>(null);
  const [queueDay, setQueueDay] = useState<string | null>(null);
  const [currentServingId, setCurrentServingId] = useState<string | null>(null);
  const [currentAppointment, setCurrentAppointment] = useState<CurrentAppointmentDto | null>(null);
  const [queueItems, setQueueItems] = useState<QueueStateMessage['items']>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueConnectionStatus, setQueueConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isCompleting, setIsCompleting] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordDto[]>([]);
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
  const [isStartingConsultation, setIsStartingConsultation] = useState(false);
  const [isMarkingNotPresented, setIsMarkingNotPresented] = useState(false);

  const formatAgeGender = (dateOfBirth?: string | null, gender?: 'male' | 'female' | 'other' | null) => {
    const parts: string[] = [];
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (!Number.isNaN(dob.getTime())) {
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age -= 1;
        }
        if (age >= 0 && age <= 130) {
          parts.push(`${age} yrs`);
        }
      }
    }
    if (gender) {
      const label = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other';
      parts.push(label);
    }
    return parts.join(' • ');
  };

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const res = await api.get<{ todaysAppointments: number }>('/doctor/dashboard');
        const queueRes = await api.get<{
          doctorId: string;
          day: string;
          items: QueueStateMessage['items'];
          currentServingId: string | null;
          currentServingQueueNumber: number | null;
          waitingCount: number;
          currentServingAppointment: CurrentAppointmentDto | null;
        }>('/doctor/queue/today');
        if (!cancelled) {
          setTodayCount(res.data.todaysAppointments);
          setCurrentlyServing(queueRes.data.currentServingQueueNumber);
          setWaitingCount(queueRes.data.waitingCount);
          setQueueDoctorId(queueRes.data.doctorId);
          setQueueDay(queueRes.data.day);
          setCurrentServingId(queueRes.data.currentServingId);
          setCurrentAppointment(queueRes.data.currentServingAppointment);
          setQueueItems(queueRes.data.items || []);
          setQueueLoading(false);
          setQueueConnectionStatus('connected');
        }
      } catch {
        if (!cancelled) {
          setTodayCount(null);
          setCurrentlyServing(null);
          setWaitingCount(null);
          setQueueDoctorId(null);
          setQueueDay(null);
          setCurrentServingId(null);
          setCurrentAppointment(null);
          setQueueItems([]);
          setQueueLoading(false);
          setQueueConnectionStatus('disconnected');
        }
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!window.io || !queueDoctorId || !queueDay) {
      return;
    }

    const socket = window.io();
    setQueueConnectionStatus('connecting');

    socket.emit('queue:join', {
      doctorId: queueDoctorId,
      day: queueDay,
    });

    const handleQueueUpdate = (msg: QueueStateMessage) => {
      if (msg.doctorId !== queueDoctorId || msg.day !== queueDay) {
        return;
      }

      setCurrentlyServing(msg.currentServingQueueNumber);
      setWaitingCount(msg.waitingCount);
      setCurrentServingId(msg.currentServingId);
      setQueueItems(msg.items);
      const todaysAppointments = msg.items.filter(
        (item) => item.status === 'booked' || item.status === 'completed',
      ).length;
      setTodayCount(todaysAppointments);
    };

    const handleConnect = () => {
      setQueueConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      setQueueConnectionStatus('disconnected');
    };

    const handleReconnectAttempt = () => {
      setQueueConnectionStatus('connecting');
    };

    socket.on('queue:update', handleQueueUpdate);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io?.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('queue:update', handleQueueUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io?.off('reconnect_attempt', handleReconnectAttempt);
      socket.disconnect();
    };
  }, [queueDoctorId, queueDay]);

  useEffect(() => {
    if (!currentServingId) {
      setCurrentAppointment(null);
      setMedicalRecords([]);
      return;
    }

    let cancelled = false;

    const loadCurrent = async () => {
      try {
        const res = await api.get<CurrentAppointmentDto>(`/doctor/appointments/${currentServingId}`);
        if (!cancelled) {
          setCurrentAppointment(res.data);
        }
      } catch {
        if (!cancelled) {
          setCurrentAppointment(null);
        }
      }
    };

    loadCurrent();

    return () => {
      cancelled = true;
    };
  }, [currentServingId]);

  useEffect(() => {
    if (!currentAppointment) {
      setMedicalRecords([]);
      return;
    }

    let cancelled = false;

    const loadRecords = async () => {
      try {
        setMedicalRecordsLoading(true);
        const res = await api.get<MedicalRecordDto[]>(`/doctor/appointments/${currentAppointment.id}/records`);
        if (!cancelled) {
          setMedicalRecords(res.data || []);
        }
      } catch {
        if (!cancelled) {
          setMedicalRecords([]);
        }
      } finally {
        if (!cancelled) {
          setMedicalRecordsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [currentAppointment?.id]);

  const handleDownloadRecord = async (record: MedicalRecordDto) => {
    if (!currentAppointment) {
      return;
    }
    try {
      const res = await api.get(
        `/doctor/appointments/${currentAppointment.id}/records/${record.id}/download`,
        { responseType: 'blob' },
      );
      const contentType = res.headers['content-type'] || record.fileType || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download medical record');
    }
  };

  const handleAddPrescription = () => {
    if (!currentAppointment) {
      return;
    }

    navigate('/doctor/prescriptions', {
      state: {
        fromDashboard: true,
        patient: {
          id: currentAppointment.patient.id,
          name: currentAppointment.patient.name,
          email: currentAppointment.patient.email,
          phone: currentAppointment.patient.phone ?? null,
        },
        appointment: {
          id: currentAppointment.id,
          date: currentAppointment.date,
          timeSlot: currentAppointment.timeSlot,
          queueNumber: currentAppointment.queueNumber,
          reasonForVisit: currentAppointment.reasonForVisit ?? '',
          isEmergency: currentAppointment.isEmergency,
        },
      },
    });
  };

  const handleStartConsultation = async () => {
    if (!currentAppointment || currentAppointment.status !== 'booked') {
      return;
    }

    try {
      setIsStartingConsultation(true);
      await api.patch(`/doctor/appointments/${currentAppointment.id}/status`, {
        status: 'in_consultation',
      });
      toast.success('Consultation started');
    } catch {
      toast.error('Failed to start consultation');
    } finally {
      setIsStartingConsultation(false);
    }
  };

  const handleCompleteCurrent = async () => {
    if (!currentAppointment || currentAppointment.status !== 'in_consultation') {
      return;
    }

    try {
      setIsCompleting(true);
      await api.patch(`/doctor/appointments/${currentAppointment.id}/status`, {
        status: 'completed',
      });
      toast.success('Consultation marked as completed');
    } catch {
      toast.error('Failed to complete consultation');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNotPresented = async () => {
    if (
      !currentAppointment ||
      (currentAppointment.status !== 'booked' && currentAppointment.status !== 'in_consultation')
    ) {
      return;
    }

    try {
      setIsMarkingNotPresented(true);
      await api.patch(`/doctor/appointments/${currentAppointment.id}/not-presented`);
      toast.success('Appointment marked as not presented');
    } catch {
      toast.error('Failed to mark as not presented');
    } finally {
      setIsMarkingNotPresented(false);
    }
  };

  const stats = [
    { title: t('todays_appointments'), value: todayCount ?? 0, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    {
      title: 'Currently Serving',
      value: currentlyServing != null ? `Token #${currentlyServing}` : '--',
      icon: Users,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'Waiting Patients',
      value: waitingCount != null ? waitingCount : 0,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  const nextPatients = queueItems
    .filter((item) => item.status === 'booked')
    .filter((item) =>
      currentlyServing != null ? item.queueNumber > currentlyServing : true,
    )
    .sort((a, b) => a.queueNumber - b.queueNumber)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Good morning, {user?.name}</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                Emergency Trigger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center gap-3 text-destructive mb-2">
                  <ShieldAlert className="w-8 h-8" />
                  <DialogTitle className="text-2xl">Emergency Protocol</DialogTitle>
                </div>
                <DialogDescription className="text-base">
                  Activating emergency mode will notify all waiting patients and administrators.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                  <h4 className="font-bold mb-1">Reallocate All Patients</h4>
                  <p className="text-xs text-muted-foreground">Automatically transfer your current queue to other available doctors in the department.</p>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                  <h4 className="font-bold mb-1">Reschedule for Tomorrow</h4>
                  <p className="text-xs text-muted-foreground">Notify patients that their appointments are moved to the same time tomorrow.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmergencyModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => {
                  setEmergencyModalOpen(false);
                  alert("Emergency protocol activated. All patients notified.");
                }}>Confirm Action</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">View Calendar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="medical-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentAppointment && (
        <Card className="medical-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Currently Serving</CardTitle>
              <CardDescription>
                Token #{currentAppointment.queueNumber} • {currentAppointment.timeSlot}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPrescription}
              >
                <FileText className="w-4 h-4" />
                Add Prescription
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                disabled={currentAppointment.status !== 'booked' || isStartingConsultation}
                onClick={handleStartConsultation}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isStartingConsultation ? 'Starting...' : 'Start'}
              </Button>
              <Button
                size="sm"
                className="gap-1"
                disabled={currentAppointment.status !== 'in_consultation' || isCompleting}
                onClick={handleCompleteCurrent}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleting ? 'Completing...' : 'Complete'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1"
                disabled={
                  (currentAppointment.status !== 'booked' && currentAppointment.status !== 'in_consultation') ||
                  isMarkingNotPresented
                }
                onClick={handleNotPresented}
              >
                {isMarkingNotPresented ? 'Marking...' : 'Not Presented'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Patient</p>
              <p className="text-base font-bold">{currentAppointment.patient.name}</p>
              <p className="text-xs text-muted-foreground">
                Email: {currentAppointment.patient.email}
              </p>
              {currentAppointment.patient.phone && (
                <p className="text-xs text-muted-foreground">
                  Phone: {currentAppointment.patient.phone}
                </p>
              )}
              {formatAgeGender(currentAppointment.patient.dateOfBirth, currentAppointment.patient.gender) && (
                <p className="text-xs text-muted-foreground">
                  {formatAgeGender(currentAppointment.patient.dateOfBirth, currentAppointment.patient.gender)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Appointment</p>
              <p className="text-sm">
                Date: {new Date(currentAppointment.date).toISOString().split('T')[0]}
              </p>
              <p className="text-sm">Time: {currentAppointment.timeSlot}</p>
              {currentAppointment.isEmergency && (
                <Badge variant="destructive" className="text-[10px]">
                  Emergency
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Reason for Visit</p>
                <p className="text-sm">
                  {currentAppointment.reasonForVisit && currentAppointment.reasonForVisit.trim().length > 0
                    ? currentAppointment.reasonForVisit
                    : 'No reason provided'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Medical Records</p>
                {medicalRecordsLoading && (
                  <p className="text-xs text-muted-foreground">Loading records...</p>
                )}
                {!medicalRecordsLoading && medicalRecords.length === 0 && (
                  <p className="text-xs text-muted-foreground">No records attached</p>
                )}
                {!medicalRecordsLoading && medicalRecords.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {medicalRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-muted px-2 py-1"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium truncate max-w-[150px]">
                            {record.fileName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {(record.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] px-2 py-1"
                          onClick={() => handleDownloadRecord(record)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 medical-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Next Patients</CardTitle>
              <CardDescription>Upcoming queue for Room 302</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">View All</Button>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className={`w-2 h-2 rounded-full ${
                    queueConnectionStatus === 'connected'
                      ? 'bg-green-500'
                      : queueConnectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                {queueConnectionStatus === 'connected'
                  ? 'Live'
                  : queueConnectionStatus === 'connecting'
                  ? 'Reconnecting...'
                  : 'Offline'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {queueLoading && (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 border-transparent animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="w-24 h-3 rounded bg-muted" />
                        <div className="w-32 h-3 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="w-16 h-8 rounded bg-muted" />
                  </div>
                ))}
              </>
            )}
            {!queueLoading && nextPatients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No patients are currently waiting in the queue.
              </p>
            )}
            {!queueLoading &&
              nextPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    patient.isEmergency
                      ? 'bg-accent/5 border-accent/20'
                      : 'bg-muted/30 border-transparent hover:border-primary/20'
                  } transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        patient.isEmergency ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {patient.queueNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">
                          {patient.patientName || `Token #${patient.queueNumber}`}
                        </p>
                        {patient.isEmergency && (
                          <Badge variant="destructive" className="text-[10px]">
                            URGENT
                          </Badge>
                        )}
                      </div>
                      {patient.timeSlot && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {patient.timeSlot}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      History
                    </Button>
                    <Button size="sm" className="gap-1" disabled>
                      <CheckCircle2 className="w-4 h-4" /> Start
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-3 py-6" asChild>
              <Link to="/doctor/prescriptions">
                <FileText className="w-5 h-5 text-primary" />
                <span>Upload Prescription</span>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 py-6">
              <Users className="w-5 h-5 text-secondary" />
              <span>Queue Management</span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 py-6">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <span>Broadcast Notice</span>
            </Button>
          </CardContent>
          <div className="p-6 pt-0 mt-4 border-t">
            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">AI Queue Optimizer</h4>
            <div className="space-y-2">
              <p className="text-xs">Suggested: Move Token #14 up due to symptom severity reported in pre-check.</p>
              <Button size="sm" variant="secondary" className="w-full text-xs">Apply Optimization</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
