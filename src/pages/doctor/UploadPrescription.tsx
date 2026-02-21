import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Send, X, PlusCircle, CheckCircle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

type PrefillState = {
  fromDashboard?: boolean;
  patient?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  appointment?: {
    id: string;
    date: string;
    timeSlot: string;
    queueNumber: number;
    reasonForVisit: string;
    isEmergency: boolean;
  };
} | null;

type DoctorAppointmentDto = {
  id: string;
  date: string;
  timeSlot: string;
  queueNumber: number;
  reasonForVisit?: string | null;
  patient: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
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

const UploadPrescription: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as PrefillState) || null;
  const [patient, setPatient] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [diagnosis, setDiagnosis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    if (prefill && prefill.patient) {
      setPatient(prefill.patient.id);
      if (prefill.appointment && prefill.appointment.reasonForVisit) {
        setDiagnosis(prefill.appointment.reasonForVisit);
      }
    }
  }, [prefill]);

  useEffect(() => {
    if (prefill && prefill.patient && prefill.appointment) {
      return;
    }

    let cancelled = false;

    const loadAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        const res = await api.get<DoctorAppointmentDto[]>('/doctor/appointments');
        if (!cancelled) {
          setAppointments(res.data || []);
        }
      } catch {
        if (!cancelled) {
          setAppointments([]);
          toast.error('Failed to load appointments');
        }
      } finally {
        if (!cancelled) {
          setAppointmentsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [prefill]);

  useEffect(() => {
    const activeAppointmentId = prefill?.appointment?.id || patient;
    if (!activeAppointmentId) {
      setRecords([]);
      return;
    }

    let cancelled = false;

    const loadRecords = async () => {
      try {
        setRecordsLoading(true);
        const res = await api.get<MedicalRecordDto[]>(
          `/doctor/appointments/${activeAppointmentId}/records`,
        );
        if (!cancelled) {
          setRecords(res.data || []);
        }
      } catch {
        if (!cancelled) {
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setRecordsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [prefill?.appointment?.id, patient]);

  const handleDownloadRecord = async (record: MedicalRecordDto) => {
    const activeAppointmentId = prefill?.appointment?.id || patient;
    if (!activeAppointmentId) {
      return;
    }
    try {
      const res = await api.get(
        `/doctor/appointments/${activeAppointmentId}/records/${record.id}/download`,
        { responseType: 'blob' },
      );
      const contentType =
        res.headers['content-type'] || record.fileType || 'application/octet-stream';
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

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      if (prefill && prefill.patient && prefill.appointment) {
        await api.post('/doctor/prescriptions', {
          appointmentId: prefill.appointment.id,
          patientId: prefill.patient.id,
          diagnosis,
          medicines,
        });
      } else {
        const selectedAppointment = appointments.find((apt) => apt.id === patient);
        if (!selectedAppointment) {
          toast.error('Please select a patient appointment');
          setSubmitting(false);
          return;
        }
        await api.post('/doctor/prescriptions', {
          appointmentId: selectedAppointment.id,
          patientId: selectedAppointment.patient.id,
          diagnosis,
          medicines,
        });
      }

      toast.success("Prescription uploaded and patient notified.");
      navigate('/doctor');
    } catch {
      toast.error("Failed to send prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">New Prescription</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Enter medication and diagnosis for the patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {prefill && prefill.patient && prefill.appointment ? (
                  <div className="grid gap-2">
                    <Label>Patient</Label>
                    <div className="p-3 rounded-lg border bg-muted/40">
                      <p className="font-semibold">{prefill.patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Token #{prefill.appointment.queueNumber} • {prefill.appointment.timeSlot}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Email: {prefill.patient.email}
                      </p>
                      {prefill.patient.phone && (
                        <p className="text-xs text-muted-foreground">
                          Phone: {prefill.patient.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label>Patient</Label>
                    <Select
                      value={patient}
                      onValueChange={(value) => {
                        setPatient(value);
                        const selectedAppointment = appointments.find((apt) => apt.id === value);
                        if (
                          selectedAppointment &&
                          !diagnosis &&
                          selectedAppointment.reasonForVisit
                        ) {
                          setDiagnosis(selectedAppointment.reasonForVisit);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            appointmentsLoading ? 'Loading appointments...' : 'Select Patient'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {appointments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id}>
                            {apt.patient.name} (Token #{apt.queueNumber}) • {apt.timeSlot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {patient && (
                      <div className="p-3 rounded-lg border bg-muted/40 text-xs space-y-1">
                        {(() => {
                          const selectedAppointment = appointments.find(
                            (apt) => apt.id === patient,
                          );
                          if (!selectedAppointment) {
                            return null;
                          }
                          return (
                            <>
                              <p className="font-semibold">{selectedAppointment.patient.name}</p>
                              <p className="text-muted-foreground">
                                Token #{selectedAppointment.queueNumber} •{' '}
                                {selectedAppointment.timeSlot}
                              </p>
                              <p className="text-muted-foreground">
                                Email: {selectedAppointment.patient.email}
                              </p>
                              {selectedAppointment.patient.phone && (
                                <p className="text-muted-foreground">
                                  Phone: {selectedAppointment.patient.phone}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Diagnosis Notes</Label>
                  <Textarea
                    placeholder="Describe patient symptoms and diagnosis..."
                    rows={4}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Medications</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addMedicine} className="gap-1 text-primary">
                    <PlusCircle className="w-4 h-4" /> Add More
                  </Button>
                </div>

                {medicines.map((med, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl relative group">
                    {medicines.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeMedicine(i)}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Medicine Name</Label>
                      <Input placeholder="Paracetamol" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Dosage</Label>
                      <Input placeholder="500mg - 1-0-1" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Duration</Label>
                      <Input placeholder="5 Days" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!prefill && !patient && (
                <p className="text-xs text-muted-foreground">
                  Select a patient appointment to view uploaded attachments.
                </p>
              )}
              {(prefill?.appointment?.id || patient) && recordsLoading && (
                <p className="text-xs text-muted-foreground">Loading attachments...</p>
              )}
              {(prefill?.appointment?.id || patient) &&
                !recordsLoading &&
                records.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No attachments uploaded for this appointment.
                  </p>
                )}
              {records.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {records.map((record) => (
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
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Save to Digital Locker</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Notify Patient via Email/App</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Update Health Timeline</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full gap-2 h-11"
                disabled={submitting || (!patient && !(prefill && prefill.patient))}
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending...' : 'Send Prescription'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default UploadPrescription;
