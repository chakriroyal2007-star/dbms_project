import React, { useState, useEffect } from 'react';
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
import { TeraExplorePage } from './pages/explore/TeraExplorePage';
import { PublicTrackerModal } from './components/PublicTrackerModal';
import { 
  IncidentsView, AmbulancesView, HospitalsView, 
  ResourcesView, RoadsView, TeamsView, SettingsView 
} from './pages/EntitiesPages';
import { User, RoleType, PublicTrackedIncident } from './types';
import { authApi } from './services/api';
import { 
  ROLE_DEFAULT_TABS, 
  ROLE_ALLOWED_TABS, 
  getDefaultTabForRole, 
  getValidTabForRole 
} from './utils/rbacRouting';

export { 
  ROLE_DEFAULT_TABS, 
  ROLE_ALLOWED_TABS, 
  getDefaultTabForRole, 
  getValidTabForRole 
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
    if (hash && u?.role) {
      return getValidTabForRole(hash, u.role);
    }
    return getDefaultTabForRole(u?.role) || 'dashboard';
  });

  const [isHydrating, setIsHydrating] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('tera_token'));
  });
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  const [selectedIncidentForAllocation, setSelectedIncidentForAllocation] = useState<string | null>(null);
  const [trackedIncidentModal, setTrackedIncidentModal] = useState<PublicTrackedIncident | null>(null);

  // Authoritative Session Hydration from Backend
  useEffect(() => {
    const token = localStorage.getItem('tera_token');
    if (!token) {
      // Check if user is in an active guest session
      const savedUser = localStorage.getItem('tera_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.username === 'guest_citizen') {
            setUser(parsed);
            setView('app');
            setActiveTab('reporter_portal');
            setIsHydrating(false);
            return;
          }
        } catch (e) {}
      }
      setIsHydrating(false);
      return;
    }

    let isMounted = true;
    authApi.getMe()
      .then((meData) => {
        if (!isMounted) return;
        if (!meData.is_active) {
          authApi.logout();
          setUser(null);
          setView('welcome');
          setHydrationError('Your account has been deactivated. Please contact an administrator.');
          setIsHydrating(false);
          return;
        }

        const role = meData.role?.toUpperCase();
        if (!role || !ROLE_DEFAULT_TABS[role]) {
          authApi.logout();
          setUser(null);
          setView('welcome');
          setHydrationError(`Invalid account role configuration '${meData.role}'. Access denied.`);
          setIsHydrating(false);
          return;
        }

        const authenticatedUser: User = {
          user_id: meData.user_id,
          username: meData.username,
          role: meData.role,
          full_name: meData.full_name,
          email: meData.email,
          access_token: token,
          organization_id: meData.organization_id,
          is_active: meData.is_active
        };

        setUser(authenticatedUser);
        localStorage.setItem('tera_user', JSON.stringify(authenticatedUser));
        setView('app');

        const hash = window.location.hash.replace('#', '');
        const targetTab = hash ? getValidTabForRole(hash, meData.role) : getDefaultTabForRole(meData.role);
        setActiveTab(targetTab);
        window.location.hash = targetTab;
        setIsHydrating(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Session hydration failed:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          authApi.logout();
          setUser(null);
          setView('welcome');
          setHydrationError(err.response?.data?.detail || 'Session expired. Please sign in again.');
        } else {
          // In case of transient network failure, retain valid local user session
          const saved = localStorage.getItem('tera_user');
          if (saved) {
            try {
              const u = JSON.parse(saved);
              if (u && u.role && ROLE_DEFAULT_TABS[u.role.toUpperCase()]) {
                setUser(u);
                setView('app');
                const hash = window.location.hash.replace('#', '');
                const targetTab = hash ? getValidTabForRole(hash, u.role) : getDefaultTabForRole(u.role);
                setActiveTab(targetTab);
                window.location.hash = targetTab;
              }
            } catch (e) {}
          }
        }
        setIsHydrating(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync hash routing on window back/forward with strict authorization validation
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        if (hash === 'explore') {
          setView('app');
          setActiveTab('explore');
          return;
        }
        if (!user) {
          setView('welcome');
          window.location.hash = '';
          return;
        }
        const validated = getValidTabForRole(hash, user?.role);
        if (validated) {
          setActiveTab(validated);
          if (window.location.hash !== `#${validated}`) {
            window.location.hash = validated;
          }
        } else {
          const defaultTab = getDefaultTabForRole(user.role);
          setActiveTab(defaultTab);
          window.location.hash = defaultTab;
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const handleSelectTab = (tab: string) => {
    if (tab === 'explore') {
      setView('app');
      setActiveTab('explore');
      window.location.hash = 'explore';
      return;
    }
    if (!user) {
      setView('welcome');
      window.location.hash = '';
      return;
    }
    const validated = getValidTabForRole(tab, user?.role);
    if (!validated) {
      const defaultTab = getDefaultTabForRole(user.role);
      setActiveTab(defaultTab);
      window.location.hash = defaultTab;
      return;
    }
    setActiveTab(validated);
    window.location.hash = validated;
    if (validated !== 'allocation') {
      setSelectedIncidentForAllocation(null);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User, targetRole: RoleType) => {
    setUser(authenticatedUser);
    setView('app');

    const effectiveRole = targetRole || authenticatedUser.role;
    const validatedTab = getValidTabForRole(getDefaultTabForRole(effectiveRole), authenticatedUser.role) || getDefaultTabForRole(authenticatedUser.role);
    setActiveTab(validatedTab);
    window.location.hash = validatedTab;
  };

  const handleGuestEmergencyReport = () => {
    localStorage.removeItem('tera_token');
    const guestUser: User = {
      username: 'guest_citizen',
      role: 'REPORTER',
      full_name: 'Bystander Informant (Guest)',
      access_token: ''
    };
    localStorage.setItem('tera_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setView('app');
    setActiveTab('reporter_portal');
    window.location.hash = 'reporter_portal';
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setView('welcome');
    setActiveTab('');
    window.location.hash = '';
  };

  const handleSelectIncidentForAllocation = (incidentId: string) => {
    setSelectedIncidentForAllocation(incidentId);
    handleSelectTab('allocation');
  };

  if (isHydrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070B14] text-zinc-100 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-[2px] shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse">
            <div className="w-full h-full bg-[#090C15] rounded-[14px] flex items-center justify-center font-bold text-cyan-400 text-lg font-mono">
              T
            </div>
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-bold tracking-tight text-white font-mono">TERA Grid OS</h2>
            <p className="text-xs text-zinc-400">Verifying security credentials & synchronizing role permissions...</p>
          </div>
          <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'welcome') {
    return (
      <>
        {hydrationError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono shadow-2xl flex items-center gap-2">
            <span>{hydrationError}</span>
            <button onClick={() => setHydrationError(null)} className="hover:text-white font-bold ml-2">×</button>
          </div>
        )}
        <WelcomeRoleSelectionPage
          onSelectRole={(role) => {}}
          onLoginSuccess={handleLoginSuccess}
          onGuestEmergencyReport={handleGuestEmergencyReport}
          onTrackIncident={(inc) => setTrackedIncidentModal(inc)}
          onExploreSystem={() => {
            setView('app');
            setActiveTab('dbms_architecture');
          }}
          onExploreMore={() => {
            setView('app');
            setActiveTab('explore');
            window.location.hash = 'explore';
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

  // Dedicated Immersive Road Safety Platform: TERA Explore 2.0
  if (activeTab === 'explore') {
    return (
      <>
        <TeraExplorePage
          onReturnToOperations={() => {
            if (user?.role) {
              handleSelectTab(getDefaultTabForRole(user.role));
            } else {
              setView('welcome');
              window.location.hash = '';
            }
          }}
          onNavigateToSOS={() => {
            setView('app');
            handleSelectTab('reporter_portal');
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
        onNavigateTab={handleSelectTab}
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
              onSwitchToEOC={
                user && ['CONTROL_OPERATOR', 'ADMINISTRATOR', 'ADMIN'].includes(user.role.toUpperCase())
                  ? () => handleSelectTab('dashboard')
                  : undefined
              } 
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
