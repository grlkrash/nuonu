const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Serve the test_frontend.html file
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'test_frontend.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading test page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  // Handle 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Open this URL in your browser to view the test page');
}); 