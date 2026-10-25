import React, { useState } from 'react';
import { WelcomeRoleSelectionPage } from './pages/WelcomeRoleSelectionPage';
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
import { HospitalCoordinatorPage } from './pages/HospitalCoordinatorPage';
import { FieldResponderPage } from './pages/FieldResponderPage';
import { DBMSArchitecturePage } from './pages/DBMSArchitecturePage';
import { PublicTrackerModal } from './components/PublicTrackerModal';
import { 
  IncidentsView, AmbulancesView, HospitalsView, 
  ResourcesView, RoadsView, TeamsView, SettingsView 
} from './pages/EntitiesPages';
import { User, RoleType, PublicTrackedIncident } from './types';
import { authApi } from './services/api';

export const App: React.FC = () => {
  // Session User State: No hardcoded demo login. Reads saved session or defaults to null
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tera_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [view, setView] = useState<'welcome' | 'app'>(() => {
    return localStorage.getItem('tera_user') ? 'app' : 'welcome';
  });
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedIncidentForAllocation, setSelectedIncidentForAllocation] = useState<string | null>(null);
  const [trackedIncidentModal, setTrackedIncidentModal] = useState<PublicTrackedIncident | null>(null);

  const handleLoginSuccess = (authenticatedUser: User, targetRole: RoleType) => {
    setUser(authenticatedUser);
    setView('app');

    // Route to appropriate role-specific default view
    if (targetRole === 'REPORTER') {
      setActiveTab('reporter_portal');
    } else if (targetRole === 'CONTROL_OPERATOR') {
      setActiveTab('dashboard');
    } else if (targetRole === 'HOSPITAL_COORDINATOR') {
      setActiveTab('hospital_coord');
    } else if (targetRole === 'FIELD_RESPONDER') {
      setActiveTab('field_responder');
    } else if (targetRole === 'ANALYST') {
      setActiveTab('analytics');
    } else if (targetRole === 'ADMINISTRATOR' || targetRole === 'ADMIN') {
      setActiveTab('admin_users');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleGuestEmergencyReport = () => {
    // Guest reporting bypass: No registration or credentials required
    setUser({
      username: 'guest_citizen',
      role: 'REPORTER',
      full_name: 'Bystander Informant (Guest)',
      access_token: ''
    });
    setView('app');
    setActiveTab('reporter_portal');
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setView('welcome');
    setActiveTab('dashboard');
  };

  const handleSelectIncidentForAllocation = (incidentId: string) => {
    setSelectedIncidentForAllocation(incidentId);
    setActiveTab('allocation');
  };

  if (view === 'welcome') {
    return (
      <>
        <WelcomeRoleSelectionPage
          onSelectRole={(role) => {}}
          onLoginSuccess={handleLoginSuccess}
          onGuestEmergencyReport={handleGuestEmergencyReport}
          onTrackIncident={(inc) => setTrackedIncidentModal(inc)}
          onExploreSystem={() => {
            setView('app');
            setActiveTab('dbms_architecture');
          }}
        />
        {trackedIncidentModal && (
          <PublicTrackerModal
            incident={trackedIncidentModal}
            onClose={() => setTrackedIncidentModal(null)}
          />
        )}
      </>
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
          } else if (newUser.role === 'HOSPITAL_COORDINATOR') {
            setActiveTab('hospital_coord');
          } else if (newUser.role === 'FIELD_RESPONDER') {
            setActiveTab('field_responder');
          } else if (newUser.role === 'ADMIN' || newUser.role === 'ADMINISTRATOR') {
            setActiveTab('admin_users');
          } else if (newUser.role === 'ANALYST') {
            setActiveTab('analytics');
          }
        }}
        onLogout={handleLogout}
        onLoadScenario={() => setActiveTab('dashboard')}
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
        <main className="flex-1 overflow-y-auto bg-[#070B14] flex flex-col">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onSelectIncidentForAllocation={handleSelectIncidentForAllocation}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'reporter_portal' && (
            <ReporterPortalPage 
              onSwitchToEOC={() => setActiveTab('dashboard')} 
              user={user} 
            />
          )}
          {activeTab === 'hospital_coord' && (
            <HospitalCoordinatorPage user={user} />
          )}
          {activeTab === 'field_responder' && (
            <FieldResponderPage user={user} />
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

      {/* Global Public Tracker Modal */}
      {trackedIncidentModal && (
        <PublicTrackerModal
          incident={trackedIncidentModal}
          onClose={() => setTrackedIncidentModal(null)}
        />
      )}
    </div>
  );
};

export default App;
