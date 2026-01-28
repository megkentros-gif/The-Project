import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trophy, Dribbble, ChevronRight, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// League country flags (emoji representation)
const LEAGUE_FLAGS = {
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Spain": "🇪🇸",
  "Germany": "🇩🇪",
  "Italy": "🇮🇹",
  "France": "🇫🇷",
  "Europe": "🇪🇺"
};

// League colors
const LEAGUE_COLORS = {
  "PL": "from-purple-500 to-blue-500",
  "PD": "from-red-500 to-yellow-500",
  "BL1": "from-red-600 to-black",
  "SA": "from-blue-500 to-green-500",
  "FL1": "from-blue-600 to-red-500",
  "CL": "from-blue-800 to-yellow-500",
  "EL": "from-orange-500 to-red-600",
  "EURO": "from-orange-400 to-orange-600"
};

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get(`${API}/leagues`);
      setLeagues(response.data.leagues || []);
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  const footballLeagues = leagues.filter(l => l.sport === "football");
  const basketballLeagues = leagues.filter(l => l.sport === "basketball");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="leagues-page">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
          LEAGUES
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Browse matches and standings from the top football leagues in Europe and EuroLeague basketball.
        </p>
      </div>

      {/* Football Leagues */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-green-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold uppercase text-white">Football</h2>
          <Badge className="bg-zinc-800 text-zinc-400">
            {footballLeagues.length} Leagues
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-16 rounded-xl mb-4 bg-zinc-800" />
                  <Skeleton className="h-6 w-3/4 mb-2 bg-zinc-800" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {footballLeagues.map((league, index) => (
              <Link 
                key={league.code} 
                to={`/standings/${league.code}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card 
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 group overflow-hidden"
                  data-testid={`league-card-${league.code}`}
                >
                  <CardContent className="p-6 relative">
                    {/* Gradient background */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br ${LEAGUE_COLORS[league.code] || 'from-zinc-700 to-zinc-800'} opacity-10 group-hover:opacity-20 transition-opacity`}
                    />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${LEAGUE_COLORS[league.code] || 'from-zinc-700 to-zinc-800'} flex items-center justify-center text-3xl`}>
                          {LEAGUE_FLAGS[league.country] || "⚽"}
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      
                      <h3 className="font-heading text-xl font-bold uppercase text-white mb-1">
                        {league.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">{league.country}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Basketball Leagues */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Dribbble className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold uppercase text-white">Basketball</h2>
          <Badge className="bg-zinc-800 text-zinc-400">
            {basketballLeagues.length} League
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-16 rounded-xl mb-4 bg-zinc-800" />
                <Skeleton className="h-6 w-3/4 mb-2 bg-zinc-800" />
                <Skeleton className="h-4 w-1/2 bg-zinc-800" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {basketballLeagues.map((league, index) => (
              <Link 
                key={league.code} 
                to={`/standings/${league.code}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card 
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 group overflow-hidden"
                  data-testid={`league-card-${league.code}`}
                >
                  <CardContent className="p-6 relative">
                    {/* Gradient background */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br ${LEAGUE_COLORS[league.code] || 'from-orange-500 to-orange-700'} opacity-10 group-hover:opacity-20 transition-opacity`}
                    />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${LEAGUE_COLORS[league.code] || 'from-orange-500 to-orange-700'} flex items-center justify-center text-3xl`}>
                          🏀
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      
                      <h3 className="font-heading text-xl font-bold uppercase text-white mb-1">
                        {league.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">{league.country}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
