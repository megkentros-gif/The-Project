# BetSmart AI - Sports Betting Guide

## Original Problem Statement
Build a site that guides users with the best bets for every match in the top five football leagues, European games, and EuroLeague basketball. Features include AI-powered hidden analysis, parlay calculator with live probability updates, injury tracking, and all stats features (predictions, H2H, form).

## User Personas
- **Sports Bettors**: Users seeking data-driven betting insights
- **Casual Fans**: People wanting match predictions and analysis
- **Parlay Builders**: Users creating accumulator bets across multiple matches

## Core Requirements
- ✅ Match data from API-Football (Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL)
- ✅ EuroLeague basketball support
- ✅ AI-powered analysis with GPT-5.2 (hidden logic)
- ✅ Parlay builder with live probability calculator
- ✅ Injury and unavailable player tracking
- ✅ Head-to-head historical stats
- ✅ Team form analysis
- ✅ Dark sporty theme

## What's Been Implemented (Jan 2025)
### Backend (FastAPI)
- `/api/leagues` - Returns all 8 leagues (7 football + EuroLeague)
- `/api/matches` - Fetches matches with filtering by sport/league
- `/api/matches/{id}` - Match details with H2H, form, injuries, AI analysis
- `/api/standings/{league_id}` - League standings
- `/api/parlay/calculate` - Parlay odds and probability calculation
- `/api/parlays` - Save/retrieve parlays (MongoDB)

### Frontend (React)
- Dashboard with match cards, filters, stats
- Match Detail page with AI Analysis, H2H, Form, Injuries tabs
- Leagues browser with 8 competition cards
- Standings page with full league tables
- Parlay Builder with match selection and probability circle

### Integrations
- API-Football (free tier) for match data
- GPT-5.2 via Emergent LLM key for AI analysis
- MongoDB for parlay storage

## Prioritized Backlog
### P0 (Critical) - DONE
- ✅ Basic match display with team logos/scores
- ✅ AI analysis integration
- ✅ Parlay builder functionality

### P1 (High)
- [ ] Live odds integration (requires premium API tier or odds provider)
- [ ] Filter to show only matches WITH odds
- [ ] Real-time match updates

### P2 (Medium)
- [ ] User authentication and saved preferences
- [ ] Historical bet tracking
- [ ] Push notifications for match start

### P3 (Low)
- [ ] Social sharing of parlays
- [ ] Betting ROI calculator
- [ ] Multi-language support

## Technical Notes
- API-Football free tier: 100 req/day, 10 req/min, 2022-2024 seasons only
- Odds endpoint requires premium for full coverage
- 5-minute cache on API responses to reduce rate limit hits
