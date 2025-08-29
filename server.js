const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');

// Use PORT from environment variable or default to 8080
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;
let wss;

if (NODE_ENV === 'production' && process.env.SSL_KEY && process.env.SSL_CERT) {
  // HTTPS server for production with SSL certificates
  const serverOptions = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
  };
  
  server = app.listen(process.env.PORT || 3000);
  wss = new WebSocket.Server({ server });
  
  server.listen(PORT, () => {
    console.log(`Secure WebSocket server started on wss://localhost:${PORT}`);
  });
} else {
  // HTTP server for development or cloud platforms that handle SSL
  server = http.createServer();
  wss = new WebSocket.Server({ server });
  
  server.listen(PORT, () => {
    console.log(`WebSocket server started on ws://localhost:${PORT}`);
    if (NODE_ENV === 'production') {
      console.log('Note: Running in production mode without SSL certificates');
      console.log('Cloud platforms like Railway/Render will handle SSL automatically');
    }
  });
}

wss.on('connection', function connection(ws) {
  console.log('New client connected');

  // Handle incoming messages
  ws.on('message', function incoming(data) {
    try {
      // Parse the incoming message
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      // Extract packet_id from the message
      const packetId = message.packet_id;
      
      if (packetId === undefined || packetId === null) {
        // Send error if packet_id is missing
        const errorResponse = {
          status: 0,
          error: "packet_id is required"
        };
        ws.send(JSON.stringify(errorResponse));
        return;
      }
      
      // Create acknowledgment response
      const acknowledgment = {
        status: 1,
        packet_id: packetId
      };
      
      // Send acknowledgment back to client
      ws.send(JSON.stringify(acknowledgment));
      console.log('Sent acknowledgment:', acknowledgment);
      
    } catch (error) {
      console.error('Error parsing message:', error);
      
      // Send error response for invalid JSON
      const errorResponse = {
        status: 0,
        error: "Invalid JSON format"
      };
      ws.send(JSON.stringify(errorResponse));
    }
  });

  // Handle client disconnect
  ws.on('close', function close() {
    console.log('Client disconnected');
  });

  // Handle errors
  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
  });

  // Send welcome message when client connects
  const welcomeMessage = {
    status: 1,
    message: "Connected to WebSocket server",
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(welcomeMessage));
});

// Handle server errors
wss.on('error', function error(err) {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', function() {
  console.log('\nShutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});