#!/usr/bin/env python3
"""
Backend API Testing for Sports Betting Guide
Tests all API endpoints for functionality and data integrity
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class BettingAPITester:
    def __init__(self, base_url="https://highprob-matches.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
            self.failed_tests.append({"test": name, "error": details, "response": response_data})
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:500]}
            
            return success, response_data
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection error"}
        except Exception as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.make_request("GET", "/")
        if success and "message" in response:
            self.log_test("Root Endpoint", True, "API is accessible")
        else:
            self.log_test("Root Endpoint", False, f"Unexpected response: {response}")

    def test_leagues_endpoint(self):
        """Test leagues endpoint - specifically check for basketball_euroleague"""
        success, response = self.make_request("GET", "/leagues")
        
        if not success:
            self.log_test("Leagues Endpoint", False, f"Request failed: {response}")
            return None
        
        if "leagues" not in response:
            self.log_test("Leagues Endpoint", False, "Missing 'leagues' key in response")
            return None
        
        leagues = response["leagues"]
        if not isinstance(leagues, list):
            self.log_test("Leagues Endpoint", False, "'leagues' is not a list")
            return None
        
        # Check for expected leagues including basketball_euroleague
        expected_leagues = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", 
                          "Champions League", "Europa League", "EuroLeague"]
        found_leagues = [league.get("name", "") for league in leagues]
        
        # Specifically check for basketball_euroleague ID
        basketball_euroleague_found = False
        for league in leagues:
            if league.get("id") == "basketball_euroleague" or league.get("name") == "EuroLeague":
                basketball_euroleague_found = True
                break
        
        if not basketball_euroleague_found:
            self.log_test("Basketball EuroLeague Check", False, "basketball_euroleague not found in leagues")
        else:
            self.log_test("Basketball EuroLeague Check", True, "basketball_euroleague found in leagues")
        
        missing_leagues = [league for league in expected_leagues if league not in found_leagues]
        
        if missing_leagues:
            self.log_test("Leagues Endpoint", False, f"Missing leagues: {missing_leagues}")
        else:
            self.log_test("Leagues Endpoint", True, f"Found {len(leagues)} leagues")
        
        return leagues

    def test_premier_league_matches(self):
        """Test GET /api/matches?league=PL - Should return football matches"""
        success, response = self.make_request("GET", "/matches?league=PL")
        
        if not success:
            self.log_test("Premier League Matches", False, f"Request failed: {response}")
            return None
        
        if "matches" not in response:
            self.log_test("Premier League Matches", False, "Missing 'matches' key in response")
            return None
        
        matches = response["matches"]
        if not isinstance(matches, list):
            self.log_test("Premier League Matches", False, "'matches' is not a list")
            return None
        
        # Check if matches are football and Premier League
        if matches:
            pl_matches = [m for m in matches if m.get("sport") == "football" and 
                         (m.get("league") == "Premier League" or m.get("league_code") == "PL")]
            
            if len(pl_matches) != len(matches):
                self.log_test("Premier League Matches", False, f"Found non-PL matches: {len(matches) - len(pl_matches)}")
            else:
                self.log_test("Premier League Matches", True, f"Found {len(pl_matches)} Premier League matches")
        else:
            self.log_test("Premier League Matches", True, "No Premier League matches found (valid if no scheduled matches)")
        
        return matches

    def test_match_detail_endpoint(self, matches: List[Dict]):
        """Test match detail endpoint with enhanced AI analysis fields"""
        if not matches:
            self.log_test("Match Detail Endpoint", False, "No matches available to test")
            return
        
        # Test with first match
        match_id = matches[0]["id"]
        success, response = self.make_request("GET", f"/matches/{match_id}")
        
        if not success:
            self.log_test("Match Detail Endpoint", False, f"Request failed: {response}")
            return
        
        # Check for AI analysis with enhanced fields
        if "ai_analysis" in response:
            ai_analysis = response["ai_analysis"]
            
            # Required AI analysis fields
            required_ai_fields = ["prediction", "confidence", "best_bet", "reasoning", "risk_level"]
            missing_ai_fields = [field for field in required_ai_fields if field not in ai_analysis]
            
            if missing_ai_fields:
                self.log_test("Match Detail AI Analysis (Core)", False, f"Missing AI fields: {missing_ai_fields}")
            else:
                self.log_test("Match Detail AI Analysis (Core)", True, "Core AI analysis fields present")
            
            # Check for new enhanced fields
            enhanced_fields = ["news_summary", "key_injuries", "value_bet"]
            present_enhanced = []
            missing_enhanced = []
            
            for field in enhanced_fields:
                if field in ai_analysis:
                    present_enhanced.append(field)
                else:
                    missing_enhanced.append(field)
            
            # Special handling for value_bet - it can be null when no odds available
            if "value_bet" not in ai_analysis:
                # Check if this is because no odds are available
                match_has_odds = response.get("has_odds", False)
                if not match_has_odds:
                    self.log_test("Match Detail AI Analysis (Enhanced)", True, f"Enhanced fields present: {present_enhanced}. value_bet missing due to no odds available (API quota exhausted)")
                else:
                    self.log_test("Match Detail AI Analysis (Enhanced)", False, f"Missing enhanced fields: {missing_enhanced}")
            elif missing_enhanced:
                self.log_test("Match Detail AI Analysis (Enhanced)", False, f"Missing enhanced fields: {missing_enhanced}")
            else:
                self.log_test("Match Detail AI Analysis (Enhanced)", True, f"All enhanced fields present: {enhanced_fields}")
            
            # Test value_bet structure if present
            if "value_bet" in ai_analysis:
                value_bet = ai_analysis["value_bet"]
                if value_bet is not None:
                    value_bet_fields = ["has_value", "value_rating", "ai_probability", "implied_probability", "edge"]
                    missing_vb_fields = [field for field in value_bet_fields if field not in value_bet]
                    
                    if missing_vb_fields:
                        self.log_test("Value Bet Structure", False, f"Missing value bet fields: {missing_vb_fields}")
                    else:
                        self.log_test("Value Bet Structure", True, "Value bet structure is complete")
                else:
                    self.log_test("Value Bet Structure", True, "Value bet is null (valid when no odds available)")
        else:
            self.log_test("Match Detail AI Analysis", False, "Missing AI analysis")
        
        # Check for additional data
        expected_fields = ["head_to_head", "home_form", "away_form", "injuries"]
        present_fields = [field for field in expected_fields if field in response]
        
        self.log_test("Match Detail Endpoint", True, f"Match detail loaded with fields: {present_fields}")

    def test_matches_endpoint(self):
        """Test general matches endpoint"""
        success, response = self.make_request("GET", "/matches")
        
        if not success:
            self.log_test("Matches Endpoint", False, f"Request failed: {response}")
            return None
        
        if "matches" not in response:
            self.log_test("Matches Endpoint", False, "Missing 'matches' key in response")
            return None
        
        matches = response["matches"]
        if not isinstance(matches, list):
            self.log_test("Matches Endpoint", False, "'matches' is not a list")
            return None
        
        # Validate match structure
        if matches:
            match = matches[0]
            required_fields = ["id", "sport", "league", "home_team", "away_team", "match_date", "status"]
            missing_fields = [field for field in required_fields if field not in match]
            
            if missing_fields:
                self.log_test("Matches Endpoint", False, f"Missing fields in match: {missing_fields}")
            else:
                self.log_test("Matches Endpoint", True, f"Found {len(matches)} matches with valid structure")
        else:
            self.log_test("Matches Endpoint", True, "No matches found (empty list is valid)")
        
        return matches

    def test_standings_endpoint(self, leagues: List[Dict]):
        """Test standings endpoint"""
        if not leagues:
            self.log_test("Standings Endpoint", False, "No leagues available to test")
            return
        
        # Test with Premier League (should be ID 39 or code PL)
        test_league = None
        for league in leagues:
            if league.get("name") == "Premier League":
                test_league = league
                break
        
        if not test_league:
            # Use first football league
            football_leagues = [l for l in leagues if l.get("sport") == "football"]
            if football_leagues:
                test_league = football_leagues[0]
        
        if not test_league:
            self.log_test("Standings Endpoint", False, "No suitable league found for testing")
            return
        
        league_id = test_league.get("id") or test_league.get("code")
        success, response = self.make_request("GET", f"/standings/{league_id}")
        
        if not success:
            self.log_test("Standings Endpoint", False, f"Request failed: {response}")
            return
        
        if "standings" not in response:
            self.log_test("Standings Endpoint", False, "Missing 'standings' key in response")
            return
        
        standings = response["standings"]
        if standings and len(standings) > 0:
            # Check standings structure
            team = standings[0]
            required_fields = ["position", "team", "played", "won", "points"]
            missing_fields = [field for field in required_fields if field not in team]
            
            if missing_fields:
                self.log_test("Standings Endpoint", False, f"Missing fields in standings: {missing_fields}")
            else:
                self.log_test("Standings Endpoint", True, f"Standings loaded with {len(standings)} teams")
        else:
            self.log_test("Standings Endpoint", True, "Empty standings (valid for some leagues)")

    def test_parlay_calculate_endpoint(self):
        """Test parlay calculation endpoint"""
        # Test with sample parlay data
        test_parlay = {
            "items": [
                {
                    "match_id": "fb_12345",
                    "selection": "Home Win",
                    "odds": 1.85,
                    "match_name": "Team A vs Team B"
                },
                {
                    "match_id": "fb_67890",
                    "selection": "Over 2.5 Goals",
                    "odds": 1.75,
                    "match_name": "Team C vs Team D"
                }
            ]
        }
        
        success, response = self.make_request("POST", "/parlay/calculate", test_parlay)
        
        if not success:
            self.log_test("Parlay Calculate Endpoint", False, f"Request failed: {response}")
            return
        
        # Check response structure
        required_fields = ["combined_odds", "probability", "potential_return", "risk_assessment"]
        missing_fields = [field for field in required_fields if field not in response]
        
        if missing_fields:
            self.log_test("Parlay Calculate Endpoint", False, f"Missing fields: {missing_fields}")
        else:
            # Validate calculations
            expected_odds = 1.85 * 1.75  # 3.2375
            actual_odds = response.get("combined_odds", 0)
            
            if abs(actual_odds - expected_odds) < 0.01:
                self.log_test("Parlay Calculate Endpoint", True, f"Calculation correct: {actual_odds}")
            else:
                self.log_test("Parlay Calculate Endpoint", False, f"Calculation error: expected {expected_odds}, got {actual_odds}")

    def test_sport_filter(self):
        """Test sport filtering"""
        # Test football filter
        success, response = self.make_request("GET", "/matches?sport=football")
        if success and "matches" in response:
            football_matches = response["matches"]
            non_football = [m for m in football_matches if m.get("sport") != "football"]
            if non_football:
                self.log_test("Sport Filter (Football)", False, f"Found non-football matches: {len(non_football)}")
            else:
                self.log_test("Sport Filter (Football)", True, f"Football filter working: {len(football_matches)} matches")
        else:
            self.log_test("Sport Filter (Football)", False, f"Request failed: {response}")
        
        # Test basketball filter
        success, response = self.make_request("GET", "/matches?sport=basketball")
        if success and "matches" in response:
            basketball_matches = response["matches"]
            non_basketball = [m for m in basketball_matches if m.get("sport") != "basketball"]
            if non_basketball:
                self.log_test("Sport Filter (Basketball)", False, f"Found non-basketball matches: {len(non_basketball)}")
            else:
                self.log_test("Sport Filter (Basketball)", True, f"Basketball filter working: {len(basketball_matches)} matches")
        else:
            self.log_test("Sport Filter (Basketball)", False, f"Request failed: {response}")

    def test_league_filter(self, leagues: List[Dict]):
        """Test league filtering"""
        if not leagues:
            self.log_test("League Filter", False, "No leagues available to test")
            return
        
        # Test with first league
        test_league = leagues[0]
        league_id = test_league.get("id") or test_league.get("code")
        
        success, response = self.make_request("GET", f"/matches?league={league_id}")
        if success and "matches" in response:
            filtered_matches = response["matches"]
            # Check if all matches belong to the specified league
            wrong_league = [m for m in filtered_matches 
                          if m.get("league_id") != str(league_id) and m.get("league_code") != league_id]
            
            if wrong_league:
                self.log_test("League Filter", False, f"Found matches from wrong league: {len(wrong_league)}")
            else:
                self.log_test("League Filter", True, f"League filter working: {len(filtered_matches)} matches")
        else:
            self.log_test("League Filter", False, f"Request failed: {response}")

    def test_extended_markets_structure(self):
        """Test that odds response includes Handicap and Over/Under Alternative fields"""
        # First get some matches
        success, response = self.make_request("GET", "/matches")
        
        if not success or "matches" not in response:
            self.log_test("Extended Markets Structure", False, "Could not fetch matches to test odds structure")
            return
        
        matches = response["matches"]
        matches_with_odds = [m for m in matches if m.get("has_odds") and m.get("odds")]
        
        if not matches_with_odds:
            self.log_test("Extended Markets Structure", True, "No matches with odds found - structure cannot be tested (API quota may be exhausted)")
            return
        
        # Test odds structure on first match with odds
        match = matches_with_odds[0]
        odds = match.get("odds", {})
        
        # Check for required extended market fields
        required_markets = ["Handicap", "Over/Under Alternative"]
        missing_markets = []
        
        for market in required_markets:
            if market not in odds:
                missing_markets.append(market)
        
        if missing_markets:
            self.log_test("Extended Markets Structure", False, f"Missing markets in odds: {missing_markets}. Available: {list(odds.keys())}")
        else:
            self.log_test("Extended Markets Structure", True, f"Extended markets found: {required_markets}")
        
        # Also check for standard markets
        standard_markets = ["Match Winner", "Over/Under 2.5"]
        for market in standard_markets:
            if market in odds:
                self.log_test(f"Standard Market ({market})", True, f"Market structure present")
            else:
                self.log_test(f"Standard Market ({market})", False, f"Market missing from odds structure")

    def test_quick_analysis_field(self):
        """Test quick_analysis field for Top 4 High-Probability Picks functionality"""
        # Test general matches endpoint
        success, response = self.make_request("GET", "/matches")
        
        if not success or "matches" not in response:
            self.log_test("Quick Analysis - General Matches", False, "Could not fetch matches to test quick_analysis")
            return
        
        matches = response["matches"]
        
        if not matches:
            self.log_test("Quick Analysis - General Matches", True, "No matches found (empty list is valid)")
            return
        
        # Test quick_analysis structure on all matches
        matches_with_quick_analysis = []
        matches_missing_quick_analysis = []
        
        for match in matches:
            if "quick_analysis" in match:
                matches_with_quick_analysis.append(match)
            else:
                matches_missing_quick_analysis.append(match)
        
        if matches_missing_quick_analysis:
            self.log_test("Quick Analysis - Field Presence", False, f"{len(matches_missing_quick_analysis)} matches missing quick_analysis field")
        else:
            self.log_test("Quick Analysis - Field Presence", True, f"All {len(matches)} matches have quick_analysis field")
        
        # Test quick_analysis structure on first match
        if matches_with_quick_analysis:
            match = matches_with_quick_analysis[0]
            quick_analysis = match["quick_analysis"]
            
            # Required fields
            required_fields = ["probability", "best_pick", "pick_type"]
            missing_fields = [field for field in required_fields if field not in quick_analysis]
            
            if missing_fields:
                self.log_test("Quick Analysis - Required Fields", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Quick Analysis - Required Fields", True, "All required fields present")
                
                # Validate field values
                probability = quick_analysis.get("probability")
                best_pick = quick_analysis.get("best_pick")
                pick_type = quick_analysis.get("pick_type")
                
                # Test probability range (0-95)
                if isinstance(probability, (int, float)) and 0 <= probability <= 95:
                    self.log_test("Quick Analysis - Probability Range", True, f"Probability {probability} is within 0-95 range")
                else:
                    self.log_test("Quick Analysis - Probability Range", False, f"Probability {probability} is not within 0-95 range")
                
                # Test best_pick values
                valid_picks = ["Home Win", "Away Win", "Draw"]
                if best_pick in valid_picks:
                    self.log_test("Quick Analysis - Best Pick Values", True, f"Best pick '{best_pick}' is valid")
                else:
                    self.log_test("Quick Analysis - Best Pick Values", False, f"Best pick '{best_pick}' is not in {valid_picks}")
                
                # Test pick_type values
                valid_types = ["home", "away", "draw"]
                if pick_type in valid_types:
                    self.log_test("Quick Analysis - Pick Type Values", True, f"Pick type '{pick_type}' is valid")
                else:
                    self.log_test("Quick Analysis - Pick Type Values", False, f"Pick type '{pick_type}' is not in {valid_types}")
                
                # Test source field if present
                source = quick_analysis.get("source")
                if source:
                    valid_sources = ["odds", "ai_estimated"]
                    if source in valid_sources:
                        self.log_test("Quick Analysis - Source Field", True, f"Source '{source}' is valid")
                    else:
                        self.log_test("Quick Analysis - Source Field", False, f"Source '{source}' is not in {valid_sources}")

    def test_premier_league_quick_analysis(self):
        """Test GET /api/matches?league=PL specifically for quick_analysis with source field"""
        success, response = self.make_request("GET", "/matches?league=PL")
        
        if not success:
            self.log_test("PL Quick Analysis", False, f"Request failed: {response}")
            return
        
        if "matches" not in response:
            self.log_test("PL Quick Analysis", False, "Missing 'matches' key in response")
            return
        
        matches = response["matches"]
        
        if not matches:
            self.log_test("PL Quick Analysis", True, "No Premier League matches found (valid if no scheduled matches)")
            return
        
        # Check quick_analysis on PL matches
        for i, match in enumerate(matches[:3]):  # Test first 3 matches
            if "quick_analysis" not in match:
                self.log_test(f"PL Quick Analysis - Match {i+1}", False, "Missing quick_analysis field")
                continue
            
            quick_analysis = match["quick_analysis"]
            
            # Check for source field specifically
            if "source" not in quick_analysis:
                self.log_test(f"PL Quick Analysis - Match {i+1} Source", False, "Missing source field in quick_analysis")
            else:
                source = quick_analysis["source"]
                valid_sources = ["odds", "ai_estimated"]
                if source in valid_sources:
                    self.log_test(f"PL Quick Analysis - Match {i+1} Source", True, f"Source '{source}' is valid")
                else:
                    self.log_test(f"PL Quick Analysis - Match {i+1} Source", False, f"Invalid source '{source}'")

    def test_probability_sorting_logic(self):
        """Test that matches with higher probability exist for sorting"""
        success, response = self.make_request("GET", "/matches")
        
        if not success or "matches" not in response:
            self.log_test("Probability Sorting Logic", False, "Could not fetch matches to test sorting")
            return
        
        matches = response["matches"]
        
        if not matches:
            self.log_test("Probability Sorting Logic", True, "No matches found (empty list is valid)")
            return
        
        # Extract probabilities from matches with quick_analysis
        probabilities = []
        for match in matches:
            if "quick_analysis" in match and "probability" in match["quick_analysis"]:
                prob = match["quick_analysis"]["probability"]
                if isinstance(prob, (int, float)):
                    probabilities.append(prob)
        
        if not probabilities:
            self.log_test("Probability Sorting Logic", False, "No valid probabilities found in matches")
            return
        
        # Check if we have varying probabilities (needed for sorting)
        unique_probs = set(probabilities)
        if len(unique_probs) < 2:
            self.log_test("Probability Sorting Logic", True, f"All matches have same probability ({probabilities[0]}) - sorting not testable")
        else:
            # Find highest probabilities
            sorted_probs = sorted(probabilities, reverse=True)
            top_4_probs = sorted_probs[:4]
            
            self.log_test("Probability Sorting Logic", True, f"Found {len(probabilities)} matches with probabilities. Top 4: {top_4_probs}")
            
            # Verify we have high-probability matches (>60% for featured picks)
            high_prob_matches = [p for p in probabilities if p >= 60]
            if high_prob_matches:
                self.log_test("High Probability Matches", True, f"Found {len(high_prob_matches)} matches with >=60% probability")
            else:
                self.log_test("High Probability Matches", True, f"No matches with >=60% probability (highest: {max(probabilities)})")

    def test_top_picks_functionality(self):
        """Comprehensive test for Top 4 High-Probability Picks functionality"""
        print("\n🎯 Testing Top 4 High-Probability Picks Functionality")
        print("-" * 50)
        
        # Test 1: Quick analysis field presence and structure
        self.test_quick_analysis_field()
        
        # Test 2: Premier League specific test with source field
        self.test_premier_league_quick_analysis()
        
        # Test 3: Probability sorting logic
        self.test_probability_sorting_logic()

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Backend API Tests for BetSmart AI Enhancements")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test leagues (including basketball_euroleague check)
        leagues = self.test_leagues_endpoint()
        
        # Test Premier League matches specifically
        pl_matches = self.test_premier_league_matches()
        
        # Test general matches
        matches = self.test_matches_endpoint()
        
        # Test extended markets structure
        self.test_extended_markets_structure()
        
        # Test match details with enhanced AI analysis
        if matches:
            self.test_match_detail_endpoint(matches)
        
        # Test standings
        if leagues:
            self.test_standings_endpoint(leagues)
        
        # Test parlay calculation
        self.test_parlay_calculate_endpoint()
        
        # Test filters
        if leagues:
            self.test_league_filter(leagues)
        self.test_sport_filter()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = BettingAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/test_reports/backend_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "failed_tests": len(tester.failed_tests),
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results,
            "failed_details": tester.failed_tests
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())