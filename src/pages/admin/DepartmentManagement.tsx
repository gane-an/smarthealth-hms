import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Cardiology', doctors: 12, head: 'Dr. John Doe', status: 'Active' },
    { id: 2, name: 'Pediatrics', doctors: 8, head: 'Dr. Sarah Smith', status: 'Active' },
    { id: 3, name: 'Dermatology', doctors: 5, head: 'Dr. Robert Brown', status: 'Active' },
    { id: 4, name: 'Radiology', doctors: 4, head: 'Dr. Mark Wilson', status: 'Active' },
  ]);

  const [newDept, setNewDept] = useState({ name: '', head: '' });

  const addDepartment = () => {
    if (!newDept.name || !newDept.head) return;
    setDepartments([...departments, { id: Date.now(), ...newDept, doctors: 0, status: 'Active' }]);
    setNewDept({ name: '', head: '' });
    toast.success("Department added successfully!");
  };

  const deleteDept = (id: number) => {
    setDepartments(departments.filter(d => d.id !== id));
    toast.error("Department deleted.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground">Manage hospital specialties and staff distribution.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>Enter the department details to add it to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Department Name</Label>
                <Input id="name" value={newDept.name} onChange={(e) => setNewDept({...newDept, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="head">Head of Department</Label>
                <Input id="head" value={newDept.head} onChange={(e) => setNewDept({...newDept, head: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addDepartment}>Save Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="medical-card border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search departments..." className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Head of Dept</TableHead>
              <TableHead>Total Doctors</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id} className="hover:bg-muted/30">
                <TableCell className="font-bold text-primary">{dept.name}</TableCell>
                <TableCell>{dept.head}</TableCell>
                <TableCell>{dept.doctors}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                    {dept.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDept(dept.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
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

export default DepartmentManagement;
