import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Trophy, Dribbble, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// EuroLeague team logo mapping using Wikipedia URLs
const EUROLEAGUE_LOGOS = {
  "panathinaikos": "https://upload.wikimedia.org/wikipedia/en/7/71/Panathinaikos_BC_logo.svg",
  "olympiacos": "https://upload.wikimedia.org/wikipedia/en/1/1d/Olympiacos_BC_logo.svg",
  "real madrid": "https://upload.wikimedia.org/wikipedia/en/1/1b/Real_Madrid_Baloncesto_logo.svg"
};

export default function MatchCard({ match, showAddToParlay = false, onAddToParlay }) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "LIVE":
      case "IN_PLAY":
      case "1H":
      case "2H":
      case "HT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "FT":
      case "AET":
      case "PEN":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "NS": return "Upcoming";
      case "1H": return "1st Half";
      case "2H": return "2nd Half";
      case "HT": return "Half Time";
      case "FT": return "Full Time";
      case "AET": return "After ET";
      case "PEN": return "Penalties";
      default: return status;
    }
  };

  // Get EuroLeague logo if available
  const getTeamLogo = (teamName, originalLogo) => {
    if (!teamName) return originalLogo;
    
    // Check if this is a basketball match and if we have a logo mapping
    if (match.sport === "basketball" && match.league && match.league.toLowerCase().includes("euro")) {
      const normalizedName = teamName.toLowerCase();
      for (const [key, logoUrl] of Object.entries(EUROLEAGUE_LOGOS)) {
        if (normalizedName.includes(key)) {
          return logoUrl;
        }
      }
    }
    
    return originalLogo;
  };

  // Extract odds from match data - supports both parsed and raw bookmaker formats
  const getOdds = () => {
    if (!match.odds) return null;
    
    // Try parsed format first (Match Winner object)
    const matchWinner = match.odds["Match Winner"] || match.odds["Home/Away"] || {};
    if (matchWinner["Home"] || matchWinner["Away"]) {
      return {
        home: matchWinner["Home"] || matchWinner["1"],
        draw: matchWinner["Draw"] || matchWinner["X"],
        away: matchWinner["Away"] || matchWinner["2"]
      };
    }
    
    // Try raw bookmaker format from The Odds API
    const rawBookmakers = match.odds.raw_bookmakers || match.bookmakers || [];
    if (rawBookmakers.length > 0) {
      const firstBookmaker = rawBookmakers[0];
      const h2hMarket = firstBookmaker.markets?.find(m => m.key === 'h2h');
      if (h2hMarket && h2hMarket.outcomes) {
        const outcomes = h2hMarket.outcomes;
        return {
          home: outcomes[0]?.price?.toFixed(2),
          draw: outcomes.length > 2 ? outcomes[1]?.price?.toFixed(2) : null,
          away: outcomes.length > 2 ? outcomes[2]?.price?.toFixed(2) : outcomes[1]?.price?.toFixed(2)
        };
      }
    }
    
    return null;
  };

  const odds = getOdds();
  const SportIcon = match.sport === "basketball" ? Dribbble : Trophy;
  const homeLogo = getTeamLogo(match.home_team, match.home_logo);
  const awayLogo = getTeamLogo(match.away_team, match.away_logo);

  return (
    <Card 
      className="match-card bg-zinc-900 border-zinc-800 overflow-hidden group"
      data-testid={`match-card-${match.id}`}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <SportIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
              {match.league}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {match.has_odds && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                Odds
              </Badge>
            )}
            <Badge className={getStatusColor(match.status)}>
              {getStatusText(match.status)}
            </Badge>
          </div>
        </div>

        {/* Teams */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {homeLogo ? (
                <img 
                  src={homeLogo} 
                  alt={match.home_team}
                  className="team-logo mb-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-zinc-600" />
                </div>
              )}
              <span className="text-sm font-medium text-white line-clamp-2">
                {match.home_team}
              </span>
            </div>

            {/* Score / VS */}
            <div className="px-4">
              {match.home_score !== null && match.away_score !== null ? (
                <div className="text-center">
                  <span className="font-mono text-2xl font-bold text-white">
                    {match.home_score} - {match.away_score}
                  </span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-xs text-zinc-500 font-bold">VS</span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {awayLogo ? (
                <img 
                  src={awayLogo} 
                  alt={match.away_team}
                  className="team-logo mb-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-zinc-600" />
                </div>
              )}
              <span className="text-sm font-medium text-white line-clamp-2">
                {match.away_team}
              </span>
            </div>
          </div>

          {/* Odds Display */}
          {odds && (odds.home || odds.away) && (
            <div className="flex justify-center gap-2 mb-4">
              <div className="flex-1 text-center p-2 bg-zinc-800/50 rounded-lg">
                <span className="text-xs text-zinc-500 block">Home</span>
                <span className="font-mono text-lg font-bold text-white">{odds.home || '-'}</span>
              </div>
              {match.sport === "football" && (
                <div className="flex-1 text-center p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-xs text-zinc-500 block">Draw</span>
                  <span className="font-mono text-lg font-bold text-white">{odds.draw || '-'}</span>
                </div>
              )}
              <div className="flex-1 text-center p-2 bg-zinc-800/50 rounded-lg">
                <span className="text-xs text-zinc-500 block">Away</span>
                <span className="font-mono text-lg font-bold text-white">{odds.away || '-'}</span>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm mb-4">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(match.match_date)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={`/match/${match.id}`} className="flex-1">
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 text-white hover:bg-zinc-800 group-hover:border-green-500/50"
                data-testid={`view-analysis-${match.id}`}
              >
                View Analysis
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            {showAddToParlay && (
              <Button
                onClick={() => onAddToParlay && onAddToParlay(match)}
                className="bg-green-500 hover:bg-green-600 text-black"
                data-testid={`add-to-parlay-${match.id}`}
              >
                + Parlay
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
