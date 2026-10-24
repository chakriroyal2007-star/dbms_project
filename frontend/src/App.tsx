import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { HistoricalPage } from './pages/HistoricalPage';
import { AllocationPage } from './pages/AllocationPage';
import { SimulationPage } from './pages/SimulationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { ExplorerPage } from './pages/ExplorerPage';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { SqlPlaygroundPage } from './pages/SqlPlaygroundPage';
import { ReporterPortalPage } from './pages/ReporterPortalPage';
import { DBMSArchitecturePage } from './pages/DBMSArchitecturePage';
import { 
  IncidentsView, AmbulancesView, HospitalsView, 
  ResourcesView, RoadsView, TeamsView, SettingsView 
} from './pages/EntitiesPages';
import { User } from './types';
import { authApi } from './services/api';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedIncidentForAllocation, setSelectedIncidentForAllocation] = useState<string | null>(null);
  
  // Default Initial User (Administrator)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tera_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      username: 'admin',
      role: 'ADMINISTRATOR',
      full_name: 'EOC Chief Commander',
      access_token: 'demo_token_admin'
    };
  });

  // Auto-login on mount to initialize token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const u = user?.username || 'admin';
        const p = u === 'admin' ? 'admin123' : (u === 'operator' ? 'operator123' : (u === 'reporter' ? 'reporter123' : 'analyst123'));
        const authData = await authApi.login(u, p);
        setUser({
          username: authData.username,
          role: authData.role,
          full_name: authData.full_name,
          access_token: authData.access_token
        });
      } catch (err) {
        console.warn('Initial auto-login error (backend may be spinning up):', err);
      }
    };
    initAuth();
  }, []);

  const handleStartTera = () => {
    setView('app');
    if (activeTab === 'reporter_portal') {
      setActiveTab('dashboard');
    }
  };

  const handleReportEmergencyDirect = async () => {
    setView('app');
    setActiveTab('reporter_portal');
    try {
      const authData = await authApi.login('reporter', 'reporter123');
      setUser({
        username: authData.username,
        role: authData.role,
        full_name: authData.full_name,
        access_token: authData.access_token
      });
    } catch (e) {
      console.warn('Direct reporter login error:', e);
    }
  };

  const handleSelectIncidentForAllocation = (incidentId: string) => {
    setSelectedIncidentForAllocation(incidentId);
    setActiveTab('allocation');
  };

  const handleLogout = () => {
    setView('landing');
  };

  const handleReloadScenario = () => {
    setActiveTab('dashboard');
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={handleStartTera}
        onReportEmergency={handleReportEmergencyDirect}
        onExplore={() => {
          setView('app');
          setActiveTab('explorer');
        }}
        onViewArchitecture={() => {
          setView('app');
          setActiveTab('dbms_architecture');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B14] text-gray-100">
      {/* Top Header */}
      <Header
        user={user}
        onUserChange={(newUser) => {
          setUser(newUser);
          if (newUser.role === 'REPORTER') {
            setActiveTab('reporter_portal');
          } else if (newUser.role === 'CONTROL_OPERATOR') {
            setActiveTab('dashboard');
          } else if (newUser.role === 'ADMIN' || newUser.role === 'ADMINISTRATOR') {
            setActiveTab('admin_users');
          } else if (newUser.role === 'ANALYST') {
            setActiveTab('analytics');
          }
        }}
        onLogout={handleLogout}
        onLoadScenario={handleReloadScenario}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          user={user}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'allocation') {
              setSelectedIncidentForAllocation(null);
            }
          }}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto bg-[#070B14]">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onSelectIncidentForAllocation={handleSelectIncidentForAllocation}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'reporter_portal' && (
            <ReporterPortalPage onSwitchToEOC={() => setActiveTab('dashboard')} user={user} />
          )}
          {activeTab === 'dbms_architecture' && <DBMSArchitecturePage />}
          {activeTab === 'incidents' && <IncidentsView user={user} />}
          {activeTab === 'ambulances' && <AmbulancesView user={user} />}
          {activeTab === 'hospitals' && <HospitalsView user={user} />}
          {activeTab === 'resources' && <ResourcesView user={user} />}
          {activeTab === 'teams' && <TeamsView user={user} />}
          {activeTab === 'roads' && <RoadsView user={user} />}
          {activeTab === 'historical' && <HistoricalPage />}
          {activeTab === 'allocation' && (
            <AllocationPage initialIncidentId={selectedIncidentForAllocation} />
          )}
          {activeTab === 'simulation' && <SimulationPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'sql_playground' && <SqlPlaygroundPage />}
          {activeTab === 'performance' && <PerformancePage />}
          {activeTab === 'explorer' && <ExplorerPage />}
          {activeTab === 'admin_users' && <AdminUserManagement />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
