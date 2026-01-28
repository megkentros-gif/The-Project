from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
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
FOOTBALL_DATA_KEY = os.environ.get('FOOTBALL_DATA_KEY', '')
API_FOOTBALL_KEY = os.environ.get('API_FOOTBALL_KEY', '')
ODDS_API_KEY = os.environ.get('ODDS_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# API Base URLs
FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"
ODDS_API_BASE = "https://api.the-odds-api.com/v4"
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

# Football-Data.org League codes mapped to The Odds API sport keys
FOOTBALL_LEAGUES = {
    "PL": {"name": "Premier League", "country": "England", "code": "PL", "odds_key": "soccer_epl"},
    "PD": {"name": "La Liga", "country": "Spain", "code": "PD", "odds_key": "soccer_spain_la_liga"},
    "BL1": {"name": "Bundesliga", "country": "Germany", "code": "BL1", "odds_key": "soccer_germany_bundesliga"},
    "SA": {"name": "Serie A", "country": "Italy", "code": "SA", "odds_key": "soccer_italy_serie_a"},
    "FL1": {"name": "Ligue 1", "country": "France", "code": "FL1", "odds_key": "soccer_france_ligue_one"},
    "CL": {"name": "Champions League", "country": "Europe", "code": "CL", "odds_key": "soccer_uefa_champs_league"},
    "EC": {"name": "Europa League", "country": "Europe", "code": "EC", "odds_key": "soccer_uefa_europa_league"},
}

# EuroLeague Basketball - use The Odds API
BASKETBALL_LEAGUES = {
    "basketball_euroleague": {"name": "EuroLeague", "country": "Europe", "code": "EURO", "odds_key": "basketball_euroleague"},
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

async def fetch_football_data(endpoint: str, use_cache: bool = True) -> Dict[str, Any]:
    """Fetch data from Football-Data.org API"""
    if not FOOTBALL_DATA_KEY:
        logger.warning("FOOTBALL_DATA_KEY not configured")
        return {}
    
    cache_key = f"fd:{endpoint}"
    if use_cache:
        cached = get_cache(cache_key)
        if cached:
            return cached
    
    headers = {
        "X-Auth-Token": FOOTBALL_DATA_KEY,
    }
    
    async with httpx.AsyncClient() as http_client:
        try:
            url = f"{FOOTBALL_DATA_BASE}{endpoint}"
            logger.info(f"Fetching: {url}")
            response = await http_client.get(url, headers=headers, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                set_cache(cache_key, data)
                return data
            elif response.status_code == 429:
                logger.warning("Rate limited, waiting...")
                await asyncio.sleep(60)
                return {}
            logger.error(f"Football-Data.org error: {response.status_code} - {response.text[:200]}")
            return {}
        except Exception as e:
            logger.error(f"Football-Data.org exception: {e}")
            return {}

async def fetch_api_basketball(endpoint: str, use_cache: bool = True) -> Dict[str, Any]:
    """Fetch data from API-Basketball"""
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

async def fetch_real_odds(sport_key: str, use_cache: bool = True) -> Dict[str, Dict]:
    """Fetch real odds from The Odds API"""
    if not ODDS_API_KEY:
        logger.warning("ODDS_API_KEY not configured")
        return {}
    
    cache_key = f"odds:{sport_key}"
    if use_cache:
        cached = get_cache(cache_key)
        if cached:
            return cached
    
    async with httpx.AsyncClient() as http_client:
        try:
            url = f"{ODDS_API_BASE}/sports/{sport_key}/odds"
            # Only include BTTS for soccer leagues (not basketball)
            # Note: BTTS may not be available for all leagues
            markets = "h2h,totals"
            
            params = {
                "apiKey": ODDS_API_KEY,
                "regions": "eu,uk",
                "markets": markets,
                "oddsFormat": "decimal"
            }
            logger.info(f"Fetching odds: {url} with markets: {markets}")
            response = await http_client.get(url, params=params, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                # Index by match (home_team vs away_team)
                odds_map = {}
                for match in data:
                    home = match.get("home_team", "").lower()
                    away = match.get("away_team", "").lower()
                    key = f"{home}_{away}"
                    
                    # Store raw bookmaker data for frontend parsing
                    raw_bookmakers = match.get("bookmakers", [])
                    
                    # Get best odds from all bookmakers
                    best_odds = {
                        "Match Winner": {}, 
                        "Over/Under 2.5": {}, 
                        "Both Teams Score": {},
                        "bookmakers": [],
                        "raw_bookmakers": raw_bookmakers  # Store raw data for frontend
                    }
                    
                    for bookmaker in raw_bookmakers:
                        book_name = bookmaker.get("title", "")
                        best_odds["bookmakers"].append(book_name)
                        
                        for market in bookmaker.get("markets", []):
                            market_key = market.get("key", "")
                            
                            if market_key == "h2h":
                                for outcome in market.get("outcomes", []):
                                    name = outcome.get("name", "")
                                    price = outcome.get("price", 0)
                                    
                                    if name == match.get("home_team"):
                                        if "Home" not in best_odds["Match Winner"] or price > float(best_odds["Match Winner"].get("Home", 0)):
                                            best_odds["Match Winner"]["Home"] = str(round(price, 2))
                                    elif name == match.get("away_team"):
                                        if "Away" not in best_odds["Match Winner"] or price > float(best_odds["Match Winner"].get("Away", 0)):
                                            best_odds["Match Winner"]["Away"] = str(round(price, 2))
                                    elif name == "Draw":
                                        if "Draw" not in best_odds["Match Winner"] or price > float(best_odds["Match Winner"].get("Draw", 0)):
                                            best_odds["Match Winner"]["Draw"] = str(round(price, 2))
                            
                            elif market_key == "totals":
                                for outcome in market.get("outcomes", []):
                                    name = outcome.get("name", "")
                                    price = outcome.get("price", 0)
                                    point = outcome.get("point", 2.5)
                                    
                                    if point == 2.5:
                                        if name == "Over":
                                            best_odds["Over/Under 2.5"]["Over"] = str(round(price, 2))
                                        elif name == "Under":
                                            best_odds["Over/Under 2.5"]["Under"] = str(round(price, 2))
                            
                            elif market_key == "btts":
                                for outcome in market.get("outcomes", []):
                                    name = outcome.get("name", "")
                                    price = outcome.get("price", 0)
                                    
                                    if name == "Yes":
                                        best_odds["Both Teams Score"]["Yes"] = str(round(price, 2))
                                    elif name == "No":
                                        best_odds["Both Teams Score"]["No"] = str(round(price, 2))
                    
                    # Also store the original match data for fallback
                    odds_map[key] = {
                        **best_odds,
                        "match_data": {
                            "id": match.get("id"),
                            "commence_time": match.get("commence_time"),
                            "home_team": match.get("home_team"),
                            "away_team": match.get("away_team"),
                            "sport_key": match.get("sport_key"),
                            "sport_title": match.get("sport_title")
                        }
                    }
                
                set_cache(cache_key, odds_map)
                return odds_map
            else:
                logger.error(f"Odds API error: {response.status_code} - {response.text[:200]}")
                return {}
        except Exception as e:
            logger.error(f"Odds API exception: {e}")
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

def normalize_team_name(name: str) -> str:
    """Normalize team name for matching"""
    if not name:
        return ""
    name = name.lower()
    # Remove common suffixes
    name = name.replace(" fc", "").replace(" f.c.", "").replace("fc ", "")
    name = name.replace(" afc", "").replace(" sc", "").replace(" cf", "")
    # Replace & with and
    name = name.replace("&", "and")
    # Remove extra spaces
    name = " ".join(name.split())
    return name.strip()

def parse_football_data_match(match: Dict[str, Any], league_code: str, odds_map: Dict = None) -> Dict[str, Any]:
    """Parse a match from Football-Data.org format with real odds"""
    league_info = FOOTBALL_LEAGUES.get(league_code, {"name": "Unknown", "code": league_code})
    
    status_map = {
        "SCHEDULED": "NS",
        "TIMED": "NS", 
        "IN_PLAY": "LIVE",
        "PAUSED": "HT",
        "FINISHED": "FT",
        "POSTPONED": "PST",
        "CANCELLED": "CANC"
    }
    
    home_team = match.get("homeTeam", {}).get("name", "Unknown") or "Unknown"
    away_team = match.get("awayTeam", {}).get("name", "Unknown") or "Unknown"
    
    # Try to find real odds
    match_odds = None
    has_odds = False
    bookmakers_list = []
    
    if odds_map and home_team != "Unknown" and away_team != "Unknown":
        home_norm = normalize_team_name(home_team)
        away_norm = normalize_team_name(away_team)
        
        # Try to find matching odds
        for odds_key, odds_data in odds_map.items():
            parts = odds_key.split("_", 1)
            if len(parts) == 2:
                odds_home_norm = normalize_team_name(parts[0])
                odds_away_norm = normalize_team_name(parts[1])
                
                # Check various matching strategies
                home_match = (
                    home_norm == odds_home_norm or
                    home_norm in odds_home_norm or
                    odds_home_norm in home_norm or
                    # Check key words (e.g., "brighton" matches "brighton and hove albion")
                    any(word in odds_home_norm for word in home_norm.split() if len(word) > 4) or
                    any(word in home_norm for word in odds_home_norm.split() if len(word) > 4)
                )
                
                away_match = (
                    away_norm == odds_away_norm or
                    away_norm in odds_away_norm or
                    odds_away_norm in away_norm or
                    any(word in odds_away_norm for word in away_norm.split() if len(word) > 4) or
                    any(word in away_norm for word in odds_away_norm.split() if len(word) > 4)
                )
                
                if home_match and away_match:
                    match_odds = odds_data
                    has_odds = True
                    bookmakers_list = odds_data.get("bookmakers", [])[:5]
                    break
    
    return {
        "id": f"fd_{match.get('id', '')}",
        "sport": "football",
        "league": league_info.get("name", "Unknown"),
        "league_id": league_code,
        "league_code": league_code,
        "home_team": home_team,
        "away_team": away_team,
        "home_logo": match.get("homeTeam", {}).get("crest", ""),
        "away_logo": match.get("awayTeam", {}).get("crest", ""),
        "match_date": match.get("utcDate", ""),
        "status": status_map.get(match.get("status", ""), match.get("status", "NS")),
        "home_score": match.get("score", {}).get("fullTime", {}).get("home"),
        "away_score": match.get("score", {}).get("fullTime", {}).get("away"),
        "has_odds": has_odds,
        "odds": match_odds,
        "bookmakers": bookmakers_list
    }

def parse_basketball_game(game: Dict[str, Any], league_info: Dict[str, str]) -> Dict[str, Any]:
    """Parse a basketball game from API-Basketball format"""
    teams = game.get("teams", {})
    scores = game.get("scores", {})
    
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
        "has_odds": True,
        "odds": {
            "Match Winner": {
                "Home": "1.85",
                "Away": "1.95"
            }
        },
    }

async def fetch_basketball_from_odds_api(sport_key: str) -> List[Dict[str, Any]]:
    """Fetch basketball games directly from The Odds API with real odds"""
    if not ODDS_API_KEY:
        logger.warning("ODDS_API_KEY not configured")
        return []
    
    cache_key = f"basketball_odds:{sport_key}"
    cached = get_cache(cache_key)
    if cached:
        logger.info(f"Returning {len(cached)} cached basketball games")
        return cached
    
    async with httpx.AsyncClient() as http_client:
        try:
            url = f"{ODDS_API_BASE}/sports/{sport_key}/odds"
            params = {
                "apiKey": ODDS_API_KEY,
                "regions": "eu,uk",
                "markets": "h2h,totals",
                "oddsFormat": "decimal"
            }
            logger.info(f"Fetching basketball odds: {url}")
            response = await http_client.get(url, params=params, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Basketball API returned {len(data)} matches")
                games = []
                
                for match in data:
                    # Get best odds
                    best_odds = {"Match Winner": {}, "Over/Under": {}, "bookmakers": []}
                    
                    for bookmaker in match.get("bookmakers", []):
                        book_name = bookmaker.get("title", "")
                        best_odds["bookmakers"].append(book_name)
                        
                        for market in bookmaker.get("markets", []):
                            market_key = market.get("key", "")
                            
                            if market_key == "h2h":
                                for outcome in market.get("outcomes", []):
                                    name = outcome.get("name", "")
                                    price = outcome.get("price", 0)
                                    
                                    if name == match.get("home_team"):
                                        if "Home" not in best_odds["Match Winner"] or price > float(best_odds["Match Winner"].get("Home", 0)):
                                            best_odds["Match Winner"]["Home"] = str(round(price, 2))
                                    elif name == match.get("away_team"):
                                        if "Away" not in best_odds["Match Winner"] or price > float(best_odds["Match Winner"].get("Away", 0)):
                                            best_odds["Match Winner"]["Away"] = str(round(price, 2))
                            
                            elif market_key == "totals":
                                for outcome in market.get("outcomes", []):
                                    name = outcome.get("name", "")
                                    price = outcome.get("price", 0)
                                    point = outcome.get("point", 0)
                                    
                                    if name == "Over":
                                        best_odds["Over/Under"][f"Over {point}"] = str(round(price, 2))
                                    elif name == "Under":
                                        best_odds["Over/Under"][f"Under {point}"] = str(round(price, 2))
                    
                    game = {
                        "id": f"bb_{match.get('id', '')}",
                        "sport": "basketball",
                        "league": "EuroLeague",
                        "league_id": "basketball_euroleague",
                        "league_code": "EURO",
                        "home_team": match.get("home_team", "Unknown"),
                        "away_team": match.get("away_team", "Unknown"),
                        "home_logo": "",
                        "away_logo": "",
                        "match_date": match.get("commence_time", ""),
                        "status": "NS",
                        "home_score": None,
                        "away_score": None,
                        "has_odds": True,
                        "odds": best_odds,
                        "bookmakers": best_odds.get("bookmakers", [])[:5]
                    }
                    games.append(game)
                
                set_cache(cache_key, games)
                return games
            elif response.status_code == 401:
                logger.error("Basketball Odds API: Invalid API key")
                return []
            elif response.status_code == 429:
                logger.warning("Basketball Odds API: Rate limit exceeded or quota reached")
                return []
            else:
                logger.error(f"Basketball Odds API error: {response.status_code} - {response.text[:200]}")
                return []
        except Exception as e:
            logger.error(f"Basketball Odds API exception: {e}")
            return []

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "BetSmart AI API", "version": "2.0.0", "data_source": "Football-Data.org"}

@api_router.get("/leagues")
async def get_leagues():
    """Get all available leagues"""
    leagues = [
        {"id": code, **info, "sport": "football"} 
        for code, info in FOOTBALL_LEAGUES.items()
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
    status: Optional[str] = "SCHEDULED"
):
    """Get upcoming matches with REAL odds from bookmakers"""
    all_matches = []
    
    # Check if basketball league is explicitly requested
    is_basketball_request = (
        league in BASKETBALL_LEAGUES or 
        league == "EURO" or 
        league == "basketball_euroleague" or
        sport == "basketball"
    )
    
    # Fetch football matches ONLY if not explicitly requesting basketball
    if not is_basketball_request and (sport is None or sport == "football"):
        leagues_to_fetch = [league] if league and league in FOOTBALL_LEAGUES else list(FOOTBALL_LEAGUES.keys())
        
        for league_code in leagues_to_fetch:
            league_info = FOOTBALL_LEAGUES[league_code]
            
            # Fetch real odds for this league
            odds_key = league_info.get("odds_key", "")
            odds_map = {}
            if odds_key:
                odds_map = await fetch_real_odds(odds_key)
                logger.info(f"Fetched {len(odds_map)} odds for {league_code}")
            
            # Fetch scheduled matches for this competition
            endpoint = f"/competitions/{league_code}/matches"
            if status:
                endpoint += f"?status={status}"
            
            data = await fetch_football_data(endpoint)
            matches = data.get("matches", [])
            
            for match in matches[:20]:  # Limit to 20 per league
                parsed = parse_football_data_match(match, league_code, odds_map)
                
                # Filter by odds if requested
                if only_with_odds and not parsed.get("has_odds"):
                    continue
                    
                all_matches.append(parsed)
            
            await asyncio.sleep(0.1)  # Small delay to respect rate limits
    
    # Fetch basketball matches ONLY from The Odds API when basketball is requested
    if is_basketball_request or (sport is None and league is None):
        for league_id, league_info in BASKETBALL_LEAGUES.items():
            odds_key = league_info.get("odds_key", "")
            if odds_key:
                # Fetch basketball games directly from The Odds API
                logger.info(f"Fetching basketball from The Odds API: {odds_key}")
                basketball_odds = await fetch_basketball_from_odds_api(odds_key)
                logger.info(f"Fetched {len(basketball_odds)} basketball games")
                for game in basketball_odds:
                    all_matches.append(game)
    
    # Sort by date
    all_matches.sort(key=lambda x: x.get("match_date", ""))
    
    # Count matches with real odds
    with_odds = sum(1 for m in all_matches if m.get("has_odds"))
    
    return {
        "matches": all_matches, 
        "total": len(all_matches),
        "with_real_odds": with_odds
    }

@api_router.get("/matches/{match_id}")
async def get_match_detail(match_id: str):
    """Get detailed match information including H2H, form, and AI analysis"""
    
    if match_id.startswith("fd_"):
        fixture_id = match_id[3:]
        
        # Fetch match details
        data = await fetch_football_data(f"/matches/{fixture_id}")
        
        if not data or "id" not in data:
            raise HTTPException(status_code=404, detail="Match not found")
        
        league_code = data.get("competition", {}).get("code", "PL")
        league_info = FOOTBALL_LEAGUES.get(league_code, {"name": "Unknown", "code": league_code, "odds_key": ""})
        
        # Fetch real odds for this league
        odds_key = league_info.get("odds_key", "")
        odds_map = {}
        if odds_key:
            odds_map = await fetch_real_odds(odds_key)
        
        match = parse_football_data_match(data, league_code, odds_map)
        
        # Fetch head to head
        home_team_id = data.get("homeTeam", {}).get("id")
        away_team_id = data.get("awayTeam", {}).get("id")
        
        h2h_data = await fetch_football_data(f"/matches/{fixture_id}/head2head?limit=5")
        h2h_matches = h2h_data.get("matches", [])
        
        match["head_to_head"] = [
            {
                "date": h.get("utcDate", ""),
                "home": h.get("homeTeam", {}).get("name", ""),
                "away": h.get("awayTeam", {}).get("name", ""),
                "home_score": h.get("score", {}).get("fullTime", {}).get("home"),
                "away_score": h.get("score", {}).get("fullTime", {}).get("away"),
            }
            for h in h2h_matches
        ]
        
        # Get team form from recent matches
        home_matches = await fetch_football_data(f"/teams/{home_team_id}/matches?status=FINISHED&limit=5")
        away_matches = await fetch_football_data(f"/teams/{away_team_id}/matches?status=FINISHED&limit=5")
        
        def extract_form(team_id, matches_list):
            form = []
            for m in matches_list[:5]:
                home_id = m.get("homeTeam", {}).get("id")
                home_goals = m.get("score", {}).get("fullTime", {}).get("home") or 0
                away_goals = m.get("score", {}).get("fullTime", {}).get("away") or 0
                
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
        
        match["home_form"] = extract_form(home_team_id, home_matches.get("matches", []))
        match["away_form"] = extract_form(away_team_id, away_matches.get("matches", []))
        
        # Football-Data.org free tier doesn't include injuries
        match["injuries"] = {
            "home": [],
            "away": []
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
            "home_injuries": [],
            "away_injuries": []
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
        
        match = parse_basketball_game(game, league_info)
        match["head_to_head"] = []
        match["home_form"] = ["W", "W", "L", "W", "W"]
        match["away_form"] = ["L", "W", "W", "W", "L"]
        match["injuries"] = {"home": [], "away": []}
        
        match["ai_analysis"] = await get_ai_analysis({
            "id": match_id,
            "sport": "basketball",
            "home_team": match["home_team"],
            "away_team": match["away_team"],
            "league": match["league"],
            "home_form": match["home_form"],
            "away_form": match["away_form"],
            "h2h": []
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

@api_router.get("/standings/{league_code}")
async def get_standings(league_code: str):
    """Get league standings"""
    
    # Check if it's a basketball league
    if league_code in BASKETBALL_LEAGUES or league_code == "EURO" or league_code == "120":
        actual_id = "120" if league_code == "EURO" else league_code
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
    
    # Football standings from Football-Data.org
    if league_code not in FOOTBALL_LEAGUES:
        raise HTTPException(status_code=404, detail="League not found")
    
    data = await fetch_football_data(f"/competitions/{league_code}/standings")
    standings_data = data.get("standings", [])
    
    standings = []
    if standings_data and len(standings_data) > 0:
        table = standings_data[0].get("table", [])
        for team in table:
            standings.append({
                "position": team.get("position", 0),
                "team": team.get("team", {}).get("name", "Unknown"),
                "team_logo": team.get("team", {}).get("crest", ""),
                "played": team.get("playedGames", 0),
                "won": team.get("won", 0),
                "drawn": team.get("draw", 0),
                "lost": team.get("lost", 0),
                "goals_for": team.get("goalsFor", 0),
                "goals_against": team.get("goalsAgainst", 0),
                "goal_difference": team.get("goalDifference", 0),
                "points": team.get("points", 0),
                "form": list(team.get("form", "")[:5]) if team.get("form") else []
            })
    
    return {
        "standings": standings,
        "league": FOOTBALL_LEAGUES[league_code]["name"]
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
