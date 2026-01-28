import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Trash2,
  Calculator,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Trophy,
  ChevronRight,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Betting options
const BET_TYPES = [
  { value: "home_win", label: "Home Win", defaultOdds: 1.85 },
  { value: "away_win", label: "Away Win", defaultOdds: 2.10 },
  { value: "draw", label: "Draw", defaultOdds: 3.40 },
  { value: "over_2.5", label: "Over 2.5 Goals", defaultOdds: 1.75 },
  { value: "under_2.5", label: "Under 2.5 Goals", defaultOdds: 2.05 },
  { value: "btts_yes", label: "Both Teams Score - Yes", defaultOdds: 1.80 },
  { value: "btts_no", label: "Both Teams Score - No", defaultOdds: 1.95 },
];

export default function ParlayBuilder() {
  const [matches, setMatches] = useState([]);
  const [parlayItems, setParlayItems] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [parlayResult, setParlayResult] = useState(null);
  const [stakeAmount, setStakeAmount] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedBet, setSelectedBet] = useState("");
  const [customOdds, setCustomOdds] = useState("");

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (parlayItems.length > 0) {
      calculateParlay();
    } else {
      setParlayResult(null);
    }
  }, [parlayItems, stakeAmount]);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches`);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  };

  const calculateParlay = async () => {
    if (parlayItems.length === 0) return;
    
    setCalculating(true);
    try {
      const response = await axios.post(`${API}/parlay/calculate`, {
        items: parlayItems
      });
      setParlayResult({
        ...response.data,
        potential_return: response.data.combined_odds * stakeAmount
      });
    } catch (error) {
      console.error("Error calculating parlay:", error);
    } finally {
      setCalculating(false);
    }
  };

  const addToParlay = () => {
    if (!selectedMatch || !selectedBet) {
      toast.error("Please select a match and bet type");
      return;
    }

    const betType = BET_TYPES.find(b => b.value === selectedBet);
    const odds = customOdds ? parseFloat(customOdds) : betType.defaultOdds;

    const newItem = {
      match_id: selectedMatch.id,
      home_team: selectedMatch.home_team,
      away_team: selectedMatch.away_team,
      selection_name: betType.label,
      price: odds,
      match_name: `${selectedMatch.home_team} vs ${selectedMatch.away_team}`
    };

    // Check if match already in parlay
    if (parlayItems.some(item => item.match_id === selectedMatch.id)) {
      toast.error("This match is already in your parlay");
      return;
    }

    setParlayItems([...parlayItems, newItem]);
    setDialogOpen(false);
    setSelectedMatch(null);
    setSelectedBet("");
    setCustomOdds("");
    toast.success("Added to parlay!");
  };

  const removeFromParlay = (index) => {
    const newItems = parlayItems.filter((_, i) => i !== index);
    setParlayItems(newItems);
    toast.info("Removed from parlay");
  };

  const clearParlay = () => {
    setParlayItems([]);
    setParlayResult(null);
    toast.info("Parlay cleared");
  };

  const saveParlay = async () => {
    if (parlayItems.length === 0) {
      toast.error("Add matches to your parlay first");
      return;
    }

    try {
      await axios.post(`${API}/parlays`, { items: parlayItems });
      toast.success("Parlay saved successfully!");
    } catch (error) {
      console.error("Error saving parlay:", error);
      toast.error("Failed to save parlay");
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "text-green-500 bg-green-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/20";
      case "high":
        return "text-red-500 bg-red-500/20";
      default:
        return "text-zinc-500 bg-zinc-500/20";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="parlay-builder">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
          PARLAY BUILDER
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Build your accumulator bet and see live probability calculations as you add selections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Selection Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold uppercase h-14"
                data-testid="add-selection-btn"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Selection
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl uppercase text-white">
                  Add Selection
                </DialogTitle>
                <DialogDescription className="text-zinc-500">
                  Select a match and bet type to add to your parlay
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Match Selection */}
                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Select Match ({matches.length} available)</label>
                  <Select 
                    value={selectedMatch?.id || ""} 
                    onValueChange={(id) => setSelectedMatch(matches.find(m => m.id === id))}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="match-select">
                      <SelectValue placeholder="Choose a match" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 max-h-64 z-50">
                      {matches.length === 0 ? (
                        <SelectItem value="none" disabled>No matches available</SelectItem>
                      ) : (
                        matches.map((match) => (
                          <SelectItem key={match.id} value={match.id}>
                            {match.home_team} vs {match.away_team} ({match.league})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bet Type Selection */}
                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Bet Type</label>
                  <Select value={selectedBet} onValueChange={setSelectedBet}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="bet-type-select">
                      <SelectValue placeholder="Choose bet type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 z-50">
                      {BET_TYPES.map((bet) => (
                        <SelectItem key={bet.value} value={bet.value}>
                          {bet.label} @ {bet.defaultOdds}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Odds */}
                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Custom Odds (optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter custom odds"
                    value={customOdds}
                    onChange={(e) => setCustomOdds(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="custom-odds-input"
                  />
                </div>

                <Button 
                  onClick={addToParlay}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
                  disabled={!selectedMatch || !selectedBet}
                  data-testid="confirm-add-btn"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Add to Parlay
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Parlay Items */}
          {parlayItems.length > 0 ? (
            <div className="space-y-4">
              {parlayItems.map((item, index) => (
                <Card 
                  key={index} 
                  className="bg-zinc-900 border-zinc-800 animate-fade-in"
                  data-testid={`parlay-item-${index}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">{item.match_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {item.selection}
                          </Badge>
                          <span className="font-mono text-lg text-white">@ {item.odds.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromParlay(index)}
                        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                        data-testid={`remove-item-${index}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Clear All */}
              <Button
                variant="outline"
                onClick={clearParlay}
                className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:border-red-500/50"
                data-testid="clear-parlay-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-12 text-center">
                <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Selections Yet</h3>
                <p className="text-zinc-500 mb-4">
                  Click "Add Selection" to start building your parlay
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Parlay Summary */}
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calculator className="w-5 h-5 text-green-500" />
                Parlay Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stake Amount */}
              <div>
                <label className="text-sm text-zinc-500 mb-2 block">Stake Amount ($)</label>
                <Input
                  type="number"
                  min="1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 10)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-lg"
                  data-testid="stake-input"
                />
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400">Selections</span>
                  <span className="font-mono font-bold text-white">{parlayItems.length}</span>
                </div>

                {parlayResult ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-zinc-400">Combined Odds</span>
                      <span className="font-mono font-bold text-white">
                        {parlayResult.combined_odds.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-zinc-400">Win Probability</span>
                      <span className="font-mono font-bold text-blue-400">
                        {parlayResult.probability.toFixed(1)}%
                      </span>
                    </div>

                    {/* Probability Circle */}
                    <div className="flex justify-center py-4">
                      <div 
                        className="probability-circle"
                        style={{ '--probability': `${parlayResult.probability * 3.6}deg` }}
                      >
                        <div className="probability-inner">
                          <span className="font-mono text-2xl font-bold text-white">
                            {parlayResult.probability.toFixed(1)}%
                          </span>
                          <span className="text-xs text-zinc-500">Win Chance</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Potential Return</span>
                        <span className="font-mono text-2xl font-bold text-green-500">
                          ${parlayResult.potential_return.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="flex items-center justify-between p-3 rounded-lg">
                      <span className="text-zinc-400">Risk Level</span>
                      <Badge className={getRiskColor(parlayResult.risk_assessment)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {parlayResult.risk_assessment}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-zinc-600">
                    <Target className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Add selections to see calculations</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              {parlayItems.length > 0 && (
                <Button
                  onClick={saveParlay}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
                  data-testid="save-parlay-btn"
                >
                  Save Parlay
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <h4 className="font-medium text-white mb-2">Pro Tips</h4>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Keep parlays to 3-4 selections for better odds</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Mix favorites with slight underdogs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Check AI analysis for each match before adding</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
