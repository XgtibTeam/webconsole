// server.js
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // serve index.html and assets

// Simple run endpoint (WARNING: executes arbitrary code on server - use carefully)
app.post('/run', (req, res) => {
  const code = req.body.code || '';
  // escape backticks and backslashes to avoid early termination in node -e
  const sanitized = String(code).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const command = `node -e \`${sanitized}\``;

  const proc = exec(command, { timeout: 10_000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    if (err && err.killed) {
      return res.json({ output: 'Process killed (timeout)' });
    }
    const out = String(stdout || '') + String(stderr || '') + (err && !err.killed ? (`\nError: ${err.message}`) : '');
    res.json({ output: out });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
