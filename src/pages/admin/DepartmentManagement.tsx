import React, { useEffect, useState } from 'react';
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
import api from '@/services/api';

interface Department {
  id: string;
  name: string;
  doctors?: {
    id: string;
    user?: {
      id: string;
      name: string;
      email?: string;
    } | null;
  }[];
}

interface DoctorSummary {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  } | null;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState('');
  const [settingsDept, setSettingsDept] = useState<Department | null>(null);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get<Department[]>('/admin/departments');
      setDepartments(res.data);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get<DoctorSummary[]>('/admin/doctors');
      setDoctors(res.data);
    } catch {
    }
  };

  useEffect(() => {
    loadDepartments();
    loadDoctors();
  }, []);

  const addDepartment = async () => {
    if (!newDept.name) return;
    try {
      const res = await api.post<Department>('/admin/departments', { name: newDept.name });
      setDepartments([...departments, res.data]);
      setNewDept({ name: '' });
      toast.success('Department added successfully!');
    } catch {
      toast.error('Failed to add department');
    }
  };

  const deleteDept = async (id: string) => {
    try {
      await api.delete(`/admin/departments/${id}`);
      setDepartments(departments.filter(d => d.id !== id));
      toast.error('Department deleted.');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to delete department';
      toast.error(message);
    }
  };

  const startEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);
  };

  const saveEdit = async () => {
    if (!editingDept) return;
    if (!editName.trim()) return;
    try {
      const res = await api.put<Department>(`/admin/departments/${editingDept.id}`, {
        name: editName.trim(),
      });
      setDepartments(
        departments.map((d) => (d.id === editingDept.id ? { ...d, name: res.data.name } : d)),
      );
      setEditingDept(null);
      toast.success('Department updated');
    } catch {
      toast.error('Failed to update department');
    }
  };

  const openSettings = (dept: Department) => {
    setSettingsDept(dept);
    setSelectedDoctorId('');
  };

  const assignDoctor = async () => {
    if (!settingsDept || !selectedDoctorId) return;
    try {
      const res = await api.patch<DoctorSummary>(`/admin/doctors/${selectedDoctorId}/assign`, {
        departmentId: settingsDept.id,
      });

      setDepartments((prev) =>
        prev.map((d) =>
          d.id === settingsDept.id
            ? {
                ...d,
                doctors: [
                  ...(d.doctors || []),
                  {
                    id: res.data.id,
                    user: res.data.user,
                  },
                ],
              }
            : {
                ...d,
                doctors: (d.doctors || []).filter((doc) => doc.id !== res.data.id),
              },
        ),
      );

      setDoctors((prev) =>
        prev.map((doc) =>
          doc.id === res.data.id
            ? {
                ...doc,
                department: res.data.department,
              }
            : doc,
        ),
      );

      toast.success('Doctor assigned to department');
      setSelectedDoctorId('');
    } catch {
      toast.error('Failed to assign doctor');
    }
  };

  const unassignDoctor = async (doctorId: string) => {
    try {
      const res = await api.patch<DoctorSummary>(`/admin/doctors/${doctorId}/assign`, {
        departmentId: null,
      });

      setDepartments((prev) =>
        prev.map((d) => ({
          ...d,
          doctors: (d.doctors || []).filter((doc) => doc.id !== doctorId),
        })),
      );

      setDoctors((prev) =>
        prev.map((doc) =>
          doc.id === res.data.id
            ? {
                ...doc,
                department: null,
              }
            : doc,
        ),
      );

      toast.info('Doctor unassigned from department');
    } catch {
      toast.error('Failed to unassign doctor');
    }
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
                <Input id="name" value={newDept.name} onChange={(e) => setNewDept({ name: e.target.value })} />
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
                  <TableCell>-</TableCell>
                  <TableCell>{dept.doctors?.length ?? 0}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Dialog open={editingDept?.id === dept.id} onOpenChange={(open) => !open && setEditingDept(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(dept)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Department</DialogTitle>
                            <DialogDescription>Update the department name.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-name">Department Name</Label>
                              <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={saveEdit}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteDept(dept.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Dialog open={settingsDept?.id === dept.id} onOpenChange={(open) => !open && setSettingsDept(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openSettings(dept)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Manage Doctors</DialogTitle>
                            <DialogDescription>
                              Assign or unassign doctors for this department.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-2">
                            <div className="space-y-2">
                              <Label>Assigned Doctors</Label>
                              <div className="border rounded-lg divide-y">
                                {(dept.doctors || []).length === 0 && (
                                  <div className="px-4 py-3 text-sm text-muted-foreground">
                                    No doctors assigned to this department.
                                  </div>
                                )}
                                {(departments.find((d) => d.id === dept.id)?.doctors || []).map(
                                  (doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between px-4 py-2 text-sm"
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {doc.user?.name || 'Doctor'}
                                        </div>
                                        {doc.user?.email && (
                                          <div className="text-xs text-muted-foreground">
                                            {doc.user.email}
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => unassignDoctor(doc.id)}
                                      >
                                        Unassign
                                      </Button>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Add Doctor to Department</Label>
                              <div className="flex gap-2">
                                <select
                                  className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
                                  value={selectedDoctorId}
                                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                                >
                                  <option value="">Select doctor</option>
                                  {doctors
                                    .filter(
                                      (doc) =>
                                        !doc.department || doc.department.id !== dept.id,
                                    )
                                    .map((doc) => (
                                      <option key={doc.id} value={doc.id}>
                                        {doc.user.name}{" "}
                                        {doc.department
                                          ? `(${doc.department.name})`
                                          : '(Unassigned)'}
                                      </option>
                                    ))}
                                </select>
                                <Button onClick={assignDoctor} disabled={!selectedDoctorId}>
                                  Assign
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                    No departments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default DepartmentManagement;
