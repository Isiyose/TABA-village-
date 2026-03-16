import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { PublicPortal } from './pages/PublicPortal';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CitizenDatabase } from './pages/CitizenDatabase';
import { RegistrationForm } from './pages/RegistrationForm';
import { IsiboDirectory } from './pages/IsiboDirectory';
import { UmugandaTracker } from './pages/UmugandaTracker';
import { AdminInbox } from './pages/AdminInbox';
import { Notices } from './pages/Notices';
import { ManageAdmins } from './pages/ManageAdmins';
import { TransferCitizen } from './pages/TransferCitizen';
import { SystemLogs } from './pages/SystemLogs';
import { HealthInsurance } from './pages/HealthInsurance';
import { MapView } from './pages/MapView';
import { Communication } from './pages/Communication';
import { PopulationSearch } from './pages/PopulationSearch';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  if (!user) {
    return <PublicPortal />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && <Dashboard />}
      {activeTab === 'data' && <CitizenDatabase />}
      {activeTab === 'form' && <RegistrationForm />}
      {activeTab === 'isibo' && <IsiboDirectory />}
      {activeTab === 'umuganda' && <UmugandaTracker />}
      {activeTab === 'inbox' && <AdminInbox />}
      {activeTab === 'notices' && <Notices />}
      {activeTab === 'manage-admins' && <ManageAdmins />}
      {activeTab === 'transfer' && <TransferCitizen />}
      {activeTab === 'logs' && <SystemLogs />}
      {activeTab === 'insurance' && <HealthInsurance />}
      {activeTab === 'map' && <MapView />}
      {activeTab === 'population' && <PopulationSearch />}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <MainApp />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
