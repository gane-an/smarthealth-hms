# SmartHealth – AI-Based Multilingual Health Appointment & Live Queue Management System Requirements Document

## 1. Application Overview

**Application Name:** HealSync

**Application Description:** A production-ready, industry-level frontend prototype for a healthcare web application featuring role-based dashboards, appointment booking, live queue management, and multilingual support. This is a complete UI/UX implementation ready for backend API integration.

## 2. Design System

### Theme Colors

- Primary: Medical Blue (#1E88E5)
- Secondary: Soft Green (#43A047)
- Background: White / Light Gray
- Accent: Emergency Red (#E53935)

### Typography

- Clean hospital-style professional font
- Good spacing
- Clear readability

### UI Style

- Card-based layout
- Smooth hover effects
- Soft shadows
- Rounded-xl containers
- Modern healthcare SaaS design

### Accessibility

- High contrast
- Large clickable areas
- Mobile friendly
- Clean error states

## 3. User Roles

Implement role-based dashboard layouts (frontend simulation only):

- Patient
- Doctor
- Admin

## 4. Authentication UI

### Single Login Page

- Role Selector dropdown
- Email input field
- Password input field
- Language selector
- Remember me checkbox
- Forgot password link
- Centered card layout
- Modern medical theme
- Subtle animated background

### Registration Page

- Patient/doctor registration,
- for doctor registeration need approval from admin to register
- Role-based redirect (UI simulation)

## 5. Patient Dashboard UI

### Overview Cards

- Upcoming Appointment
- Current Queue Position
- Estimated Waiting Time
- Notifications Count

### Book Appointment Page

- Department Dropdown
- Doctor Dropdown
- Date Picker
- Time Slot Selector
- Emergency Checkbox
- Upload Health Report (UI only)
- Confirm Button

### Live Queue Page

- Doctor Name
- Current Serving Number
- Your Queue Number
- Your Position
- Estimated Waiting Time
- Animated real-time queue indicator (UI simulation)

### My Appointments Page

- Status badges (Booked / Completed / Cancelled)
- Reschedule button
- Cancel button

### Prescriptions Page

- File preview cards
- Download button (UI)

### Feedback Page

- Star rating system
- Comment box
- Submit button

## 6. Doctor Dashboard UI

### Doctor Overview

- Today's Appointments Count
- Current Queue
- Emergency Alert Indicator

### Appointment List

- Patient Name
- Time Slot
- Emergency badge
- View History button
- Mark Completed button

### Upload Prescription Page

- File Upload
- Notes Field
- Submit button

### Emergency Trigger Modal

- Reallocate Patients option
- Reschedule Patients option
- Confirm action modal

## 7. Admin Dashboard UI

### Analytics Section

- Total Appointments
- Active Doctors
- Peak Hours Graph
- No-Show Rate
- Department Load Distribution (Bar Chart)
- Use Chart.js or Recharts
- Card-style widgets

### Department Management

- Add Department
- Edit
- Delete

### Doctor Approval Page

- Pending Doctors Table
- Approve / Reject buttons

### User Management

- Search Users
- Role Filter
- Block User button

## 8. Multilingual Support UI

### Languages

- English
- Tamil (or regional language)

### Implementation

- Language toggle in header
- All labels translatable
- RTL ready structure (if extended later)

## 9. Notifications UI

- Notification Bell in Navbar
- Dropdown Notification Panel
- Read / Unread Badge
- Toast notifications
- In-app notification page

## 10. Responsive Requirements

### Device Support

- Desktop
- Tablet
- Mobile

### Implementation

- Sidebar collapse on mobile
- Bottom navigation (optional)
- Touch-friendly buttons

## 11. Component Architecture

### Project Structure

```
src/
  components/
  layouts/
  pages/
  services/
  hooks/
  context/
  i18n/
  utils/
```

### Reusable Components

- Card
- Modal
- Button
- Badge
- QueueCard
- AppointmentCard
- StatsCard
- Navbar
- Sidebar

## 12. UI Quality Requirements

- Loading Skeleton UI
- Proper empty states
- Error state UI
- Confirmation modals
- Smooth transitions
- Professional hospital-grade look
- Production SaaS level quality

## 13. AI Feature Placeholders

Add UI placeholders for:

- Predicted Waiting Time (AI)
- No-Show Risk Score
- Peak Hour Forecast
- Recommended Doctor
- Display as AI-powered badges or cards

## 14. Mock Data

Use realistic dummy data:

- 3 Departments
- 5 Doctors
- 10 Appointments
- Queue simulation
