import { AuthProvider, useAuth } from '@/state/AuthContext';
import { ServicesProvider } from '@/state/ServicesContext';
import { HomePage } from '@/pages/Home/HomePage';
import { AuthPage } from '@/pages/Auth/AuthPage';

function AppShell() {
  const { isAuthenticated } = useAuth();

  // The auth gate: signed out sees only the login/signup screen; nothing
  // about the trip flow (services, map, location) is created until there's
  // a session, since none of it is needed before then.
  if (!isAuthenticated) return <AuthPage />;

  return (
    <ServicesProvider>
      <HomePage />
    </ServicesProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
