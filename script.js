// STORAGE KEYS
const STORAGE_USERS = "teampulse_users";
const STORAGE_TASKS = "teampulse_tasks";
const STORAGE_MESSAGES = "teampulse_messages";

let currentUser = null;
let allUsers = [];
let tasks = [];
let messages = [];
let activeView = "tasks";

// DOM
const loginContainer = document.getElementById("loginContainer");
const mainApp = document.getElementById("mainApp");
const loginName = document.getElementById("loginName");
const loginRole = document.getElementById("loginRole");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserRole = document.getElementById("sidebarUserRole");
const logoutBtn = document.getElementById("logoutBtnSidebar");
const tasksViewDiv = document.getElementById("tasksView");
const chatViewDiv = document.getElementById("chatView");
const teamViewDiv = document.getElementById("teamView");
const teamNavBtn = document.getElementById("teamNavBtn");
const chatMessagesList = document.getElementById("chatMessagesList");
const chatMsgInput = document.getElementById("chatMsgInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const profileAvatar = document.getElementById("profileAvatar");

// ---------- DATA INIT ----------
function seedData() {
  if (!localStorage.getItem(STORAGE_USERS)) {
    localStorage.setItem(
      STORAGE_USERS,
      JSON.stringify([
        { name: "Alex Boss", role: "Project Manager" },
        { name: "Emma Dev", role: "Developer" },
        { name: "Lisa Design", role: "Designer" },
        { name: "John Writer", role: "Content Writer" },
      ]),
    );
  }
  if (!localStorage.getItem(STORAGE_TASKS)) {
    localStorage.setItem(
      STORAGE_TASKS,
      JSON.stringify([
        {
          id: Date.now() + 1,
          title: "Build Dashboard UI",
          description: "Responsive layout",
          estimatedHours: 8,
          assignedTo: "Emma Dev",
          progress: 45,
          status: "In Progress",
          priority: "High",
          createdBy: "Alex Boss",
        },
        {
          id: Date.now() + 2,
          title: "Create Brand Assets",
          description: "Logo & illustrations",
          estimatedHours: 6,
          assignedTo: "Lisa Design",
          progress: 20,
          status: "Pending",
          priority: "Medium",
          createdBy: "Alex Boss",
        },
        {
          id: Date.now() + 3,
          title: "Write Blog Post",
          description: "Product launch",
          estimatedHours: 3,
          assignedTo: "John Writer",
          progress: 0,
          status: "Pending",
          priority: "Low",
          createdBy: "Alex Boss",
        },
      ]),
    );
  }
  if (!localStorage.getItem(STORAGE_MESSAGES)) {
    localStorage.setItem(
      STORAGE_MESSAGES,
      JSON.stringify([
        {
          id: Date.now() + 100,
          senderName: "Alex Boss",
          senderRole: "Project Manager",
          text: "Welcome to TeamPulse! 🚀",
          timestamp: Date.now() - 3600000,
        },
      ]),
    );
  }
}

function loadData() {
  allUsers = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
  tasks = JSON.parse(localStorage.getItem(STORAGE_TASKS) || "[]");
  messages = JSON.parse(localStorage.getItem(STORAGE_MESSAGES) || "[]");
}
function persistTasks() {
  localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
}
function persistMessages() {
  localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}
function persistUsers() {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(allUsers));
}

