// ---------- STORAGE KEYS ----------
const STORAGE_USERS = "teamflow_users";
const STORAGE_TASKS = "teamflow_tasks";
const STORAGE_MESSAGES = "teamflow_messages";

// Global state
let currentUser = null; // { name, role }
let allUsers = []; // array of { name, role }
let tasks = [];
let messages = [];
let activeView = "tasks"; // 'tasks' or 'chat'

// DOM elements
const loginContainer = document.getElementById("loginContainer");
const mainApp = document.getElementById("mainApp");
const loginNameInput = document.getElementById("loginName");
const loginRoleSelect = document.getElementById("loginRole");
const loginBtn = document.getElementById("loginBtn");
const loginErrorDiv = document.getElementById("loginError");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserRole = document.getElementById("sidebarUserRole");
const logoutBtnSidebar = document.getElementById("logoutBtnSidebar");
const tasksViewDiv = document.getElementById("tasksView");
const chatViewDiv = document.getElementById("chatView");
const chatMessagesList = document.getElementById("chatMessagesList");
const chatMsgInput = document.getElementById("chatMsgInput");
const sendChatMsgBtn = document.getElementById("sendChatMsgBtn");
const profileAvatar = document.getElementById("profileAvatar");

// ---------- HELPER: INITIAL SEED DATA (if localStorage empty) ----------
function seedInitialData() {
  // Users (demo)
  if (!localStorage.getItem(STORAGE_USERS)) {
    const demoUsers = [
      { name: "Alex Morgan", role: "Project Manager" },
      { name: "Jamie Chen", role: "Team Member" },
      { name: "Taylor Reed", role: "Team Member" },
    ];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(demoUsers));
  }
  // Tasks
  if (!localStorage.getItem(STORAGE_TASKS)) {
    const demoTasks = [
      {
        id: Date.now() + 1,
        title: "Design Dashboard UI",
        description: "Create wireframes & glassmorphism components",
        deadline: "2025-05-20",
        assignedTo: "Jamie Chen",
        status: "In Progress",
        createdBy: "Alex Morgan",
      },
      {
        id: Date.now() + 2,
        title: "Setup localStorage logic",
        description: "Implement persistence and modular JS",
        deadline: "2025-05-18",
        assignedTo: "Taylor Reed",
        status: "Pending",
        createdBy: "Alex Morgan",
      },
      {
        id: Date.now() + 3,
        title: "Review final deliverables",
        description: "Check all features before launch",
        deadline: "2025-05-25",
        assignedTo: "Alex Morgan",
        status: "Pending",
        createdBy: "Alex Morgan",
      },
    ];
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(demoTasks));
  }
  // Messages
  if (!localStorage.getItem(STORAGE_MESSAGES)) {
    const demoMessages = [
      {
        id: Date.now() + 100,
        senderName: "Alex Morgan",
        senderRole: "Project Manager",
        text: "Welcome to TeamFlow! Use the chat to collaborate 🚀",
        timestamp: Date.now() - 3600000,
      },
      {
        id: Date.now() + 101,
        senderName: "Jamie Chen",
        senderRole: "Team Member",
        text: "Got it! Let's finish tasks on time 💪",
        timestamp: Date.now() - 1800000,
      },
    ];
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(demoMessages));
  }
}

// Load all data from localStorage into global arrays
function loadAllData() {
  allUsers = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
  tasks = JSON.parse(localStorage.getItem(STORAGE_TASKS) || "[]");
  messages = JSON.parse(localStorage.getItem(STORAGE_MESSAGES) || "[]");
}

// Save tasks & messages to localStorage (users are updated on login)
function persistTasks() {
  localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
}
function persistMessages() {
  localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}
function persistUsers() {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(allUsers));
}

// ---------- AUTHENTICATION ----------
function loginUser(name, role) {
  if (!name.trim()) {
    loginErrorDiv.innerText = "Please enter your name.";
    return false;
  }
  const existingUserIndex = allUsers.findIndex(
    (u) => u.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (existingUserIndex !== -1) {
    // update role if changed
    allUsers[existingUserIndex].role = role;
  } else {
    allUsers.push({ name: name.trim(), role: role });
  }
  persistUsers();
  currentUser = { name: name.trim(), role: role };
  // store session in sessionStorage for page refresh persistence (optional)
  sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
  return true;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem("currentUser");
  loginContainer.style.display = "flex";
  mainApp.style.display = "none";
  // reset views
  activeView = "tasks";
}

function checkAutoLogin() {
  const saved = sessionStorage.getItem("currentUser");
  if (saved) {
    try {
      const user = JSON.parse(saved);
      if (user && user.name) {
        currentUser = user;
        loadAllData();
        // ensure user exists in allUsers sync
        if (!allUsers.find((u) => u.name === currentUser.name)) {
          allUsers.push(currentUser);
          persistUsers();
        }
        loginContainer.style.display = "none";
        mainApp.style.display = "block";
        renderUI();
        return true;
      }
    } catch (e) {}
  }
  return false;
}

// ---------- TASKS LOGIC (Manager vs Employee) ----------
function addTask(title, description, deadline, assignedTo) {
  if (!title.trim()) return false;
  const newTask = {
    id: Date.now(),
    title: title.trim(),
    description: description.trim() || "",
    deadline: deadline,
    assignedTo: assignedTo,
    status: "Pending",
    createdBy: currentUser.name,
  };
  tasks.push(newTask);
  persistTasks();
  renderTasksView();
  return true;
}

function updateTaskStatus(taskId, newStatus) {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = newStatus;
    persistTasks();
    renderTasksView();
  }
}

