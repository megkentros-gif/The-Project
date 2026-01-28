import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Trophy, Dribbble, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OddsButton from "@/components/OddsButton";

// Complete EuroLeague 2025-2026 Season Team Logo Mapping (All 20 Teams)
const EUROLEAGUE_LOGOS = {
  // Greek Teams
  "panathinaikos": "https://upload.wikimedia.org/wikipedia/en/7/71/Panathinaikos_BC_logo.svg",
  "panathinaikos aktor": "https://upload.wikimedia.org/wikipedia/en/7/71/Panathinaikos_BC_logo.svg",
  "olympiacos": "https://upload.wikimedia.org/wikipedia/en/1/1d/Olympiacos_BC_logo.svg",
  "olympiacos piraeus": "https://upload.wikimedia.org/wikipedia/en/1/1d/Olympiacos_BC_logo.svg",
  
  // Spanish Teams
  "real madrid": "https://upload.wikimedia.org/wikipedia/en/1/1b/Real_Madrid_Baloncesto_logo.svg",
  "barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "fc barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "baskonia": "https://upload.wikimedia.org/wikipedia/en/4/4f/Saski_Baskonia_logo.svg",
  "saski baskonia": "https://upload.wikimedia.org/wikipedia/en/4/4f/Saski_Baskonia_logo.svg",
  
  // Turkish Teams
  "fenerbahce": "https://upload.wikimedia.org/wikipedia/commons/0/02/Fenerbah%C3%A7e_SK.svg",
  "fenerbahce beko": "https://upload.wikimedia.org/wikipedia/commons/0/02/Fenerbah%C3%A7e_SK.svg",
  "fenerbahce sk": "https://upload.wikimedia.org/wikipedia/commons/0/02/Fenerbah%C3%A7e_SK.svg",
  "anadolu efes": "https://upload.wikimedia.org/wikipedia/en/6/65/Anadolu_Efes_S.K._logo.svg",
  "efes": "https://upload.wikimedia.org/wikipedia/en/6/65/Anadolu_Efes_S.K._logo.svg",
  
  // Italian Teams
  "virtus bologna": "https://upload.wikimedia.org/wikipedia/en/7/70/Virtus_Bologna_logo.svg",
  "virtus segafredo bologna": "https://upload.wikimedia.org/wikipedia/en/7/70/Virtus_Bologna_logo.svg",
  "milano": "https://upload.wikimedia.org/wikipedia/en/1/10/Olimpia_Milano_logo.svg",
  "ea7 emporio armani milano": "https://upload.wikimedia.org/wikipedia/en/1/10/Olimpia_Milano_logo.svg",
  "olimpia milano": "https://upload.wikimedia.org/wikipedia/en/1/10/Olimpia_Milano_logo.svg",
  "armani milano": "https://upload.wikimedia.org/wikipedia/en/1/10/Olimpia_Milano_logo.svg",
  
  // French Teams
  "monaco": "https://upload.wikimedia.org/wikipedia/en/d/d3/AS_Monaco_Basket_logo.svg",
  "as monaco": "https://upload.wikimedia.org/wikipedia/en/d/d3/AS_Monaco_Basket_logo.svg",
  "ldlc asvel": "https://upload.wikimedia.org/wikipedia/en/6/6c/ASVEL_Basket_logo.svg",
  "asvel": "https://upload.wikimedia.org/wikipedia/en/6/6c/ASVEL_Basket_logo.svg",
  "villeurbanne": "https://upload.wikimedia.org/wikipedia/en/6/6c/ASVEL_Basket_logo.svg",
  "paris basketball": "https://upload.wikimedia.org/wikipedia/fr/3/34/Logo_Paris_Basketball_2018.svg",
  "paris": "https://upload.wikimedia.org/wikipedia/fr/3/34/Logo_Paris_Basketball_2018.svg",
  
  // German Teams
  "bayern munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "fc bayern munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "bayern": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "alba berlin": "https://upload.wikimedia.org/wikipedia/en/4/43/Alba_Berlin_logo.svg",
  "alba": "https://upload.wikimedia.org/wikipedia/en/4/43/Alba_Berlin_logo.svg",
  
  // Serbian Teams
  "partizan": "https://upload.wikimedia.org/wikipedia/en/e/e1/KK_Partizan_logo.svg",
  "partizan mozzart bet": "https://upload.wikimedia.org/wikipedia/en/e/e1/KK_Partizan_logo.svg",
  "partizan belgrade": "https://upload.wikimedia.org/wikipedia/en/e/e1/KK_Partizan_logo.svg",
  "crvena zvezda": "https://upload.wikimedia.org/wikipedia/en/6/62/KK_Crvena_zvezda_logo.svg",
  "red star": "https://upload.wikimedia.org/wikipedia/en/6/62/KK_Crvena_zvezda_logo.svg",
  "crvena zvezda meridianbet": "https://upload.wikimedia.org/wikipedia/en/6/62/KK_Crvena_zvezda_logo.svg",
  
  // Israeli Teams
  "maccabi tel aviv": "https://upload.wikimedia.org/wikipedia/en/7/7c/Maccabi_Tel_Aviv_BC_logo.svg",
  "maccabi playtika tel aviv": "https://upload.wikimedia.org/wikipedia/en/7/7c/Maccabi_Tel_Aviv_BC_logo.svg",
  "maccabi": "https://upload.wikimedia.org/wikipedia/en/7/7c/Maccabi_Tel_Aviv_BC_logo.svg",
  
  // Lithuanian Teams
  "zalgiris": "https://upload.wikimedia.org/wikipedia/en/3/3e/BC_Zalgiris_logo.svg",
  "zalgiris kaunas": "https://upload.wikimedia.org/wikipedia/en/3/3e/BC_Zalgiris_logo.svg"
};

