import React, { useState } from 'react';
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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'patient', status: 'Active', joined: '2026-01-10' },
    { id: 2, name: 'Dr. John Doe', email: 'j.doe@hospital.com', role: 'doctor', status: 'Active', joined: '2025-11-20' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'patient', status: 'Blocked', joined: '2026-02-05' },
    { id: 4, name: 'Admin Jane', email: 'admin@healsync.com', role: 'admin', status: 'Active', joined: '2025-01-01' },
    { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'patient', status: 'Active', joined: '2026-02-12' },
  ]);

  const toggleStatus = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Active' ? 'Blocked' : 'Active';
        toast.info(`User ${u.name} is now ${newStatus}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
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
                    variant={user.status === 'Active' ? 'secondary' : 'destructive'}
                    className={`text-[10px] font-bold uppercase ${user.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}`}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{user.joined}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => toggleStatus(user.id)}
                        className={user.status === 'Active' ? 'text-destructive' : 'text-green-600'}
                      >
                        {user.status === 'Active' ? (
                          <span className="flex items-center gap-2"><Ban className="w-4 h-4" /> Block User</span>
                        ) : (
                          <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Unblock User</span>
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
