import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Hub from "./pages/Hub";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Dashboard from "./pages/Dashboard";
import AssessmentDetail from "./pages/AssessmentDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InviteManagement from "./pages/InviteManagement";
import CustomerPortal from './pages/CustomerPortal';
import PredictionAccuracy from './pages/PredictionAccuracy';
import SeoAudit from './pages/SeoAudit';
import Consultation from './pages/Consultation';
import CommandPalette from './components/CommandPalette';
import ClientHealth from './pages/ClientHealth';
import Templates from './pages/Templates';
import Benchmarks from './pages/Benchmarks';
import Onboarding from './pages/Onboarding';
import Directory from './pages/Directory';
import Portfolio from './pages/Portfolio';
import SalesArena from './pages/SalesArena';
import SelfAssessment from './pages/SelfAssessment';
import Leads from './pages/Leads';

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Hub} />
      <Route path={"/assessment"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/assessment/:id"} component={AssessmentDetail} />
      <Route path={"/report"} component={Report} />
      <Route path={"/consultation"} component={Consultation} />
      <Route path={"/invites"} component={InviteManagement} />
      <Route path={"/portal"} component={CustomerPortal} />
      <Route path={"/predictions"} component={PredictionAccuracy} />
      <Route path={"/seo"} component={SeoAudit} />
      {/* New tools */}
      <Route path={"/health"} component={ClientHealth} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/benchmarks"} component={Benchmarks} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/directory"} component={Directory} />
      <Route path={"/portfolio"} component={Portfolio} />
      <Route path={"/sales-arena"} component={SalesArena} />
      <Route path={"/self-assessment"} component={SelfAssessment} />
      <Route path={"/leads"} component={Leads} />
      <Route path={"/404"} component={NotFound} />
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
          <CommandPalette />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
