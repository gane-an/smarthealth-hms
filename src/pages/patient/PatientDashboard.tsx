import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, Bell, ArrowRight, BrainCircuit, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const stats = [
    { title: t('upcoming_appointment'), value: 'Tomorrow, 10:00 AM', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { title: t('queue_position'), value: '4th in line', icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
    { title: t('waiting_time'), value: '35 mins', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Notifications', value: '3 New', icon: Bell, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome_back')}, {user?.name}!</h1>
          <p className="text-muted-foreground">{t('health_priority')}. Here's your overview.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/patient/book">
            <Plus className="w-4 h-4" />
            {t('book_appointment')}
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('recent_reports')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patient/prescriptions" className="gap-1">
                  {t('view_all')} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Blood Test Report - Feb {10 + i}</p>
                      <p className="text-xs text-muted-foreground">Dr. Robert Brown • Cardiology</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('recommended')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative overflow-hidden rounded-xl border p-4 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <BrainCircuit className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">AI RECOMMENDATION</span>
                </div>
                <h4 className="font-bold mb-1">Dr. Sarah Smith</h4>
                <p className="text-xs text-muted-foreground">Specialist in Pediatrics with 15 years of experience. Highly rated for patient care.</p>
              </div>
              <div className="group relative overflow-hidden rounded-xl border p-4 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">HEALTH TIP</span>
                </div>
                <h4 className="font-bold mb-1">Morning Hydration</h4>
                <p className="text-xs text-muted-foreground">Drink at least 500ml of water right after waking up to boost your metabolism.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <Card className="medical-card bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" />
                {t('ai_insights')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <p className="text-xs opacity-80 uppercase font-bold mb-1">{t('waiting_time')}</p>
                <p className="text-2xl font-bold">12 mins</p>
                <p className="text-[10px] opacity-70 mt-1">Based on current clinic load and historical patterns</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <p className="text-xs opacity-80 uppercase font-bold mb-1">No-Show Risk</p>
                <Badge variant="secondary" className="bg-green-500/20 text-white border-green-500/30">Very Low</Badge>
                <p className="text-[10px] opacity-70 mt-1">You have a 100% attendance rate in the last 6 months!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('need_help')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Our 24/7 emergency support is available for you.</p>
              <Button variant="outline" className="w-full text-accent border-accent hover:bg-accent hover:text-white">{t('emergency_call')}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
