import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { JudgeLayout } from "@/components/dashboard/JudgeLayout";
import { AuthProvider } from "@/contexts/AuthContext";

// Public pages
import Index from "./pages/Index";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Events from "./pages/Events";
import Leaderboard from "./pages/Leaderboard";
import Register from "./pages/Register";
import Voting from "./pages/Voting";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Auth pages
import AdminLogin from "./pages/auth/AdminLogin";
import JudgeLogin from "./pages/auth/JudgeLogin";

// Dashboard pages
import UserDashboard from "./pages/dashboard/UserDashboard";
import UserEvents from "./pages/dashboard/UserEvents";
import UserRegistrations from "./pages/dashboard/UserRegistrations";
import UserEventDetails from "./pages/dashboard/UserEventDetails";
import UserResults from "./pages/dashboard/UserResults";

// Admin dashboard pages
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminCompetitions from "./pages/dashboard/AdminCompetitions";
import AdminCreate from "./pages/dashboard/AdminCreate";
import AdminGallery from "./pages/dashboard/AdminGallery";
import AdminJudges from "./pages/dashboard/AdminJudges";
import AdminNotifications from "./pages/dashboard/AdminNotifications";
import AdminOutcomes from "./pages/dashboard/AdminOutcomes";
import AdminProfile from "./pages/dashboard/AdminProfile";
import AdminSettings from "./pages/dashboard/AdminSettings";
import AdminUsers from "./pages/dashboard/AdminUsers";

// Judge dashboard pages
import JudgeDashboard from "./pages/dashboard/JudgeDashboard";
import JudgeEntries from "./pages/dashboard/JudgeEntries";
import JudgeLeaderboard from "./pages/dashboard/JudgeLeaderboard";
import JudgeProfile from "./pages/dashboard/JudgeProfile";
import JudgeSubmissions from "./pages/dashboard/JudgeSubmissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes (no layout) */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/judge" element={<JudgeLogin />} />

            {/* Public routes with main layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/register" element={<Register />} />
              <Route path="/voting/:eventId?" element={<Voting />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Dashboard routes within main layout */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<UserDashboard />} />
                <Route path="events" element={<UserEvents />} />
                <Route path="events/:id" element={<UserEventDetails />} />
                <Route path="registrations" element={<UserRegistrations />} />
                <Route path="results" element={<UserResults />} />
              </Route>
            </Route>

            {/* Admin routes (no main layout) */}
            <Route path="/admin/dashboard" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="competitions" element={<AdminCompetitions />} />
              <Route path="create" element={<AdminCreate />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="judges" element={<AdminJudges />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="outcomes" element={<AdminOutcomes />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            {/* Judge routes (no main layout) */}
            <Route path="/judge/dashboard" element={<JudgeLayout />}>
              <Route index element={<JudgeDashboard />} />
              <Route path="entries" element={<JudgeEntries />} />
              <Route path="leaderboard" element={<JudgeLeaderboard />} />
              <Route path="profile" element={<JudgeProfile />} />
              <Route path="submissions" element={<JudgeSubmissions />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
