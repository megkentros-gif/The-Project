import { Link } from "react-router-dom";
import { ChevronRight, Trophy, Dribbble, Flame, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default function FeaturedPickCard({ match, rank }) {
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

  const SportIcon = match.sport === "basketball" ? Dribbble : Trophy;
  const homeLogo = getTeamLogo(match.home_team, match.home_logo);
  const awayLogo = getTeamLogo(match.away_team, match.away_logo);
  
  const quickAnalysis = match.quick_analysis || {};
  const probability = quickAnalysis.probability || 0;
  const bestPick = quickAnalysis.best_pick || "TBD";
  const pickType = quickAnalysis.pick_type;

  // Get probability color intensity based on value
  const getProbabilityBgClass = () => {
    if (probability >= 75) return "bg-red-500";
    if (probability >= 65) return "bg-red-600";
    return "bg-red-700";
  };

  return (
    <Card 
      className="featured-pick-card bg-gradient-to-br from-zinc-900 via-zinc-900 to-red-950/30 border-2 border-red-500/60 overflow-hidden group hover:border-red-400 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
      data-testid={`featured-pick-${match.id}`}
    >
      <CardContent className="p-0">
        {/* Header with Rank and League */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/20">
          <div className="flex items-center gap-2">
            {/* Rank Badge */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
              <span className="text-xs font-bold text-white">#{rank}</span>
            </div>
            <div className="flex items-center gap-1">
              <SportIcon className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-300 uppercase tracking-wide font-medium truncate max-w-[80px]">
                {match.league}
              </span>
            </div>
          </div>
          
          {/* HOT Badge */}
          <Badge className="bg-red-500/40 text-red-300 border-red-500/50 text-[10px] px-1.5 py-0.5">
            <Flame className="w-2.5 h-2.5 mr-0.5 animate-pulse" /> HOT
          </Badge>
        </div>

        {/* Teams */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {homeLogo ? (
                <img 
                  src={homeLogo} 
                  alt={match.home_team}
                  className="w-10 h-10 object-contain mb-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-1">
                  <Trophy className="w-5 h-5 text-zinc-600" />
                </div>
              )}
              <span className={`text-xs font-medium line-clamp-1 ${pickType === 'home' ? 'text-red-400' : 'text-white'}`}>
                {match.home_team}
              </span>
            </div>

            {/* VS */}
            <div className="px-2">
              <div className="w-8 h-8 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center">
                <span className="text-[10px] text-red-400 font-bold">VS</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {awayLogo ? (
                <img 
                  src={awayLogo} 
                  alt={match.away_team}
                  className="w-10 h-10 object-contain mb-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-1">
                  <Trophy className="w-5 h-5 text-zinc-600" />
                </div>
              )}
              <span className={`text-xs font-medium line-clamp-1 ${pickType === 'away' ? 'text-red-400' : 'text-white'}`}>
                {match.away_team}
              </span>
            </div>
          </div>

          {/* AI Probability Circle and Best Pick */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Probability Circle */}
            <div className={`relative w-14 h-14 rounded-full ${getProbabilityBgClass()} flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-red-400/50`}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
              <div className="text-center relative z-10">
                <span className="text-lg font-bold text-white leading-none">{Math.round(probability)}%</span>
              </div>
            </div>
            
            {/* Best Pick */}
            <div className="text-left flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <Target className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400 uppercase tracking-wide">AI Pick</span>
              </div>
              <span className="text-sm font-bold text-white">{bestPick}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400">High Confidence</span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="text-center text-[10px] text-zinc-500 mb-3">
            {formatDate(match.match_date)}
          </div>

          {/* View Analysis Button */}
          <Link to={`/match/${match.id}`}>
            <Button 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs py-2 border border-red-500/50 shadow-lg shadow-red-500/20"
              data-testid={`view-featured-${match.id}`}
            >
              View Full Analysis
              <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
