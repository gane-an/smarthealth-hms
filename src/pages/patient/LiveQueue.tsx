import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Clock, BrainCircuit, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const LiveQueue: React.FC = () => {
  const { t } = useLanguage();
  const [position, setPosition] = useState(4);
  const [estimatedTime, setEstimatedTime] = useState(35);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshQueue = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Simulate position update
      if (position > 1) {
        setPosition(p => p - 1);
        setEstimatedTime(t => Math.max(0, t - 8));
      }
    }, 1500);
  };

  const currentDoctor = "Dr. John Doe";
  const servingNumber = 12;
  const yourNumber = 16;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('queue')}</h1>
          <p className="text-muted-foreground">Real-time tracking of your appointment</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshQueue} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Queue Card */}
        <Card className="md:col-span-2 medical-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Updates
            </Badge>
          </div>
          <CardHeader>
            <CardTitle>{currentDoctor}</CardTitle>
            <CardDescription>Cardiology Department • Room 302</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-10">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-widest">Current Serving</p>
              <h2 className="text-6xl font-black text-primary">{servingNumber}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-6 rounded-2xl flex flex-col items-center justify-center border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Your Token</p>
                <p className="text-3xl font-black text-foreground">{yourNumber}</p>
              </div>
              <div className="bg-primary/5 p-6 rounded-2xl flex flex-col items-center justify-center border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Position</p>
                <p className="text-3xl font-black text-primary">{position}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queue Progress</span>
                <span className="font-bold">{Math.round((servingNumber / yourNumber) * 100)}%</span>
              </div>
              <Progress value={(servingNumber / yourNumber) * 100} className="h-3" />
              <p className="text-xs text-center text-muted-foreground italic">
                {position === 1 ? "You're next! Please head to Room 302." : `${position - 1} patients are currently before you.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Estimation Sidebar */}
        <div className="space-y-6">
          <Card className="medical-card bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" />
                AI Waiting Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 opacity-80" />
                <div>
                  <p className="text-3xl font-black">{estimatedTime} min</p>
                  <p className="text-[10px] opacity-70">Estimated waiting time</p>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm text-xs">
                <p className="font-bold mb-1">Insight:</p>
                <p className="opacity-80">Doctor John Doe is currently moving 15% faster than his daily average. Your turn may come sooner!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Clinic Advisory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg text-accent text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>One emergency patient has just been admitted. This might slightly delay the queue by 5-10 minutes.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveQueue;
