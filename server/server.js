const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Serve static frontend files from the client dist directory
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ patients: [], appointments: [], rooms: [], emergencies: [] }, null, 2));
}

// Helper to read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    return { patients: [], appointments: [], rooms: [], emergencies: [] };
  }
};

// Helper to write DB
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

app.get('/api/db', (req, res) => {
  res.json(readDB());
});

app.get('/api/:collection', (req, res) => {
  const db = readDB();
  const collection = req.params.collection;
  if (db[collection]) {
    res.json(db[collection]);
  } else {
    res.status(404).json({ error: 'Collection not found' });
  }
});

app.post('/api/:collection', (req, res) => {
  const db = readDB();
  const collection = req.params.collection;
  if (!db[collection]) db[collection] = [];
  
  const newItem = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...req.body };
  db[collection].push(newItem);
  writeDB(db);
  
  res.status(201).json(newItem);
});

app.put('/api/:collection/:id', (req, res) => {
  const db = readDB();
  const collection = req.params.collection;
  const id = req.params.id;
  
  if (!db[collection]) return res.status(404).json({ error: 'Collection not found' });
  
  const index = db[collection].findIndex(item => item.id === id);
  if (index !== -1) {
    db[collection][index] = { ...db[collection][index], ...req.body, updatedAt: new Date().toISOString() };
    writeDB(db);
    res.json(db[collection][index]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.delete('/api/:collection/:id', (req, res) => {
  const db = readDB();
  const collection = req.params.collection;
  const id = req.params.id;
  
  if (!db[collection]) return res.status(404).json({ error: 'Collection not found' });
  
  const initialLength = db[collection].length;
  db[collection] = db[collection].filter(item => item.id !== id);
  
  if (db[collection].length < initialLength) {
    writeDB(db);
    res.json({ success: true, id });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Catch-all route to serve the React app for all non-API routes (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
