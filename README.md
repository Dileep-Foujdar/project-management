// created by Dileep Foujdar

//Project Overview
TaskFlow is a modern, fully responsive Project Management & Collaboration Tool built with pure Vanilla JavaScript.
Designed to simulate a real-world office environment, it features a dual-role system (Project Manager and Team Member)
that allows for task delegation, progress tracking, and real-time team communication. The application utilizes browser
local storage to ensure data persistence without the need for a backend database.

// Key Features --------------------------------->
Role-Based Access Control (RBAC): * Project Manager (Admin): Can create, assign, edit, and delete tasks for the entire team.

Team Member: Accesses a personalized dashboard to view assigned tasks and update their status
(Pending, In Progress, Completed).

Dynamic Task Management: A centralized hub for tracking deadlines and project milestones with a clean, intuitive UI.

Integrated Group Chat: A built-in communication panel allowing users to discuss project details. Messages are time-stamped
and saved locally to maintain the conversation history.

Persistent Data: Integrated with LocalStorage API, ensuring all users, tasks, and messages remain saved even after closing
the browser or refreshing the page.

Modern Responsive UI: Built with a "Glassmorphism" aesthetic, utilizing CSS Grid and Flexbox to provide a seamless
experience across desktop, tablet, and mobile devices.

//Technical Highlights --------------------------------->
Custom State Management: Implemented a centralized data handling logic in JavaScript to sync the UI with localStorage updates.

Dynamic Rendering: The interface adapts in real-time based on the logged-in user’s credentials and role permissions.

Clean Code Architecture: Organized using modular functions to handle authentication, task filtering, and chat logic
separately.

