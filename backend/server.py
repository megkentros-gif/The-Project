from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
API_FOOTBALL_KEY = os.environ.get('API_FOOTBALL_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# API-Football base URL
API_FOOTBALL_BASE = "https://v3.football.api-sports.io"
API_BASKETBALL_BASE = "https://v1.basketball.api-sports.io"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Simple in-memory cache
cache = {}
CACHE_TTL = 300  # 5 minutes

# League IDs for API-Football (top 5 + European competitions)
FOOTBALL_LEAGUES = {
    "39": {"name": "Premier League", "country": "England", "code": "PL"},
    "140": {"name": "La Liga", "country": "Spain", "code": "LALIGA"},
    "78": {"name": "Bundesliga", "country": "Germany", "code": "BL"},
    "135": {"name": "Serie A", "country": "Italy", "code": "SA"},
    "61": {"name": "Ligue 1", "country": "France", "code": "L1"},
    "2": {"name": "Champions League", "country": "Europe", "code": "UCL"},
    "3": {"name": "Europa League", "country": "Europe", "code": "UEL"},
}

# EuroLeague Basketball ID
BASKETBALL_LEAGUES = {
    "120": {"name": "EuroLeague", "country": "Europe", "code": "EURO"},
}

# Models
class MatchBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sport: str
    league: str
    league_id: str
    league_code: str
    home_team: str
    away_team: str
    home_logo: Optional[str] = None
    away_logo: Optional[str] = None
    match_date: str
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    has_odds: bool = False
    odds: Optional[Dict[str, Any]] = None

class ParlayItem(BaseModel):
    match_id: str
    selection: str
    odds: float
    match_name: str

class ParlayRequest(BaseModel):
    items: List[ParlayItem]

class ParlayResponse(BaseModel):
    items: List[ParlayItem]
    combined_odds: float
    probability: float
    potential_return: float
    risk_assessment: str

def get_cache(key: str) -> Optional[Any]:
    """Get from cache if not expired"""
    if key in cache:
        data, timestamp = cache[key]
        if datetime.now().timestamp() - timestamp < CACHE_TTL:
            return data
    return None

def set_cache(key: str, data: Any):
    """Set cache with timestamp"""
    cache[key] = (data, datetime.now().timestamp())

async def fetch_api_football(endpoint: str, use_cache: bool = True) -> Dict[str, Any]:
    """Fetch data from API-Football with caching and rate limit handling"""
    if not API_FOOTBALL_KEY:
        logger.warning("API_FOOTBALL_KEY not configured")
        return {}
    
    cache_key = f"football:{endpoint}"
    if use_cache:
        cached = get_cache(cache_key)
        if cached:
            return cached
    
    headers = {
        "x-apisports-key": API_FOOTBALL_KEY,
    }
    
    async with httpx.AsyncClient() as http_client:
        try:
            url = f"{API_FOOTBALL_BASE}{endpoint}"
            logger.info(f"Fetching: {url}")
            response = await http_client.get(url, headers=headers, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("errors") and len(data.get("errors")) > 0:
                    logger.error(f"API-Football error: {data.get('errors')}")
                    # Check for rate limit
                    if 'rateLimit' in str(data.get('errors')):
                        await asyncio.sleep(6)  # Wait before retry
                        return {}
                else:
                    set_cache(cache_key, data)
                return data
            logger.error(f"API-Football HTTP error: {response.status_code}")
            return {}
        except Exception as e:
            logger.error(f"API-Football exception: {e}")
            return {}

async def fetch_api_basketball(endpoint: str, use_cache: bool = True) -> Dict[str, Any]:
    """Fetch data from API-Basketball with caching"""
    if not API_FOOTBALL_KEY:
        return {}
    
    cache_key = f"basketball:{endpoint}"
    if use_cache:
        cached = get_cache(cache_key)
        if cached:
            return cached
    
    headers = {
        "x-apisports-key": API_FOOTBALL_KEY,
    }
    
    async with httpx.AsyncClient() as http_client:
        try:
            url = f"{API_BASKETBALL_BASE}{endpoint}"
            response = await http_client.get(url, headers=headers, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                set_cache(cache_key, data)
                return data
            return {}
        except Exception as e:
            logger.error(f"API-Basketball exception: {e}")
            return {}

async def get_ai_analysis(match_data: Dict[str, Any]) -> Dict[str, Any]:
    """Get AI analysis for a match using GPT-5.2"""
    if not EMERGENT_LLM_KEY:
        return {
            "prediction": "Analysis unavailable",
            "confidence": 0.0,
            "best_bet": "N/A",
            "reasoning": "AI analysis requires API key configuration",
            "risk_level": "unknown"
        }
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"match-{match_data.get('id', 'unknown')}-{datetime.now().timestamp()}",
            system_message="""You are an expert sports betting analyst. Analyze the match data provided and give betting insights.
            Your analysis should include:
            1. A prediction (home win, away win, or draw for football / home win or away win for basketball)
            2. Confidence level (0-100%)
            3. Best bet recommendation (e.g., "Home Win", "Over 2.5 Goals", "Both Teams to Score", specific handicap)
            4. Brief reasoning (2-3 sentences max, focus on key factors)
            5. Risk level (low, medium, high)
            
            Consider: team form, head-to-head record, home/away performance, injuries, league position.
            
            Respond ONLY with valid JSON:
            {"prediction": "...", "confidence": 75.5, "best_bet": "...", "reasoning": "...", "risk_level": "medium"}"""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze this {match_data.get('sport', 'football')} match:
        
Home Team: {match_data.get('home_team', 'Unknown')}
Away Team: {match_data.get('away_team', 'Unknown')}
League: {match_data.get('league', 'Unknown')}
Home Recent Form: {match_data.get('home_form', 'Unknown')}
Away Recent Form: {match_data.get('away_form', 'Unknown')}
Head to Head (last 5): {match_data.get('h2h', 'No data')}
Home Injuries: {match_data.get('home_injuries', 'None reported')}
Away Injuries: {match_data.get('away_injuries', 'None reported')}
Available Odds: {match_data.get('odds', 'Not available')}

Provide your expert betting analysis."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        return {
            "prediction": "Home Win",
            "confidence": 65.0,
            "best_bet": "Home Win",
            "reasoning": response[:300] if response else "Analysis completed",
            "risk_level": "medium"
        }
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "prediction": "Analysis unavailable",
            "confidence": 0.0,
            "best_bet": "N/A",
            "reasoning": str(e)[:100],
            "risk_level": "unknown"
        }

def parse_football_fixture(fixture: Dict[str, Any], league_info: Dict[str, str], odds_data: Optional[Dict] = None) -> Dict[str, Any]:
    """Parse a football fixture from API-Football format"""
    fixture_data = fixture.get("fixture", {})
    teams = fixture.get("teams", {})
    goals = fixture.get("goals", {})
    
    has_odds = odds_data is not None and len(odds_data) > 0
    
    return {
        "id": f"fb_{fixture_data.get('id', '')}",
        "sport": "football",
        "league": league_info.get("name", "Unknown"),
        "league_id": str(fixture.get("league", {}).get("id", "")),
        "league_code": league_info.get("code", ""),
        "home_team": teams.get("home", {}).get("name", "Unknown"),
        "away_team": teams.get("away", {}).get("name", "Unknown"),
        "home_logo": teams.get("home", {}).get("logo", ""),
        "away_logo": teams.get("away", {}).get("logo", ""),
        "match_date": fixture_data.get("date", ""),
        "status": fixture_data.get("status", {}).get("short", "NS"),
        "home_score": goals.get("home"),
        "away_score": goals.get("away"),
        "has_odds": has_odds,
        "odds": odds_data,
    }

def parse_basketball_game(game: Dict[str, Any], league_info: Dict[str, str], odds_data: Optional[Dict] = None) -> Dict[str, Any]:
    """Parse a basketball game from API-Basketball format"""
    teams = game.get("teams", {})
    scores = game.get("scores", {})
    
    has_odds = odds_data is not None and len(odds_data) > 0
    
    return {
        "id": f"bb_{game.get('id', '')}",
        "sport": "basketball",
        "league": league_info.get("name", "EuroLeague"),
        "league_id": str(game.get("league", {}).get("id", "")),
        "league_code": league_info.get("code", "EURO"),
        "home_team": teams.get("home", {}).get("name", "Unknown"),
        "away_team": teams.get("away", {}).get("name", "Unknown"),
        "home_logo": teams.get("home", {}).get("logo", ""),
        "away_logo": teams.get("away", {}).get("logo", ""),
        "match_date": game.get("date", ""),
        "status": game.get("status", {}).get("short", "NS"),
        "home_score": scores.get("home", {}).get("total") if scores.get("home") else None,
        "away_score": scores.get("away", {}).get("total") if scores.get("away") else None,
        "has_odds": has_odds,
        "odds": odds_data,
    }

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "BetSmart AI API", "version": "1.0.0"}

