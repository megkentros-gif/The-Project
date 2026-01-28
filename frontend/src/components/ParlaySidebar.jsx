import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  X, 
  Trash2, 
  Layers, 
  ChevronRight, 
  Calculator,
  DollarSign,
  Percent,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useParlay } from "@/context/ParlayContext";

export default function ParlaySidebar() {
  const { 
    parlayItems, 
    removeFromParlay, 
    clearParlay, 
    calculateTotals,
    isOpen,
    closeSidebar 
  } = useParlay();
  
  const [stake, setStake] = useState(10);
  const totals = calculateTotals(stake);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeSidebar]);

  const getRiskLevel = () => {
    if (parlayItems.length <= 2 && totals.probability > 20) return "LOW";
    if (parlayItems.length <= 4 && totals.probability > 10) return "MEDIUM";
    return "HIGH";
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "LOW": return "text-green-500 bg-green-500/20 border-green-500/30";
      case "MEDIUM": return "text-yellow-500 bg-yellow-500/20 border-yellow-500/30";
      case "HIGH": return "text-red-500 bg-red-500/20 border-red-500/30";
      default: return "text-zinc-500 bg-zinc-500/20";
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-green-500" />
            <h2 className="font-heading text-lg font-bold uppercase text-white">
              Bet Slip
            </h2>
            <Badge className="bg-green-500 text-black text-xs">
              {parlayItems.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeSidebar}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          {parlayItems.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Empty Parlay</h3>
              <p className="text-zinc-500 text-sm mb-4">
                Click on odds buttons to add selections to your bet slip
              </p>
              <Button 
                variant="outline" 
                onClick={closeSidebar}
                className="border-zinc-700 text-white"
              >
                Browse Matches
              </Button>
            </div>
          ) : (
            <>
              {/* Bet Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {parlayItems.map((item, index) => (
                  <div 
                    key={item.match_id || index}
                    className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                          {item.league || item.market}
                        </p>
                        <p className="text-sm text-white font-medium truncate">
                          {item.match_name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromParlay(item.match_id)}
                        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 -mr-2 -mt-1 h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {item.selection_name}
                      </Badge>
                      <span className="font-mono text-lg font-bold text-white">
                        {item.price?.toFixed(2) || "1.00"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t border-zinc-800 p-4 bg-zinc-950 space-y-4">
                {/* Stake Input */}
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-2 block">
                    Stake Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      type="number"
                      min="1"
                      value={stake}
                      onChange={(e) => setStake(parseFloat(e.target.value) || 10)}
                      className="bg-zinc-800 border-zinc-700 text-white font-mono pl-9"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Calculator className="w-3 h-3" />
                      Total Odds
                    </span>
                    <span className="font-mono font-bold text-white">
                      {totals.totalOdds.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Win Probability
                    </span>
                    <span className="font-mono font-bold text-blue-400">
                      {totals.probability.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Risk Level
                    </span>
                    <Badge className={getRiskColor(getRiskLevel())}>
                      {getRiskLevel()}
                    </Badge>
                  </div>
                </div>

                {/* Potential Return */}
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Potential Return</span>
                    <span className="font-mono text-2xl font-bold text-green-500">
                      ${totals.potentialReturn.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link to="/parlay" onClick={closeSidebar}>
                    <Button 
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold uppercase border border-red-500/50 shadow-lg shadow-red-500/20"
                    >
                      Place Bet
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={clearParlay}
                    className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
