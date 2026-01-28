import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Trophy, Dribbble } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "FINISHED":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const SportIcon = match.sport === "basketball" ? Dribbble : Trophy;

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
          <Badge className={getStatusColor(match.status)}>
            {match.status === "SCHEDULED" || match.status === "TIMED" ? "Upcoming" : match.status}
          </Badge>
        </div>

        {/* Teams */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {match.home_logo ? (
                <img 
                  src={match.home_logo} 
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
              {match.away_logo ? (
                <img 
                  src={match.away_logo} 
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
