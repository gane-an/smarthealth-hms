import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Ban, Shield, User, MoreVertical, Plus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import api from '@/services/api';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  isApproved: boolean;
  blocked: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<ManagedUser[]>('/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user || user.role === 'admin') return;
      const newApproved = !user.isApproved;
      await api.patch(`/admin/users/${id}/status`, { isApproved: newApproved });
      setUsers(users.map(u => (u.id === id ? { ...u, isApproved: newApproved } : u)));
      toast.info(`User ${user.name} is now ${newApproved ? 'Active' : 'Inactive'}`);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const toggleBlocked = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user || user.role === 'admin') return;
      const currentlyBlocked = user.blocked;
      const endpoint = currentlyBlocked ? `/admin/users/${id}/unblock` : `/admin/users/${id}/block`;
      const res = await api.patch<ManagedUser>(endpoint);
      setUsers(users.map(u => (u.id === id ? { ...u, blocked: res.data.blocked } : u)));
      toast.info(
        `User ${user.name} is now ${res.data.blocked ? 'Blocked' : 'Unblocked'}`,
      );
    } catch (error) {
      toast.error('Failed to update user block status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage roles, permissions and account status for all system users.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create New User
        </Button>
      </div>

      <Card className="medical-card border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" /> Filter Roles
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Export CSV
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 capitalize">
                    {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500" />}
                    {user.role === 'doctor' && <Shield className="w-3 h-3 text-primary" />}
                    {user.role === 'patient' && <User className="w-3 h-3 text-secondary" />}
                    <span className="text-xs font-medium">{user.role}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.isApproved ? 'secondary' : 'outline'}
                    className={`text-[10px] font-bold uppercase ${
                      user.isApproved
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : ''
                    }`}
                  >
                    {user.isApproved ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.blocked ? 'destructive' : 'outline'}
                    className="text-[10px] font-bold uppercase"
                  >
                    {user.blocked ? 'Blocked' : 'Allowed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toISOString().split('T')[0]}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={user.role === 'admin'}
                        onClick={() => toggleStatus(user.id)}
                        className={
                          user.isApproved ? 'text-destructive' : 'text-green-600'
                        }
                      >
                        {user.isApproved ? (
                          <span className="flex items-center gap-2">
                            <Ban className="w-4 h-4" /> Deactivate User
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Check className="w-4 h-4" /> Activate User
                          </span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={user.role === 'admin'}
                        onClick={() => toggleBlocked(user.id)}
                        className={user.blocked ? 'text-green-600' : 'text-destructive'}
                      >
                        {user.blocked ? (
                          <span className="flex items-center gap-2">
                            <Check className="w-4 h-4" /> Unblock User
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Ban className="w-4 h-4" /> Block User
                          </span>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default UserManagement;
