import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  TrendingUp, 
  Activity, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    { title: 'Total Appointments', value: '1,284', change: '+12.5%', isUp: true, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Active Doctors', value: '42', change: '+2', isUp: true, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Patients Today', value: '156', change: '-4%', isUp: false, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Avg Wait Time', value: '24m', change: '-2m', isUp: false, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const chartData = [
    { name: 'Mon', appointments: 120, waitTime: 22 },
    { name: 'Tue', appointments: 150, waitTime: 28 },
    { name: 'Wed', appointments: 180, waitTime: 35 },
    { name: 'Thu', appointments: 140, waitTime: 25 },
    { name: 'Fri', appointments: 210, waitTime: 40 },
    { name: 'Sat', appointments: 90, waitTime: 15 },
    { name: 'Sun', appointments: 40, waitTime: 10 },
  ];

  const deptData = [
    { name: 'Cardiology', value: 35, color: '#1E88E5' },
    { name: 'Pediatrics', value: 25, color: '#43A047' },
    { name: 'Dermatology', value: 20, color: '#FB8C00' },
    { name: 'General', value: 20, color: '#E53935' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Insights</h1>
          <p className="text-muted-foreground">Monitoring hospital performance and operations.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Status: Healthy
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="medical-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 medical-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Appointment Trends</CardTitle>
                <CardDescription>Daily volume vs. Average waiting time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-full" /> Volume</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-orange-400 rounded-full" /> Wait Time</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))', opacity: 0.1}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Department Load</CardTitle>
            <CardDescription>Patient distribution by specialty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">156</span>
                <span className="text-[10px] text-muted-foreground uppercase">Patients</span>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              {deptData.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-muted-foreground">{dept.name}</span>
                  </div>
                  <span className="font-bold">{dept.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Peak Hour Forecast (AI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Predicted busiest hours for the next 24 hours based on historical trends.</p>
            <div className="space-y-3">
              {[
                { time: '10:00 AM', load: 85, status: 'Very High' },
                { time: '11:00 AM', load: 92, status: 'Critical' },
                { time: '02:00 PM', load: 60, status: 'Moderate' },
                { time: '04:00 PM', load: 45, status: 'Normal' },
              ].map((item) => (
                <div key={item.time} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{item.time}</span>
                    <span className={item.load > 80 ? 'text-destructive font-bold' : 'text-muted-foreground'}>{item.status}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.load > 80 ? 'bg-destructive' : item.load > 50 ? 'bg-orange-400' : 'bg-secondary'}`}
                      style={{ width: `${item.load}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              No-Show Risk Analysis (AI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 bg-secondary/5 rounded-2xl border border-secondary/10 text-center mb-4">
              <div>
                <p className="text-sm text-secondary font-bold uppercase tracking-wider mb-1">Global No-Show Risk</p>
                <p className="text-4xl font-black text-secondary">8.2%</p>
                <p className="text-xs text-muted-foreground mt-2">Decreased by 2.1% since last month due to automated reminders.</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs font-bold mb-2">AI Suggestion:</p>
              <p className="text-xs text-muted-foreground">Patients in the "Dermatology" department have a higher no-show rate (15%). Consider increasing the reminder frequency for these appointments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
