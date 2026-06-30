/**
 * TaskFlow — app.js
 * ─────────────────────────────────────────────────────────
 * A feature-rich To-Do application built with Vanilla JS.
 *
 * Key JavaScript Concepts Demonstrated:
 *  ✦ ES6 Classes & OOP  (TodoApp, Task)
 *  ✦ LocalStorage API   (persist data across sessions)
 *  ✦ Array Methods      (filter, map, sort, reduce, find, some)
 *  ✦ DOM Manipulation   (createElement, querySelector, classList)
 *  ✦ Event Delegation   (single listener on parent → handle all children)
 *  ✦ Drag & Drop API    (HTML5 native draggable)
 *  ✦ Date Handling      (compare, format, overdue detection)
 *  ✦ Debouncing         (search input throttle)
 *  ✦ Template Literals  (dynamic HTML generation)
 *  ✦ Destructuring      (object & array)
 *  ✦ Spread Operator    (immutable state updates)
 *  ✦ Optional Chaining  (safe deep access)
 *  ✦ Nullish Coalescing (default fallbacks)
 *  ✦ Module Pattern     (IIFE / class encapsulation)
 * ─────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════
// 1.  TASK MODEL
//     Represents a single task with all its properties.
// ═══════════════════════════════════════════════════════════

class Task {
  /**
   * @param {string} title    - Task name (required)
   * @param {Object} options  - Optional task properties
   */
  constructor(title, options = {}) {
    this.id        = crypto.randomUUID();          // Unique ID per task
    this.title     = title.trim();
    this.notes     = options.notes?.trim() ?? '';
    this.priority  = options.priority  ?? 'medium'; // 'high' | 'medium' | 'low'
    this.category  = options.category  ?? 'General';
    this.due       = options.due       ?? '';        // ISO date string
    this.completed = false;
    this.createdAt = new Date().toISOString();
    this.order     = options.order ?? Date.now();   // For drag-drop reorder
  }
}

// ═══════════════════════════════════════════════════════════
// 2.  MAIN APPLICATION CLASS
//     All state, logic, and DOM interaction lives here.
// ═══════════════════════════════════════════════════════════

class TodoApp {
  constructor() {
    // ── State ────────────────────────────────────────────
    this.tasks        = [];           // Master array of Task objects
    this.activeFilter = 'all';        // Sidebar view filter
    this.activeCategory = null;       // Category filter (null = all)
    this.searchQuery  = '';           // Live search string
    this.sortBy       = 'created';    // 'created' | 'due' | 'priority' | 'alpha'
    this.editingId    = null;         // ID of task being edited (null = new)
    this.selectedPriority = 'medium'; // Modal priority picker state
    this.dragSrcId    = null;         // Drag-and-drop: source task id

    // ── Category color map ────────────────────────────────
    this.catColors = {
      General:  '#6c63ff',
      Work:     '#60a5fa',
      Personal: '#f472b6',
      Shopping: '#34d399',
      Health:   '#fb923c',
      Study:    '#facc15',
    };

    // ── Priority sort weight ──────────────────────────────
    this.priorityWeight = { high: 0, medium: 1, low: 2 };

    this.init();
  }

  // ── 2a. Init ──────────────────────────────────────────
  init() {
    this.loadFromStorage();
    this.cacheDOM();
    this.bindEvents();
    this.applyTheme(localStorage.getItem('tf_theme') ?? 'dark');
    this.render();
  }

  // ── 2b. DOM Cache ────────────────────────────────────────
  // Cache frequently accessed DOM nodes to avoid repeated queries.
  cacheDOM() {
    this.taskList     = document.getElementById('taskList');
    this.emptyState   = document.getElementById('emptyState');
    this.fabBtn       = document.getElementById('fabBtn');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalTitle   = document.getElementById('modalTitle');
    this.modalSave    = document.getElementById('modalSave');
    this.modalCancel  = document.getElementById('modalCancel');
    this.modalClose   = document.getElementById('modalClose');
    this.taskTitle    = document.getElementById('taskTitle');
    this.taskNotes    = document.getElementById('taskNotes');
    this.taskCategory = document.getElementById('taskCategory');
    this.taskDue      = document.getElementById('taskDue');
    this.charCount    = document.getElementById('charCount');
    this.priorityBtns = document.querySelectorAll('.priority-btn');
    this.searchInput  = document.getElementById('searchInput');
    this.searchClear  = document.getElementById('searchClear');
    this.sortSelect   = document.getElementById('sortSelect');
    this.topbarTitle  = document.getElementById('topbarTitle');
    this.categoryList = document.getElementById('categoryList');
    this.themeToggle  = document.getElementById('themeToggle');
    this.menuToggle   = document.getElementById('menuToggle');
    this.sidebar      = document.querySelector('.sidebar');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.toastContainer = document.getElementById('toastContainer');
    this.navItems     = document.querySelectorAll('.nav-item');
  }

