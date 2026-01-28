# BetSmart AI - Sports Betting Guide

## Original Problem Statement
Build a site that guides users with the best bets for every match in the top five football leagues, European games, and EuroLeague basketball. Features include AI-powered hidden analysis, parlay calculator with live probability updates, injury tracking, and all stats features (predictions, H2H, form). User specifically requested FUTURE/UPCOMING matches for analysis.

## User Personas
- **Sports Bettors**: Users seeking data-driven betting insights for upcoming matches
- **Casual Fans**: People wanting match predictions and analysis
- **Parlay Builders**: Users creating accumulator bets across multiple matches

## Core Requirements
- ✅ UPCOMING match data from Football-Data.org (current season)
- ✅ Coverage: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League
- ✅ EuroLeague basketball support
- ✅ AI-powered analysis with GPT-5.2 (hidden logic)
- ✅ Parlay builder with live probability calculator
- ✅ Odds display (Home/Draw/Away) - generated since free tier
- ✅ Head-to-head historical stats
- ✅ Team form analysis
- ✅ Dark sporty theme

## What's Been Implemented (Jan 2025)
### Backend (FastAPI)
- `/api/leagues` - Returns all 8 leagues (7 football + EuroLeague)
- `/api/matches` - Fetches **UPCOMING** scheduled matches (120+ available)
- `/api/matches/{id}` - Match details with H2H, form, AI analysis
- `/api/standings/{league_code}` - League standings
- `/api/parlay/calculate` - Parlay odds and probability calculation
- `/api/parlays` - Save/retrieve parlays (MongoDB)

### Frontend (React)
- Dashboard with upcoming match cards, filters, odds display
- Match Detail page with AI Analysis (prediction, confidence %, best bet, reasoning)
- Leagues browser with 8 competition cards
- Standings page with full league tables
- Parlay Builder with match selection and probability circle

### Integrations
- **Football-Data.org** - Real upcoming fixtures (current season)
- **GPT-5.2** via Emergent LLM key - AI betting analysis
- **MongoDB** - Parlay storage

## API Keys Configured
- FOOTBALL_DATA_KEY - For upcoming fixtures
- API_FOOTBALL_KEY - For basketball data
- EMERGENT_LLM_KEY - For AI analysis

## Known Limitations
- Odds are generated (Football-Data.org free tier doesn't include real odds)
- Injuries not available in free tier
- Rate limits: 10 req/min on Football-Data.org
