import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Licenses from "./pages/Licenses";
import Domains from "./pages/Domains";
import Subscriptions from "./pages/Subscriptions";
import VerifyOtp from "./pages/VerifyOtp";
import UserManagement from "./pages/UserManagement";
import VendorList from "./pages/VendorList";
import VendorBudget from "./pages/VendorBudget";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Landing />
              </>
            }
          />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/register" element={<><Navbar /><Register /></>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/budget" element={<VendorBudget />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
