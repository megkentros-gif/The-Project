import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParlay } from "@/context/ParlayContext";
import { toast } from "sonner";

export default function OddsButton({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  selection, 
  odds, 
  market = "1X2",
  league = "",
  sport = "football",
  variant = "default", // default, compact
  className = ""
}) {
  const { addToParlay, isInParlay, getSelectionForMatch, openSidebar } = useParlay();
  
  const inParlay = isInParlay(matchId);
  const currentSelection = getSelectionForMatch(matchId);
  const isThisSelection = currentSelection?.selection_name === selection;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!odds || parseFloat(odds) <= 0) {
      toast.error("Odds not available");
      return;
    }

    const result = addToParlay({
      match_id: matchId,
      home_team: homeTeam,
      away_team: awayTeam,
      selection_name: selection,
      price: parseFloat(odds),
      market: market,
      league: league,
      sport: sport,
      match_name: `${homeTeam} vs ${awayTeam}`
    });

    if (result.success) {
      toast.success(inParlay ? `Changed to ${selection}` : `Added ${selection}`);
      openSidebar();
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={`relative group p-2 rounded-lg transition-all duration-200 ${
          isThisSelection 
            ? "bg-green-500/20 border-2 border-green-500 ring-2 ring-green-500/30" 
            : inParlay
              ? "bg-yellow-500/10 border border-yellow-500/30 hover:border-green-500/50"
              : "bg-zinc-800/50 border border-transparent hover:border-green-500/50 hover:bg-zinc-800"
        } ${className}`}
      >
        <span className="text-xs text-zinc-500 block mb-0.5">{selection}</span>
        <span className={`font-mono text-base font-bold ${
          isThisSelection ? "text-green-400" : "text-white"
        }`}>
          {parseFloat(odds).toFixed(2)}
        </span>
        {isThisSelection && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-black" />
          </div>
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant={isThisSelection ? "default" : "outline"}
      className={`relative group transition-all duration-200 ${
        isThisSelection 
          ? "bg-green-500 hover:bg-green-600 text-black border-green-500" 
          : inParlay
            ? "border-yellow-500/50 text-white hover:border-green-500/50"
            : "border-zinc-700 text-white hover:border-green-500/50 hover:bg-zinc-800"
      } ${className}`}
    >
      <div className="flex flex-col items-center">
        <span className="text-xs opacity-70">{selection}</span>
        <span className="font-mono font-bold">{parseFloat(odds).toFixed(2)}</span>
      </div>
      {!isThisSelection && (
        <Plus className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      {isThisSelection && (
        <Check className="w-4 h-4 ml-2" />
      )}
    </Button>
  );
}
