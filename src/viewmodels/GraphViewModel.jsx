import { useEffect, useState } from 'react';
import { graphService } from '../services/GraphService';

const GRAPH_WS_URL = 'wss://socket.geova.pro/ws';

export const graphViewModel = {
  useGraphData() {
    const [data, setData] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
      graphService.connectToGraphWebSocket(GRAPH_WS_URL);
      const handleData = (newData) => {
        console.log("Mensaje recibido desde el WebSocket:", newData); 
        setData(newData);
      };

      graphService.subscribe(handleData);
      const intervalId = setInterval(() => {
        setConnected(graphService.isConnected());
      }, 1000);

      return () => {
        clearInterval(intervalId); 
        graphService.unsubscribe(handleData);
      };
    }, []);

    return {
      data,
      isConnected: connected
    };
  }
};
