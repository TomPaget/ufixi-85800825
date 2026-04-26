import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { useAdMob } from "@/hooks/useAdMob";
import { useSubscription } from "@/hooks/useSubscription";
import { isNativeApp } from "@/lib/appNavigation";
import AppErrorBoundary from "@/components/AppErrorBoundary";
const Index = lazy(() => import("./pages/Index"));
const HomeDashboard = lazy(() => import("./pages/HomeDashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const MyIssues = lazy(() => import("./pages/MyIssues"));
const IssueDetail = lazy(() => import("./pages/IssueDetail"));
const AIHelp = lazy(() => import("./pages/AIHelp"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const History = lazy(() => import("./pages/History"));
const Contractors = lazy(() => import("./pages/Contractors"));
const Support = lazy(() => import("./pages/Support"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumPost = lazy(() => import("./pages/ForumPost"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CancelSubscription = lazy(() => import("./pages/CancelSubscription"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();
const Router = isNativeApp() ? HashRouter : BrowserRouter;

function RouteFallback() {
  return <div className="min-h-screen bg-background" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<HomeDashboard />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/issues" element={<MyIssues />} />
        <Route path="/my-issues" element={<MyIssues />} />
        <Route path="/issue/:id" element={<IssueDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/ai-help" element={<AIHelp />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/contractors" element={<Contractors />} />
        <Route path="/find-tradesman" element={<Contractors />} />
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
        <Route path="/cancel-subscription" element={<CancelSubscription />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function AdMobBootstrap() {
  const { initialize, preloadInterstitial, isNative } = useAdMob();
  const { isPremium, loading } = useSubscription();

  useEffect(() => {
    if (!isNative || loading || isPremium) return;
    void initialize()
      .then(() => preloadInterstitial())
      .catch((err) => console.warn("[AdMob] startup preload failed:", err));
  }, [initialize, preloadInterstitial, isNative, loading, isPremium]);

  return null;
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SubscriptionProvider>
          <AdMobBootstrap />
          <Toaster />
          <Sonner />
          <Router>
            <Suspense fallback={<RouteFallback />}>
              <AnimatedRoutes />
            </Suspense>
          </Router>
        </SubscriptionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
