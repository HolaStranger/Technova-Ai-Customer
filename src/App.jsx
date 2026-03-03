import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CustomerChat from "./pages/CustomerChat";
import AdminLogin from "./pages/AdminLogin";
import TechnicianLogin from "./pages/TechnicianLogin";
import VoiceCall from "./pages/VoiceCall";
import ChatSupport from "./pages/ChatSupport";
import AdminDashboard from "./pages/AdminDashboard";
import TicketDetails from "./pages/TicketDetails";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import MyTickets from "./pages/MyTickets";
import CustomerAccess from "./pages/CustomerAccess";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerSignup from "./pages/CustomerSignup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<CustomerChat />} />
        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/tickets/:id" element={<TicketDetails />} />
        {/* Technician */}
        <Route path="/technician" element={<TechnicianLogin />} />
        <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
        {/* Others */}
        <Route path="/voice-call" element={<VoiceCall />} />
        <Route path="/chat-support" element={<ChatSupport />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/customer-access" element={<CustomerAccess />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} />
      </Routes>
    </BrowserRouter>
  );
}
