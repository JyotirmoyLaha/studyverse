/* ============================================
   StudyVerse — Application Logic
   ============================================ */

// ╔══════════════════════════════════════════════╗
// ║  🔥 FIREBASE CONFIGURATION                  ║
// ║  Replace the values below with YOUR config   ║
// ║  from Firebase Console → Project Settings    ║
// ╚══════════════════════════════════════════════╝
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ── State ──
let currentUser = null;
let editingEntryId = null;
let uploadedImages = [];
let allEntries = [];

// ============================================
// PARTICLE ANIMATION SYSTEM
// ============================================
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
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
    const count = Math.min(80, Math.floor((this.canvas.width * this.canvas.height) / 15000));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: this.getRandomColor(),
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }
  }

  getRandomColor() {
    const colors = [
      'rgba(108, 92, 231,',   // purple
      'rgba(162, 155, 254,',  // light purple
      'rgba(0, 206, 201,',    // teal
      'rgba(253, 121, 168,',  // pink
      'rgba(253, 203, 110,',  // yellow
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;

      // Wrap around edges
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;

      // Pulsing opacity
      const pulsedOpacity = p.opacity + Math.sin(p.pulse) * 0.15;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + ' ' + Math.max(0, pulsedOpacity) + ')';
      this.ctx.fill();

      // Draw connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const lineOpacity = (1 - dist / 150) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(108, 92, 231, ${lineOpacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }

      // Mouse interaction
      const mdx = p.x - this.mouse.x;
      const mdy = p.y - this.mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < 120) {
        const force = (120 - mDist) / 120;
        p.vx += (mdx / mDist) * force * 0.03;
        p.vy += (mdy / mDist) * force * 0.03;
      }

      // Speed damping
      p.vx *= 0.99;
      p.vy *= 0.99;
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Init particles on load
const particleCanvas = document.getElementById('particles-canvas');
const particleSystem = new ParticleSystem(particleCanvas);

// ============================================
// AUTHENTICATION
// ============================================
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  showLoading(true);
  auth.signInWithPopup(provider)
    .then(() => {
      showToast('Welcome back! 🎉', 'success');
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
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    showDashboard(user);
    loadEntries();
  } else {
    currentUser = null;
    showLogin();
  }
});

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
  const subject = document.getElementById('entrySubject').value.trim();
  const text = document.getElementById('entryText').value.trim();
  const progress = document.getElementById('entryProgress').value;

  if (!date || !text) {
    showToast('Please fill in the date and study notes.', 'error');
    return;
  }

  const btnSave = document.getElementById('btnSave');
  btnSave.disabled = true;
  btnSave.textContent = 'Saving...';

  const entryData = {
    date: date,
    subject: subject,
    text: text,
    progress: progress,
    images: uploadedImages.slice(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

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
  document.getElementById('modalTitleText').textContent = 'Edit Entry';
  document.getElementById('entryDate').value = entry.date;
  document.getElementById('entrySubject').value = entry.subject || '';
  document.getElementById('entryText').value = entry.text || '';
  document.getElementById('entryProgress').value = entry.progress || 'in-progress';

  uploadedImages = entry.images ? [...entry.images] : [];
  renderImagePreviews();

  document.getElementById('entryModal').classList.add('active');
}

// ============================================
// RENDERING
// ============================================
function renderEntries() {
  const feed = document.getElementById('entriesFeed');
  const emptyState = document.getElementById('emptyState');

  if (allEntries.length === 0) {
    feed.innerHTML = '';
    feed.appendChild(createEmptyState());
    return;
  }

  feed.innerHTML = '';

  allEntries.forEach((entry, index) => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.style.animationDelay = `${index * 0.08}s`;

    const progressEmoji = getProgressEmoji(entry.progress);
    const formattedDate = formatDate(entry.date);

    let imagesHTML = '';
    if (entry.images && entry.images.length > 0) {
      imagesHTML = `<div class="entry-images">
        ${entry.images.map(img => `<img class="entry-image" src="${img}" alt="Study image" onclick="openLightbox('${img.replace(/'/g, "\\'")}')">`).join('')}
      </div>`;
    }

    let tagsHTML = '';
    if (entry.subject) {
      tagsHTML = `<div class="entry-tags">
        <span class="entry-tag">${escapeHtml(entry.subject)}</span>
        <span class="entry-tag">${progressEmoji}</span>
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
        <div class="entry-text">${escapeHtml(entry.text)}</div>
        ${imagesHTML}
      </div>
      ${tagsHTML}
    `;

    feed.appendChild(card);
  });
}

function createEmptyState() {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-icon">🚀</div>
    <h3 class="empty-title">Start Your Journey!</h3>
    <p class="empty-text">Add your first study entry and begin tracking your progress today.</p>
  `;
  return div;
}

function updateStats() {
  const totalEntries = allEntries.length;
  const totalImages = allEntries.reduce((sum, e) => sum + (e.images ? e.images.length : 0), 0);

  // Calculate streak
  const streak = calculateStreak();

  // This week entries
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = allEntries.filter(e => new Date(e.date) >= startOfWeek).length;

  // Animate counter
  animateCounter('statTotalEntries', totalEntries);
  animateCounter('statStreak', streak);
  animateCounter('statImages', totalImages);
  animateCounter('statThisWeek', thisWeek);

  // Progress bar (monthly goal = 30 entries)
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
    } else if (i === 0 && entryDate.getTime() === expectedDate.getTime() - 86400000) {
      // Yesterday counts too for streak start
      const yesterdayExpected = new Date(today);
      yesterdayExpected.setDate(today.getDate() - 1);
      yesterdayExpected.setHours(0, 0, 0, 0);
      if (entryDate.getTime() === yesterdayExpected.getTime()) {
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
  document.getElementById('modalTitleText').textContent = 'New Study Entry';
  document.getElementById('entryDate').value = getTodayDate();
  document.getElementById('entrySubject').value = '';
  document.getElementById('entryText').value = '';
  document.getElementById('entryProgress').value = 'in-progress';
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
document.getElementById('entryModal').addEventListener('click', function(e) {
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
