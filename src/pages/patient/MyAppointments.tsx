import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from '@/services/api';
import { toast } from 'sonner';

interface AppointmentDto {
  id: string;
  date: string;
  timeSlot: string;
  status: 'booked' | 'in_consultation' | 'completed' | 'cancelled';
  isEmergency: boolean;
  queueNumber: number;
  reasonForVisit?: string | null;
  notes?: string | null;
  doctor: {
    id: string;
    user: {
      name: string;
    };
    department?: {
      id: string;
      name: string;
    } | null;
  };
}

const MyAppointments: React.FC = () => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [savingReschedule, setSavingReschedule] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get<AppointmentDto[]>('/patient/appointments');
        if (!cancelled) {
          setAppointments(res.data);
        }
      } catch {
      }
    };

    load();
    const interval = window.setInterval(load, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const openReschedule = (apt: AppointmentDto) => {
    setRescheduleId(apt.id);
    setRescheduleDate(new Date(apt.date).toISOString().split('T')[0]);
    setRescheduleTime(apt.timeSlot);
  };

  const closeReschedule = () => {
    if (savingReschedule) return;
    setRescheduleId(null);
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await api.patch<AppointmentDto>(`/patient/appointments/${id}/cancel`);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: res.data.status } : apt)),
      );
      toast.success('Appointment cancelled');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to cancel appointment';
      toast.error(message);
    }
  };

  const handleRescheduleSave = async () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
    setSavingReschedule(true);
    try {
      const apt = appointments.find((a) => a.id === rescheduleId);
      if (!apt || !apt.doctor || !apt.doctor.department || !apt.doctor.department.id) {
        toast.error('Unable to validate appointment for reschedule');
        setSavingReschedule(false);
        return;
      }

      const validate = await api.get<{ allowed: boolean; message?: string }>('/patient/appointments/validate', {
        params: {
          doctorId: apt.doctor.id,
          departmentId: apt.doctor.department.id,
          date: rescheduleDate,
          timeSlot: rescheduleTime,
          excludeAppointmentId: rescheduleId,
        },
      });

      if (!validate.data.allowed) {
        toast.error(validate.data.message || 'This appointment conflicts with your existing bookings');
        setSavingReschedule(false);
        return;
      }

      const res = await api.patch<AppointmentDto>(
        `/patient/appointments/${rescheduleId}/reschedule`,
        {
          date: rescheduleDate,
          timeSlot: rescheduleTime,
        },
      );
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === rescheduleId ? { ...apt, ...res.data } : apt)),
      );
      toast.success('Appointment rescheduled');
      setRescheduleId(null);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to reschedule appointment';
      toast.error(message);
    } finally {
      setSavingReschedule(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const now = new Date();
    const aptDate = new Date(apt.date);

    if (filter === 'upcoming') {
      return aptDate >= now && apt.status === 'booked';
    }
    if (filter === 'past') {
      return aptDate < now;
    }
    if (filter === 'cancelled') {
      return apt.status === 'cancelled';
    }
    return true;
  });

  const pageSize = 6;
  const [page, setPage] = useState(1);
  const pagedAppointments = filteredAppointments.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('appointments')}</h1>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pagedAppointments.map((apt) => (
          <Card key={apt.id} className="medical-card border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{apt.doctor.user.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {apt.doctor.department?.name || 'Department'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {apt.isEmergency && (
                  <Badge variant="destructive" className="uppercase text-[10px]">Emergency</Badge>
                )}
                {(() => {
                  const isAutoNoShow = apt.status === 'cancelled' && apt.notes === 'AUTO_NO_SHOW';
                  const isDoctorNotPresented = apt.status === 'cancelled' && apt.notes === 'NOT_PRESENTED';
                  const label =
                    isAutoNoShow
                      ? 'Missed'
                      : apt.status === 'in_consultation'
                      ? 'In consultation'
                      : apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
                  const badge = (
                    <Badge
                      variant={apt.status === 'completed' ? 'secondary' : apt.status === 'cancelled' ? 'outline' : 'default'}
                    >
                      {label}
                    </Badge>
                  );
                  const tooltipMessage = isAutoNoShow
                    ? 'Your appointment has been missed due to no-show.'
                    : isDoctorNotPresented
                    ? 'Appointment was cancelled by the doctor because you were not present.'
                    : null;

                  if (!tooltipMessage) {
                    return badge;
                  }

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {badge}
                      </TooltipTrigger>
                      <TooltipContent>
                        {tooltipMessage}
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(apt.date).toISOString().split('T')[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{apt.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <MapPin className="w-4 h-4" />
                  <span>Room 302, Building A</span>
                </div>
                {apt.reasonForVisit && (
                  <div className="col-span-2 text-xs text-muted-foreground">
                    <span className="font-semibold">Reason: </span>
                    <span>{apt.reasonForVisit}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={apt.status !== 'booked'}
                  onClick={() => openReschedule(apt)}
                >
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  disabled={apt.status !== 'booked'}
                  onClick={() => handleCancel(apt.id)}
                >
                  Cancel
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Add to Calendar</DropdownMenuItem>
                    <DropdownMenuItem>Contact Clinic</DropdownMenuItem>
                    <DropdownMenuItem>View Instructions</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          No appointments to display for the selected filter.
        </p>
      )}

      {filteredAppointments.length > pageSize && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={!!rescheduleId} onOpenChange={(open) => (!open ? closeReschedule() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Select a new date and time.</DialogDescription>
          </DialogHeader>
          <Alert className="bg-muted/40 border-muted mb-4">
            <AlertTitle>{t('booking_rules_title')}</AlertTitle>
            <AlertDescription>
              {t('booking_rules_description')}
            </AlertDescription>
          </Alert>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <select
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              >
                <option value="">Select time</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeReschedule}
              disabled={savingReschedule}
            >
              Close
            </Button>
            <Button
              onClick={handleRescheduleSave}
              disabled={!rescheduleDate || !rescheduleTime || savingReschedule}
            >
              {savingReschedule ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAppointments;
