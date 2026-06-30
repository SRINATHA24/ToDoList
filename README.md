# ✦ TaskFlow — A Modern To-Do App

A feature-rich, fully responsive To-Do List application built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no dependencies. Designed to demonstrate strong fundamentals in JavaScript while delivering a clean, intentional user experience with dark/light themes, drag-and-drop reordering, and smart filtering.

---

## ✨ Features

- **Add / Edit / Delete** tasks with a smooth modal interface
- **Priority levels** — High / Medium / Low, color-coded for quick scanning
- **Category tagging** — Work, Personal, Shopping, Health, Study, General
- **Smart views** — Today, Upcoming, Overdue, Completed, All
- **Overdue detection** — automatically flags past-due tasks
- **Live search** — debounced, filters by title/notes/category instantly
- **Sort** — by newest, due date, priority, or alphabetically
- **Drag-and-drop reordering** using the native HTML5 Drag & Drop API
- **Dark / Light theme toggle** with persistence
- **LocalStorage persistence** — your tasks survive page refreshes
- **Fully responsive** — collapsible sidebar on mobile
- **Toast notifications** for actions (add, update, delete)
- **XSS-safe rendering** — all user input is escaped before DOM insertion

---

## 🧠 JavaScript Concepts Demonstrated

This project was built intentionally to showcase a range of core and intermediate JavaScript skills:

| Concept | Where it's used |
|---|---|
| ES6 Classes & OOP | `Task` and `TodoApp` classes |
| LocalStorage API | Persisting and rehydrating task data |
| Array methods | `map`, `filter`, `sort`, `reduce`, `find` for state derivation |
| Event delegation | Single listener on `.task-list` handles all card actions |
| HTML5 Drag & Drop API | `dragstart`, `dragover`, `drop`, `dragend` lifecycle |
| Debouncing | Search input avoids re-rendering on every keystroke |
| Template literals | Dynamic HTML generation for task cards |
| Spread/rest & destructuring | Immutable state updates |
| Optional chaining & nullish coalescing | Safe defaults throughout |
| Date handling | Overdue/today detection, locale-aware formatting |

---

## 🛠️ Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties (CSS variables), Flexbox/Grid, no framework
- **Vanilla JavaScript (ES6+)** — zero dependencies
- **LocalStorage** — client-side persistence

---

## 🚀 Getting Started

No build steps, no installs — just open the file.

```bash
git clone https://github.com/SRINATHA24/taskflow-todo-app.git
cd taskflow-todo-app
open index.html   # or just double-click it
```

Or use a local dev server (recommended for live-reload):

```bash
npx live-server
```

---

## 📁 Project Structure

```
taskflow-todo-app/
├── index.html      # Markup & structure
├── style.css        # Theming, layout, animations
├── app.js            # Application logic (TodoApp & Task classes)
└── README.md
```

---

## 📸 Preview

*(Add a screenshot or GIF here after deploying — e.g. via GitHub Pages link)*

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built by **Srinath A** — feedback and PRs welcome!
