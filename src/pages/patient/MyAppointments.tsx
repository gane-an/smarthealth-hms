import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, MoreVertical } from 'lucide-react';
import { mockAppointments } from '@/utils/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MyAppointments: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('appointments')}</h1>
        <Button variant="outline">Past History</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAppointments.map((apt) => (
          <Card key={apt.id} className="medical-card border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{apt.doctorName}</CardTitle>
                <p className="text-sm text-muted-foreground">Cardiology Department</p>
              </div>
              <div className="flex items-center gap-2">
                {apt.isEmergency && (
                  <Badge variant="destructive" className="uppercase text-[10px]">Emergency</Badge>
                )}
                <Badge 
                  variant={apt.status === 'Completed' ? 'secondary' : apt.status === 'Cancelled' ? 'outline' : 'default'}
                >
                  {apt.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{apt.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{apt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <MapPin className="w-4 h-4" />
                  <span>Room 302, Building A</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">Reschedule</Button>
                <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">Cancel</Button>
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
    </div>
  );
};

export default MyAppointments;
