// Defines the frontend route structure and wraps the app with shared providers.
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AuthProvider } from "./context/AuthContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import { Layout } from "./components/Layout";
import Home from "./pages/home";
import History from "./pages/history";
import SessionDetail from "./pages/session-detail";
import NotFound from "./pages/not-found";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import AdminPage from "./pages/admin";

// Maps each URL path to its page and applies protected/admin guards.
function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />

        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>

        <Route path="/history">
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        </Route>

        <Route path="/session/:id">
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        </Route>

        <Route path="/admin">
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Provides global dark-mode and auth state to the full application.
export default function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <WouterRouter>
          <AppRouter />
        </WouterRouter>
      </AuthProvider>
    </DarkModeProvider>
  );
}
