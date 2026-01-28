import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  History,
  AlertTriangle,
  Zap,
  ChevronRight,
  Trophy,
  Dribbble,
  Target,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MatchDetail() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchDetail();
  }, [matchId]);

  const fetchMatchDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/matches/${matchId}`);
      setMatch(response.data);
    } catch (error) {
      console.error("Error fetching match:", error);
      toast.error("Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-zinc-500";
    }
  };

  const getFormBadgeClass = (result) => {
    switch (result) {
      case "W":
        return "bg-green-500";
      case "L":
        return "bg-red-500";
      case "D":
        return "bg-zinc-500";
      default:
        return "bg-zinc-700";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-8 bg-zinc-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-8">
                <Skeleton className="h-32 w-full mb-4 bg-zinc-800" />
                <Skeleton className="h-8 w-3/4 mb-2 bg-zinc-800" />
                <Skeleton className="h-8 w-1/2 bg-zinc-800" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full mb-4 bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Match Not Found</h3>
            <p className="text-zinc-500 mb-4">Unable to load match details.</p>
            <Link to="/">
              <Button variant="outline" className="border-zinc-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SportIcon = match.sport === "basketball" ? Dribbble : Trophy;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="match-detail">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Match Header */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: match.sport === "basketball" 
              ? "url('https://images.unsplash.com/photo-1640528979293-e44c218b044d?crop=entropy&cs=srgb&fm=jpg&q=85')"
              : "url('https://images.unsplash.com/photo-1602339824201-171804fff052?crop=entropy&cs=srgb&fm=jpg&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-2 mb-6">
            <SportIcon className="w-5 h-5 text-zinc-500" />
            <span className="text-sm text-zinc-500 uppercase tracking-wide">{match.league}</span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {match.status === "SCHEDULED" || match.status === "TIMED" ? "Upcoming" : match.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {match.home_logo ? (
                <img 
                  src={match.home_logo} 
                  alt={match.home_team}
                  className="w-24 h-24 object-contain mb-4"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                  <Trophy className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              <h2 className="font-heading text-2xl font-bold uppercase text-white">
                {match.home_team}
              </h2>
              <span className="text-sm text-zinc-500">Home</span>
            </div>

            {/* Score / VS */}
            <div className="px-8 text-center">
              {match.home_score !== null && match.away_score !== null ? (
                <div className="font-mono text-5xl font-bold text-white">
                  {match.home_score} - {match.away_score}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="font-heading text-2xl text-zinc-500 font-bold">VS</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 text-zinc-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(match.match_date)}</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {match.away_logo ? (
                <img 
                  src={match.away_logo} 
                  alt={match.away_team}
                  className="w-24 h-24 object-contain mb-4"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                  <Trophy className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              <h2 className="font-heading text-2xl font-bold uppercase text-white">
                {match.away_team}
              </h2>
              <span className="text-sm text-zinc-500">Away</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 w-full justify-start">
              <TabsTrigger value="analysis" className="data-[state=active]:bg-zinc-800">
                <Zap className="w-4 h-4 mr-2" />
                AI Analysis
              </TabsTrigger>
              <TabsTrigger value="h2h" className="data-[state=active]:bg-zinc-800">
                <History className="w-4 h-4 mr-2" />
                Head to Head
              </TabsTrigger>
              <TabsTrigger value="form" className="data-[state=active]:bg-zinc-800">
                <TrendingUp className="w-4 h-4 mr-2" />
                Form
              </TabsTrigger>
            </TabsList>

            {/* AI Analysis Tab */}
            <TabsContent value="analysis" className="mt-6">
              {match.ai_analysis ? (
                <Card className="best-bet-card bg-zinc-900 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Zap className="w-5 h-5 text-green-500" />
                      AI Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prediction */}
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                      <div>
                        <p className="text-sm text-zinc-500 mb-1">Prediction</p>
                        <p className="font-heading text-2xl font-bold uppercase text-white">
                          {match.ai_analysis.prediction}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-500 mb-1">Confidence</p>
                        <p className="font-mono text-2xl font-bold text-green-500">
                          {match.ai_analysis.confidence}%
                        </p>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill"
                          style={{ width: `${match.ai_analysis.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Best Bet */}
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-400 uppercase tracking-wide font-medium">Best Bet</span>
                      </div>
                      <p className="font-heading text-xl font-bold text-white">
                        {match.ai_analysis.best_bet}
                      </p>
                    </div>

                    {/* Reasoning */}
                    <div>
                      <p className="text-sm text-zinc-500 mb-2">Analysis</p>
                      <p className="text-zinc-300 leading-relaxed">
                        {match.ai_analysis.reasoning}
                      </p>
                    </div>

                    {/* Risk Level */}
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Risk Level</span>
                      </div>
                      <span className={`font-bold uppercase ${getRiskColor(match.ai_analysis.risk_level)}`}>
                        {match.ai_analysis.risk_level}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-8 text-center">
                    <Zap className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-500">AI analysis not available for this match.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Head to Head Tab */}
            <TabsContent value="h2h" className="mt-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-blue-500" />
                    Recent Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {match.head_to_head && match.head_to_head.length > 0 ? (
                    <div className="space-y-3">
                      {match.head_to_head.map((h2h, index) => (
                        <div key={index} className="h2h-row">
                          <div className="text-right">
                            <span className="font-medium text-white">{h2h.home}</span>
                          </div>
                          <div className="font-mono font-bold text-white bg-zinc-800 px-4 py-2 rounded-lg">
                            {h2h.home_score} - {h2h.away_score}
                          </div>
                          <div>
                            <span className="font-medium text-white">{h2h.away}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-zinc-500 py-8">
                      No head-to-head data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Form Tab */}
            <TabsContent value="form" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Form */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{match.home_team} Form</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {(match.home_form || []).map((result, index) => (
                        <div
                          key={index}
                          className={`form-badge ${getFormBadgeClass(result)}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-zinc-500 mt-4">Last 5 matches</p>
                  </CardContent>
                </Card>

                {/* Away Form */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{match.away_team} Form</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {(match.away_form || []).map((result, index) => (
                        <div
                          key={index}
                          className={`form-badge ${getFormBadgeClass(result)}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-zinc-500 mt-4">Last 5 matches</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Injuries */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Injuries & Suspensions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-2">{match.home_team}</p>
                  {match.injuries?.home && match.injuries.home.length > 0 ? (
                    <ul className="space-y-1">
                      {match.injuries.home.map((player, i) => (
                        <li key={i} className="text-sm text-zinc-300">{player}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-600">No reported injuries</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-2">{match.away_team}</p>
                  {match.injuries?.away && match.injuries.away.length > 0 ? (
                    <ul className="space-y-1">
                      {match.injuries.away.map((player, i) => (
                        <li key={i} className="text-sm text-zinc-300">{player}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-600">No reported injuries</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <Link to="/parlay">
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-bold uppercase"
                  data-testid="add-to-parlay-btn"
                >
                  Add to Parlay
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* League Link */}
          {match.league_code && (
            <Link to={`/standings/${match.league_code}`}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-zinc-500" />
                    <span className="text-white">View {match.league} Standings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
