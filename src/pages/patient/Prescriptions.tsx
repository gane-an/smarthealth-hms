import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { toast } from 'sonner';

type PrescriptionItem = {
  id: string;
  doctorName: string;
  createdAt: string;
  diagnosis: string | null;
  appointmentDate: string;
};

const Prescriptions: React.FC = () => {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<PrescriptionItem[]>('/patient/prescriptions');
        setPrescriptions(res.data);
      } catch {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = prescriptions.filter((item) => {
    const text = `${item.doctorName} ${item.diagnosis ?? ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('prescriptions')}</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="medical-card animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-muted rounded-lg" />
                    <div className="w-20 h-3 bg-muted rounded" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="w-32 h-4 bg-muted rounded" />
                    <div className="w-24 h-3 bg-muted rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </>
        )}
        {!loading && filtered.map((item) => (
          <Card key={item.id} className="medical-card group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.appointmentDate).toISOString().split('T')[0]}
                </div>
              </div>
              <CardTitle className="text-lg mt-4">
                {item.diagnosis && item.diagnosis.trim().length > 0
                  ? item.diagnosis
                  : 'Prescription'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{item.doctorName}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs truncate max-w-[150px]">Digital prescription</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Created {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="w-4 h-4" /> View
                </Button>
                <Button variant="default" size="sm" className="flex-1 gap-1">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prescriptions.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No prescriptions found</h3>
          <p className="text-muted-foreground">Your digital records will appear here after your appointments.</p>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
