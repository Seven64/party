import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import HostControl from "@/pages/HostControl";
import GuestJoin from "@/pages/GuestJoin";
import GuestParty from "@/pages/GuestParty";

function App() {
  return (
    <div className="App min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/party/:partyId" element={<HostControl />} />
          <Route path="/party/:partyId" element={<GuestJoin />} />
          <Route path="/party/:partyId/room" element={<GuestParty />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
