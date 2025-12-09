const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Untuk Piston API
const app = express();
app.use(cors());
app.use(express.json());

app.post('/run-code', async (req, res) => {
  const { language, version, code } = req.body;
  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language,
      version,
      files: [{ content: code }]
    });
    res.json({ output: response.data.run.output, error: response.data.run.stderr });
  } catch (err) {
    res.json({ error: 'Execution failed' });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
