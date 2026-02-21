import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, Bell, ArrowRight, BrainCircuit, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';

type NextAppointmentDto = {
  id: string;
  providerName: string;
  datetime: string;
  timeSlot: string;
  location: string | null;
  type: string;
  status: string;
};

type LiveQueuePayload = {
  appointmentId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  queueNumber?: number;
  position: number | null;
  patientsAhead: number;
  estimatedWaitingMinutes: number;
  day: string;
  status?: string;
};

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

declare global {
  interface Window {
    io?: (url?: string) => any;
  }
}

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [nextAppointment, setNextAppointment] = useState<NextAppointmentDto | null>(null);
  const [queueData, setQueueData] = useState<LiveQueuePayload | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const socketRef = useRef<any>(null);
  const lastQueueUpdateRef = useRef<number>(0);

  const featureRealtimeDashboard =
    import.meta.env.VITE_FEATURE_DASHBOARD_REALTIME !== 'false';

  const formatAgeGender = () => {
    const parts: string[] = [];
    if (user?.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
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
    if (user?.gender) {
      const label = user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : 'Other';
      parts.push(label);
    }
    return parts.join(' • ');
  };

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      const nextRes = await api.get<{ hasNextAppointment: boolean; appointment?: NextAppointmentDto }>('/patient/appointments/next');

      if (!nextRes.data.hasNextAppointment || !nextRes.data.appointment) {
        setNextAppointment(null);
        setQueueData(null);
        return;
      }

      const appointment = nextRes.data.appointment;
      setNextAppointment(appointment);

      const queueRes = await api.get<{
        position: number | null;
        totalAhead: number;
        estimatedMinutes: number;
        lastUpdated: string | null;
        doctorId: string;
        day: string;
        status?: string;
      }>(`/patient/queue/${appointment.id}`);

      setQueueData({
        appointmentId: appointment.id,
        doctorId: queueRes.data.doctorId,
        date: appointment.datetime,
        timeSlot: appointment.timeSlot,
        queueNumber: undefined,
        position: queueRes.data.position,
        patientsAhead: queueRes.data.totalAhead,
        estimatedWaitingMinutes: queueRes.data.estimatedMinutes,
        day: queueRes.data.day,
        status: queueRes.data.status,
      });
      lastQueueUpdateRef.current = Date.now();
    } catch {
      setNextAppointment(null);
      setQueueData(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!featureRealtimeDashboard) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      const now = Date.now();
      if (now - lastQueueUpdateRef.current < 300) {
        return;
      }
      await loadDashboardStats();
      lastQueueUpdateRef.current = Date.now();
    };

    run();

    const interval = window.setInterval(run, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [featureRealtimeDashboard]);

  useEffect(() => {
    if (!featureRealtimeDashboard) {
      return;
    }
    if (!window.io || !queueData) {
      return;
    }

    const socket = window.io();
    socketRef.current = socket;

    const payload = {
      doctorId: queueData.doctorId,
      day: queueData.day,
      appointmentId: queueData.appointmentId,
    };

    socket.emit('queue:join', payload);

    const handleQueueUpdate = (msg: QueueStateMessage) => {
      if (!queueData) {
        return;
      }
      if (msg.doctorId !== queueData.doctorId || msg.day !== queueData.day) {
        return;
      }

      const now = Date.now();
      if (now - lastQueueUpdateRef.current < 200) {
        return;
      }
      lastQueueUpdateRef.current = now;

      const item = msg.items.find((i) => i.id === queueData.appointmentId);
      if (!item) {
        setQueueData((prev) =>
          prev
            ? {
                ...prev,
                position: null,
                patientsAhead: 0,
                estimatedWaitingMinutes: 0,
              }
            : prev,
        );
        return;
      }

      const position = item.position;
      const patientsAhead = position && position > 0 ? position - 1 : 0;
      const remainingPatients = patientsAhead;
      const estimatedWaitingMinutes = remainingPatients * msg.averageConsultationMinutes;

      setQueueData((prev) =>
        prev
          ? {
              ...prev,
              position,
              patientsAhead,
              estimatedWaitingMinutes,
            }
          : prev,
      );
    };

    socket.on('queue:update', handleQueueUpdate);

    return () => {
      socket.off('queue:update', handleQueueUpdate);
      socket.disconnect();
    };
  }, [featureRealtimeDashboard, queueData?.appointmentId, queueData?.doctorId, queueData?.day]);

  const formatAppointmentLabel = () => {
    if (!nextAppointment) {
      return '—';
    }
    const locale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
    const date = new Date(nextAppointment.datetime);
    const datePart = date.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timePart =
      nextAppointment.timeSlot ||
      date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
      });
    return `${datePart}, ${timePart}`;
  };

  const formatQueuePositionLabel = () => {
    if (!queueData || queueData.position == null || queueData.position <= 0) {
      return t('queue_position');
    }
    const position = queueData.position;
    const j = position % 10;
    const k = position % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    else if (j === 2 && k !== 12) suffix = 'nd';
    else if (j === 3 && k !== 13) suffix = 'rd';
    return `${position}${suffix} in line`;
  };

  const formatWaitingTimeLabel = () => {
    if (!queueData) {
      return '—';
    }
    if (queueData.status === 'in_consultation') {
      return 'You are being seen now';
    }
    const rawMinutes = queueData.estimatedWaitingMinutes || 0;
    const bucket = Math.max(0, Math.round(rawMinutes / 5) * 5);
    return bucket > 0 ? `About ${bucket} min` : 'Less than 5 min';
  };

  const stats = featureRealtimeDashboard
    ? [
        {
          title: t('upcoming_appointment'),
          value: isLoadingStats ? '...' : formatAppointmentLabel(),
          icon: Calendar,
          color: 'text-primary',
          bg: 'bg-primary/10',
        },
        {
          title: t('queue_position'),
          value: isLoadingStats ? '...' : formatQueuePositionLabel(),
          icon: Users,
          color: 'text-secondary',
          bg: 'bg-secondary/10',
        },
        {
          title: t('waiting_time'),
          value: isLoadingStats ? '...' : formatWaitingTimeLabel(),
          icon: Clock,
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
        },
        { title: 'Notifications', value: '3 New', icon: Bell, color: 'text-accent', bg: 'bg-accent/10' },
      ]
    : [
        { title: t('upcoming_appointment'), value: 'Tomorrow, 10:00 AM', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
        { title: t('queue_position'), value: '4th in line', icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
        { title: t('waiting_time'), value: '35 mins', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { title: 'Notifications', value: '3 New', icon: Bell, color: 'text-accent', bg: 'bg-accent/10' },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome_back')}, {user?.name}!</h1>
          <p className="text-muted-foreground">{t('health_priority')}. Here's your overview.</p>
          {formatAgeGender() && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatAgeGender()}
            </p>
          )}
        </div>
        <Button asChild className="gap-2">
          <Link to="/patient/book">
            <Plus className="w-4 h-4" />
            {t('book_appointment')}
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="medical-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div aria-live={i === 1 || i === 2 ? 'polite' : undefined}>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('recent_reports')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patient/prescriptions" className="gap-1">
                  {t('view_all')} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Blood Test Report - Feb {10 + i}</p>
                      <p className="text-xs text-muted-foreground">Dr. Robert Brown • Cardiology</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('recommended')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative overflow-hidden rounded-xl border p-4 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <BrainCircuit className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">AI RECOMMENDATION</span>
                </div>
                <h4 className="font-bold mb-1">Dr. Sarah Smith</h4>
                <p className="text-xs text-muted-foreground">Specialist in Pediatrics with 15 years of experience. Highly rated for patient care.</p>
              </div>
              <div className="group relative overflow-hidden rounded-xl border p-4 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">HEALTH TIP</span>
                </div>
                <h4 className="font-bold mb-1">Morning Hydration</h4>
                <p className="text-xs text-muted-foreground">Drink at least 500ml of water right after waking up to boost your metabolism.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <Card className="medical-card bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" />
                {t('ai_insights')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <p className="text-xs opacity-80 uppercase font-bold mb-1">
                  {t('waiting_time')}
                </p>
                <p className="text-2xl font-bold">
                  {queueData
                    ? (() => {
                        const minutes = queueData.estimatedWaitingMinutes || 0;
                        const bucket = Math.max(0, Math.round(minutes / 5) * 5);
                        return bucket > 0 ? `${bucket} min` : 'Less than 5 min';
                      })()
                    : '—'}
                </p>
                <p className="text-[10px] opacity-70 mt-1">
                  Based on live queue and historical consultation duration
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <p className="text-xs opacity-80 uppercase font-bold mb-1">No-Show Risk</p>
                <Badge variant="secondary" className="bg-green-500/20 text-white border-green-500/30">Very Low</Badge>
                <p className="text-[10px] opacity-70 mt-1">You have a 100% attendance rate in the last 6 months!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('need_help')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Our 24/7 emergency support is available for you.</p>
              <Button variant="outline" className="w-full text-accent border-accent hover:bg-accent hover:text-white">{t('emergency_call')}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
