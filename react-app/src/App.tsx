import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MembersProvider } from './context/MembersContext';
import LoginScreen from './components/layout/LoginScreen';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import ConnStatus from './components/layout/ConnStatus';
import AdminRoute from './components/admin/AdminRoute';
import FamillePage from './pages/FamillePage';
import RecherchePage from './pages/RecherchePage';
import ParentePage from './pages/ParentePage';
import ContribuerPage from './pages/ContribuerPage';
import MesSuggestionsPage from './pages/MesSuggestionsPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="login-logo">
            <div className="login-logo-icon">{'\u{1F333}'}</div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <MembersProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <ConnStatus />
          <main>
            <Routes>
              <Route path="/" element={<FamillePage />} />
              <Route path="/recherche" element={<RecherchePage />} />
              <Route path="/parente" element={<ParentePage />} />
              <Route path="/contribuer" element={<ContribuerPage />} />
              <Route path="/mes-suggestions" element={<MesSuggestionsPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </MembersProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
