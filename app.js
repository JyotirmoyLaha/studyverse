/* ============================================
   StudyVerse — Application Logic
   ============================================ */

// ── Firebase Configuration ──
// NOTE: Firebase web API keys are NOT secret. They are always visible
// in the browser. Your DATA is protected by Firestore Security Rules,
// not by hiding these keys. See FIREBASE_SETUP_GUIDE.md for details.
const firebaseConfig = {
    apiKey: "AIzaSyBzzz-p9O3b6cFSmak_llQaVVavMkMhKnw",
    authDomain: "studyverse-80992.firebaseapp.com",
    projectId: "studyverse-80992",
    storageBucket: "studyverse-80992.firebasestorage.app",
    messagingSenderId: "54219323523",
    appId: "1:54219323523:web:0de07d37c14853da9dc3b6",
    measurementId: "G-6H4WG9CS5G"
};

// Initialize Firebase
let auth, db;
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} catch (err) {
    console.error('🔥 Firebase init error:', err);
    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
        alert('Firebase error: ' + err.message);
    });
}

// ── State ──
let currentUser = null;
let editingEntryId = null;
let uploadedImages = [];
let allEntries = [];
let currentEntryType = 'study';   // 'study' or 'life'
let currentFilter = 'all';        // 'all', 'study', or 'life'
let selectedMood = '';

// ── Theme Toggle ──
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('studyverse-theme', next);
    updateThemeIcons(next);
}

function updateThemeIcons(theme) {
    const icon = theme === 'light' ? '☀️' : '🌙';
    document.querySelectorAll('.theme-icon').forEach(el => el.textContent = icon);
}

// Apply saved theme on load
(function () {
    const saved = localStorage.getItem('studyverse-theme') || 'dark';
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    // Update icons after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateThemeIcons(saved));
    } else {
        updateThemeIcons(saved);
    }
})();

// ============================================
// 🌸 SAKURA BLOSSOM PARTICLE SYSTEM
// ============================================
class SakuraSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.petals = [];
        this.mouse = { x: -1000, y: -1000 };
        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const count = Math.min(50, Math.floor((this.canvas.width * this.canvas.height) / 25000));
        this.petals = [];
        for (let i = 0; i < count; i++) {
            this.petals.push(this.createPetal(true));
        }
    }

    createPetal(randomY = false) {
        return {
            x: Math.random() * this.canvas.width,
            y: randomY ? Math.random() * this.canvas.height : -20,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 0.4 + 0.15,       // gentle fall
            speedX: Math.random() * 0.3 - 0.15,        // slight horizontal drift
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.015,
            sway: Math.random() * Math.PI * 2,         // phase for sway
            swaySpeed: Math.random() * 0.008 + 0.004,
            swayAmount: Math.random() * 30 + 15,       // sway amplitude
            opacity: Math.random() * 0.4 + 0.15,
            color: this.getColor(),
            type: Math.random() > 0.3 ? 'petal' : 'dot', // mix petals and tiny dots
        };
    }

    getColor() {
        const colors = [
            { r: 240, g: 160, b: 184 },   // sakura pink
            { r: 245, g: 185, b: 195 },   // light sakura
            { r: 212, g: 112, b: 138 },   // deep sakura
            { r: 176, g: 156, b: 216 },   // wisteria
            { r: 255, g: 220, b: 210 },   // peach
            { r: 232, g: 200, b: 120 },   // koi gold
            { r: 240, g: 235, b: 228 },   // cream white
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    drawPetal(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = p.opacity;

        if (p.type === 'petal') {
            // Draw petal shape — two curved quadratic bezier curves
            const s = p.size;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(s * 0.8, -s * 0.5, s, 0);
            this.ctx.quadraticCurveTo(s * 0.8, s * 0.5, 0, 0);
            this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 1)`;
            this.ctx.fill();

            // Subtle inner glow
            this.ctx.beginPath();
            this.ctx.moveTo(s * 0.2, 0);
            this.ctx.quadraticCurveTo(s * 0.6, -s * 0.2, s * 0.8, 0);
            this.ctx.quadraticCurveTo(s * 0.6, s * 0.2, s * 0.2, 0);
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            this.ctx.fill();
        } else {
            // Tiny glowing dot (firefly-like)
            const s = p.size * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, s, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 1)`;
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    bindEvents() {
        window.addEventListener('resize', () => { this.resize(); this.init(); });
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.petals.length; i++) {
            const p = this.petals[i];

            // Gentle sway motion
            p.sway += p.swaySpeed;
            p.x += p.speedX + Math.sin(p.sway) * 0.3;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;

            // Mouse repulsion — gentle push
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                const force = (80 - dist) / 80 * 0.4;
                p.x += (dx / dist) * force;
                p.y += (dy / dist) * force;
            }

            // Recycle petals that fall off screen
            if (p.y > this.canvas.height + 20 || p.x < -40 || p.x > this.canvas.width + 40) {
                this.petals[i] = this.createPetal(false);
                continue;
            }

            this.drawPetal(p);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Init sakura on load
const particleCanvas = document.getElementById('particles-canvas');
const sakuraSystem = new SakuraSystem(particleCanvas);

// ============================================
// AUTHENTICATION
// ============================================
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    showLoading(true);
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            const displayName = user.displayName || 'Student';
            const knownKey = 'studyverse-known-' + user.uid;

            if (localStorage.getItem(knownKey)) {
                // Returning user (has logged in before)
                showToast(`Welcome back 🎉, ${displayName}`, 'success');
            } else {
                // First-time login
                localStorage.setItem(knownKey, 'true');
                showToast(`Welcome! 🎉, ${displayName}`, 'success');
            }
        })
        .catch((error) => {
            console.error('Auth error:', error);
            showToast('Sign-in failed: ' + error.message, 'error');
            showLoading(false);
        });
}

