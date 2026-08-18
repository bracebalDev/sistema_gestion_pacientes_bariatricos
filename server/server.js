const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Allowed collections whitelist (prevents prototype pollution and arbitrary collection injection)
const ALLOWED_COLLECTIONS = new Set(['doctors', 'patients', 'appointments', 'rooms', 'emergencies']);

// Security middleware: disable X-Powered-By header
app.disable('x-powered-by');

// Security Headers (HIPAA / OWASP standard)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Serve static frontend files from client dist
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Initialize DB safely if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ 
    doctors: [],
    patients: [], 
    appointments: [], 
    rooms: [], 
    emergencies: [] 
  }, null, 2));
}

// Helper to safely read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading JSON DB:', err.message);
    return { doctors: [], patients: [], appointments: [], rooms: [], emergencies: [] };
  }
};

// Helper to safely write DB
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing JSON DB:', err.message);
  }
};

// Helper to strip sensitive server-only fields (like plain passwords or secrets) before sending to client
const sanitizeRecord = (item, collection) => {
  if (!item || typeof item !== 'object') return item;
  if (collection === 'doctors') {
    const { password, ...safeDoctor } = item;
    return safeDoctor;
  }
  return item;
};

// --- ROUTES ---

// Collection validation middleware
const validateCollection = (req, res, next) => {
  const collection = req.params.collection;
  if (!collection || !ALLOWED_COLLECTIONS.has(collection)) {
    return res.status(403).json({ error: 'Acceso no autorizado a la colección solicitada.' });
  }
  next();
};

// GET Collection
app.get('/api/:collection', validateCollection, (req, res) => {
  const db = readDB();
  const collection = req.params.collection;
  const items = db[collection] || [];
  
  // Return sanitized records
  const sanitizedItems = items.map(item => sanitizeRecord(item, collection));
  res.json(sanitizedItems);
});

// GET Single Item
app.get('/api/:collection/:id', validateCollection, (req, res) => {
  const db = readDB();
  const { collection, id } = req.params;
  const items = db[collection] || [];
  const found = items.find(item => item.id === id);

  if (found) {
    res.json(sanitizeRecord(found, collection));
  } else {
    res.status(404).json({ error: 'Registro no encontrado.' });
  }
});

// POST Create Item
app.post('/api/:collection', validateCollection, (req, res) => {
  const db = readDB();
  const collection = req.params.collection;
  if (!db[collection]) db[collection] = [];
  
  const newItem = { 
    id: `${collection.slice(0, 3)}-${Date.now()}`, 
    createdAt: new Date().toISOString(), 
    ...req.body 
  };

  db[collection].push(newItem);
  writeDB(db);
  
  res.status(201).json(sanitizeRecord(newItem, collection));
});

// PUT Update or Upsert Item
app.put('/api/:collection/:id', validateCollection, (req, res) => {
  const db = readDB();
  const { collection, id } = req.params;
  
  if (!db[collection]) db[collection] = [];
  
  const index = db[collection].findIndex(item => item.id === id);
  if (index !== -1) {
    db[collection][index] = { 
      ...db[collection][index], 
      ...req.body, 
      id,
      updatedAt: new Date().toISOString() 
    };
    writeDB(db);
    res.json(sanitizeRecord(db[collection][index], collection));
  } else {
    const newItem = { 
      id, 
      createdAt: new Date().toISOString(), 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    db[collection].push(newItem);
    writeDB(db);
    res.json(sanitizeRecord(newItem, collection));
  }
});

// DELETE Item
app.delete('/api/:collection/:id', validateCollection, (req, res) => {
  const db = readDB();
  const { collection, id } = req.params;
  
  if (!db[collection]) return res.status(404).json({ error: 'Colección no encontrada.' });
  
  const initialLength = db[collection].length;
  db[collection] = db[collection].filter(item => item.id !== id);
  
  if (db[collection].length < initialLength) {
    writeDB(db);
    res.json({ success: true, id });
  } else {
    res.status(404).json({ error: 'Registro no encontrado.' });
  }
});

// Catch-all middleware to serve React Single Page Application (SPA)
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[UCIBAM EHR] Servidor seguro iniciado en http://localhost:${PORT}`);
});
