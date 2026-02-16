import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const AuthLayout: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
          <Languages className="w-4 h-4" />
          {language === 'en' ? 'தமிழ்' : 'English'}
        </Button>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('app_name')}</h1>
          <p className="text-muted-foreground">{t('medical_theme_desc') || 'Your Intelligent Healthcare Partner'}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
