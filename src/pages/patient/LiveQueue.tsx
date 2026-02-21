import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Clock, BrainCircuit, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { toast } from 'sonner';

type LiveQueuePayload = {
  appointmentId: string;
  status?: string;
  doctorId: string;
  doctorName: string;
  departmentName: string | null;
  date: string;
  timeSlot: string;
  isEmergency: boolean;
  queueNumber: number;
  position: number | null;
  patientsAhead: number;
  remainingPatients: number;
  currentServingQueueNumber: number | null;
  waitingCount: number;
  completedCount: number;
  estimatedWaitingMinutes: number;
  estimatedWaitingSeconds: number;
  averageConsultationMinutes: number;
  day: string;
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

const LiveQueue: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<LiveQueuePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const socketRef = useRef<any>(null);
  const lastPositionRef = useRef<number | null>(null);

  const loadQueue = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get<{ hasActiveAppointment: boolean; queue?: LiveQueuePayload }>('/patient/queue/live');
      if (!res.data.hasActiveAppointment || !res.data.queue) {
        setData(null);
        setCountdown(0);
        return;
      }
      setData(res.data.queue);
      setCountdown(res.data.queue.estimatedWaitingSeconds);
      lastPositionRef.current = res.data.queue.position;
    } catch {
      toast.error('Failed to load live queue');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (!window.io || !data) {
      return;
    }

    const socket = window.io();
    socketRef.current = socket;

    const payload = {
      doctorId: data.doctorId,
      day: data.day,
      appointmentId: data.appointmentId,
    };

    socket.emit('queue:join', payload);

    const handleQueueUpdate = (msg: QueueStateMessage) => {
      if (!data) return;
      if (msg.doctorId !== data.doctorId || msg.day !== data.day) {
        return;
      }

      const item = msg.items.find((i) => i.id === data.appointmentId);
      if (!item) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                position: null,
                patientsAhead: 0,
                remainingPatients: 0,
                currentServingQueueNumber: msg.currentServingQueueNumber,
                waitingCount: msg.waitingCount,
                completedCount: msg.completedCount,
                estimatedWaitingMinutes: 0,
                estimatedWaitingSeconds: 0,
                averageConsultationMinutes: msg.averageConsultationMinutes,
              }
            : prev,
        );
        return;
      }

      const position = item.position;
      const patientsAhead = position && position > 0 ? position - 1 : 0;
      const remainingPatients = patientsAhead;
      const estimatedWaitingMinutes = remainingPatients * msg.averageConsultationMinutes;

      setData((prev) =>
        prev
          ? {
              ...prev,
              position,
              patientsAhead,
              remainingPatients,
              currentServingQueueNumber: msg.currentServingQueueNumber,
              waitingCount: msg.waitingCount,
              completedCount: msg.completedCount,
              estimatedWaitingMinutes,
              estimatedWaitingSeconds: estimatedWaitingMinutes * 60,
              averageConsultationMinutes: msg.averageConsultationMinutes,
            }
          : prev,
      );

      if (lastPositionRef.current && position && position < lastPositionRef.current) {
        if (position === 1) {
          toast.success("You're next. Please get ready for your consultation.");
        } else {
          toast.success(`Your position has moved to ${position}.`);
        }
      }

      lastPositionRef.current = position ?? null;
    };

    socket.on('queue:update', handleQueueUpdate);

    return () => {
      socket.off('queue:update', handleQueueUpdate);
      socket.disconnect();
    };
  }, [data?.appointmentId, data?.doctorId, data?.day]);

  useEffect(() => {
    if (!data || !data.estimatedWaitingSeconds) {
      return;
    }

    setCountdown(data.estimatedWaitingSeconds);

    const interval = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [data?.estimatedWaitingSeconds]);

  const refreshQueue = () => {
    loadQueue();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('queue')}</h1>
            <p className="text-muted-foreground">Real-time tracking of your appointment</p>
          </div>
        </div>
        <Card className="medical-card">
          <CardContent className="p-8 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading live queue...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('queue')}</h1>
            <p className="text-muted-foreground">Real-time tracking of your appointment</p>
          </div>
        </div>
        <Card className="medical-card">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-2">
            <Users className="w-6 h-6 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center">
              You do not have any active appointments in the queue today.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentDoctor = data.doctorName;
  const servingNumber = data.currentServingQueueNumber ?? 0;
  const yourNumber = data.queueNumber;
  const position = data.position ?? 0;
  const estimatedMinutes = Math.round(data.estimatedWaitingMinutes);
  const hours = Math.floor(countdown / 3600);
  const minutes = Math.floor((countdown % 3600) / 60);
  const seconds = countdown % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('queue')}</h1>
          <p className="text-muted-foreground">Real-time tracking of your appointment</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshQueue} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 medical-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Updates
            </Badge>
          </div>
          <CardHeader>
            <CardTitle>{currentDoctor}</CardTitle>
            <CardDescription>
              {data.departmentName ? `${data.departmentName} • ${data.timeSlot}` : data.timeSlot}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-10">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-widest">Current Serving</p>
              <h2 className="text-6xl font-black text-primary">{servingNumber}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-6 rounded-2xl flex flex-col items-center justify-center border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Your Token</p>
                <p className="text-3xl font-black text-foreground">{yourNumber}</p>
              </div>
              <div className="bg-primary/5 p-6 rounded-2xl flex flex-col items-center justify-center border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Position</p>
                <p className="text-3xl font-black text-primary">{position}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queue Progress</span>
                <span className="font-bold">
                  {yourNumber > 0 && servingNumber > 0
                    ? `${Math.min(100, Math.round((servingNumber / yourNumber) * 100))}%`
                    : '0%'}
                </span>
              </div>
              <Progress
                value={
                  yourNumber > 0 && servingNumber > 0
                    ? Math.min(100, (servingNumber / yourNumber) * 100)
                    : 0
                }
                className="h-3"
              />
              <p className="text-xs text-center text-muted-foreground italic">
                {position === 1
                  ? "You're next. Please be prepared to enter the consultation room."
                  : `${Math.max(0, position - 1)} patients are currently before you.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Estimation Sidebar */}
        <div className="space-y-6">
          <Card className="medical-card bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" />
                AI Waiting Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 opacity-80" />
                <div>
                  <p className="text-3xl font-black">
                    {hours > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${minutes} min`}
                  </p>
                  <p className="text-[10px] opacity-70">Estimated waiting time</p>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm text-xs">
                <p className="font-bold mb-1">Insight:</p>
                <p className="opacity-80">
                  {data.waitingCount === 0
                    ? 'No other patients are currently in the queue.'
                    : `Based on the current queue of ${data.waitingCount} patients and an average of ${data.averageConsultationMinutes} minutes per consultation, this estimate will adjust as the queue moves.`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Clinic Advisory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg text-accent text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>One emergency patient has just been admitted. This might slightly delay the queue by 5-10 minutes.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveQueue;
