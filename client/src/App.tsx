import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGuard from "./components/AuthGuard";
import { ThemeProvider } from "./contexts/ThemeContext";
import Hub from "./pages/Hub";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Dashboard from "./pages/Dashboard";
import AssessmentDetail from "./pages/AssessmentDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quiz from "./pages/Quiz";
import CustomerPortal from "./pages/CustomerPortal";
import AdminPanel from "./pages/AdminPanel";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Hub} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/quiz" component={Quiz} />

      {/* Admin / super_admin only */}
      <Route path="/assessment">
        <AuthGuard roles={["admin", "super_admin"]}>
          <Home />
        </AuthGuard>
      </Route>
      <Route path="/assessment/:id">
        {(params) => (
          <AuthGuard roles={["admin", "super_admin"]}>
            <AssessmentDetail params={params} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard">
        <AuthGuard roles={["admin", "super_admin"]}>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/report">
        <AuthGuard>
          <Report />
        </AuthGuard>
      </Route>

      {/* Customer portal */}
      <Route path="/portal">
        <AuthGuard roles={["customer", "admin", "super_admin"]}>
          <CustomerPortal />
        </AuthGuard>
      </Route>

      {/* Super admin only */}
      <Route path="/admin">
        <AuthGuard roles={["super_admin"]}>
          <AdminPanel />
        </AuthGuard>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: 'oklch(0.19 0.015 260)',
                border: '1px solid oklch(0.28 0.02 260)',
                color: 'oklch(0.92 0.005 260)',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
