import { createContext, useContext, useState, useEffect } from "react";

const ParlayContext = createContext();

export function ParlayProvider({ children }) {
  const [parlayItems, setParlayItems] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("parlayItems");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("parlayItems", JSON.stringify(parlayItems));
  }, [parlayItems]);

  const addToParlay = (item) => {
    // Accept and store object with {home_team, away_team, selection_name, price}
    const parlayItem = {
      match_id: item.match_id || item.matchId,
      home_team: item.home_team,
      away_team: item.away_team,
      selection_name: item.selection_name || item.selection,
      price: item.price || item.odds,
      match_name: item.match_name || `${item.home_team} vs ${item.away_team}`
    };

    // Check if match already in parlay
    if (parlayItems.some(p => p.match_id === parlayItem.match_id)) {
      return { success: false, message: "This match is already in your parlay" };
    }
    
    setParlayItems([...parlayItems, parlayItem]);
    return { success: true, message: "Added to parlay!" };
  };

  const removeFromParlay = (matchId) => {
    setParlayItems(parlayItems.filter(p => p.match_id !== matchId));
  };

  const clearParlay = () => {
    setParlayItems([]);
  };

  const getParlayCount = () => parlayItems.length;

  return (
    <ParlayContext.Provider value={{
      parlayItems,
      setParlayItems,
      addToParlay,
      removeFromParlay,
      clearParlay,
      getParlayCount
    }}>
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  const context = useContext(ParlayContext);
  if (!context) {
    throw new Error("useParlay must be used within a ParlayProvider");
  }
  return context;
}