// Helper function to normalize team names for matching
const normalizeTeamName = (name) => {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/ fc$/i, "")
    .replace(/^fc /i, "")
    .replace(/ f\.c\.$/i, "")
    .replace(/ afc$/i, "")
    .replace(/ sc$/i, "")
    .replace(/ cf$/i, "")
    .replace(/&/g, "and")
    .trim();
};

// Helper function to check if two team names match
const teamsMatch = (name1, name2) => {
  if (!name1 || !name2) return false;
  const norm1 = normalizeTeamName(name1);
  const norm2 = normalizeTeamName(name2);
  
  // Direct match
  if (norm1 === norm2) return true;
  
  // Partial match (one contains the other)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Word-based match (key words match)
  const words1 = norm1.split(/\s+/).filter(w => w.length > 3);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 3);
  
  for (const word of words1) {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      return true;
    }
  }
  
  return false;
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

  // Extract odds from match data - FIXED: Match by team names, not by array index
  const getOdds = () => {
    if (!match.odds) return null;
    
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    
    // Try parsed format first (Match Winner object with Home/Away keys)
    const matchWinner = match.odds["Match Winner"] || match.odds["Home/Away"] || {};
    if (matchWinner["Home"] || matchWinner["Away"]) {
      return {
        home: matchWinner["Home"] || matchWinner["1"],
        draw: matchWinner["Draw"] || matchWinner["X"],
        away: matchWinner["Away"] || matchWinner["2"]
      };
    }
    
    // Try raw bookmaker format from The Odds API - MATCH BY TEAM NAMES
    const rawBookmakers = match.odds.raw_bookmakers || match.bookmakers || [];
    if (rawBookmakers.length > 0) {
      const firstBookmaker = rawBookmakers[0];
      const h2hMarket = firstBookmaker.markets?.find(m => m.key === 'h2h');
      
      if (h2hMarket && h2hMarket.outcomes) {
        const outcomes = h2hMarket.outcomes;
        
        // Initialize odds object
        const oddsResult = {
          home: null,
          draw: null,
          away: null
        };
        
        // Match each outcome by team name
        for (const outcome of outcomes) {
          const outcomeName = outcome.name;
          const price = outcome.price?.toFixed(2);
          
          if (outcomeName === "Draw") {
            oddsResult.draw = price;
          } else if (teamsMatch(outcomeName, homeTeam)) {
            // This outcome is for the home team
            oddsResult.home = price;
          } else if (teamsMatch(outcomeName, awayTeam)) {
            // This outcome is for the away team
            oddsResult.away = price;
          }
        }
        
        // Fallback: if we couldn't match by name, try to use match_data from odds
        if (!oddsResult.home && !oddsResult.away && match.odds.match_data) {
          const oddsHomeTeam = match.odds.match_data.home_team;
          const oddsAwayTeam = match.odds.match_data.away_team;
          
          for (const outcome of outcomes) {
            const outcomeName = outcome.name;
            const price = outcome.price?.toFixed(2);
            
            if (outcomeName === "Draw") {
              oddsResult.draw = price;
            } else if (outcomeName === oddsHomeTeam) {
              // Check if odds API home_team matches our home_team
              if (teamsMatch(oddsHomeTeam, homeTeam)) {
                oddsResult.home = price;
              } else {
                oddsResult.away = price;
              }
            } else if (outcomeName === oddsAwayTeam) {
              // Check if odds API away_team matches our away_team
              if (teamsMatch(oddsAwayTeam, awayTeam)) {
                oddsResult.away = price;
              } else {
                oddsResult.home = price;
              }
            }
          }
        }
        
        return oddsResult;
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

          {/* Clickable Odds Display */}
          {odds && (odds.home || odds.away) && (
            <div className="flex justify-center gap-2 mb-4">
              <OddsButton
                matchId={match.id}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
                selection="Home"
                odds={odds.home}
                market="1X2"
                league={match.league}
                sport={match.sport}
                variant="compact"
                className="flex-1"
              />
              {match.sport === "football" && odds.draw && (
                <OddsButton
                  matchId={match.id}
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  selection="Draw"
                  odds={odds.draw}
                  market="1X2"
                  league={match.league}
                  sport={match.sport}
                  variant="compact"
                  className="flex-1"
                />
              )}
              <OddsButton
                matchId={match.id}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
                selection="Away"
                odds={odds.away}
                market="1X2"
                league={match.league}
                sport={match.sport}
                variant="compact"
                className="flex-1"
              />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
