import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./stores/auth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { AgreementDetail } from "./pages/AgreementDetail";
import { GuestForm } from "./pages/GuestForm";
import Home from "@/pages/Home";
import PublicRentForm from "@/pages/PublicRentForm";
import PublicAgreementStatus from "@/pages/PublicAgreementStatus";
import BikeManagement from "@/pages/BikeManagement";
import NewAgreement from "@/pages/NewAgreement";

import PricingManagement from "@/pages/PricingManagement";
import NotFound from "@/pages/NotFound";

export default function App() {
  // Restore the session on a full page load. checkAuth reads the token that
  // the request interceptor already sends; without it, user stayed null after
  // every refresh and the admin guard bounced the owner to /login despite a
  // valid token — so a reload mid-task (or a shared link) always logged him out.
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rent" element={<PublicRentForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agreements/:id" element={<AgreementDetail />} />
        <Route path="/agreement/:reference" element={<PublicAgreementStatus />} />
        <Route path="/admin/bikes" element={<BikeManagement />} />
        <Route path="/admin/pricing" element={<PricingManagement />} />
        <Route path="/admin/new-agreement" element={<NewAgreement />} />
        <Route path="/rent/:token" element={<GuestForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
