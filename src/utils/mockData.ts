export const departments = [
  { id: '1', name: 'Cardiology', taName: 'இதயவியல்' },
  { id: '2', name: 'Pediatrics', taName: 'குழந்தை மருத்துவம்' },
  { id: '3', name: 'Dermatology', taName: 'தோல் மருத்துவம்' },
];

export const doctors = [
  { id: 'd1', name: 'Dr. John Doe', dept: 'Cardiology', taName: 'டாக்டர் ஜான் டோ' },
  { id: 'd2', name: 'Dr. Sarah Smith', dept: 'Pediatrics', taName: 'டாக்டர் சாரா ஸ்மித்' },
  { id: 'd3', name: 'Dr. Robert Brown', dept: 'Dermatology', taName: 'டாக்டர் ராபர்ட் பிரவுன்' },
];

export const mockAppointments = [
  { id: 'a1', patientName: 'Alice Johnson', doctorName: 'Dr. John Doe', time: '10:00 AM', date: '2026-02-17', status: 'Booked', isEmergency: false },
  { id: 'a2', patientName: 'Bob Wilson', doctorName: 'Dr. Sarah Smith', time: '11:30 AM', date: '2026-02-17', status: 'Completed', isEmergency: false },
  { id: 'a3', patientName: 'Charlie Davis', doctorName: 'Dr. Robert Brown', time: '02:00 PM', date: '2026-02-18', status: 'Booked', isEmergency: true },
];

export const mockQueue = [
  { pos: 1, name: 'Alice Johnson', token: 'C001' },
  { pos: 2, name: 'David Miller', token: 'C002' },
  { pos: 3, name: 'Eve White', token: 'C003' },
];

export const mockStats = {
  totalAppointments: 1250,
  activeDoctors: 45,
  peakHours: '10 AM - 12 PM',
  noShowRate: '12%',
};