function signOutUser() {
    auth.signOut()
        .then(() => {
            showToast('Signed out successfully', 'info');
        })
        .catch((error) => {
            showToast('Error signing out', 'error');
        });
}

// Auth state observer
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showDashboard(user);
            loadEntries().catch(err => {
                console.error('Load entries error:', err);
                showLoading(false);
            });
        } else {
            currentUser = null;
            showLogin();
        }
    });
} else {
    // Firebase didn't init — make sure login page shows
    document.addEventListener('DOMContentLoaded', () => {
        showLogin();
    });
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboard').classList.remove('active');
    showLoading(false);
}

function showDashboard(user) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');

    document.getElementById('userName').textContent = user.displayName || 'Student';
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/40';

    showLoading(false);
}

// ============================================
// ENTRY TYPE TOGGLE
// ============================================
function setEntryType(type) {
    currentEntryType = type;

    // Toggle buttons
    document.getElementById('toggleStudy').classList.toggle('active', type === 'study');
    document.getElementById('toggleLife').classList.toggle('active', type === 'life');

    // Toggle field sections
    document.getElementById('studyFields').classList.toggle('active', type === 'study');
    document.getElementById('lifeFields').classList.toggle('active', type === 'life');

    // Update modal title
    if (!editingEntryId) {
        document.getElementById('modalTitleText').textContent =
            type === 'study' ? 'New Study Entry' : 'New Life Entry';
    }
}

// ============================================
// MOOD SELECTOR
// ============================================
function selectMood(element, mood) {
    // Deselect all
    document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
    // Select this one
    element.classList.add('selected');
    selectedMood = mood;
}

// ============================================
// FILTER TABS
// ============================================
function filterEntries(filter) {
    currentFilter = filter;

    // Update tab styling
    document.getElementById('tabAll').classList.toggle('active', filter === 'all');
    document.getElementById('tabStudy').classList.toggle('active', filter === 'study');
    document.getElementById('tabLife').classList.toggle('active', filter === 'life');

    renderEntries();
}

// ============================================
// FIRESTORE CRUD OPERATIONS
// ============================================
function getUserEntriesRef() {
    return db.collection('users').doc(currentUser.uid).collection('entries');
}

async function loadEntries() {
    if (!currentUser) return;

    try {
        const snapshot = await getUserEntriesRef()
            .orderBy('date', 'desc')
            .get();

        allEntries = [];
        snapshot.forEach((doc) => {
            allEntries.push({ id: doc.id, ...doc.data() });
        });

        renderEntries();
        updateStats();
    } catch (error) {
        console.error('Error loading entries:', error);
        showToast('Error loading entries. Check your Firebase config.', 'error');
    }
}

