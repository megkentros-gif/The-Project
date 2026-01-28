import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ParlayProvider } from "@/context/ParlayContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MatchDetail from "@/pages/MatchDetail";
import Leagues from "@/pages/Leagues";
import Standings from "@/pages/Standings";
import ParlayBuilder from "@/pages/ParlayBuilder";

function App() {
  return (
    <div className="App min-h-screen bg-[#09090b]">
      <ParlayProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/match/:matchId" element={<MatchDetail />} />
              <Route path="/leagues" element={<Leagues />} />
              <Route path="/standings/:leagueCode" element={<Standings />} />
              <Route path="/parlay" element={<ParlayBuilder />} />
            </Routes>
          </Layout>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </ParlayProvider>
    </div>
  );
}

export default App;
