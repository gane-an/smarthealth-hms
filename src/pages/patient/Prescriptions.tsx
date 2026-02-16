import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Prescriptions: React.FC = () => {
  const { t } = useLanguage();

  const prescriptions = [
    { id: 1, doctor: 'Dr. John Doe', date: '2026-02-10', diagnosis: 'Hypertension Checkup', file: 'prescription_123.pdf' },
    { id: 2, doctor: 'Dr. Sarah Smith', date: '2026-01-25', diagnosis: 'Common Cold', file: 'prescription_124.pdf' },
    { id: 3, doctor: 'Dr. Robert Brown', date: '2026-01-15', diagnosis: 'Skin Allergy', file: 'prescription_125.pdf' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('prescriptions')}</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search records..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptions.map((item) => (
          <Card key={item.id} className="medical-card group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </div>
              </div>
              <CardTitle className="text-lg mt-4">{item.diagnosis}</CardTitle>
              <p className="text-sm text-muted-foreground">{item.doctor}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs truncate max-w-[150px]">{item.file}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">PDF • 1.2MB</span>
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