// AUTH
function loginUser(name, role) {
  if (!name.trim()) {
    loginError.innerText = "Enter your name";
    return false;
  }
  const idx = allUsers.findIndex(
    (u) => u.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (idx !== -1) allUsers[idx].role = role;
  else allUsers.push({ name: name.trim(), role });
  persistUsers();
  currentUser = { name: name.trim(), role };
  sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
  return true;
}
function logout() {
  currentUser = null;
  sessionStorage.removeItem("currentUser");
  loginContainer.style.display = "flex";
  mainApp.style.display = "none";
}
function checkAutoLogin() {
  const saved = sessionStorage.getItem("currentUser");
  if (saved) {
    currentUser = JSON.parse(saved);
    loadData();
    loginContainer.style.display = "none";
    mainApp.style.display = "block";
    renderUI();
    return true;
  }
  return false;
}

// TEAM MANAGEMENT (BOSS ONLY)
function renderTeamPanel() {
  const container = document.getElementById("memberListContainer");
  if (!container) return;
  if (allUsers.length === 0) {
    container.innerHTML = "<div class='empty-state'>No members</div>";
    return;
  }
  let html = "";
  allUsers.forEach((user) => {
    html += `
        <div class="member-item">
          <span><strong>${escapeHtml(user.name)}</strong> (${user.role})</span>
          ${user.name !== currentUser.name ? `<button class="remove-member-btn" data-name="${escapeHtml(user.name)}">Remove</button>` : "<span>👑 You</span>"}
        </div>
      `;
  });
  container.innerHTML = html;
  document.querySelectorAll(".remove-member-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      if (confirm(`Remove ${name}?`)) {
        allUsers = allUsers.filter((u) => u.name !== name);
        persistUsers();
        renderTeamPanel();
        renderTasksView(); // update assign dropdown
      }
    });
  });
}

function addMember(name, role) {
  if (!name.trim()) return false;
  if (
    allUsers.some((u) => u.name.toLowerCase() === name.trim().toLowerCase())
  ) {
    alert("User exists");
    return false;
  }
  allUsers.push({ name: name.trim(), role });
  persistUsers();
  renderTeamPanel();
  renderTasksView();
  return true;
}

// TASKS: BOSS creates task with estimated hours, MEMBER updates progress %
function addTask(title, desc, estimatedHours, assignedTo, priority) {
  if (!title.trim()) return false;
  tasks.push({
    id: Date.now(),
    title: title.trim(),
    description: desc.trim() || "",
    estimatedHours: parseFloat(estimatedHours) || 0,
    assignedTo,
    progress: 0,
    status: "Pending",
    priority: priority || "Medium",
    createdBy: currentUser.name,
  });
  persistTasks();
  renderTasksView();
  return true;
}
function updateProgress(taskId, newProgress) {
  const t = tasks.find((t) => t.id === taskId);
  if (t) {
    t.progress = Math.min(100, Math.max(0, parseFloat(newProgress)));
    t.status =
      t.progress >= 100
        ? "Completed"
        : t.progress > 0
          ? "In Progress"
          : "Pending";
    persistTasks();
    renderTasksView();
  }
}
function editTask(taskId, updates) {
  const t = tasks.find((t) => t.id === taskId);
  if (t) {
    Object.assign(t, updates);
    persistTasks();
    renderTasksView();
  }
}
function deleteTask(taskId) {
  tasks = tasks.filter((t) => t.id !== taskId);
  persistTasks();
  renderTasksView();
}

