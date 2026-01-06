const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Railway tharura Port-ah use pannanum, illana local-ku 5050
const PORT = process.env.PORT || 5050;

app.use(express.json());

// Backend folder-la irundhu veliya irukura public folder-ah serve panna
app.use(express.static(path.join(__dirname, '..', 'public')));

// ✅ Railway Cloud Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Cloud deployment-ku idhu kandippa venum
  }
});

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ✅ REGISTER API
app.post('/register', async (req, res) => {
  const { name, email, Password, ConfirmPassword } = req.body;
  if (Password !== ConfirmPassword) return res.json({ success: false, message: 'Password mismatch' });
  try {
    await pool.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [name, email, Password]);
    res.json({ success: true });
  } catch (e) { 
    res.json({ success: false, message: 'User already exists or DB Error' }); 
  }
});

// ✅ LOGIN API
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1 AND password=$2', [email, password]);
    if (result.rows.length > 0) {
        res.json({ success: true, name: result.rows[0].name, userId: result.rows[0].id });
    } else { 
        res.json({ success: false, message: 'Invalid credentials' }); 
    }
  } catch (err) { res.json({ success: false }); }
});

// ✅ GET TODOS (With formatted date)
app.get('/todos/:userId', async (req, res) => {
  try {
    const result = await pool.query(
        "SELECT *, to_char(due_date, 'Day, DD Mon YYYY') as formatted_date FROM todos WHERE user_id=$1 ORDER BY id DESC", 
        [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ ADD TODO
app.post('/todos', async (req, res) => {
  const { userId, task, date, priority } = req.body;
  try {
    await pool.query('INSERT INTO todos(user_id, task, due_date, priority, completed) VALUES($1, $2, $3, $4, false)', [userId, task, date || null, priority]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ✅ UPDATE TODO (Status or Task)
app.put('/todos/:id', async (req, res) => {
    const { completed, task } = req.body;
    try {
        if (completed !== undefined) await pool.query('UPDATE todos SET completed=$1 WHERE id=$2', [completed, req.params.id]);
        else if (task) await pool.query('UPDATE todos SET task=$1 WHERE id=$2', [task, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// ✅ DELETE TODO
app.delete('/todos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM todos WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));