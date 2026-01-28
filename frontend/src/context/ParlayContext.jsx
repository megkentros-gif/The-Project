import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ParlayContext = createContext();

export function ParlayProvider({ children }) {
  const [parlayItems, setParlayItems] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("parlayItems");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("parlayItems", JSON.stringify(parlayItems));
  }, [parlayItems]);

  const addToParlay = useCallback((item) => {
    // Build standardized parlay item with market type
    const parlayItem = {
      match_id: item.match_id || item.matchId,
      home_team: item.home_team,
      away_team: item.away_team,
      selection_name: item.selection_name || item.selection,
      price: parseFloat(item.price || item.odds) || 1.0,
      match_name: item.match_name || `${item.home_team} vs ${item.away_team}`,
      market: item.market || "1X2", // Market type: 1X2, Over/Under, BTTS, Handicap
      league: item.league || "",
      sport: item.sport || "football"
    };

    setParlayItems(prev => {
      // Check if this match already exists in parlay
      const existingIndex = prev.findIndex(p => p.match_id === parlayItem.match_id);
      
      if (existingIndex >= 0) {
        // Replace existing bet with new one (different market or selection)
        const updated = [...prev];
        updated[existingIndex] = parlayItem;
        return updated;
      }
      
      // Add new bet
      return [...prev, parlayItem];
    });
    
    return { success: true, message: "Added to parlay!" };
  }, []);

  const removeFromParlay = useCallback((matchId) => {
    setParlayItems(prev => prev.filter(p => p.match_id !== matchId));
  }, []);

  const clearParlay = useCallback(() => {
    setParlayItems([]);
  }, []);

  const getParlayCount = useCallback(() => parlayItems.length, [parlayItems]);

  const isInParlay = useCallback((matchId) => {
    return parlayItems.some(p => p.match_id === matchId);
  }, [parlayItems]);

  const getSelectionForMatch = useCallback((matchId) => {
    return parlayItems.find(p => p.match_id === matchId);
  }, [parlayItems]);

  // Calculate total odds and potential return
  const calculateTotals = useCallback((stake = 10) => {
    if (parlayItems.length === 0) {
      return { totalOdds: 0, potentialReturn: 0, probability: 0 };
    }
    
    const totalOdds = parlayItems.reduce((acc, item) => acc * (item.price || 1), 1);
    const potentialReturn = totalOdds * stake;
    const probability = (1 / totalOdds) * 100;
    
    return {
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      potentialReturn: parseFloat(potentialReturn.toFixed(2)),
      probability: parseFloat(probability.toFixed(1))
    };
  }, [parlayItems]);

  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ParlayContext.Provider value={{
      parlayItems,
      setParlayItems,
      addToParlay,
      removeFromParlay,
      clearParlay,
      getParlayCount,
      isInParlay,
      getSelectionForMatch,
      calculateTotals,
      isOpen,
      toggleSidebar,
      openSidebar,
      closeSidebar
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