// RENDER TASKS (BOSS vs MEMBER)
function renderTasksView() {
  if (!tasksViewDiv) return;
  const isManager = currentUser.role === "Project Manager";
  let html = `<div><h2>📋 Task Board</h2></div>`;

  // stats
  const myTasks = isManager
    ? tasks
    : tasks.filter((t) => t.assignedTo === currentUser.name);
  const avgProgress = myTasks.length
    ? Math.round(myTasks.reduce((s, t) => s + t.progress, 0) / myTasks.length)
    : 0;
  html += `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">${myTasks.length}</div><div>My Tasks</div></div>
        <div class="stat-card"><div class="stat-number">${avgProgress}%</div><div>Avg Progress</div></div>
        <div class="stat-card"><div class="stat-number">${myTasks.filter((t) => t.status === "Completed").length}</div><div>Completed</div></div>
      </div>
    `;

  // Create task form (boss only)
  if (isManager) {
    const teamMembers = allUsers
      .filter((u) => u.role !== "Project Manager")
      .map((u) => u.name);
    const assignOptions = [...new Set([...teamMembers, currentUser.name])];
    html += `
        <div class="card-panel">
          <h3>➕ Assign New Task</h3>
          <div class="form-grid">
            <input type="text" id="taskTitle" placeholder="Title">
            <input type="text" id="taskDesc" placeholder="Description">
            <input type="number" id="taskHours" placeholder="Est. hours" step="0.5">
            <select id="taskAssignTo">${assignOptions.map((n) => `<option value="${n}">${n}</option>`).join("")}</select>
            <select id="taskPriority"><option value="Low">🟢 Low</option><option value="Medium">🟡 Medium</option><option value="High">🔴 High</option></select>
            <button id="createTaskBtn" class="primary">Create Task</button>
          </div>
        </div>
      `;
  }

  let filtered = isManager
    ? [...tasks]
    : tasks.filter((t) => t.assignedTo === currentUser.name);
  if (filtered.length === 0) {
    html += `<div class="card-panel"><div class="empty-state">✨ No tasks yet ✨</div></div>`;
  } else {
    html += `<div class="tasks-grid">`;
    filtered.forEach((task) => {
      const priorityClass = `priority-${task.priority}`;
      const borderColor =
        task.progress >= 100
          ? "#2ecc71"
          : task.progress > 0
            ? "#facc15"
            : "#e74c3c";
      html += `
          <div class="task-card" style="border-left-color: ${borderColor};">
            <div class="task-header" style="display:flex; justify-content:space-between; flex-wrap:wrap;">
              <strong>${escapeHtml(task.title)}</strong>
              <span style="background:#eef2ff; padding:2px 8px; border-radius:20px; font-size:0.7rem;">${task.priority}</span>
            </div>
            <div style="font-size:0.8rem;">📝 ${escapeHtml(task.description || "—")}</div>
            <div style="font-size:0.75rem; margin:4px 0;">⏱️ Est: ${task.estimatedHours} hrs | 👤 ${task.assignedTo}</div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${task.progress}%;"></div></div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
              <span>📊 ${task.progress}% complete</span>
        `;
      if (!isManager && task.assignedTo === currentUser.name) {
        html += `
            <div style="display:flex; gap:6px;">
              <input type="number" id="progress-${task.id}" value="${task.progress}" min="0" max="100" step="5" style="width:70px; padding:4px; border-radius:20px;">
              <button class="update-progress-btn" data-id="${task.id}" style="background:#0f172a; color:white; border:none; padding:4px 12px; border-radius:20px;">Update %</button>
            </div>
          `;
      } else if (isManager) {
        html += `
            <div>
              <button class="edit-task-btn" data-id="${task.id}" data-title="${escapeHtml(task.title)}" data-desc="${escapeHtml(task.description)}" data-hours="${task.estimatedHours}" data-assigned="${task.assignedTo}" data-priority="${task.priority}">✏️ Edit</button>
              <button class="delete-task-btn" data-id="${task.id}">🗑️ Delete</button>
            </div>
          `;
      }
      html += `</div></div>`;
    });
    html += `</div>`;
  }
  tasksViewDiv.innerHTML = html;

  // attach events
  if (isManager) {
    document.getElementById("createTaskBtn")?.addEventListener("click", () => {
      const title = document.getElementById("taskTitle").value;
      const desc = document.getElementById("taskDesc").value;
      const hours = document.getElementById("taskHours").value;
      const assign = document.getElementById("taskAssignTo").value;
      const priority = document.getElementById("taskPriority").value;
      if (addTask(title, desc, hours, assign, priority)) {
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDesc").value = "";
        document.getElementById("taskHours").value = "";
      } else alert("Title required");
    });
    document.querySelectorAll(".edit-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const newTitle = prompt("New title", btn.dataset.title);
        if (newTitle && newTitle.trim()) {
          const newDesc = prompt("Description", btn.dataset.desc) || "";
          const newHours = parseFloat(prompt("Est. hours", btn.dataset.hours));
          const newAssign = prompt("Assign to", btn.dataset.assigned);
          const newPriority = prompt(
            "Priority (Low/Medium/High)",
            btn.dataset.priority,
          );
          const updates = { title: newTitle.trim(), description: newDesc };
          if (!isNaN(newHours)) updates.estimatedHours = newHours;
          if (newAssign) updates.assignedTo = newAssign;
          if (newPriority && ["Low", "Medium", "High"].includes(newPriority))
            updates.priority = newPriority;
          editTask(id, updates);
        }
      });
    });
    document.querySelectorAll(".delete-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Delete?")) deleteTask(parseInt(btn.dataset.id));
      });
    });
  } else {
    document.querySelectorAll(".update-progress-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const progressInput = document.getElementById(`progress-${id}`);
        if (progressInput) updateProgress(id, progressInput.value);
      });
    });
  }
}

