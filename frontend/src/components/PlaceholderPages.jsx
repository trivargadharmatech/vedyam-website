import React from 'react';
import { BarChart3, Users, BookOpen, Settings as SettingsIcon, Bell } from 'lucide-react';

const PageLayout = ({ title, icon: Icon, description }) => (
  <div className="placeholder-page animate-on-scroll visible">
    <div className="placeholder-content">
      <div className="placeholder-icon-wrapper">
        <Icon size={48} className="placeholder-icon" />
      </div>
      <h1 className="placeholder-title">{title}</h1>
      <p className="placeholder-desc">{description}</p>
      <div className="coming-soon-badge">Coming Soon</div>
    </div>
  </div>
);

export const Analytics = () => (
  <PageLayout 
    title="Analytics" 
    icon={BarChart3} 
    description="Track your learning progress, view engagement metrics, and discover insights about your journey through ancient wisdom."
  />
);

export const Community = () => (
  <PageLayout 
    title="Community" 
    icon={Users} 
    description="Connect with fellow learners, share your insights, and participate in discussions about spiritual and historical topics."
  />
);

export const Resources = () => (
  <PageLayout 
    title="Resources" 
    icon={BookOpen} 
    description="Access a curated library of supplementary texts, historical documents, and audio-visual materials."
  />
);

export const Settings = () => (
  <PageLayout 
    title="Settings" 
    icon={SettingsIcon} 
    description="Manage your account preferences, customize your learning experience, and adjust privacy settings."
  />
);

export const Notifications = () => (
  <PageLayout 
    title="Notifications" 
    icon={Bell} 
    description="Stay updated with the latest announcements, reminders for your learning streak, and new content alerts."
  />
);
