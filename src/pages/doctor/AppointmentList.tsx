import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, MoreHorizontal, Eye, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AppointmentList: React.FC = () => {
  const { t } = useLanguage();

  const appointments = [
    { id: 1, patient: 'Alice Johnson', time: '10:00 AM', status: 'Booked', type: 'Checkup', emergency: false },
    { id: 2, patient: 'Bob Wilson', time: '11:30 AM', status: 'Completed', type: 'Follow-up', emergency: false },
    { id: 3, patient: 'Charlie Davis', time: '02:00 PM', status: 'Booked', type: 'Consultation', emergency: true },
    { id: 4, patient: 'David Miller', time: '02:30 PM', status: 'In-Progress', type: 'Emergency', emergency: true },
    { id: 5, patient: 'Eve White', time: '03:00 PM', status: 'Cancelled', type: 'Checkup', emergency: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('appointments')}</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search patients..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="medical-card border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{apt.patient}</TableCell>
                <TableCell>{apt.time}</TableCell>
                <TableCell>{apt.type}</TableCell>
                <TableCell>
                  {apt.emergency ? (
                    <Badge variant="destructive" className="animate-pulse">Emergency</Badge>
                  ) : (
                    <Badge variant="outline">Routine</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={apt.status === 'Completed' ? 'secondary' : apt.status === 'In-Progress' ? 'default' : 'outline'}
                    className={apt.status === 'In-Progress' ? 'bg-primary' : ''}
                  >
                    {apt.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="View History"><Eye className="w-4 h-4" /></Button>
                    {apt.status !== 'Completed' && (
                      <Button variant="ghost" size="icon" className="text-green-600" title="Mark Completed">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AppointmentList;