// CHAT
function renderChatView() {
  if (!chatMessagesList) return;
  if (messages.length === 0) {
    chatMessagesList.innerHTML =
      "<div class='empty-state'>💬 No messages</div>";
    return;
  }
  let html = "";
  messages.slice().forEach((msg) => {
    html += `<div class="chat-message"><div class="message-meta"><strong>${escapeHtml(msg.senderName)}</strong> (${msg.senderRole}) • ${new Date(msg.timestamp).toLocaleTimeString()}</div><div>${escapeHtml(msg.text)}</div></div>`;
  });
  chatMessagesList.innerHTML = html;
  chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
}
function sendChatMessage() {
  const text = chatMsgInput.value.trim();
  if (!text) return;
  messages.push({
    id: Date.now(),
    senderName: currentUser.name,
    senderRole: currentUser.role,
    text,
    timestamp: Date.now(),
  });
  persistMessages();
  renderChatView();
  chatMsgInput.value = "";
}

// VIEW SWITCH
function switchView(view) {
  activeView = view;
  tasksViewDiv.style.display = view === "tasks" ? "block" : "none";
  chatViewDiv.style.display = view === "chat" ? "block" : "none";
  teamViewDiv.style.display = view === "team" ? "block" : "none";
  document.querySelectorAll(".nav-item").forEach((btn) => {
    if (btn.dataset.view === view) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  if (view === "tasks") renderTasksView();
  if (view === "chat") renderChatView();
  if (view === "team") renderTeamPanel();
}

function renderUI() {
  sidebarUserName.innerText = currentUser.name;
  sidebarUserRole.innerText = currentUser.role;
  profileAvatar.innerText =
    currentUser.role === "Project Manager" ? "👔" : "👤";
  teamNavBtn.style.display =
    currentUser.role === "Project Manager" ? "flex" : "none";
  switchView("tasks");
}

function escapeHtml(str) {
  return str.replace(
    /[&<>]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[m],
  );
}

function bootstrap() {
  seedData();
  loadData();
  if (checkAutoLogin()) renderUI();
  loginBtn.addEventListener("click", () => {
    const name = loginName.value.trim();
    const role = loginRole.value;
    if (loginUser(name, role)) {
      loadData();
      loginContainer.style.display = "none";
      mainApp.style.display = "block";
      renderUI();
    }
  });
  logoutBtn.addEventListener("click", logout);
  sendChatBtn.addEventListener("click", sendChatMessage);
  chatMsgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
  const addMemberBtn = document.getElementById("addMemberBtn");
  if (addMemberBtn)
    addMemberBtn.addEventListener("click", () => {
      const name = document.getElementById("newMemberName").value;
      const role = document.getElementById("newMemberRole").value;
      if (addMember(name, role))
        document.getElementById("newMemberName").value = "";
    });
}
bootstrap();
