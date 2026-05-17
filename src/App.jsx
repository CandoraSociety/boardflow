import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Meetings from '@/pages/Meetings';
import AgendaBuilder from '@/pages/AgendaBuilder';
import MinutesTaker from '@/pages/MinutesTaker';
import Documents from '@/pages/Documents';
import BoardMembers from '@/pages/BoardMembers';
import Onboarding from '@/pages/Onboarding';
import StrategicPlan from '@/pages/StrategicPlan';
import BoardAssistant from '@/pages/BoardAssistant';
import { Toaster as SonnerToaster } from 'sonner';
import { useBranding } from '@/hooks/useBranding';
import { useIntegrations } from '@/hooks/useIntegrations';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  useBranding();
  useIntegrations();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/meetings/new" element={<Meetings />} />
        <Route path="/meetings/:id/agenda" element={<AgendaBuilder />} />
        <Route path="/meetings/:id/minutes" element={<MinutesTaker />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/members" element={<BoardMembers />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/strategic-plan" element={<StrategicPlan />} />
        <Route path="/board-assistant" element={<BoardAssistant />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App