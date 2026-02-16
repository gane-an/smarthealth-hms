import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldCheck, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DoctorApprovals: React.FC = () => {
  const [pendingDoctors, setPendingDoctors] = useState([
    { id: 1, name: 'Dr. Michael Chen', dept: 'Cardiology', email: 'm.chen@hospital.com', exp: '10 years', license: 'LC-12345' },
    { id: 2, name: 'Dr. Emily Watson', dept: 'Pediatrics', email: 'e.watson@hospital.com', exp: '6 years', license: 'LC-67890' },
    { id: 3, name: 'Dr. James Rodriguez', dept: 'Neurology', email: 'j.rod@hospital.com', exp: '15 years', license: 'LC-11223' },
  ]);

  const handleAction = (id: number, approved: boolean) => {
    setPendingDoctors(pendingDoctors.filter(d => d.id !== id));
    if (approved) toast.success("Doctor approved and granted access.");
    else toast.error("Doctor application rejected.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doctor Verification</h1>
        <p className="text-muted-foreground">Review and approve medical credentials for new doctor registrations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingDoctors.map((doc) => (
          <Card key={doc.id} className="medical-card overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="bg-muted/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r min-w-[200px]">
                <Avatar className="w-20 h-20 mb-4 border-2 border-primary/20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`} />
                  <AvatarFallback>{doc.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-bold">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.dept}</p>
                </div>
              </div>
              
              <div className="flex-1 p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{doc.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Experience</p>
                    <p className="text-sm font-medium">{doc.exp}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">License No.</p>
                    <p className="text-sm font-medium">{doc.license}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                    <div className="flex items-center gap-1 text-orange-500 text-sm font-bold">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      Pending Review
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <FileText className="w-4 h-4" /> View Documents
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="w-4 h-4" /> Full Profile
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-muted/20 flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l min-w-[150px]">
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleAction(doc.id, true)}>
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={() => handleAction(doc.id, false)}>
                  <X className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {pendingDoctors.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <ShieldCheck className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No pending approvals</h3>
            <p className="text-muted-foreground">All doctor registrations are currently verified.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorApprovals;
