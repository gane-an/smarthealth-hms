import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MoreHorizontal, Eye, CheckCircle, XCircle, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MedicalRecordDto {
  id: string;
  appointmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

interface DoctorAppointmentDto {
  id: string;
  date: string;
  timeSlot: string;
  status: 'booked' | 'in_consultation' | 'completed' | 'cancelled';
  isEmergency: boolean;
  queueNumber: number;
  reasonForVisit?: string | null;
  patient: {
    name: string;
  };
}

function formatAppointmentDateTime(dateIso: string, timeSlot: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return `${dateIso} ${timeSlot}`;
  }
  const yyyyMmDd = d.toISOString().split('T')[0];
  return `${yyyyMmDd} ${timeSlot}`;
}

const AppointmentList: React.FC = () => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [selected, setSelected] = useState<DoctorAppointmentDto | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<MedicalRecordDto[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'booked' | 'in_consultation' | 'completed' | 'cancelled'>('all');
  const [confirming, setConfirming] = useState<{ type: 'complete' | 'cancel'; id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get<DoctorAppointmentDto[]>('/doctor/appointments');
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

  const markCompleted = async (id: string) => {
    try {
      const res = await api.patch<DoctorAppointmentDto>(`/doctor/appointments/${id}/status`, {
        status: 'completed',
      });
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: res.data.status } : apt)),
      );
      toast.success('Appointment marked as completed');
    } catch {
      toast.error('Failed to update appointment status');
    }
  };

  const markCancelled = async (id: string) => {
    try {
      const res = await api.patch<DoctorAppointmentDto>(`/doctor/appointments/${id}/status`, {
        status: 'cancelled',
      });
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: res.data.status } : apt)),
      );
      toast.success('Appointment cancelled');
    } catch {
      toast.error('Failed to update appointment status');
    }
  };

  const loadRecordsForAppointment = async (appointmentId: string) => {
    try {
      setRecordsLoading(true);
      const res = await api.get<MedicalRecordDto[]>(`/doctor/appointments/${appointmentId}/records`);
      setSelectedRecords(res.data || []);
    } catch {
      setSelectedRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleDownloadRecord = async (record: MedicalRecordDto) => {
    if (!selected) {
      return;
    }
    try {
      const res = await api.get(
        `/doctor/appointments/${selected.id}/records/${record.id}/download`,
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selected) {
        setSelectedRecords([]);
        return;
      }
      try {
        setRecordsLoading(true);
        const res = await api.get<MedicalRecordDto[]>(`/doctor/appointments/${selected.id}/records`);
        if (!cancelled) {
          setSelectedRecords(res.data || []);
        }
      } catch {
        if (!cancelled) {
          setSelectedRecords([]);
        }
      } finally {
        if (!cancelled) {
          setRecordsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.timeSlot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('appointments')}</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients or time..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | 'booked' | 'in_consultation' | 'completed' | 'cancelled',
              )
            }
          >
            <option value="all">All</option>
            <option value="booked">Booked</option>
            <option value="in_consultation">In consultation</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card className="medical-card border-none shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-4 pb-2 text-xs text-muted-foreground">
          <span>
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </span>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.map((apt) => (
              <TableRow
                key={apt.id}
                className={`hover:bg-muted/30 ${apt.status === 'cancelled' ? 'opacity-60' : ''}`}
              >
                  <TableCell className="font-mono text-xs">#{apt.queueNumber}</TableCell>
                <TableCell className="font-medium">
                  <span className={apt.status === 'cancelled' ? 'line-through' : ''}>
                    {apt.patient.name}
                  </span>
                </TableCell>
                <TableCell>
                  {formatAppointmentDateTime(apt.date, apt.timeSlot)}
                </TableCell>
                <TableCell>
                  {apt.isEmergency ? (
                    <Badge variant="destructive" className="animate-pulse">Emergency</Badge>
                  ) : (
                    <Badge variant="outline">Routine</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      apt.status === 'completed'
                        ? 'secondary'
                        : apt.status === 'booked' || apt.status === 'in_consultation'
                        ? 'default'
                        : 'destructive'
                    }
                    className={
                      apt.status === 'booked' || apt.status === 'in_consultation'
                        ? 'bg-primary'
                        : apt.status === 'cancelled'
                        ? 'bg-red-100 text-red-700 line-through'
                        : ''
                    }
                  >
                    {apt.status === 'in_consultation'
                      ? 'In consultation'
                      : apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View Details"
                      onClick={() => setSelected(apt)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {apt.status === 'in_consultation' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600"
                        title="Mark Completed"
                        onClick={() => setConfirming({ type: 'complete', id: apt.id })}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelected(apt)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {apt.status === 'in_consultation' && (
                          <DropdownMenuItem onClick={() => setConfirming({ type: 'complete', id: apt.id })}>
                            Mark completed
                          </DropdownMenuItem>
                        )}
                        {apt.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => setConfirming({ type: 'cancel', id: apt.id })}>
                            Mark cancelled
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirming?.type === 'complete' ? 'Mark consultation as completed' : 'Cancel appointment'}
            </DialogTitle>
            <DialogDescription>
              {confirming?.type === 'complete'
                ? 'This will mark the current consultation as completed and move the queue to the next patient.'
                : 'This will cancel the appointment and update the live queue for all patients.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Keep as is
            </Button>
            <Button
              variant={confirming?.type === 'complete' ? 'default' : 'destructive'}
              onClick={async () => {
                if (!confirming) return;
                const current = confirming;
                setConfirming(null);
                if (current.type === 'complete') {
                  await markCompleted(current.id);
                } else {
                  await markCancelled(current.id);
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setSelectedRecords([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Full information about the selected appointment.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-medium">{selected.patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(selected.date).toISOString().split('T')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selected.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Queue Number</span>
                  <span className="font-medium">#{selected.queueNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="font-medium">
                    {selected.isEmergency ? 'Emergency' : 'Routine'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium max-w-[60%] text-right whitespace-pre-wrap">
                    {selected.reasonForVisit && selected.reasonForVisit.trim().length > 0
                      ? selected.reasonForVisit
                      : 'No reason provided'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Medical Records
                  </span>
                  {recordsLoading && (
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  )}
                </div>
                {selectedRecords.length === 0 && !recordsLoading && (
                  <p className="text-xs text-muted-foreground">
                    No medical records attached for this appointment.
                  </p>
                )}
                {selectedRecords.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{record.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(record.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleDownloadRecord(record)}
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentList;
