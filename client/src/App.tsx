import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGuard from "./components/AuthGuard";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BrandingProvider } from "./contexts/BrandingContext";
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
import Pricing from "./pages/Pricing";
import BillingSuccess from "./pages/BillingSuccess";
import TechPortal from "./pages/TechPortal";
import ShopManagerPanel from "./pages/ShopManagerPanel";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Hub} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/billing/success" component={BillingSuccess} />

      {/* Pro-gated routes — require active subscription (admins bypass) */}
      <Route path="/assessment">
        <AuthGuard roles={["admin", "super_admin"]} requiresPro>
          <Home />
        </AuthGuard>
      </Route>
      <Route path="/assessment/:id">
        {(params) => (
          <AuthGuard roles={["admin", "super_admin"]} requiresPro>
            <AssessmentDetail params={params} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard">
        <AuthGuard roles={["admin", "super_admin"]} requiresPro>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/report">
        <AuthGuard requiresPro>
          <Report />
        </AuthGuard>
      </Route>

      {/* Customer portal */}
      <Route path="/portal">
        <AuthGuard roles={["customer", "admin", "super_admin"]}>
          <CustomerPortal />
        </AuthGuard>
      </Route>

      {/* Tech portal — for shop employees */}
      <Route path="/tech">
        <AuthGuard>
          <TechPortal />
        </AuthGuard>
      </Route>

      {/* Shop manager panel — shop_manager, admin, super_admin */}
      <Route path="/shop-admin">
        <AuthGuard roles={["shop_manager", "admin", "super_admin"]}>
          <ShopManagerPanel />
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
        <BrandingProvider>
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
        </BrandingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
