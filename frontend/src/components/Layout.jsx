import { Link, useLocation } from "react-router-dom";
import { Trophy, LayoutDashboard, ListOrdered, Layers } from "lucide-react";
import { useParlay } from "@/context/ParlayContext";
import { Badge } from "@/components/ui/badge";
import ParlaySidebar from "@/components/ParlaySidebar";

export default function Layout({ children }) {
  const location = useLocation();
  const { getParlayCount, toggleSidebar } = useParlay();
  const parlayCount = getParlayCount();
  
  const navLinks = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leagues", label: "Leagues", icon: Trophy },
    { to: "/parlay", label: "Parlay Builder", icon: Layers, badge: parlayCount },
  ];
  
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                BETSMART<span className="text-green-500">AI</span>
              </span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                    className={`nav-link flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(link.to)
                        ? "active text-white bg-white/5"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="font-medium">{link.label}</span>
                    {link.badge > 0 && (
                      <Badge className="bg-green-500 text-black text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              data-testid="mobile-menu-btn"
            >
              <ListOrdered className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-white/10">
          <div className="flex justify-around py-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                    isActive(link.to) ? "text-green-500" : "text-zinc-400"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-xs">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Floating Parlay Button */}
      {parlayCount > 0 && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-black font-bold rounded-full shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
          data-testid="floating-parlay-btn"
        >
          <Layers className="w-5 h-5" />
          <span className="hidden sm:inline">Bet Slip</span>
          <Badge className="bg-black text-green-500 text-xs min-w-[24px]">
            {parlayCount}
          </Badge>
        </button>
      )}

      {/* Parlay Sidebar */}
      <ParlaySidebar />
      
      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-500" />
              <span className="font-heading text-lg font-bold text-white">BETSMART<span className="text-green-500">AI</span></span>
            </div>
            <p className="text-sm text-zinc-500">
              AI-powered betting insights for smarter decisions. Gamble responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