async function saveEntry() {
    if (!currentUser) return;

    const date = document.getElementById('entryDate').value;

    if (!date) {
        showToast('Please select a date.', 'error');
        return;
    }

    const btnSave = document.getElementById('btnSave');
    btnSave.disabled = true;
    btnSave.textContent = 'Saving...';

    let entryData;

    if (currentEntryType === 'study') {
        const subject = document.getElementById('entrySubject').value.trim();
        const text = document.getElementById('entryText').value.trim();
        const progress = document.getElementById('entryProgress').value;

        if (!text) {
            showToast('Please write about what you studied.', 'error');
            btnSave.disabled = false;
            btnSave.textContent = 'Save Entry';
            return;
        }

        entryData = {
            type: 'study',
            date: date,
            subject: subject,
            text: text,
            progress: progress,
            images: uploadedImages.slice(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    } else {
        const lifeTitle = document.getElementById('lifeTitle').value.trim();
        const lifeText = document.getElementById('lifeText').value.trim();

        if (!lifeText) {
            showToast('Please write about your day.', 'error');
            btnSave.disabled = false;
            btnSave.textContent = 'Save Entry';
            return;
        }

        entryData = {
            type: 'life',
            date: date,
            lifeTitle: lifeTitle,
            text: lifeText,
            mood: selectedMood,
            images: uploadedImages.slice(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    }

    try {
        if (editingEntryId) {
            // Update existing
            delete entryData.createdAt;
            await getUserEntriesRef().doc(editingEntryId).update(entryData);
            showToast('Entry updated! ✏️', 'success');
        } else {
            // Create new
            await getUserEntriesRef().add(entryData);
            showToast('Entry saved! 🎉', 'success');
        }

        closeModal();
        await loadEntries();
    } catch (error) {
        console.error('Error saving entry:', error);
        showToast('Error saving entry: ' + error.message, 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Save Entry';
    }
}

async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
        await getUserEntriesRef().doc(entryId).delete();
        showToast('Entry deleted 🗑️', 'info');
        await loadEntries();
    } catch (error) {
        console.error('Error deleting entry:', error);
        showToast('Error deleting entry', 'error');
    }
}

function editEntry(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    editingEntryId = entryId;
    const entryType = entry.type || 'study';
    setEntryType(entryType);

    document.getElementById('modalTitleText').textContent = 'Edit Entry';
    document.getElementById('entryDate').value = entry.date;

    if (entryType === 'study') {
        document.getElementById('entrySubject').value = entry.subject || '';
        document.getElementById('entryText').value = entry.text || '';
        document.getElementById('entryProgress').value = entry.progress || 'in-progress';
    } else {
        document.getElementById('lifeTitle').value = entry.lifeTitle || '';
        document.getElementById('lifeText').value = entry.text || '';
        selectedMood = entry.mood || '';
        // Highlight the matching mood button
        document.querySelectorAll('.mood-option').forEach(el => {
            el.classList.toggle('selected', selectedMood && el.textContent.trim() === selectedMood.trim());
        });
    }

    uploadedImages = entry.images ? [...entry.images] : [];
    renderImagePreviews();

    document.getElementById('entryModal').classList.add('active');
}

// ============================================
// RENDERING
// ============================================
function renderEntries() {
    const feed = document.getElementById('entriesFeed');

    // Filter entries
    let filtered = allEntries;
    if (currentFilter === 'study') {
        filtered = allEntries.filter(e => (e.type || 'study') === 'study');
    } else if (currentFilter === 'life') {
        filtered = allEntries.filter(e => e.type === 'life');
    }

    if (filtered.length === 0) {
        feed.innerHTML = '';
        feed.appendChild(createEmptyState());
        return;
    }

    feed.innerHTML = '';

    filtered.forEach((entry, index) => {
        const card = document.createElement('div');
        const entryType = entry.type || 'study';
        card.className = 'entry-card' + (entryType === 'life' ? ' life-entry' : '');
        card.style.animationDelay = `${index * 0.08}s`;

        const formattedDate = formatDate(entry.date);

        let bodyHTML = '';
        let tagsHTML = '';

        if (entryType === 'study') {
            const progressEmoji = getProgressEmoji(entry.progress);
            bodyHTML = `<div class="entry-text">${escapeHtml(entry.text)}</div>`;
            if (entry.subject) {
                tagsHTML = `
          <span class="entry-tag type-tag">📖 Study</span>
          <span class="entry-tag">${escapeHtml(entry.subject)}</span>
          <span class="entry-tag">${progressEmoji}</span>
        `;
            } else {
                tagsHTML = `<span class="entry-tag type-tag">📖 Study</span>`;
            }
        } else {
            // Daily life
            let moodTag = '';
            if (entry.mood) {
                moodTag = `<span class="entry-tag">${escapeHtml(entry.mood)}</span>`;
            }
            const titleLine = entry.lifeTitle ? `<strong>${escapeHtml(entry.lifeTitle)}</strong><br>` : '';
            bodyHTML = `<div class="entry-text">${titleLine}${escapeHtml(entry.text)}</div>`;
            tagsHTML = `
        <span class="entry-tag type-tag">🌟 Life</span>
        ${moodTag}
      `;
        }

        let imagesHTML = '';
        if (entry.images && entry.images.length > 0) {
            imagesHTML = `<div class="entry-images">
        ${entry.images.map(img => `<img class="entry-image" src="${img}" alt="Image" onclick="openLightbox('${img.replace(/'/g, "\\'")}')">`).join('')}
      </div>`;
        }

        card.innerHTML = `
      <div class="entry-header">
        <div class="entry-date">
          <span class="icon">📅</span> ${formattedDate}
        </div>
        <div class="entry-actions">
          <button class="btn-icon edit" onclick="editEntry('${entry.id}')" title="Edit">✏️</button>
          <button class="btn-icon" onclick="deleteEntry('${entry.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="entry-body">
        ${bodyHTML}
        ${imagesHTML}
      </div>
      <div class="entry-tags">
        ${tagsHTML}
      </div>
    `;

        feed.appendChild(card);
    });
}

function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';

    let msg = 'Add your first entry and begin tracking your progress today.';
    if (currentFilter === 'study') {
        msg = 'No study entries yet. Start logging what you learn each day!';
    } else if (currentFilter === 'life') {
        msg = 'No life entries yet. Start capturing your daily moments!';
    }

    div.innerHTML = `
    <div class="empty-icon">🚀</div>
    <h3 class="empty-title">Start Your Journey!</h3>
    <p class="empty-text">${msg}</p>
  `;
    return div;
}

function updateStats() {
    const studyEntries = allEntries.filter(e => (e.type || 'study') === 'study').length;
    const lifeEntries = allEntries.filter(e => e.type === 'life').length;
    const totalImages = allEntries.reduce((sum, e) => sum + (e.images ? e.images.length : 0), 0);

    // Calculate streak
    const streak = calculateStreak();

    // Animate counters
    animateCounter('statTotalEntries', studyEntries);
    animateCounter('statStreak', streak);
    animateCounter('statLifeEntries', lifeEntries);
    animateCounter('statImages', totalImages);

    // Progress bar (monthly goal = 30 entries)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthEntries = allEntries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const goalEntries = 30;
    const percent = Math.min(100, Math.round((monthEntries / goalEntries) * 100));

    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressDone').textContent = monthEntries;
    document.getElementById('progressGoal').textContent = goalEntries;
}

function calculateStreak() {
    if (allEntries.length === 0) return 0;

    // Get unique dates sorted descending
    const dates = [...new Set(allEntries.map(e => e.date))].sort().reverse();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
        const entryDate = new Date(dates[i]);
        entryDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === expectedDate.getTime()) {
            streak++;
        } else if (i === 0) {
            // Check if yesterday is the start
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            if (entryDate.getTime() === yesterday.getTime()) {
                streak++;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return streak;
}

function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 800;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = Math.round(current + (target - current) * eased);
        element.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================================
// MODAL
// ============================================
function openModal() {
    editingEntryId = null;
    setEntryType('study');
    document.getElementById('modalTitleText').textContent = 'New Entry';
    document.getElementById('entryDate').value = getTodayDate();
    document.getElementById('entrySubject').value = '';
    document.getElementById('entryText').value = '';
    document.getElementById('entryProgress').value = 'in-progress';
    document.getElementById('lifeTitle').value = '';
    document.getElementById('lifeText').value = '';
    selectedMood = '';
    document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
    uploadedImages = [];
    renderImagePreviews();

    document.getElementById('entryModal').classList.add('active');
}

function closeModal() {
    document.getElementById('entryModal').classList.remove('active');
    editingEntryId = null;
    uploadedImages = [];
    renderImagePreviews();
}

// Close modal on overlay click
document.getElementById('entryModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// ============================================
// IMAGE HANDLING
// ============================================
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');

uploadArea.addEventListener('click', () => imageInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

imageInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    imageInput.value = '';
});

function handleFiles(files) {
    const remaining = 3 - uploadedImages.length;
    if (remaining <= 0) {
        showToast('Maximum 3 images per entry', 'error');
        return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);

    filesToProcess.forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
            showToast(`${file.name} is too large (max 2MB)`, 'error');
            return;
        }

        compressAndAddImage(file);
    });
}

function compressAndAddImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Compress
            const canvas = document.createElement('canvas');
            const maxDim = 800;
            let w = img.width;
            let h = img.height;

            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = (h / w) * maxDim;
                    w = maxDim;
                } else {
                    w = (w / h) * maxDim;
                    h = maxDim;
                }
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            uploadedImages.push(compressed);
            renderImagePreviews();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderImagePreviews() {
    const container = document.getElementById('imagePreviews');
    container.innerHTML = '';

    uploadedImages.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = 'image-preview';
        div.innerHTML = `
      <img src="${src}" alt="Preview">
      <button class="remove-btn" onclick="removeImage(${index})">✕</button>
    `;
        container.appendChild(div);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
}

// ============================================
// LIGHTBOX
// ============================================
function openLightbox(src) {
    document.getElementById('lightboxImage').src = src;
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// Close lightbox on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
        closeModal();
    }
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============================================
// LOADING
// ============================================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// ============================================
// HELPERS
// ============================================
function getTodayDate() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
}

function getProgressEmoji(progress) {
    const map = {
        'just-started': '🌱 Just Started',
        'in-progress': '📖 In Progress',
        'almost-done': '🔥 Almost Done',
        'completed': '✅ Completed',
    };
    return map[progress] || '📖 In Progress';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
