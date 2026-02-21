import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ta';

interface Translation {
  [key: string]: {
    en: string;
    ta: string;
  };
}

export const translations: Translation = {
  // Common
  'app_name': { en: 'HealSync', ta: 'ஹீல்சின்க்' },
  'login': { en: 'Login', ta: 'உள்நுழைய' },
  'register': { en: 'Register', ta: 'பதிவு செய்க' },
  'email': { en: 'Email', ta: 'மின்னஞ்சல்' },
  'password': { en: 'Password', ta: 'கடவுச்சொல்' },
  'role': { en: 'Role', ta: 'பங்கு' },
  'patient': { en: 'Patient', ta: 'நோயாளி' },
  'doctor': { en: 'Doctor', ta: 'மருத்துவர்' },
  'admin': { en: 'Admin', ta: 'நிர்வாகி' },
  'language': { en: 'Language', ta: 'மொழி' },
  'sign_out': { en: 'Sign Out', ta: 'வெளியேறு' },
  'medical_theme_desc': { en: 'Your Intelligent Healthcare Partner', ta: 'உங்கள் அறிவார்ந்த சுகாதார பங்குதாரர்' },
  'doctor_approvals': { en: 'Doctor Approvals', ta: 'மருத்துவர் ஒப்புதல்கள்' },
  'user_management': { en: 'User Management', ta: 'பயனர் மேலாண்மை' },
  'welcome_back': { en: 'Welcome back', ta: 'மீண்டும் வருக' },
  'health_priority': { en: 'Your health is our priority', ta: 'உங்கள் ஆரோக்கியமே எங்களின் முன்னுரிமை' },
  'notifications': { en: 'Notifications', ta: 'அறிவிப்புகள்' },
  'view_all': { en: 'View All', ta: 'அனைத்தையும் பார்' },
  'recent_reports': { en: 'Recent Health Reports', ta: 'சமீபத்திய சுகாதார அறிக்கைகள்' },
  'recommended': { en: 'Recommended for You', ta: 'உங்களுக்கு பரிந்துரைக்கப்படுகிறது' },
  'ai_insights': { en: 'AI Insights', ta: 'AI நுண்ணறிவு' },
  'need_help': { en: 'Need Help?', ta: 'உதவி தேவையா?' },
  'emergency_call': { en: 'Emergency Call', ta: 'அவசர அழைப்பு' },
  
  // Dashboard
  'dashboard': { en: 'Dashboard', ta: 'டாஷ்போர்டு' },
  'appointments': { en: 'Appointments', ta: 'சந்திப்புகள்' },
  'queue': { en: 'Live Queue', ta: 'நேரடி வரிசை' },
  'prescriptions': { en: 'Prescriptions', ta: 'மருந்துச் சீட்டுகள்' },
  'feedback': { en: 'Feedback', ta: 'கருத்து' },
  'analytics': { en: 'Analytics', ta: 'பகுப்பாய்வு' },
  'departments': { en: 'Departments', ta: 'துறைகள்' },
  'available_departments': { en: 'Available Departments', ta: 'கிடைக்கும் துறைகள்' },
  'booking_rules_title': { en: 'Booking rules', ta: 'பதிவு விதிகள்' },
  'booking_rules_description': {
    en: 'You can book one appointment per day in each department, and you cannot have two appointments at the same time on the same day. Cancelling an appointment frees that time slot so it can be booked again.',
    ta: 'ஒவ்வொரு துறையிலும் ஒரு நாளுக்கு ஒரு சந்திப்பை בלבד பதிவு செய்யலாம். அதே நாளில் ஒரே நேரத்தில் இரண்டு சந்திப்புகளை வைத்திருக்க முடியாது. ஒரு சந்திப்பை ரத்து செய்தால் அந்த நேரம் மீண்டும் பதிவு செய்யக்கூடியதாக இருக்கும்.'
  },
  
  // Patient Dashboard
  'upcoming_appointment': { en: 'Upcoming Appointment', ta: 'வரவிருக்கும் சந்திப்பு' },
  'queue_position': { en: 'Queue Position', ta: 'வரிசை நிலை' },
  'waiting_time': { en: 'Waiting Time', ta: 'காத்திருப்பு நேரம்' },
  'book_appointment': { en: 'Book Appointment', ta: 'சந்திப்பை பதிவு செய்க' },
  
  // Doctor Dashboard
  'todays_appointments': { en: "Today's Appointments", ta: 'இன்றைய சந்திப்புகள்' },
  'emergency': { en: 'Emergency', ta: 'அவசரம்' },
  'mark_completed': { en: 'Mark Completed', ta: 'முடிந்தது என குறிக்கவும்' },
  
  // Admin Dashboard
  'total_appointments': { en: 'Total Appointments', ta: 'மொத்த சந்திப்புகள்' },
  'active_doctors': { en: 'Active Doctors', ta: 'செயலில் உள்ள மருத்துவர்கள்' },
  'pending_approvals': { en: 'Pending Approvals', ta: 'நிலுவையில் உள்ள ஒப்புதல்கள்' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
