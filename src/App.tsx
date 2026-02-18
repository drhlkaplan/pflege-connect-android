import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NurseProfileEdit from "./pages/NurseProfileEdit";
import CompanyProfileEdit from "./pages/CompanyProfileEdit";
import PatientRelativeProfileEdit from "./pages/PatientRelativeProfileEdit";
import JobPostingCreate from "./pages/JobPostingCreate";
import JobPostings from "./pages/JobPostings";
import MyJobPostings from "./pages/MyJobPostings";
import MyApplications from "./pages/MyApplications";
import JobApplications from "./pages/JobApplications";
import Search from "./pages/Search";
import NurseDirectory from "./pages/NurseDirectory";
import CompanyDirectory from "./pages/CompanyDirectory";
import NurseProfile from "./pages/NurseProfile";
import CompanyProfile from "./pages/CompanyProfile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import GdprSettings from "./pages/GdprSettings";
import Pricing from "./pages/Pricing";
import JobDetail from "./pages/JobDetail";
import Impressum from "./pages/Impressum";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Messages from "./pages/Messages";
import NursePanel from "./pages/NursePanel";
import CompanyPanel from "./pages/CompanyPanel";
import RelativePanel from "./pages/RelativePanel";
import Watchlist from "./pages/Watchlist";
import ContactRequests from "./pages/ContactRequests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nurse/profile" element={<NurseProfileEdit />} />
            <Route path="/company/profile" element={<CompanyProfileEdit />} />
            <Route path="/relative/profile" element={<PatientRelativeProfileEdit />} />
            <Route path="/jobs" element={<JobPostings />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/create" element={<JobPostingCreate />} />
            <Route path="/jobs/my" element={<MyJobPostings />} />
            <Route path="/jobs/applications" element={<JobApplications />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/nurses" element={<NurseDirectory />} />
            <Route path="/companies" element={<CompanyDirectory />} />
            <Route path="/nurse/:id" element={<NurseProfile />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/privacy" element={<GdprSettings />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/datenschutz" element={<PrivacyPolicy />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/nurse/panel" element={<NursePanel />} />
            <Route path="/company/panel" element={<CompanyPanel />} />
            <Route path="/relative/panel" element={<RelativePanel />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/contact-requests" element={<ContactRequests />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
