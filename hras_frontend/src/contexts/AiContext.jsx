import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AiContext = createContext();

export const useAiContext = () => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAiContext must be used within an AiProvider');
  }
  return context;
};

export const AiProvider = ({ children }) => {
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiMessage, setAiMessage] = useState('Checking AI status...');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const initialCheckDone = useRef(false);

  const checkAiStatus = async () => {
    if (checking) return; // Prevent concurrent checks
    
    setChecking(true);
    try {
      const response = await axios.get('http://localhost:8000/api/ai-status/');
      setAiAvailable(response.data.available);
      setAiMessage(response.data.message);
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited - don't update state to avoid flickering
        console.warn('AI status check rate limited, keeping previous state');
        return;
      }
      setAiAvailable(false);
      setAiMessage('Unable to check AI status - connection error');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      checkAiStatus();
    }

    // Check every 5 minutes
    const interval = setInterval(checkAiStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const refetch = () => {
    setLoading(true);
    checkAiStatus();
  };

  const value = {
    aiAvailable,
    aiMessage,
    loading,
    refetch
  };

  return (
    <AiContext.Provider value={value}>
      {children}
    </AiContext.Provider>
  );
};