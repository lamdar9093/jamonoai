import { Switch, Route, Router } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import NOXHome from "@/pages/NOXHome";
import Search from "@/pages/search";
import AgentDetail from "@/pages/agent/[id]";
import NoxDemo from "@/pages/nox-demo";
import Onboarding from "@/pages/onboarding";
import OnboardingSlackCallback from "@/pages/onboarding-slack-callback";
import NOXOnboarding from "@/pages/NOXOnboarding";
import OrchestratorDashboard from "@/pages/orchestrator-dashboard";
import DemoPresentation from "@/pages/demo-presentation";
import PlatformDemo from "@/pages/PlatformDemo";
import EnterpriseOnboarding from "@/pages/enterprise-onboarding";
import FreelanceOnboarding from "@/pages/freelance-onboarding";
import AccountTypeSelection from "@/pages/account-type-selection";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import TenantDashboard from "@/pages/tenant-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import EnterpriseAdmin from "@/pages/enterprise-admin";
import { AuthProvider } from "@/hooks/useAuth";


function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Layout>
          <Router>
            <Switch>
              <Route path="/" component={NOXHome} />
              <Route path="/search" component={Search} />
              <Route path="/agent/:id" component={AgentDetail} />
              <Route path="/nox-demo" component={NoxDemo} />
              <Route path="/onboarding" component={Onboarding} />
              <Route path="/onboarding/slack/callback" component={OnboardingSlackCallback} />
              <Route path="/onboarding/agents" component={NOXOnboarding} />
              <Route path="/orchestrator" component={OrchestratorDashboard} />
              <Route path="/demo" component={DemoPresentation} />
              <Route path="/platform-demo" component={PlatformDemo} />
              <Route path="/account-type" component={AccountTypeSelection} />
              <Route path="/enterprise/onboard" component={EnterpriseOnboarding} />
              <Route path="/freelance/onboard" component={FreelanceOnboarding} />
              <Route path="/sign-in" component={SignIn} />
              <Route path="/sign-up" component={SignUp} />
              <Route path="/dashboard" component={UserDashboard} />
              <Route path="/tenant/:tenantId/dashboard" component={TenantDashboard} />
              <Route path="/tenant/:tenantId/admin" component={EnterpriseAdmin} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </Layout>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
