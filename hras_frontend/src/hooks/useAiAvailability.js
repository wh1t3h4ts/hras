import { useState, useEffect } from 'react';
import axios from 'axios';

const useAiAvailability = () => {
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiMessage, setAiMessage] = useState('Checking AI status...');
  const [loading, setLoading] = useState(true);

  const checkAiStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/ai-status/');
      setAiAvailable(response.data.available);
      setAiMessage(response.data.message);
    } catch (error) {
      setAiAvailable(false);
      setAiMessage('Unable to check AI status - connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAiStatus();

    // Check every 5 minutes
    const interval = setInterval(checkAiStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { aiAvailable, aiMessage, loading, refetch: checkAiStatus };
};

export default useAiAvailability;