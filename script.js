// ===== DOM ELEMENTS =====
const noteForm = document.getElementById('noteForm');
const noteTitle = document.getElementById('noteTitle');
const noteCategory = document.getElementById('noteCategory');
const noteDescription = document.getElementById('noteDescription');
const charCount = document.getElementById('charCount');
const submitBtnText = document.getElementById('submitBtnText');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const notesContainer = document.getElementById('notesContainer');
const emptyState = document.getElementById('emptyState');
const darkModeToggle = document.getElementById('darkModeToggle');
const deleteModal = document.getElementById('deleteModal');
const modalClose = document.getElementById('modalClose');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// ===== STATE MANAGEMENT =====
let notes = [];
let editingNoteId = null;
let noteToDeleteId = null;

// ===== LOCAL STORAGE FUNCTIONS =====
/**
 * Save notes to localStorage
 */
function saveNotesToStorage() {
    try {
        localStorage.setItem('smartNotes', JSON.stringify(notes));
    } catch (error) {
        console.error('Error saving notes to localStorage:', error);
        showNotification('Error saving notes', 'error');
    }
}

/**
 * Load notes from localStorage
 */
function loadNotesFromStorage() {
    try {
        const storedNotes = localStorage.getItem('smartNotes');
        if (storedNotes) {
            notes = JSON.parse(storedNotes);
        }
    } catch (error) {
        console.error('Error loading notes from localStorage:', error);
        notes = [];
    }
}

/**
 * Save dark mode preference to localStorage
 */
function saveDarkModePreference(isDark) {
    try {
        localStorage.setItem('darkMode', isDark);
    } catch (error) {
        console.error('Error saving dark mode preference:', error);
    }
}

/**
 * Load dark mode preference from localStorage
 */
function loadDarkModePreference() {
    try {
        const isDark = localStorage.getItem('darkMode') === 'true';
        return isDark;
    } catch (error) {
        console.error('Error loading dark mode preference:', error);
        return false;
    }
}

// ===== DARK MODE FUNCTIONS =====
/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    saveDarkModePreference(newTheme === 'dark');
}

/**
 * Initialize dark mode
 */