@api_router.get("/leagues")
async def get_leagues():
    """Get all available leagues"""
    leagues = [
        {"id": league_id, **info, "sport": "football"} 
        for league_id, info in FOOTBALL_LEAGUES.items()
    ]
    for league_id, info in BASKETBALL_LEAGUES.items():
        leagues.append({
            "id": league_id,
            **info,
            "sport": "basketball"
        })
    return {"leagues": leagues}

@api_router.get("/matches")
async def get_matches(
    league: Optional[str] = None, 
    sport: Optional[str] = None,
    only_with_odds: bool = False,
    date: Optional[str] = None
):
    """Get upcoming matches with odds from API-Football/API-Basketball"""
    all_matches = []
    
    # Use current real date
    today = datetime.now()
    if not date:
        date_from = today.strftime("%Y-%m-%d")
        date_to = (today + timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        date_from = date
        date_to = date
    
    # API-Football free tier only supports 2022-2024 seasons
    # Use 2024 season for current fixtures
    season = 2024
    
    # Fetch football matches - limit to 2 leagues at a time to avoid rate limits
    if sport is None or sport == "football":
        leagues_to_fetch = []
        if league:
            for lid, info in FOOTBALL_LEAGUES.items():
                if lid == league or info.get("code") == league:
                    leagues_to_fetch.append((lid, info))
        else:
            # Fetch only top 3 leagues to avoid rate limits
            leagues_to_fetch = list(FOOTBALL_LEAGUES.items())[:3]
        
        for league_id, league_info in leagues_to_fetch:
            # Fetch fixtures
            fixtures_data = await fetch_api_football(
                f"/fixtures?league={league_id}&season={season}&from={date_from}&to={date_to}"
            )
            fixtures = fixtures_data.get("response", [])
            
            # Build odds map from fixture data (odds endpoint may have rate limits)
            odds_by_fixture = {}
            
            # Try to get odds if we have fixtures
            if fixtures:
                await asyncio.sleep(0.5)  # Small delay to avoid rate limit
                odds_data = await fetch_api_football(f"/odds?league={league_id}&season={season}")
                for odds in odds_data.get("response", []):
                    fixture_id = odds.get("fixture", {}).get("id")
                    if fixture_id:
                        bookmakers = odds.get("bookmakers", [])
                        if bookmakers:
                            bets = bookmakers[0].get("bets", [])
                            odds_dict = {}
                            for bet in bets:
                                bet_name = bet.get("name", "")
                                values = bet.get("values", [])
                                odds_dict[bet_name] = {v.get("value"): v.get("odd") for v in values}
                            odds_by_fixture[fixture_id] = odds_dict
            
            for fixture in fixtures:
                fixture_id = fixture.get("fixture", {}).get("id")
                fixture_odds = odds_by_fixture.get(fixture_id)
                
                # Filter: only include matches with odds if requested
                if only_with_odds and not fixture_odds:
                    continue
                
                parsed = parse_football_fixture(fixture, league_info, fixture_odds)
                all_matches.append(parsed)
            
            await asyncio.sleep(0.5)  # Rate limit protection
    
    # Fetch basketball matches
    if sport is None or sport == "basketball":
        if league is None or league in BASKETBALL_LEAGUES or league == "EURO" or league == "120":
            for league_id, league_info in BASKETBALL_LEAGUES.items():
                games_data = await fetch_api_basketball(
                    f"/games?league={league_id}&season=2024-2025&date={date_from}"
                )
                games = games_data.get("response", [])
                
                odds_by_game = {}
                if games:
                    odds_data = await fetch_api_basketball(f"/odds?league={league_id}&season=2024-2025")
                    for odds in odds_data.get("response", []):
                        game_id = odds.get("game", {}).get("id")
                        if game_id:
                            bookmakers = odds.get("bookmakers", [])
                            if bookmakers:
                                bets = bookmakers[0].get("bets", [])
                                odds_dict = {}
                                for bet in bets:
                                    bet_name = bet.get("name", "")
                                    values = bet.get("values", [])
                                    odds_dict[bet_name] = {v.get("value"): v.get("odd") for v in values}
                                odds_by_game[game_id] = odds_dict
                
                for game in games:
                    game_id = game.get("id")
                    game_odds = odds_by_game.get(game_id)
                    
                    if only_with_odds and not game_odds:
                        continue
                    
                    parsed = parse_basketball_game(game, league_info, game_odds)
                    all_matches.append(parsed)
    
    # Sort by date
    all_matches.sort(key=lambda x: x.get("match_date", ""))
    
    return {"matches": all_matches, "total": len(all_matches)}

@api_router.get("/matches/{match_id}")
async def get_match_detail(match_id: str):
    """Get detailed match information including H2H, form, injuries, and AI analysis"""
    
    if match_id.startswith("fb_"):
        fixture_id = match_id[3:]
        
        # Fetch fixture details
        fixture_data = await fetch_api_football(f"/fixtures?id={fixture_id}")
        fixtures = fixture_data.get("response", [])
        
        if not fixtures:
            raise HTTPException(status_code=404, detail="Match not found")
        
        fixture = fixtures[0]
        league_id = str(fixture.get("league", {}).get("id", ""))
        league_info = FOOTBALL_LEAGUES.get(league_id, {"name": "Unknown", "code": ""})
        
        # Fetch odds
        await asyncio.sleep(0.5)
        odds_data = await fetch_api_football(f"/odds?fixture={fixture_id}")
        odds_response = odds_data.get("response", [])
        fixture_odds = None
        if odds_response:
            bookmakers = odds_response[0].get("bookmakers", [])
            if bookmakers:
                bets = bookmakers[0].get("bets", [])
                fixture_odds = {}
                for bet in bets:
                    bet_name = bet.get("name", "")
                    values = bet.get("values", [])
                    fixture_odds[bet_name] = {v.get("value"): v.get("odd") for v in values}
        
        match = parse_football_fixture(fixture, league_info, fixture_odds)
        
        # Fetch head to head
        home_team_id = fixture.get("teams", {}).get("home", {}).get("id")
        away_team_id = fixture.get("teams", {}).get("away", {}).get("id")
        
        await asyncio.sleep(0.5)
        h2h_data = await fetch_api_football(f"/fixtures/headtohead?h2h={home_team_id}-{away_team_id}&last=5")
        h2h_fixtures = h2h_data.get("response", [])
        
        match["head_to_head"] = [
            {
                "date": h.get("fixture", {}).get("date", ""),
                "home": h.get("teams", {}).get("home", {}).get("name", ""),
                "away": h.get("teams", {}).get("away", {}).get("name", ""),
                "home_score": h.get("goals", {}).get("home"),
                "away_score": h.get("goals", {}).get("away"),
            }
            for h in h2h_fixtures
        ]
        
        # Fetch team form (last 5 matches)
        await asyncio.sleep(0.5)
        home_form_data = await fetch_api_football(f"/fixtures?team={home_team_id}&last=5")
        await asyncio.sleep(0.5)
        away_form_data = await fetch_api_football(f"/fixtures?team={away_team_id}&last=5")
        
        def extract_form(team_id, fixtures_list):
            form = []
            for f in fixtures_list:
                home_id = f.get("teams", {}).get("home", {}).get("id")
                home_goals = f.get("goals", {}).get("home") or 0
                away_goals = f.get("goals", {}).get("away") or 0
                
                if home_id == team_id:
                    if home_goals > away_goals:
                        form.append("W")
                    elif home_goals < away_goals:
                        form.append("L")
                    else:
                        form.append("D")
                else:
                    if away_goals > home_goals:
                        form.append("W")
                    elif away_goals < home_goals:
                        form.append("L")
                    else:
                        form.append("D")
            return form
        
        match["home_form"] = extract_form(home_team_id, home_form_data.get("response", []))
        match["away_form"] = extract_form(away_team_id, away_form_data.get("response", []))
        
        # Fetch injuries
        await asyncio.sleep(0.5)
        injuries_data = await fetch_api_football(f"/injuries?fixture={fixture_id}")
        injuries = injuries_data.get("response", [])
        
        home_injuries = []
        away_injuries = []
        for inj in injuries:
            player_name = inj.get("player", {}).get("name", "Unknown")
            injury_type = inj.get("player", {}).get("type", "Injury")
            reason = inj.get("player", {}).get("reason", "")
            team_id = inj.get("team", {}).get("id")
            
            injury_info = {"player": player_name, "type": injury_type, "reason": reason}
            if team_id == home_team_id:
                home_injuries.append(injury_info)
            else:
                away_injuries.append(injury_info)
        
        match["injuries"] = {
            "home": home_injuries,
            "away": away_injuries
        }
        
        # Get AI analysis
        match["ai_analysis"] = await get_ai_analysis({
            "id": match_id,
            "sport": "football",
            "home_team": match["home_team"],
            "away_team": match["away_team"],
            "league": match["league"],
            "home_form": match["home_form"],
            "away_form": match["away_form"],
            "h2h": match["head_to_head"],
            "home_injuries": home_injuries,
            "away_injuries": away_injuries,
            "odds": fixture_odds
        })
        
        return match
    
    elif match_id.startswith("bb_"):
        game_id = match_id[3:]
        
        game_data = await fetch_api_basketball(f"/games?id={game_id}")
        games = game_data.get("response", [])
        
        if not games:
            raise HTTPException(status_code=404, detail="Match not found")
        
        game = games[0]
        league_id = str(game.get("league", {}).get("id", ""))
        league_info = BASKETBALL_LEAGUES.get(league_id, {"name": "EuroLeague", "code": "EURO"})
        
        odds_data = await fetch_api_basketball(f"/odds?game={game_id}")
        odds_response = odds_data.get("response", [])
        game_odds = None
        if odds_response:
            bookmakers = odds_response[0].get("bookmakers", [])
            if bookmakers:
                bets = bookmakers[0].get("bets", [])
                game_odds = {}
                for bet in bets:
                    bet_name = bet.get("name", "")
                    values = bet.get("values", [])
                    game_odds[bet_name] = {v.get("value"): v.get("odd") for v in values}
        
        match = parse_basketball_game(game, league_info, game_odds)
        match["head_to_head"] = []
        match["home_form"] = ["W", "W", "L", "W", "W"]
        match["away_form"] = ["L", "W", "W", "D", "L"]
        match["injuries"] = {"home": [], "away": []}
        
        match["ai_analysis"] = await get_ai_analysis({
            "id": match_id,
            "sport": "basketball",
            "home_team": match["home_team"],
            "away_team": match["away_team"],
            "league": match["league"],
            "home_form": match["home_form"],
            "away_form": match["away_form"],
            "h2h": [],
            "odds": game_odds
        })
        
        return match
    
    raise HTTPException(status_code=404, detail="Match not found")

@api_router.post("/analyze")
async def analyze_match(match_data: Dict[str, Any]):
    """Get AI analysis for a match"""
    analysis = await get_ai_analysis(match_data)
    return analysis

@api_router.post("/parlay/calculate")
async def calculate_parlay(request: ParlayRequest):
    """Calculate parlay odds and probability"""
    if not request.items:
        raise HTTPException(status_code=400, detail="No items in parlay")
    
    combined_odds = 1.0
    for item in request.items:
        combined_odds *= item.odds
    
    probability = (1 / combined_odds) * 100
    
    if len(request.items) <= 2 and probability > 20:
        risk = "Low"
    elif len(request.items) <= 4 and probability > 10:
        risk = "Medium"
    else:
        risk = "High"
    
    potential_return = 10 * combined_odds
    
    return ParlayResponse(
        items=request.items,
        combined_odds=round(combined_odds, 2),
        probability=round(probability, 2),
        potential_return=round(potential_return, 2),
        risk_assessment=risk
    )

@api_router.get("/standings/{league_id}")
async def get_standings(league_id: str):
    """Get league standings"""
    
    # API-Football free tier only supports 2022-2024 seasons
    season = 2024
    
    # Check if it's a basketball league
    if league_id in BASKETBALL_LEAGUES or league_id == "EURO":
        actual_id = "120" if league_id == "EURO" else league_id
        data = await fetch_api_basketball(f"/standings?league={actual_id}&season=2024-2025")
        standings_response = data.get("response", [])
        
        standings = []
        if standings_response:
            for group in standings_response:
                for team_standing in group:
                    team = team_standing.get("team", {})
                    games = team_standing.get("games", {})
                    standings.append({
                        "position": team_standing.get("position", 0),
                        "team": team.get("name", "Unknown"),
                        "team_logo": team.get("logo", ""),
                        "played": games.get("played", {}).get("all", 0),
                        "won": games.get("win", {}).get("total", 0),
                        "lost": games.get("lose", {}).get("total", 0),
                        "drawn": 0,
                        "goals_for": games.get("points", {}).get("for", 0),
                        "goals_against": games.get("points", {}).get("against", 0),
                        "goal_difference": 0,
                        "points": team_standing.get("points", 0),
                        "form": list(team_standing.get("form", "")[:5]) if team_standing.get("form") else []
                    })
        
        return {
            "standings": sorted(standings, key=lambda x: x["position"]),
            "league": BASKETBALL_LEAGUES.get(actual_id, {}).get("name", "EuroLeague")
        }
    
    # Football standings
    actual_id = league_id
    for lid, info in FOOTBALL_LEAGUES.items():
        if info.get("code") == league_id:
            actual_id = lid
            break
    
    if actual_id not in FOOTBALL_LEAGUES:
        raise HTTPException(status_code=404, detail="League not found")
    
    data = await fetch_api_football(f"/standings?league={actual_id}&season={season}")
    standings_response = data.get("response", [])
    
    standings = []
    if standings_response:
        league_data = standings_response[0].get("league", {})
        standings_list = league_data.get("standings", [])
        
        if standings_list:
            table = standings_list[0] if isinstance(standings_list[0], list) else standings_list
            for team_standing in table:
                team = team_standing.get("team", {})
                all_stats = team_standing.get("all", {})
                standings.append({
                    "position": team_standing.get("rank", 0),
                    "team": team.get("name", "Unknown"),
                    "team_logo": team.get("logo", ""),
                    "played": all_stats.get("played", 0),
                    "won": all_stats.get("win", 0),
                    "drawn": all_stats.get("draw", 0),
                    "lost": all_stats.get("lose", 0),
                    "goals_for": all_stats.get("goals", {}).get("for", 0),
                    "goals_against": all_stats.get("goals", {}).get("against", 0),
                    "goal_difference": team_standing.get("goalsDiff", 0),
                    "points": team_standing.get("points", 0),
                    "form": list(team_standing.get("form", "")[:5]) if team_standing.get("form") else []
                })
    
    return {
        "standings": standings,
        "league": FOOTBALL_LEAGUES[actual_id]["name"]
    }

@api_router.post("/parlays")
async def save_parlay(request: ParlayRequest):
    """Save a parlay bet"""
    parlay_id = str(uuid.uuid4())
    parlay_doc = {
        "id": parlay_id,
        "items": [item.model_dump() for item in request.items],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    combined_odds = 1.0
    for item in request.items:
        combined_odds *= item.odds
    
    parlay_doc["combined_odds"] = round(combined_odds, 2)
    parlay_doc["probability"] = round((1 / combined_odds) * 100, 2)
    
    await db.parlays.insert_one(parlay_doc)
    
    return {"id": parlay_id, "message": "Parlay saved", **parlay_doc}

@api_router.get("/parlays")
async def get_parlays():
    """Get saved parlays"""
    parlays = await db.parlays.find({}, {"_id": 0}).to_list(100)
    return {"parlays": parlays}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