function editTask(taskId, updatedData) {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    Object.assign(task, updatedData);
    persistTasks();
    renderTasksView();
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter((t) => t.id !== taskId);
  persistTasks();
  renderTasksView();
}

// ---------- RENDER TASKS VIEW (Role Based) ----------
function renderTasksView() {
  if (!tasksViewDiv) return;
  const isManager = currentUser.role === "Project Manager";
  let html = `<div class="dashboard-header"><h2>📌 Task Dashboard</h2></div>`;

  // Manager: create task form + all tasks | Employee: only assigned tasks
  if (isManager) {
    // Get list of team members (role = Team Member) + manager itself can assign to anyone
    const teamMembers = allUsers
      .filter((u) => u.role === "Team Member")
      .map((u) => u.name);
    const assignOptions = [...teamMembers, currentUser.name].filter(
      (v, i, a) => a.indexOf(v) === i,
    );
    html += `
        <div class="card-panel">
          <h3>➕ Create New Task</h3>
          <div class="form-grid">
            <input type="text" id="taskTitle" placeholder="Task title" autocomplete="off">
            <input type="text" id="taskDesc" placeholder="Description (optional)">
            <input type="date" id="taskDeadline">
            <select id="taskAssignTo">
              ${assignOptions.map((name) => `<option value="${name}">${name}</option>`).join("")}
            </select>
            <button id="createTaskBtn" class="primary">Create Task</button>
          </div>
        </div>
      `;
  }

  // Filter tasks based on role
  let filteredTasks = [];
  if (isManager) {
    filteredTasks = [...tasks];
  } else {
    filteredTasks = tasks.filter((t) => t.assignedTo === currentUser.name);
  }

  if (filteredTasks.length === 0) {
    html += `<div class="card-panel"><div class="empty-state">✨ No tasks ${!isManager ? "assigned to you" : "available"}. ✨</div></div>`;
  } else {
    html += `<div class="tasks-grid">`;
    filteredTasks.forEach((task) => {
      const statusClass = `status-${task.status.replace(/ /g, "-")}`;
      html += `
          <div class="task-card" style="border-left-color: ${task.status === "Completed" ? "#2ecc71" : task.status === "In Progress" ? "#facc15" : "#e74c3c"}">
            <div class="task-header">
              <strong>${escapeHtml(task.title)}</strong>
              <span class="status-badge ${statusClass}">${task.status}</span>
            </div>
            <div style="font-size:0.85rem; margin: 6px 0;">📝 ${escapeHtml(task.description || "—")}</div>
            <div style="font-size:0.75rem; color:#475569;">📅 Deadline: ${task.deadline || "No deadline"} | 👤 Assigned to: ${task.assignedTo}</div>
            <div class="task-actions" style="margin-top: 12px;">
        `;
      // Employee view: status update dropdown
      if (!isManager) {
        html += `
            <select class="status-update" data-id="${task.id}">
              <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>⏳ Pending</option>
              <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>⚙️ In Progress</option>
              <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>✅ Completed</option>
            </select>
          `;
      } else {
        // Manager: edit & delete buttons + inline edit form (simplified)
        html += `
            <button class="edit-task-btn" data-id="${task.id}" data-title="${escapeHtml(task.title)}" data-desc="${escapeHtml(task.description)}" data-deadline="${task.deadline || ""}" data-assigned="${task.assignedTo}">✏️ Edit</button>
            <button class="delete-task-btn" data-id="${task.id}">🗑️ Delete</button>
          `;
      }
      html += `</div></div>`;
    });
    html += `</div>`;
  }
  tasksViewDiv.innerHTML = html;

  // Attach event listeners dynamically
  if (isManager) {
    document.getElementById("createTaskBtn")?.addEventListener("click", () => {
      const title = document.getElementById("taskTitle").value;
      const desc = document.getElementById("taskDesc").value;
      const deadline = document.getElementById("taskDeadline").value;
      const assignTo = document.getElementById("taskAssignTo").value;
      if (addTask(title, desc, deadline, assignTo)) {
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDesc").value = "";
      } else alert("Task title required");
    });
    // Edit & delete listeners
    document.querySelectorAll(".edit-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const oldTitle = btn.dataset.title;
        const oldDesc = btn.dataset.desc;
        const oldDeadline = btn.dataset.deadline;
        const oldAssigned = btn.dataset.assigned;
        const newTitle = prompt("Edit task title:", oldTitle);
        if (newTitle && newTitle.trim()) {
          const newDesc = prompt("Edit description:", oldDesc) || "";
          const newDeadline =
            prompt("Edit deadline (YYYY-MM-DD):", oldDeadline) || "";
          const newAssigned = prompt("Assign to (name):", oldAssigned);
          if (newAssigned) {
            editTask(id, {
              title: newTitle.trim(),
              description: newDesc,
              deadline: newDeadline,
              assignedTo: newAssigned,
            });
          } else {
            editTask(id, {
              title: newTitle.trim(),
              description: newDesc,
              deadline: newDeadline,
            });
          }
        }
      });
    });
    document.querySelectorAll(".delete-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Delete this task permanently?"))
          deleteTask(parseInt(btn.dataset.id));
      });
    });
  } else {
    // Employee status change
    document.querySelectorAll(".status-update").forEach((select) => {
      select.addEventListener("change", (e) => {
        const taskId = parseInt(select.dataset.id);
        updateTaskStatus(taskId, select.value);
      });
    });
  }
}