function initializeDarkMode() {
    const isDark = loadDarkModePreference();
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// ===== NOTE MANAGEMENT FUNCTIONS =====
/**
 * Generate unique ID for notes
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Create a new note object
 */
function createNote(title, category, description) {
    return {
        id: generateId(),
        title: title.trim(),
        category: category,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Add or update a note
 */
function saveNote(title, category, description) {
    if (editingNoteId) {
        // Update existing note
        const noteIndex = notes.findIndex(note => note.id === editingNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = {
                ...notes[noteIndex],
                title: title.trim(),
                category: category,
                description: description.trim(),
                updatedAt: new Date().toISOString()
            };
        }
        editingNoteId = null;
        submitBtnText.textContent = 'Add Note';
    } else {
        // Add new note
        const newNote = createNote(title, category, description);
        notes.unshift(newNote);
    }
    
    saveNotesToStorage();
    renderNotes();
    resetForm();
    showNotification(editingNoteId ? 'Note updated successfully' : 'Note added successfully', 'success');
}

/**
 * Delete a note
 */
function deleteNote(noteId) {
    noteToDeleteId = noteId;
    showModal();
}

/**
 * Confirm note deletion
 */
function confirmDeleteNote() {
    if (noteToDeleteId) {
        notes = notes.filter(note => note.id !== noteToDeleteId);
        saveNotesToStorage();
        renderNotes();
        hideModal();
        showNotification('Note deleted successfully', 'success');
        noteToDeleteId = null;
    }
}

/**
 * Edit a note
 */
function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        noteTitle.value = note.title;
        noteCategory.value = note.category;
        noteDescription.value = note.description;
        updateCharCount();
        editingNoteId = noteId;
        submitBtnText.textContent = 'Update Note';
        noteTitle.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===== RENDERING FUNCTIONS =====
/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

/**
 * Create note card HTML
 */
function createNoteCard(note) {
    return `
        <div class="note-card" data-note-id="${note.id}">
            <div class="note-header">
                <div>
                    <h3 class="note-title">${escapeHtml(note.title)}</h3>
                    <span class="note-category ${note.category}">${note.category}</span>
                </div>
            </div>
            <p class="note-description">${escapeHtml(note.description)}</p>
            <div class="note-footer">
                <span class="note-date">${formatDate(note.createdAt)}</span>
                <div class="note-actions">
                    <button class="note-btn edit" onclick="editNote('${note.id}')" aria-label="Edit note">
                        ✏️
                    </button>
                    <button class="note-btn delete" onclick="deleteNote('${note.id}')" aria-label="Delete note">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render all notes
 */
function renderNotes() {
    const filteredNotes = getFilteredNotes();
    const sortedNotes = getSortedNotes(filteredNotes);
    
    if (sortedNotes.length === 0) {
        notesContainer.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        notesContainer.innerHTML = sortedNotes.map(note => createNoteCard(note)).join('');
    }
}

// ===== FILTERING AND SORTING =====
/**
 * Get filtered notes based on search and category
 */
function getFilteredNotes() {
    let filtered = [...notes];
    
    // Filter by search term
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            note.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    const selectedCategory = categoryFilter.value;
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(note => note.category === selectedCategory);
    }
    
    return filtered;
}

/**
 * Get sorted notes
 */
function getSortedNotes(notesToSort) {
    const sortBy = sortSelect.value;
    const sorted = [...notesToSort];
    
    if (sortBy === 'newest') {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    return sorted;
}

// ===== FORM FUNCTIONS =====
/**
 * Reset form fields
 */
function resetForm() {
    noteForm.reset();
    editingNoteId = null;
    submitBtnText.textContent = 'Add Note';
    updateCharCount();
}

/**
 * Update character counter
 */
function updateCharCount() {
    const count = noteDescription.value.length;
    charCount.textContent = count;
    
    if (count > 450) {
        charCount.style.color = 'var(--danger-color)';
    } else if (count > 400) {
        charCount.style.color = 'var(--warning-color)';
    } else {
        charCount.style.color = 'var(--text-muted)';
    }
}

/**
 * Validate form
 */
function validateForm() {
    const title = noteTitle.value.trim();
    const description = noteDescription.value.trim();
    
    if (!title) {
        showNotification('Please enter a note title', 'error');
        noteTitle.focus();
        return false;
    }
    
    if (!description) {
        showNotification('Please enter a note description', 'error');
        noteDescription.focus();
        return false;
    }
    
    if (title.length > 100) {
        showNotification('Title must be less than 100 characters', 'error');
        noteTitle.focus();
        return false;
    }
    
    if (description.length > 500) {
        showNotification('Description must be less than 500 characters', 'error');
        noteDescription.focus();
        return false;
    }
    
    return true;
}

// ===== MODAL FUNCTIONS =====
/**
 * Show delete confirmation modal
 */
function showModal() {
    deleteModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Hide delete confirmation modal
 */
function hideModal() {
    deleteModal.classList.remove('show');
    document.body.style.overflow = '';
    noteToDeleteId = null;
}

// ===== NOTIFICATION FUNCTIONS =====
/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: 'var(--shadow-lg)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
    });
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = 'var(--success-color)';
            break;
        case 'error':
            notification.style.backgroundColor = 'var(--danger-color)';
            break;
        default:
            notification.style.backgroundColor = 'var(--primary-color)';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== EVENT LISTENERS =====
/**
 * Form submission
 */
noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (validateForm()) {
        const title = noteTitle.value;
        const category = noteCategory.value;
        const description = noteDescription.value;
        
        saveNote(title, category, description);
    }
});

/**
 * Character counter update
 */
noteDescription.addEventListener('input', updateCharCount);

/**
 * Search input
 */
searchInput.addEventListener('input', () => {
    renderNotes();
});

/**
 * Category filter
 */
categoryFilter.addEventListener('change', () => {
    renderNotes();
});

/**
 * Sort select
 */
sortSelect.addEventListener('change', () => {
    renderNotes();
});

/**
 * Dark mode toggle
 */
darkModeToggle.addEventListener('click', toggleDarkMode);

/**
 * Modal close button
 */
modalClose.addEventListener('click', hideModal);

/**
 * Cancel delete button
 */
cancelDelete.addEventListener('click', hideModal);

/**
 * Confirm delete button
 */
confirmDelete.addEventListener('click', confirmDeleteNote);

/**
 * Close modal when clicking outside
 */
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        hideModal();
    }
});

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape' && deleteModal.classList.contains('show')) {
        hideModal();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + N to focus title input
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        noteTitle.focus();
    }
});

// ===== INITIALIZATION =====
/**
 * Initialize the application
 */
function init() {
    // Load saved data
    loadNotesFromStorage();
    initializeDarkMode();
    
    // Render initial notes
    renderNotes();
    
    // Set up initial character counter
    updateCharCount();
    
    // Focus on title input for better UX
    noteTitle.focus();
    
    // Show welcome message if no notes exist
    if (notes.length === 0) {
        setTimeout(() => {
            showNotification('Welcome! Start by creating your first note 📝', 'info');
        }, 500);
    }
}

// ===== START THE APPLICATION =====
document.addEventListener('DOMContentLoaded', init);

// ===== EXPORT FUNCTIONS FOR INLINE EVENT HANDLERS =====
window.editNote = editNote;
window.deleteNote = deleteNote;
