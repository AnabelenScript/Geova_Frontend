import { useEffect, useState } from 'react';
import { graphService } from '../services/GraphService';

const GRAPH_WS_URL = 'ws://localhost:8000/ws/graph';

export const graphViewModel = {
  useGraphData() {
    const [data, setData] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
      graphService.connectToGraphWebSocket(GRAPH_WS_URL);
      setConnected(graphService.isConnected());

      const handleData = (newData) => {
        setData(newData);
      };

      graphService.subscribe(handleData);

      return () => {
        graphService.unsubscribe(handleData);
      };
    }, []);

    return {
      data,
      isConnected: connected
    };
  }
};
