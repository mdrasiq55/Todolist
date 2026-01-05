// 1. REGISTER LOGIC
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(registerForm));

        if (data.Password !== data.ConfirmPassword) {
            return alert("Passwords do not match!");
        }

        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const msg = await res.json();
        if (msg.success) {
            alert("Registration Successful!");
            window.location.href = '/login.html';
        } else {
            alert(msg.message);
        }
    });
}

// 2. LOGIN LOGIC
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(loginForm));

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const msg = await res.json();
        if (msg.success) {
            localStorage.setItem('userId', msg.userId); //
            localStorage.setItem('loggedInUser', msg.name); //
            window.location.href = '/todo.html';
        } else {
            const errorMsg = document.getElementById('errorMsg');
            if (errorMsg) errorMsg.innerText = msg.message;
        }
    });
}

// 3. TODO LOGIC (Card Representation with Checkbox & Date)
const userId = localStorage.getItem('userId');
const todoList = document.getElementById('todoList');

if (window.location.pathname.includes('todo.html')) {
    if (!userId) window.location.href = '/login.html';
    document.getElementById('username').innerText = localStorage.getItem('loggedInUser');
    loadTodos();
}

// ✅ Load Tasks as Boxes/Cards
async function loadTodos() {
    const res = await fetch(`/todos/${userId}`);
    const todos = await res.json();
    if (!todoList) return;
    
    todoList.innerHTML = '';

    todos.forEach(t => {
        const isDone = t.completed ? 'checked' : '';
        const textStyle = t.completed ? 'text-decoration: line-through; color: #888;' : 'color: #000;';
        
        // Formatted Date (Backend-la formatted_date nu anupanum)
        const displayDate = t.formatted_date || (t.due_date ? new Date(t.due_date).toDateString() : 'No Date');

        todoList.innerHTML += `
            <div class="todo-card" style="background: white; padding: 15px; margin: 10px 0; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <input type="checkbox" ${isDone} style="width: 20px; height: 20px; cursor: pointer;" onclick="toggleTask(${t.id}, ${t.completed})">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em; ${textStyle}">${t.task}</div>
                        <div style="font-size: 0.85em; color: #666; margin-top: 3px;">📅 ${displayDate}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editTodo(${t.id}, '${t.task}')" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Edit</button>
                    <button onclick="deleteTodo(${t.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
                </div>
            </div>`;
    });
}

// ✅ Add Task with Date
async function addTodo() {
    const taskInput = document.getElementById('todoInput');
    const taskDate = document.getElementById('todoDate'); // HTML-la 'todoDate' id ulla input field irukanum
    
    if (!taskInput.value) return alert("Task fill pannu machan!");

    await fetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId, 
            task: taskInput.value, 
            date: taskDate ? taskDate.value : null 
        })
    });
    
    taskInput.value = '';
    if(taskDate) taskDate.value = '';
    loadTodos();
}

// ✅ Toggle Checkbox (Status Update)
async function toggleTask(id, currentStatus) {
    await fetch(`/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
    });
    loadTodos();
}

// ✅ Edit Task
async function editTodo(id, oldTask) {
    const newTask = prompt("Edit your task:", oldTask);
    if (newTask && newTask !== oldTask) {
        await fetch(`/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: newTask })
        });
        loadTodos();
    }
}

// ✅ Delete Task
async function deleteTodo(id) {
    if (confirm("Indha task-ah delete pannidalaama?")) {
        await fetch(`/todos/${id}`, { method: 'DELETE' });
        loadTodos();
    }
}

// ✅ Logout
function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}