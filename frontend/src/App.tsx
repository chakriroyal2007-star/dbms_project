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

// Helper to determine authoritative default tab for each role
export const getDefaultTabForRole = (role?: string): string => {
  switch (role?.toUpperCase()) {
    case 'REPORTER': return 'reporter_portal';
    case 'CONTROL_OPERATOR': return 'dashboard';
    case 'HOSPITAL_COORDINATOR': return 'hospital_coord';
    case 'FIELD_RESPONDER': return 'field_responder';
    case 'ANALYST': return 'analytics';
    case 'ADMINISTRATOR':
    case 'ADMIN': return 'admin_users';
    default: return 'dashboard';
  }
};

// Guard against cross-role privilege escalation or silent misrouting
export const getValidTabForRole = (tab: string, userRole?: string): string => {
  const role = userRole?.toUpperCase() || 'REPORTER';
  if (role === 'REPORTER') {
    if (tab === 'reporter_portal' || tab === 'settings' || tab === 'dbms_architecture') return tab;
    return 'reporter_portal';
  }
  if (role === 'FIELD_RESPONDER') {
    if (['field_responder', 'incidents', 'settings', 'dbms_architecture'].includes(tab)) return tab;
    return 'field_responder';
  }
  if (role === 'HOSPITAL_COORDINATOR') {
    if (['hospital_coord', 'resources', 'ambulances', 'incidents', 'settings', 'dbms_architecture'].includes(tab)) return tab;
    return 'hospital_coord';
  }
  if (role === 'ANALYST') {
    if (['analytics', 'historical', 'sql_playground', 'performance', 'explorer', 'dbms_architecture', 'settings'].includes(tab)) return tab;
    return 'analytics';
  }
  return tab;
};

export const App: React.FC = () => {
  // Session User State: Reads saved session or defaults to null
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
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('tera_user');
    let u: User | null = null;
    if (saved) {
      try { u = JSON.parse(saved); } catch (e) {}
    }
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      return getValidTabForRole(hash, u?.role);
    }
    return getDefaultTabForRole(u?.role);
  });

  const [selectedIncidentForAllocation, setSelectedIncidentForAllocation] = useState<string | null>(null);
  const [trackedIncidentModal, setTrackedIncidentModal] = useState<PublicTrackedIncident | null>(null);

  // Sync hash routing on window back/forward
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab((curr) => {
          const validated = getValidTabForRole(hash, user?.role);
          return validated !== curr ? validated : curr;
        });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const handleSelectTab = (tab: string) => {
    const validated = getValidTabForRole(tab, user?.role);
    setActiveTab(validated);
    window.location.hash = validated;
    if (validated !== 'allocation') {
      setSelectedIncidentForAllocation(null);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User, targetRole: RoleType) => {
    setUser(authenticatedUser);
    setView('app');

    const targetTab = getDefaultTabForRole(targetRole);
    setActiveTab(targetTab);
    window.location.hash = targetTab;
  };

  const handleGuestEmergencyReport = () => {
    setUser({
      username: 'guest_citizen',
      role: 'REPORTER',
      full_name: 'Bystander Informant (Guest)',
      access_token: ''
    });
    setView('app');
    setActiveTab('reporter_portal');
    window.location.hash = 'reporter_portal';
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setView('welcome');
    setActiveTab('dashboard');
    window.location.hash = '';
  };

  const handleSelectIncidentForAllocation = (incidentId: string) => {
    setSelectedIncidentForAllocation(incidentId);
    handleSelectTab('allocation');
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
          const targetTab = getDefaultTabForRole(newUser.role);
          handleSelectTab(targetTab);
        }}
        onLogout={handleLogout}
        onLoadScenario={() => handleSelectTab('dashboard')}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          user={user}
          onSelectTab={handleSelectTab}
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
