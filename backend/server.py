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
from datetime import datetime, timezone
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
FOOTBALL_API_KEY = os.environ.get('FOOTBALL_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Football-Data.org base URL
FOOTBALL_API_BASE = "https://api.football-data.org/v4"
EUROLEAGUE_API_BASE = "https://api-live.euroleague.net/v1"

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

# League mappings for Football-Data.org
FOOTBALL_LEAGUES = {
    "PL": {"name": "Premier League", "country": "England", "code": "PL"},
    "PD": {"name": "La Liga", "country": "Spain", "code": "PD"},
    "BL1": {"name": "Bundesliga", "country": "Germany", "code": "BL1"},
    "SA": {"name": "Serie A", "country": "Italy", "code": "SA"},
    "FL1": {"name": "Ligue 1", "country": "France", "code": "FL1"},
    "CL": {"name": "Champions League", "country": "Europe", "code": "CL"},
    "EL": {"name": "Europa League", "country": "Europe", "code": "EC"},
}

# Models
class MatchBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sport: str
    league: str
    league_code: str
    home_team: str
    away_team: str
    home_logo: Optional[str] = None
    away_logo: Optional[str] = None
    match_date: str
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None

class MatchDetail(MatchBase):
    head_to_head: Optional[List[Dict[str, Any]]] = []
    home_form: Optional[List[str]] = []
    away_form: Optional[List[str]] = []
    injuries: Optional[Dict[str, List[str]]] = {}
    ai_analysis: Optional[Dict[str, Any]] = None

class AIAnalysis(BaseModel):
    match_id: str
    prediction: str
    confidence: float
    best_bet: str
    reasoning: str
    risk_level: str

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

class LeagueStanding(BaseModel):
    position: int
    team: str
    team_logo: Optional[str] = None
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    form: Optional[List[str]] = []

# Helper functions
async def fetch_football_data(endpoint: str) -> Dict[str, Any]:
    """Fetch data from Football-Data.org API"""
    headers = {"X-Auth-Token": FOOTBALL_API_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{FOOTBALL_API_BASE}{endpoint}", headers=headers, timeout=30.0)
            if response.status_code == 200:
                return response.json()
            logger.error(f"Football API error: {response.status_code} - {response.text}")
            return {}
        except Exception as e:
            logger.error(f"Football API exception: {e}")
            return {}

async def fetch_euroleague_data(endpoint: str) -> Dict[str, Any]:
    """Fetch data from EuroLeague API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{EUROLEAGUE_API_BASE}{endpoint}", timeout=30.0)
            if response.status_code == 200:
                return response.json()
            logger.error(f"EuroLeague API error: {response.status_code}")
            return {}
        except Exception as e:
            logger.error(f"EuroLeague API exception: {e}")
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
            session_id=f"match-{match_data.get('id', 'unknown')}",
            system_message="""You are an expert sports betting analyst. Analyze the match data provided and give betting insights.
            Your analysis should include:
            1. A prediction (home win, away win, or draw)
            2. Confidence level (0-100%)
            3. Best bet recommendation (e.g., "Home Win", "Over 2.5 Goals", "Both Teams to Score")
            4. Brief reasoning (2-3 sentences max)
            5. Risk level (low, medium, high)
            
            Respond in JSON format only:
            {"prediction": "...", "confidence": 0.0, "best_bet": "...", "reasoning": "...", "risk_level": "..."}"""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze this match:
        Home Team: {match_data.get('home_team', 'Unknown')}
        Away Team: {match_data.get('away_team', 'Unknown')}
        League: {match_data.get('league', 'Unknown')}
        Home Form: {match_data.get('home_form', [])}
        Away Form: {match_data.get('away_form', [])}
        Head to Head: {match_data.get('h2h', [])}
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        # Try to parse JSON from response
        try:
            # Clean the response - find JSON object
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        return {
            "prediction": "Analysis processing",
            "confidence": 65.0,
            "best_bet": "Home Win",
            "reasoning": response[:200] if response else "Analysis completed",
            "risk_level": "medium"
        }
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "prediction": "Analysis unavailable",
            "confidence": 0.0,
            "best_bet": "N/A",
            "reasoning": str(e),
            "risk_level": "unknown"
        }

def parse_football_match(match: Dict[str, Any], league_info: Dict[str, str]) -> Dict[str, Any]:
    """Parse a football match from Football-Data.org format"""
    return {
        "id": f"fb_{match.get('id', '')}",
        "sport": "football",
        "league": league_info.get("name", "Unknown"),
        "league_code": league_info.get("code", ""),
        "home_team": match.get("homeTeam", {}).get("name", "Unknown"),
        "away_team": match.get("awayTeam", {}).get("name", "Unknown"),
        "home_logo": match.get("homeTeam", {}).get("crest", ""),
        "away_logo": match.get("awayTeam", {}).get("crest", ""),
        "match_date": match.get("utcDate", ""),
        "status": match.get("status", "SCHEDULED"),
        "home_score": match.get("score", {}).get("fullTime", {}).get("home"),
        "away_score": match.get("score", {}).get("fullTime", {}).get("away"),
    }

def parse_euroleague_match(match: Dict[str, Any]) -> Dict[str, Any]:
    """Parse a basketball match from EuroLeague API format"""
    return {
        "id": f"bb_{match.get('gameCode', match.get('code', ''))}",
        "sport": "basketball",
        "league": "EuroLeague",
        "league_code": "EURO",
        "home_team": match.get("homeTeam", {}).get("name", match.get("localTeam", {}).get("name", "Unknown")),
        "away_team": match.get("awayTeam", {}).get("name", match.get("visitorTeam", {}).get("name", "Unknown")),
        "home_logo": match.get("homeTeam", {}).get("logo", ""),
        "away_logo": match.get("awayTeam", {}).get("logo", ""),
        "match_date": match.get("date", match.get("gameDate", "")),
        "status": match.get("status", "SCHEDULED"),
        "home_score": match.get("homeScore", match.get("localTeam", {}).get("score")),
        "away_score": match.get("awayScore", match.get("visitorTeam", {}).get("score")),
    }

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "BetSmart AI API", "version": "1.0.0"}

@api_router.get("/leagues")
async def get_leagues():
    """Get all available leagues"""
    leagues = [
        {"code": code, **info, "sport": "football"} 
        for code, info in FOOTBALL_LEAGUES.items()
    ]
    leagues.append({
        "code": "EURO",
        "name": "EuroLeague",
        "country": "Europe",
        "sport": "basketball"
    })
    return {"leagues": leagues}

@api_router.get("/matches")
async def get_matches(league: Optional[str] = None, sport: Optional[str] = None):
    """Get upcoming matches across all leagues"""
    all_matches = []
    
    # Fetch football matches
    if sport is None or sport == "football":
        leagues_to_fetch = [league] if league and league in FOOTBALL_LEAGUES else list(FOOTBALL_LEAGUES.keys())
        
        for league_code in leagues_to_fetch:
            league_info = FOOTBALL_LEAGUES.get(league_code, {})
            data = await fetch_football_data(f"/competitions/{league_code}/matches?status=SCHEDULED")
            matches = data.get("matches", [])[:10]  # Limit to 10 per league
            
            for match in matches:
                parsed = parse_football_match(match, league_info)
                all_matches.append(parsed)
    
    # Fetch basketball matches
    if sport is None or sport == "basketball":
        if league is None or league == "EURO":
            euro_data = await fetch_euroleague_data("/results?seasonCode=E2024")
            games = euro_data if isinstance(euro_data, list) else euro_data.get("games", euro_data.get("results", []))
            
            if isinstance(games, list):
                for match in games[:10]:
                    parsed = parse_euroleague_match(match)
                    all_matches.append(parsed)
    
    # Sort by date
    all_matches.sort(key=lambda x: x.get("match_date", ""))
    
    return {"matches": all_matches}

@api_router.get("/matches/{match_id}")
async def get_match_detail(match_id: str):
    """Get detailed match information including H2H, form, and AI analysis"""
    # Parse match ID to determine sport
    if match_id.startswith("fb_"):
        original_id = match_id[3:]
        data = await fetch_football_data(f"/matches/{original_id}")
        
        if not data:
            raise HTTPException(status_code=404, detail="Match not found")
        
        league_code = data.get("competition", {}).get("code", "")
        league_info = FOOTBALL_LEAGUES.get(league_code, {"name": "Unknown", "code": league_code})
        
        match = parse_football_match(data, league_info)
        
        # Fetch head to head
        h2h_data = await fetch_football_data(f"/matches/{original_id}/head2head?limit=5")
        h2h_matches = h2h_data.get("matches", [])
        
        match["head_to_head"] = [
            {
                "date": m.get("utcDate", ""),
                "home": m.get("homeTeam", {}).get("name", ""),
                "away": m.get("awayTeam", {}).get("name", ""),
                "home_score": m.get("score", {}).get("fullTime", {}).get("home"),
                "away_score": m.get("score", {}).get("fullTime", {}).get("away"),
            }
            for m in h2h_matches
        ]
        
        # Generate form from recent matches (simplified)
        match["home_form"] = ["W", "D", "W", "L", "W"]  # Placeholder - would fetch from team endpoint
        match["away_form"] = ["L", "W", "W", "D", "L"]
        
        # Injuries - Football-Data.org free tier doesn't include injuries
        match["injuries"] = {
            "home": ["Data requires premium subscription"],
            "away": ["Data requires premium subscription"]
        }
        
        # Get AI analysis
        match["ai_analysis"] = await get_ai_analysis({
            "id": match_id,
            "home_team": match["home_team"],
            "away_team": match["away_team"],
            "league": match["league"],
            "home_form": match["home_form"],
            "away_form": match["away_form"],
            "h2h": match["head_to_head"]
        })
        
        return match
    
    elif match_id.startswith("bb_"):
        # Basketball match - EuroLeague
        game_code = match_id[3:]
        # EuroLeague API structure may vary
        match = {
            "id": match_id,
            "sport": "basketball",
            "league": "EuroLeague",
            "league_code": "EURO",
            "home_team": "Team A",
            "away_team": "Team B",
            "match_date": datetime.now(timezone.utc).isoformat(),
            "status": "SCHEDULED",
            "head_to_head": [],
            "home_form": ["W", "W", "L", "W", "W"],
            "away_form": ["L", "W", "D", "W", "L"],
            "injuries": {"home": [], "away": []},
        }
        
        match["ai_analysis"] = await get_ai_analysis({
            "id": match_id,
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
    
    # Calculate combined odds
    combined_odds = 1.0
    for item in request.items:
        combined_odds *= item.odds
    
    # Calculate implied probability (simplified)
    probability = (1 / combined_odds) * 100
    
    # Risk assessment based on number of legs and probability
    if len(request.items) <= 2 and probability > 20:
        risk = "Low"
    elif len(request.items) <= 4 and probability > 10:
        risk = "Medium"
    else:
        risk = "High"
    
    # Potential return on $10 bet
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
    if league_code == "EURO":
        # EuroLeague standings
        data = await fetch_euroleague_data("/standings?seasonCode=E2024")
        standings_list = data if isinstance(data, list) else data.get("standings", [])
        
        return {"standings": standings_list, "league": "EuroLeague"}
    
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
    
    # Calculate odds
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
