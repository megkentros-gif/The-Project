import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Shield,
  Goal,
  BarChart3,
  Plus,
  Newspaper,
  Scale,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParlay } from "@/context/ParlayContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { addToParlay, parlayItems } = useParlay();
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

  const handleBackClick = () => {
    // Navigate back to dashboard - localStorage already has the filter state preserved
    // The Dashboard will read from localStorage and restore the last selected filters
    navigate("/");
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

  // Calculate probability from odds
  const oddsToProbability = (odds) => {
    if (!odds || parseFloat(odds) <= 0) return 0;
    return ((1 / parseFloat(odds)) * 100).toFixed(1);
  };

  // Get Over/Under odds
  const getOverUnderOdds = () => {
    if (!match?.odds) return null;
    const ou = match.odds["Over/Under 2.5"] || {};
    return {
      over: ou["Over"],
      under: ou["Under"],
      overProb: oddsToProbability(ou["Over"]),
      underProb: oddsToProbability(ou["Under"])
    };
  };

  // Get alternative Over/Under lines
  const getAlternativeLines = () => {
    if (!match?.odds) return null;
    const alt = match.odds["Over/Under Alternative"] || {};
    if (Object.keys(alt).length === 0) return null;
    
    // Group by line value
    const lines = {};
    Object.entries(alt).forEach(([key, value]) => {
      const parts = key.split(' ');
      const type = parts[0]; // "Over" or "Under"
      const line = parts[1]; // "1.5", "2.5", "3.5", etc.
      
      if (!lines[line]) {
        lines[line] = {};
      }
      lines[line][type] = value;
      lines[line][`${type}Prob`] = oddsToProbability(value);
    });
    
    return lines;
  };

  // Get Handicap odds
  const getHandicapOdds = () => {
    if (!match?.odds) return null;
    const handicap = match.odds["Handicap"] || {};
    if (Object.keys(handicap).length === 0) return null;
    
    const result = {};
    Object.entries(handicap).forEach(([key, value]) => {
      result[key] = {
        odds: value,
        prob: oddsToProbability(value)
      };
    });
    
    return result;
  };

  // Get BTTS odds (Both Teams to Score / Goal-Goal)
  const getBTTSOdds = () => {
    if (!match?.odds) return null;
    const btts = match.odds["Both Teams Score"] || match.odds["BTTS"] || {};
    return {
      yes: btts["Yes"],
      no: btts["No"],
      yesProb: oddsToProbability(btts["Yes"]),
      noProb: oddsToProbability(btts["No"])
    };
  };

  // Get Match Winner odds
  const getMatchWinnerOdds = () => {
    if (!match?.odds) return null;
    const mw = match.odds["Match Winner"] || {};
    return {
      home: mw["Home"],
      draw: mw["Draw"],
      away: mw["Away"],
      homeProb: oddsToProbability(mw["Home"]),
      drawProb: oddsToProbability(mw["Draw"]),
      awayProb: oddsToProbability(mw["Away"])
    };
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
            <Button 
              variant="outline" 
              className="border-zinc-700 text-white"
              onClick={handleBackClick}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SportIcon = match.sport === "basketball" ? Dribbble : Trophy;
  const overUnder = getOverUnderOdds();
  const btts = getBTTSOdds();
  const matchWinner = getMatchWinnerOdds();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="match-detail">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors px-0"
        data-testid="back-to-dashboard"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Button>

      {/* Match Header */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8 overflow-hidden relative">
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
              {match.status === "NS" ? "Upcoming" : match.status}
            </Badge>
            {match.has_odds && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Real Odds
              </Badge>
            )}
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

      {/* Odds & Probabilities Section */}
      {match.has_odds && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Match Winner Probabilities */}
          {matchWinner && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Match Winner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Home</span>
                    <div className="text-right">
                      <span className="font-mono text-white">{matchWinner.home}</span>
                      <span className="text-green-500 ml-2">({matchWinner.homeProb}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Draw</span>
                    <div className="text-right">
                      <span className="font-mono text-white">{matchWinner.draw}</span>
                      <span className="text-yellow-500 ml-2">({matchWinner.drawProb}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Away</span>
                    <div className="text-right">
                      <span className="font-mono text-white">{matchWinner.away}</span>
                      <span className="text-blue-500 ml-2">({matchWinner.awayProb}%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Over/Under 2.5 Goals */}
          {overUnder && (overUnder.over || overUnder.under) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Goal className="w-4 h-4" />
                  Over/Under 2.5 Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="text-white font-medium">Over 2.5</span>
                    <div className="text-right">
                      <span className="font-mono text-xl text-white">{overUnder.over || 'N/A'}</span>
                      <span className="text-green-500 ml-2 text-lg">({overUnder.overProb}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <span className="text-white font-medium">Under 2.5</span>
                    <div className="text-right">
                      <span className="font-mono text-xl text-white">{overUnder.under || 'N/A'}</span>
                      <span className="text-red-500 ml-2 text-lg">({overUnder.underProb}%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Both Teams to Score (GG/NG) */}
          {btts && (btts.yes || btts.no) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Both Teams Score (GG/NG)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="text-white font-medium">Goal-Goal (Yes)</span>
                    <div className="text-right">
                      <span className="font-mono text-xl text-white">{btts.yes || 'N/A'}</span>
                      <span className="text-green-500 ml-2 text-lg">({btts.yesProb}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <span className="text-white font-medium">No Goal (No)</span>
                    <div className="text-right">
                      <span className="font-mono text-xl text-white">{btts.no || 'N/A'}</span>
                      <span className="text-red-500 ml-2 text-lg">({btts.noProb}%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                        <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <div className="flex-1 text-right">
                            <span className="font-medium text-white">{h2h.home}</span>
                          </div>
                          <div className="px-4">
                            <div className="font-mono font-bold text-white bg-zinc-700 px-4 py-2 rounded-lg">
                              {h2h.home_score ?? '?'} - {h2h.away_score ?? '?'}
                            </div>
                          </div>
                          <div className="flex-1">
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
                    <CardTitle className="text-white text-lg">{match.home_team}</CardTitle>
                    <p className="text-sm text-zinc-500">Last 5 matches</p>
                  </CardHeader>
                  <CardContent>
                    {match.home_form && match.home_form.length > 0 ? (
                      <div className="flex gap-2">
                        {match.home_form.map((result, index) => (
                          <div
                            key={index}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${getFormBadgeClass(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500">No form data available</p>
                    )}
                    {match.home_form && match.home_form.length > 0 && (
                      <div className="mt-4 text-sm text-zinc-400">
                        <span className="text-green-500">{match.home_form.filter(r => r === 'W').length}W</span>
                        {' '}-{' '}
                        <span className="text-zinc-400">{match.home_form.filter(r => r === 'D').length}D</span>
                        {' '}-{' '}
                        <span className="text-red-500">{match.home_form.filter(r => r === 'L').length}L</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Away Form */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{match.away_team}</CardTitle>
                    <p className="text-sm text-zinc-500">Last 5 matches</p>
                  </CardHeader>
                  <CardContent>
                    {match.away_form && match.away_form.length > 0 ? (
                      <div className="flex gap-2">
                        {match.away_form.map((result, index) => (
                          <div
                            key={index}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${getFormBadgeClass(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500">No form data available</p>
                    )}
                    {match.away_form && match.away_form.length > 0 && (
                      <div className="mt-4 text-sm text-zinc-400">
                        <span className="text-green-500">{match.away_form.filter(r => r === 'W').length}W</span>
                        {' '}-{' '}
                        <span className="text-zinc-400">{match.away_form.filter(r => r === 'D').length}D</span>
                        {' '}-{' '}
                        <span className="text-red-500">{match.away_form.filter(r => r === 'L').length}L</span>
                      </div>
                    )}
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
                      {match.injuries.home.map((injury, i) => (
                        <li key={i} className="text-sm text-zinc-300">
                          {typeof injury === 'string' ? injury : injury.player || 'Unknown'}
                          {injury.reason && <span className="text-zinc-500 ml-1">({injury.reason})</span>}
                        </li>
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
                      {match.injuries.away.map((injury, i) => (
                        <li key={i} className="text-sm text-zinc-300">
                          {typeof injury === 'string' ? injury : injury.player || 'Unknown'}
                          {injury.reason && <span className="text-zinc-500 ml-1">({injury.reason})</span>}
                        </li>
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
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold uppercase"
                onClick={() => navigate("/parlay")}
                data-testid="add-to-parlay-btn"
              >
                Add to Parlay
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Bookmakers */}
          {match.bookmakers && match.bookmakers.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Odds From</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {match.bookmakers.slice(0, 5).map((book, i) => (
                    <Badge key={i} className="bg-zinc-800 text-zinc-300">
                      {book}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
