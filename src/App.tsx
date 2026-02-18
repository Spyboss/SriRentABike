import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { AgreementDetail } from "./pages/AgreementDetail";
import { GuestForm } from "./pages/GuestForm";
import Home from "@/pages/Home";
import PublicRentForm from "@/pages/PublicRentForm";
import PublicAgreementStatus from "@/pages/PublicAgreementStatus";
import BikeManagement from "@/pages/BikeManagement";

import PricingManagement from "@/pages/PricingManagement";
import NotFound from "@/pages/NotFound";

export default function App() {
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
        <Route path="/rent/:token" element={<GuestForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