// ---------- CHAT FUNCTIONALITY ----------
function renderChatView() {
  if (!chatMessagesList) return;
  if (messages.length === 0) {
    chatMessagesList.innerHTML = `<div class="empty-state">💬 No messages yet. Start the conversation!</div>`;
    return;
  }
  let html = "";
  messages.slice().forEach((msg) => {
    html += `
        <div class="chat-message">
          <div class="message-meta">
            <strong>${escapeHtml(msg.senderName)}</strong> (${msg.senderRole}) • ${new Date(msg.timestamp).toLocaleTimeString()}
          </div>
          <div>${escapeHtml(msg.text)}</div>
        </div>
      `;
  });
  chatMessagesList.innerHTML = html;
  chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
}

function sendChatMessage(text) {
  if (!text.trim()) return;
  const newMsg = {
    id: Date.now(),
    senderName: currentUser.name,
    senderRole: currentUser.role,
    text: text.trim(),
    timestamp: Date.now(),
  };
  messages.push(newMsg);
  persistMessages();
  renderChatView();
  chatMsgInput.value = "";
}

// ---------- SWITCH VIEWS (Tasks / Chat) ----------
function switchView(view) {
  activeView = view;
  if (view === "tasks") {
    tasksViewDiv.style.display = "block";
    chatViewDiv.style.display = "none";
    renderTasksView();
  } else {
    tasksViewDiv.style.display = "none";
    chatViewDiv.style.display = "block";
    renderChatView();
  }
  // Update nav active style
  document.querySelectorAll(".nav-item").forEach((btn) => {
    if (btn.dataset.view === view) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

// ---------- RENDER FULL UI (header, sidebar, initial view) ----------
function renderUI() {
  if (!currentUser) return;
  sidebarUserName.innerText = currentUser.name;
  sidebarUserRole.innerText =
    currentUser.role === "Project Manager" ? "👔 Manager" : "👩‍💻 Employee";
  profileAvatar.innerText =
    currentUser.role === "Project Manager" ? "👔" : "👩‍💻";
  // Setup default view
  switchView("tasks");
}

// ---------- EVENT LISTENERS & INITIALIZATION ----------
function initEventListeners() {
  logoutBtnSidebar.addEventListener("click", () => {
    logout();
  });
  sendChatMsgBtn.addEventListener("click", () =>
    sendChatMessage(chatMsgInput.value),
  );
  chatMsgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage(chatMsgInput.value);
  });
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView(btn.dataset.view);
    });
  });
}

// Helper escape
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Startup
function bootstrap() {
  seedInitialData();
  loadAllData();
  initEventListeners();
  if (checkAutoLogin()) {
    renderUI();
  } else {
    loginContainer.style.display = "flex";
    mainApp.style.display = "none";
  }
  loginBtn.addEventListener("click", () => {
    const name = loginNameInput.value.trim();
    const role = loginRoleSelect.value;
    if (loginUser(name, role)) {
      loadAllData(); // refresh users list after potential addition
      loginContainer.style.display = "none";
      mainApp.style.display = "block";
      renderUI();
    }
  });
}

bootstrap();
