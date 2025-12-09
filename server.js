// server.js
const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const TMP = os.tmpdir();
const TIMEOUT_MS = 7000; // max exec time

function tmpPath(prefix, ext='') {
  return path.join(TMP, `${prefix}-${uuidv4()}${ext}`);
}

function runProcess(command, args, options = {}, stdin = '', timeout = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    let killed = false;

    const to = setTimeout(() => {
      killed = true;
      try { child.kill('SIGKILL'); } catch(e){}
    }, timeout);

    if (stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch (e) {}
    }

    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', (code, sig) => {
      clearTimeout(to);
      resolve({ stdout, stderr, code, sig, killed });
    });
    child.on('error', (err) => {
      clearTimeout(to);
      resolve({ stdout, stderr: (stderr + '\n' + err.message), code: null, sig: null, killed });
    });
  });
}

app.post('/run', async (req, res) => {
  try {
    const { language, code, stdin } = req.body || {};
    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing language or code' });
    }

    // NOTE: Running arbitrary code on server is dangerous.
    // This endpoint is intended for LOCAL / trusted usage only.
    // Consider isolating with containers / sandbox for public deployment.
    console.log(`[RUN] language=${language}, code-len=${code.length}`);

    if (language === 'javascript') {
      // write to temp .js to support multi-line easily
      const file = tmpPath('code', '.js');
      fs.writeFileSync(file, code, 'utf8');
      const result = await runProcess('node', [file], { cwd: TMP }, stdin || '');
      try { fs.unlinkSync(file); } catch(e){}
      return res.json({ runtime: 'node', ...result });
    }

    if (language === 'python') {
      const file = tmpPath('code', '.py');
      fs.writeFileSync(file, code, 'utf8');
      const result = await runProcess('python3', [file], { cwd: TMP }, stdin || '');
      try { fs.unlinkSync(file); } catch(e){}
      return res.json({ runtime: 'python3', ...result });
    }

    if (language === 'bash') {
      const file = tmpPath('code', '.sh');
      fs.writeFileSync(file, code, { mode: 0o700 });
      const result = await runProcess('bash', [file], { cwd: TMP }, stdin || '');
      try { fs.unlinkSync(file); } catch(e){}
      return res.json({ runtime: 'bash', ...result });
    }

    if (language === 'ruby') {
      const file = tmpPath('code', '.rb');
      fs.writeFileSync(file, code, 'utf8');
      const result = await runProcess('ruby', [file], { cwd: TMP }, stdin || '');
      try { fs.unlinkSync(file); } catch(e){}
      return res.json({ runtime: 'ruby', ...result });
    }

    if (language === 'cpp') {
      // compile then run
      const src = tmpPath('code', '.cpp');
      const exe = tmpPath('a.out', '');
      fs.writeFileSync(src, code, 'utf8');

      // compile
      // g++ flags: -std=c++17 -O2 -pipe -static? (do NOT use -static on many hosts)
      const compile = await runProcess('g++', ['-std=c++17', '-O2', src, '-o', exe], { cwd: TMP }, '');
      if (compile.code !== 0 || compile.stderr) {
        // compilation error -> return message
        try { fs.unlinkSync(src); } catch(e){}
        try { if (fs.existsSync(exe)) fs.unlinkSync(exe); } catch(e){}
        return res.json({ runtime: 'g++', compileError: compile.stderr || compile.stdout, compileCode: compile.code });
      }

      // run executable
      const runres = await runProcess(exe, [], { cwd: TMP }, stdin || '');
      try { fs.unlinkSync(src); } catch(e){}
      try { fs.unlinkSync(exe); } catch(e){}
      return res.json({ runtime: 'g++ (run)', ...runres });
    }

    return res.status(400).json({ error: 'Language not supported' });

  } catch (err) {
    console.error('Run error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('WARNING: /run executes arbitrary code. Use only in trusted/local environment.');
});
                         
