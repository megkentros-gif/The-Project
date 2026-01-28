import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Trophy, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Standings() {
  const { leagueCode } = useParams();
  const [standings, setStandings] = useState([]);
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStandings();
  }, [leagueCode]);

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/standings/${leagueCode}`);
      setStandings(response.data.standings || []);
      setLeagueName(response.data.league || leagueCode);
    } catch (err) {
      console.error("Error fetching standings:", err);
      setError("Unable to load standings. Please try again later.");
    } finally {
      setLoading(false);
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

  const getPositionClass = (position) => {
    if (position <= 4) return "text-green-500"; // Champions League
    if (position === 5) return "text-blue-500"; // Europa League
    if (position >= 18) return "text-red-500"; // Relegation
    return "text-white";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="standings-page">
      {/* Back Button */}
      <Link to="/leagues" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Leagues</span>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            {leagueName}
          </h1>
          <p className="text-zinc-500">Current Season Standings</p>
        </div>
      </div>

      {/* Standings Table */}
      {loading ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 bg-zinc-800" />
                  <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800" />
                  <Skeleton className="h-6 flex-1 bg-zinc-800" />
                  <Skeleton className="h-6 w-12 bg-zinc-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Standings</h3>
            <p className="text-zinc-500 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchStandings}
              className="border-zinc-700 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : standings.length > 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 w-12">#</TableHead>
                  <TableHead className="text-zinc-500">Team</TableHead>
                  <TableHead className="text-zinc-500 text-center w-12">P</TableHead>
                  <TableHead className="text-zinc-500 text-center w-12">W</TableHead>
                  <TableHead className="text-zinc-500 text-center w-12">D</TableHead>
                  <TableHead className="text-zinc-500 text-center w-12">L</TableHead>
                  <TableHead className="text-zinc-500 text-center w-16">GF</TableHead>
                  <TableHead className="text-zinc-500 text-center w-16">GA</TableHead>
                  <TableHead className="text-zinc-500 text-center w-16">GD</TableHead>
                  <TableHead className="text-zinc-500 text-center w-16">Pts</TableHead>
                  <TableHead className="text-zinc-500 text-center">Form</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => (
                  <TableRow 
                    key={index} 
                    className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                    data-testid={`standing-row-${index}`}
                  >
                    <TableCell className={`font-mono font-bold ${getPositionClass(team.position)}`}>
                      {team.position}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {team.team_logo ? (
                          <img 
                            src={team.team_logo} 
                            alt={team.team}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                        <span className="font-medium text-white">{team.team}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono">{team.played}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono">{team.won}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono">{team.drawn}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono">{team.lost}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono">{team.goals_for}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono">{team.goals_against}</TableCell>
                    <TableCell className={`text-center font-mono font-bold ${
                      team.goal_difference > 0 ? 'text-green-500' : 
                      team.goal_difference < 0 ? 'text-red-500' : 'text-zinc-400'
                    }`}>
                      {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-white">{team.points}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {(team.form || []).slice(0, 5).map((result, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${getFormBadgeClass(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Standings Available</h3>
            <p className="text-zinc-500">
              Standings data is not available for this league yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {standings.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-zinc-500">Champions League</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-zinc-500">Europa League</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-zinc-500">Relegation</span>
          </div>
        </div>
      )}
    </div>
  );
}
