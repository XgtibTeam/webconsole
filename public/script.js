// Sidebar navigation
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.feature').forEach(f => f.classList.add('hidden'));
    document.getElementById(item.dataset.feature + '-container').classList.remove('hidden');
  });
});

// Code Editor (Monaco)
require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function() {
  window.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
    value: 'console.log("Hello World");',
    language: 'javascript'
  });
  document.getElementById('lang-select').addEventListener('change', (e) => {
    monaco.editor.setModelLanguage(window.editor.getModel(), e.target.value);
  });
  document.getElementById('run-btn').addEventListener('click', async () => {
    const code = window.editor.getValue();
    const lang = document.getElementById('lang-select').value;
    const response = await fetch('http://localhost:3000/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang, version: 'latest', code })
    });
    const result = await response.json();
    document.getElementById('console-output').value = result.output || result.error;
  });
});

// Calculator (Sederhana, tambah logika untuk operator lengkap)
let calcDisplay = document.getElementById('calc-display');
document.querySelectorAll('#calculator-container button').forEach(btn => {
  btn.addEventListener('click', () => {
    calcDisplay.value += btn.textContent;
  });
});
// Tambah logika eval() atau parser untuk aritmatika lengkap.

// File Manager (JSONBin)
const jsonbinKey = '$2a$10$VgGdKhHNGyYIibY1.OQxl.B6kODOFjQwK7asUOTKl67UrFanxbtKe'; // Ganti dengan key Anda
document.getElementById('save-file').addEventListener('click', async () => {
  const name = document.getElementById('file-name').value;
  const content = document.getElementById('file-content').value;
  await fetch('https://api.jsonbin.io/v3/b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': jsonbinKey },
    body: JSON.stringify({ name, content })
  });
  // Load files: Tambah fetch untuk list.
});

// Web View
document.getElementById('webview-container').addEventListener('input', () => {
  const html = document.getElementById('editor').value; // Asumsikan editor untuk HTML
  document.getElementById('web-preview').srcdoc = html;
});

// Debug: Log error dari console ke textarea.
