import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  TrendingUp, 
  Calendar, 
  Zap, 
  ChevronRight,
  Trophy,
  Dribbble,
  Clock,
  Flame,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MatchCard from "@/components/MatchCard";
import FeaturedPickCard from "@/components/FeaturedPickCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  // Initialize state from localStorage
  const [selectedSport, setSelectedSport] = useState(() => {
    return localStorage.getItem('betsmart_selectedSport') || "all";
  });
  const [selectedLeague, setSelectedLeague] = useState(() => {
    return localStorage.getItem('betsmart_selectedLeague') || "all";
  });
  const [leagues, setLeagues] = useState([]);

  // Persist filter state to localStorage
  useEffect(() => {
    localStorage.setItem('betsmart_selectedSport', selectedSport);
  }, [selectedSport]);

  useEffect(() => {
    localStorage.setItem('betsmart_selectedLeague', selectedLeague);
  }, [selectedLeague]);

  useEffect(() => {
    fetchLeagues();
    fetchMatches();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [selectedSport, selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get(`${API}/leagues`);
      setLeagues(response.data.leagues || []);
    } catch (error) {
      console.error("Error fetching leagues:", error);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      let url = `${API}/matches`;
      const params = new URLSearchParams();
      
      if (selectedSport !== "all") {
        params.append("sport", selectedSport);
      }
      if (selectedLeague !== "all") {
        params.append("league", selectedLeague);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle sport filter change with basketball/euroleague special handling
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    // If basketball or euroleague is selected, enforce the correct API key
    if (sport === 'basketball' || sport === 'euroleague') {
      setSelectedLeague('basketball_euroleague');
    } else if (sport === 'all') {
      setSelectedLeague('all');
    }
  };

  // Handle league filter change with basketball/euroleague special handling
  const handleLeagueChange = (league) => {
    // If a basketball league is selected, ensure correct API key
    if (league === 'basketball_euroleague' || league === 'EURO') {
      setSelectedLeague('basketball_euroleague');
    } else {
      setSelectedLeague(league);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getUpcomingCount = () => {
    return matches.filter(m => m.status === "NS" || m.status === "SCHEDULED" || m.status === "TIMED").length;
  };

  // Get top 4 high-probability picks sorted by AI probability
  const topPicks = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    // Filter matches with valid quick_analysis probability and sort by probability descending
    const matchesWithProbability = matches
      .filter(m => 
        m.quick_analysis && 
        m.quick_analysis.probability > 0 &&
        m.quick_analysis.best_pick &&
        (m.status === "NS" || m.status === "SCHEDULED" || m.status === "TIMED")
      )
      .sort((a, b) => (b.quick_analysis?.probability || 0) - (a.quick_analysis?.probability || 0));
    
    return matchesWithProbability.slice(0, 4);
  }, [matches]);

  // Get remaining matches (excluding top picks)
  const remainingMatches = useMemo(() => {
    const topPickIds = new Set(topPicks.map(m => m.id));
    return matches.filter(m => !topPickIds.has(m.id));
  }, [matches, topPicks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 mb-8">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1761396677022-3678bcb336f0?crop=entropy&cs=srgb&fm=jpg&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        
        <div className="relative p-8 md:p-12">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
              <Zap className="w-3 h-3 mr-1" /> AI-Powered Analysis
            </Badge>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-4">
              SMART BETTING<br />
              <span className="text-green-500">STARTS HERE</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-6 max-w-lg">
              Get AI-powered predictions, head-to-head stats, and form analysis for every match in the top football leagues and EuroLeague basketball.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/parlay">
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-black font-bold uppercase tracking-wide"
                  data-testid="build-parlay-btn"
                >
                  Build Your Parlay
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/leagues">
                <Button 
                  variant="outline" 
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                  data-testid="browse-leagues-btn"
                >
                  Browse Leagues
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white">{leagues.filter(l => l.sport === "football").length}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Football Leagues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Dribbble className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white">1</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Basketball</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white">{getUpcomingCount()}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white">AI</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8 relative z-20">
        <h2 className="font-heading text-2xl font-bold uppercase text-white">
          Upcoming Matches
        </h2>
        
        <div className="flex-1" />
        
        <Select value={selectedSport} onValueChange={handleSportChange}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white" data-testid="sport-filter">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 z-50">
            <SelectItem value="all">All Sports</SelectItem>
            <SelectItem value="football">Football</SelectItem>
            <SelectItem value="basketball">Basketball</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedLeague} onValueChange={handleLeagueChange}>
          <SelectTrigger className="w-48 bg-zinc-900 border-zinc-800 text-white" data-testid="league-filter">
            <SelectValue placeholder="League" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 z-50">
            <SelectItem value="all">All Leagues</SelectItem>
            {leagues
              .filter(l => selectedSport === "all" || l.sport === selectedSport)
              .map((league) => (
                <SelectItem key={league.id || league.code} value={league.id || league.code}>
                  {league.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4 bg-zinc-800" />
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg bg-zinc-800" />
                  <Skeleton className="h-8 w-16 bg-zinc-800" />
                  <Skeleton className="h-12 w-12 rounded-lg bg-zinc-800" />
                </div>
                <Skeleton className="h-4 w-full mb-2 bg-zinc-800" />
                <Skeleton className="h-4 w-3/4 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : matches.length > 0 ? (
        <>
          {/* Featured Picks Section - Top 4 High Probability */}
          {topPicks.length > 0 && (
            <div className="mb-10">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold uppercase text-white flex items-center gap-2">
                      Top 4 High-Probability Picks
                      <Badge className="bg-red-500/30 text-red-400 border-red-500/50 animate-pulse">
                        <Flame className="w-3 h-3 mr-1" /> HOT
                      </Badge>
                    </h3>
                    <p className="text-xs text-zinc-500">AI-recommended picks with highest confidence</p>
                  </div>
                </div>
              </div>
              
              {/* Featured Picks Container */}
              <div className="relative">
                {/* Gradient Background Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-red-900/20 via-red-600/10 to-red-900/20 rounded-3xl blur-xl" />
                
                <div className="relative bg-gradient-to-r from-red-900/30 to-red-800/20 rounded-2xl border border-red-500/30 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topPicks.map((match, index) => (
                      <div 
                        key={match.id} 
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <FeaturedPickCard match={match} rank={index + 1} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Matches Section */}
          {remainingMatches.length > 0 && (
            <>
              <h3 className="font-heading text-lg font-bold uppercase text-zinc-400 mb-4 mt-8">
                All Matches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingMatches.map((match, index) => (
                  <div 
                    key={match.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
            <p className="text-zinc-500">
              {selectedLeague !== "all" || selectedSport !== "all" 
                ? "Try adjusting your filters to see more matches."
                : "Check back soon for upcoming fixtures."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
