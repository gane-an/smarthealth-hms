import React, { useState } from 'react';
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
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const stats = [
    { title: t('todays_appointments'), value: '18', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Currently Serving', value: 'Token #12', icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
    { title: 'Waiting Patients', value: '6', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const nextPatients = [
    { id: 1, name: 'Alice Johnson', token: '13', time: '10:15 AM', status: 'Waiting' },
    { id: 2, name: 'David Miller', token: '14', time: '10:30 AM', status: 'Waiting', isEmergency: true },
    { id: 3, name: 'Eve White', token: '15', time: '10:45 AM', status: 'Waiting' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Good morning, {user?.name}</h1>
          <p className="text-muted-foreground">You have 18 appointments scheduled for today.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 medical-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Next Patients</CardTitle>
              <CardDescription>Upcoming queue for Room 302</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextPatients.map((patient) => (
              <div key={patient.id} className={`flex items-center justify-between p-4 rounded-xl border ${patient.isEmergency ? 'bg-accent/5 border-accent/20' : 'bg-muted/30 border-transparent hover:border-primary/20'} transition-all`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${patient.isEmergency ? 'bg-accent text-white' : 'bg-primary/10 text-primary'}`}>
                    {patient.token}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{patient.name}</p>
                      {patient.isEmergency && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {patient.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">History</Button>
                  <Button size="sm" className="gap-1">
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
