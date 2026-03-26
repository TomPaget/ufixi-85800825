import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Index from "./pages/Index";
import HomeDashboard from "./pages/HomeDashboard";
import MyIssues from "./pages/MyIssues";
import IssueDetail from "./pages/IssueDetail";
import AIHelp from "./pages/AIHelp";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import History from "./pages/History";
import Contractors from "./pages/Contractors";
import Support from "./pages/Support";
import Upgrade from "./pages/Upgrade";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Forum from "./pages/Forum";
import ForumPost from "./pages/ForumPost";
import CreatePost from "./pages/CreatePost";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<HomeDashboard />} />
        <Route path="/issues" element={<MyIssues />} />
        <Route path="/issue/:id" element={<IssueDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/ai-help" element={<AIHelp />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/contractors" element={<Contractors />} />
        <Route path="/support" element={<Support />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/:id" element={<ForumPost />} />
        <Route path="/forum/create" element={<CreatePost />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