  // ── 2c. Bind Events ──────────────────────────────────────
  // Centralised event binding. Uses delegation where possible.
  bindEvents() {
    // FAB → open modal
    this.fabBtn.addEventListener('click', () => this.openModal());

    // Modal close/cancel
    this.modalClose.addEventListener('click',  () => this.closeModal());
    this.modalCancel.addEventListener('click', () => this.closeModal());
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // Modal save
    this.modalSave.addEventListener('click', () => this.handleSave());

    // Enter key saves modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
      if (e.key === 'Enter' && !this.modalOverlay.classList.contains('hidden') && e.target !== this.taskNotes) {
        this.handleSave();
      }
    });

    // Priority picker
    this.priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => this.selectPriority(btn.dataset.value));
    });

    // Character counter — demonstrates input event + closure
    this.taskTitle.addEventListener('input', () => {
      const len = this.taskTitle.value.length;
      this.charCount.textContent = `${len} / 120`;
    });

    // Search — debounced to avoid re-rendering on every keystroke
    this.searchInput.addEventListener('input', this.debounce(() => {
      this.searchQuery = this.searchInput.value.trim().toLowerCase();
      this.searchClear.classList.toggle('hidden', !this.searchQuery);
      this.render();
    }, 180));

    this.searchClear.addEventListener('click', () => {
      this.searchInput.value = '';
      this.searchQuery = '';
      this.searchClear.classList.add('hidden');
      this.render();
    });

    // Sort
    this.sortSelect.addEventListener('change', () => {
      this.sortBy = this.sortSelect.value;
      this.render();
    });

    // Sidebar nav — Event delegation on static parent
    document.querySelector('.sidebar-nav').addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      this.activeFilter   = item.dataset.filter;
      this.activeCategory = null;
      this.updateNavUI();
      this.render();
      this.closeSidebarMobile();
    });

    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      this.applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Mobile menu
    this.menuToggle.addEventListener('click', () => this.toggleSidebarMobile());
    this.sidebarOverlay.addEventListener('click', () => this.closeSidebarMobile());

    // Task list — Event delegation (handles all task actions)
    this.taskList.addEventListener('click',    (e) => this.handleTaskClick(e));
    this.taskList.addEventListener('dragstart',(e) => this.handleDragStart(e));
    this.taskList.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.taskList.addEventListener('drop',     (e) => this.handleDrop(e));
    this.taskList.addEventListener('dragend',  (e) => this.handleDragEnd(e));
  }

  // ═══════════════════════════════════════════════════════════
  // 3.  CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════

  // Add a new task
  addTask(title, options) {
    const task = new Task(title, options);
    this.tasks.unshift(task);   // Prepend — newest first
    this.saveToStorage();
    this.render();
    this.toast(`Task added!`, 'success');
    return task;
  }

  // Update an existing task by ID
  updateTask(id, updates) {
    this.tasks = this.tasks.map(t =>
      t.id === id ? { ...t, ...updates } : t   // Spread for immutability
    );
    this.saveToStorage();
    this.render();
  }

  // Delete a task by ID
  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveToStorage();
    this.render();
    this.toast('Task deleted.', 'error');
  }

  // Toggle complete / incomplete
  toggleComplete(id) {
    this.tasks = this.tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    this.saveToStorage();
    this.render();
  }

  // ═══════════════════════════════════════════════════════════
  // 4.  FILTERING, SEARCHING & SORTING
  //     Demonstrates chained array methods.
  // ═══════════════════════════════════════════════════════════

  getFilteredTasks() {
    const today = this.todayStr();

    // Step 1: filter by view (sidebar)
    let result = this.tasks.filter(task => {
      switch (this.activeFilter) {
        case 'all':       return true;
        case 'today':     return task.due === today && !task.completed;
        case 'upcoming':  return task.due > today   && !task.completed;
        case 'overdue':   return task.due && task.due < today && !task.completed;
        case 'completed': return task.completed;
        default:          return true;
      }
    });

    // Step 2: filter by category
    if (this.activeCategory) {
      result = result.filter(t => t.category === this.activeCategory);
    }

    // Step 3: filter by search query
    if (this.searchQuery) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(this.searchQuery) ||
        t.notes.toLowerCase().includes(this.searchQuery) ||
        t.category.toLowerCase().includes(this.searchQuery)
      );
    }

    // Step 4: sort
    result = this.sortTasks(result);

    return result;
  }

  sortTasks(tasks) {
    // Clone before sorting so we don't mutate state
    return [...tasks].sort((a, b) => {
      switch (this.sortBy) {
        case 'due':
          // Tasks with no due date go to the end
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due);

        case 'priority':
          return this.priorityWeight[a.priority] - this.priorityWeight[b.priority];

        case 'alpha':
          return a.title.localeCompare(b.title);

        case 'created':
        default:
          return b.order - a.order;   // Newest first
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 5.  RENDERING
  //     Build DOM from state — "state → UI" pattern.
  // ═══════════════════════════════════════════════════════════

  render() {
    this.renderTasks();
    this.renderSidebarBadges();
    this.renderCategoryList();
    this.renderStats();
    this.updateNavUI();
  }

  renderTasks() {
    const tasks = this.getFilteredTasks();

    if (tasks.length === 0) {
      this.taskList.innerHTML = '';
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');

    // Build HTML string with template literals, then set once (performance)
    this.taskList.innerHTML = tasks.map(task => this.buildTaskCard(task)).join('');

    // Re-attach draggable after rerender
    this.taskList.querySelectorAll('.task-card').forEach(card => {
      card.setAttribute('draggable', 'true');
    });
  }

  // Build a single task card HTML string
  buildTaskCard(task) {
    const isOverdue = task.due && task.due < this.todayStr() && !task.completed;
    const isToday   = task.due === this.todayStr() && !task.completed;

    const dueLabel = task.due
      ? `<span class="task-due ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">
           ⏱ ${isOverdue ? 'Overdue · ' : isToday ? 'Today · ' : ''}${this.formatDate(task.due)}
         </span>`
      : '';

    const catColor = this.catColors[task.category] ?? '#6c63ff';
    const catTag = `<span class="task-tag" style="background:${catColor}22;color:${catColor}">${task.category}</span>`;

    const notesHTML = task.notes
      ? `<p class="task-notes">${this.escapeHTML(task.notes)}</p>`
      : '';

    return `
      <div class="task-card ${task.completed ? 'completed' : ''}"
           data-id="${task.id}"
           data-priority="${task.priority}">

        <button class="task-check" data-action="toggle" title="Mark complete">
          ${task.completed ? '✓' : ''}
        </button>

        <div class="task-body">
          <p class="task-title">${this.escapeHTML(task.title)}</p>
          ${notesHTML}
          <div class="task-meta">
            ${catTag}
            <span class="task-priority ${task.priority}">${task.priority}</span>
            ${dueLabel}
          </div>
        </div>

        <div class="task-actions">
          <button class="task-btn" data-action="edit" title="Edit">✎</button>
          <button class="task-btn delete" data-action="delete" title="Delete">✕</button>
        </div>
      </div>
    `;
  }

  // Sidebar badge counts — uses reduce for aggregation
  renderSidebarBadges() {
    const today = this.todayStr();

    // Reduce tasks into a counts object in one pass (efficient)
    const counts = this.tasks.reduce((acc, t) => {
      acc.all++;
      if (t.completed) acc.completed++;
      if (!t.completed) {
        if (t.due === today)               acc.today++;
        if (t.due > today)                 acc.upcoming++;
        if (t.due && t.due < today)        acc.overdue++;
      }
      return acc;
    }, { all: 0, today: 0, upcoming: 0, overdue: 0, completed: 0 });

    Object.entries(counts).forEach(([key, val]) => {
      const el = document.getElementById(`badge-${key}`);
      if (el) el.textContent = val;
    });
  }

  renderCategoryList() {
    const categories = Object.keys(this.catColors);
    this.categoryList.innerHTML = categories.map(cat => {
      const count = this.tasks.filter(t => t.category === cat).length;
      const color = this.catColors[cat];
      const active = this.activeCategory === cat ? 'active' : '';
      return `
        <button class="category-pill ${active}" data-cat="${cat}">
          <span class="cat-dot" style="background:${color}"></span>
          ${cat}
          <span class="nav-badge" style="margin-left:auto">${count}</span>
        </button>
      `;
    }).join('');

    // Bind category click
    this.categoryList.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.dataset.cat;
        this.activeCategory = this.activeCategory === cat ? null : cat;
        this.activeFilter   = 'all';
        this.updateNavUI();
        this.render();
        this.closeSidebarMobile();
      });
    });
  }

  renderStats() {
    const total   = this.tasks.length;
    const done    = this.tasks.filter(t => t.completed).length;
    const pending = total - done;
    document.getElementById('statTotal').textContent   = total;
    document.getElementById('statDone').textContent    = done;
    document.getElementById('statPending').textContent = pending;
  }

  updateNavUI() {
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.filter === this.activeFilter && !this.activeCategory);
    });

    // Update topbar title
    const titles = {
      all:       'All Tasks',
      today:     'Today',
      upcoming:  'Upcoming',
      overdue:   'Overdue',
      completed: 'Completed',
    };
    this.topbarTitle.textContent = this.activeCategory
      ? this.activeCategory
      : (titles[this.activeFilter] ?? 'Tasks');
  }

  // ═══════════════════════════════════════════════════════════
  // 6.  MODAL
  // ═══════════════════════════════════════════════════════════

  openModal(taskId = null) {
    this.editingId = taskId;

    if (taskId) {
      // Edit mode — populate form with existing task data
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;
      this.taskTitle.value    = task.title;
      this.taskNotes.value    = task.notes;
      this.taskCategory.value = task.category;
      this.taskDue.value      = task.due;
      this.charCount.textContent = `${task.title.length} / 120`;
      this.selectPriority(task.priority);
      this.modalTitle.textContent  = 'Edit Task';
      this.modalSave.textContent   = 'Save Changes';
    } else {
      // New task — reset form
      this.taskTitle.value    = '';
      this.taskNotes.value    = '';
      this.taskCategory.value = 'General';
      this.taskDue.value      = '';
      this.charCount.textContent = '0 / 120';
      this.selectPriority('medium');
      this.modalTitle.textContent  = 'New Task';
      this.modalSave.textContent   = 'Add Task';
    }

    this.taskTitle.classList.remove('error');
    this.modalOverlay.classList.remove('hidden');
    setTimeout(() => this.taskTitle.focus(), 60);
  }

  closeModal() {
    this.modalOverlay.classList.add('hidden');
    this.editingId = null;
  }

  handleSave() {
    const title = this.taskTitle.value.trim();

    // Validation
    if (!title) {
      this.taskTitle.classList.add('error');
      this.taskTitle.focus();
      this.toast('Please enter a task title.', 'error');
      return;
    }

    this.taskTitle.classList.remove('error');

    const options = {
      notes:    this.taskNotes.value,
      priority: this.selectedPriority,
      category: this.taskCategory.value,
      due:      this.taskDue.value,
    };

    if (this.editingId) {
      this.updateTask(this.editingId, { title, ...options });
      this.toast('Task updated!', 'success');
    } else {
      this.addTask(title, options);
    }

    this.closeModal();
  }

  selectPriority(value) {
    this.selectedPriority = value;
    this.priorityBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 7.  TASK EVENT DELEGATION
  //     One listener on the list handles clicks for all cards.
  // ═══════════════════════════════════════════════════════════

  handleTaskClick(e) {
    const btn  = e.target.closest('[data-action]');
    if (!btn) return;

    const card = btn.closest('.task-card');
    const id   = card?.dataset.id;
    if (!id) return;

    switch (btn.dataset.action) {
      case 'toggle': this.toggleComplete(id); break;
      case 'edit':   this.openModal(id);      break;
      case 'delete': this.deleteTask(id);     break;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 8.  DRAG & DROP (HTML5 API)
  //     Demonstrates the full drag cycle: start → over → drop → end.
  // ═══════════════════════════════════════════════════════════

  handleDragStart(e) {
    const card = e.target.closest('.task-card');
    if (!card) return;
    this.dragSrcId = card.dataset.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const card = e.target.closest('.task-card');
    // Highlight drop target
    this.taskList.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
    if (card && card.dataset.id !== this.dragSrcId) {
      card.classList.add('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const targetCard = e.target.closest('.task-card');
    if (!targetCard || targetCard.dataset.id === this.dragSrcId) return;

    const srcIndex  = this.tasks.findIndex(t => t.id === this.dragSrcId);
    const destIndex = this.tasks.findIndex(t => t.id === targetCard.dataset.id);

    if (srcIndex < 0 || destIndex < 0) return;

    // Splice-based reorder (mutate order property then save)
    const [removed] = this.tasks.splice(srcIndex, 1);
    this.tasks.splice(destIndex, 0, removed);

    // Re-assign order values to preserve sequence in storage
    this.tasks.forEach((t, i) => { t.order = this.tasks.length - i; });

    this.saveToStorage();
    this.render();
  }

  handleDragEnd(e) {
    const card = e.target.closest('.task-card');
    card?.classList.remove('dragging');
    this.taskList.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
    this.dragSrcId = null;
  }

  // ═══════════════════════════════════════════════════════════
  // 9.  THEME
  // ═══════════════════════════════════════════════════════════

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tf_theme', theme);
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☾' : '☀';
  }

  // ═══════════════════════════════════════════════════════════
  // 10. MOBILE SIDEBAR
  // ═══════════════════════════════════════════════════════════

  toggleSidebarMobile() {
    this.sidebar.classList.toggle('open');
    this.sidebarOverlay.classList.toggle('visible');
  }

  closeSidebarMobile() {
    this.sidebar.classList.remove('open');
    this.sidebarOverlay.classList.remove('visible');
  }

  // ═══════════════════════════════════════════════════════════
  // 11. LOCALSTORAGE PERSISTENCE
  //     Tasks are serialized to JSON and stored locally.
  // ═══════════════════════════════════════════════════════════

  saveToStorage() {
    localStorage.setItem('tf_tasks', JSON.stringify(this.tasks));
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem('tf_tasks');
      this.tasks = raw ? JSON.parse(raw) : [];
    } catch {
      // Corrupt storage — start fresh
      this.tasks = [];
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 12. TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  toast(message, type = '') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    this.toastContainer.appendChild(el);

    // Auto-dismiss after 2.5s
    setTimeout(() => {
      el.classList.add('fadeOut');
      el.addEventListener('animationend', () => el.remove());
    }, 2500);
  }

  // ═══════════════════════════════════════════════════════════
  // 13. UTILITY HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Debounce: delays function execution until after `delay` ms
   * have elapsed since the last call. Prevents excessive re-renders
   * on fast keystrokes in the search input.
   *
   * @param {Function} fn    - Function to debounce
   * @param {number}   delay - Wait time in ms
   * @returns {Function}     - Debounced wrapper function
   */
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Returns today's date as YYYY-MM-DD (matches <input type="date"> format).
   * Using local date parts avoids UTC offset issues.
   */
  todayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Format a YYYY-MM-DD string to a readable label like "Jun 29".
   * Uses Intl.DateTimeFormat for locale-aware formatting.
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    // Add T00:00 to force local time parsing (not UTC midnight)
    const d = new Date(`${dateStr}T00:00`);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }

  /**
   * Escape user input before injecting into innerHTML.
   * Prevents XSS by converting special characters to HTML entities.
   */
  escapeHTML(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }
}

// ═══════════════════════════════════════════════════════════
// 14. BOOTSTRAP
//     Instantiate the app once the DOM is fully parsed.
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TodoApp();
});
