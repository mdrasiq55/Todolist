const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// ✅ Middleware
app.use(bodyParser.json());
// Backend folder-la irundhu public folder-ah point panna correct path
app.use(express.static(path.join(__dirname, '..', 'public')));

// ✅ Database Connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'todo', 
  password: 'Ahbi@2003',
  port: 5432
});

// ✅ Root Route - Registration Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ✅ Database Connection Check
const initDB = async () => {
    try {
        await pool.query('SELECT 1 + 1');
        console.log("✅ Database connected successfully!");
    } catch (err) {
        console.error("❌ Database Connection Error: ", err.message);
    }
};
initDB();

// ✅ Register API
app.post('/register', async (req, res) => {
  const { name, email, Password, ConfirmPassword } = req.body; 
  if (Password !== ConfirmPassword) return res.json({ success: false, message: 'Password mismatch' });

  try {
    await pool.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [name, email, Password]);
    res.json({ success: true });
  } catch (e) {
    if (e.code === '23505') res.json({ success: false, message: 'Email already exists' });
    else res.json({ success: false, message: 'Server error: ' + e.message });
  }
});

// ✅ Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1 AND password=$2', [email, password]);
    if (result.rows.length > 0) {
        res.json({ 
            success: true, 
            name: result.rows[0].name, 
            userId: result.rows[0].id 
        });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
      res.json({ success: false, message: 'Login Error' });
  }
});

// ✅ GET ALL TODOS - day and date formatted logic oda
app.get('/todos/:userId', async (req, res) => {
  try {
    // formatted_date use panni "Monday, 05 Jan 2026" maari display panna logic
    const result = await pool.query(
        "SELECT *, to_char(due_date, 'Day, DD Mon YYYY') as formatted_date FROM todos WHERE user_id=$1 ORDER BY id DESC", 
        [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD TASK
app.post('/todos', async (req, res) => {
  const { userId, task, date } = req.body;
  try {
    await pool.query(
        'INSERT INTO todos(user_id, task, due_date, completed) VALUES($1, $2, $3, false)', 
        [userId, task, date || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ UPDATE TASK STATUS (Checkbox click panna toggle aaga)
app.put('/todos/:id', async (req, res) => {
    const { completed, task } = req.body;
    try {
        if (completed !== undefined) {
            // Checkbox tick logic
            await pool.query('UPDATE todos SET completed=$1 WHERE id=$2', [completed, req.params.id]);
        } else if (task) {
            // Edit task text logic
            await pool.query('UPDATE todos SET task=$1 WHERE id=$2', [task, req.params.id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ✅ DELETE TASK
app.delete('/todos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM todos WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.listen(5050, () => console.log(' http://localhost:5050'));