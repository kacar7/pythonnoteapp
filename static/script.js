// static/script.js

document.addEventListener('DOMContentLoaded', () => {
    const userIdDisplay = document.getElementById('userIdDisplay');
    const signOutButton = document.getElementById('signOutButton');

    const topicsNavButton = document.getElementById('topicsNavButton');
    const notesNavButton = document.getElementById('notesNavButton');
    const todosNavButton = document.getElementById('todosNavButton');

    const topicsSection = document.getElementById('topicsSection');
    const notesSection = document.getElementById('notesSection');
    const todosSection = document.getElementById('todosSection');

    const addTopicButton = document.getElementById('addTopicButton');
    const addNoteButton = document.getElementById('addNoteButton');
    const addTodoButton = document.getElementById('addTodoButton');

    const topicModal = document.getElementById('topicModal');
    const topicModalTitle = document.getElementById('topicModalTitle');
    const topicNameInput = document.getElementById('topicNameInput');
    const cancelTopicButton = document.getElementById('cancelTopicButton');
    const saveTopicButton = document.getElementById('saveTopicButton');

    const noteModal = document.getElementById('noteModal');
    const noteModalTitle = document.getElementById('noteModalTitle');
    const noteContentInput = document.getElementById('noteContentInput');
    const cancelNoteButton = document.getElementById('cancelNoteButton');
    const saveNoteButton = document.getElementById('saveNoteButton');

    const todoModal = document.getElementById('todoModal');
    const todoModalTitle = document.getElementById('todoModalTitle');
    const todoTextInput = document.getElementById('todoTextInput');
    const cancelTodoButton = document.getElementById('cancelTodoButton');
    const saveTodoButton = document.getElementById('saveTodoButton');

    const beginnerColumn = document.getElementById('beginnerColumn');
    const intermediateColumn = document.getElementById('intermediateColumn');
    const expertColumn = document.getElementById('expertColumn');

    const notesList = document.getElementById('notesList');
    const todosList = document.getElementById('todosList');

    let currentEditingTopicId = null;
    let currentEditingNoteId = null;
    let currentEditingTodoId = null;
    let draggedTopicId = null;

    // --- Utility Functions ---

    // Function to render SVG icons
    const getEditIcon = () => `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
        </svg>
    `;

    const getDeleteIcon = () => `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm6 2a1 1 0 100 2h-2a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
        </svg>
    `;

    // --- Page Navigation ---
    const showPage = (pageId) => {
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');

        // Update active navigation button styles
        topicsNavButton.classList.remove('bg-indigo-700');
        notesNavButton.classList.remove('bg-purple-700');
        todosNavButton.classList.remove('bg-blue-700');

        topicsNavButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700', 'focus:ring-indigo-300');
        notesNavButton.classList.add('bg-purple-600', 'hover:bg-purple-700', 'focus:ring-purple-300');
        todosNavButton.classList.add('bg-blue-600', 'hover:bg-blue-700', 'focus:ring-blue-300');

        if (pageId === 'topicsSection') {
            topicsNavButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700', 'focus:ring-indigo-300');
            topicsNavButton.classList.add('bg-indigo-700');
            fetchTopics();
        } else if (pageId === 'notesSection') {
            notesNavButton.classList.remove('bg-purple-600', 'hover:bg-purple-700', 'focus:ring-purple-300');
            notesNavButton.classList.add('bg-purple-700');
            fetchNotes();
        } else if (pageId === 'todosSection') {
            todosNavButton.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'focus:ring-blue-300');
            todosNavButton.classList.add('bg-blue-700');
            fetchTodos();
        }
    };

    // --- Topic Functions ---
    const fetchTopics = async () => {
        try {
            const response = await fetch('/api/topics');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const topics = await response.json();
            renderTopics(topics);
        } catch (error) {
            console.error("Error fetching topics:", error);
            alert("Failed to load topics. Please try again."); // Using alert for simplicity, replace with custom modal in production
        }
    };

    const renderTopics = (topics) => {
        const beginnerList = beginnerColumn.querySelector('.topic-list');
        const intermediateList = intermediateColumn.querySelector('.topic-list');
        const expertList = expertColumn.querySelector('.topic-list');

        beginnerList.innerHTML = '';
        intermediateList.innerHTML = '';
        expertList.innerHTML = '';

        if (topics.length === 0) {
            beginnerList.innerHTML = '<p class="text-center text-gray-500 italic">No topics here yet!</p>';
            intermediateList.innerHTML = '<p class="text-center text-gray-500 italic">No topics here yet!</p>';
            expertList.innerHTML = '<p class="text-center text-gray-500 italic">No topics here yet!</p>';
            return;
        }

        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.id = `topic-${topic.id}`;
            topicElement.draggable = true;
            topicElement.dataset.topicId = topic.id;
            topicElement.classList.add(
                'bg-gray-50', 'p-4', 'rounded-lg', 'shadow-md', 'flex', 'items-center',
                'justify-between', 'cursor-grab', 'hover:shadow-lg', 'transition',
                'duration-200', 'ease-in-out', 'transform', 'hover:-translate-y-1'
            );
            topicElement.innerHTML = `
                <span class="text-lg font-medium text-gray-800 break-words flex-grow">
                    ${topic.name}
                </span>
                <div class="flex space-x-2 ml-4">
                    <button class="text-blue-600 hover:text-blue-800 transition duration-200 edit-topic-btn" title="Edit Topic" data-id="${topic.id}" data-name="${topic.name}">
                        ${getEditIcon()}
                    </button>
                    <button class="text-red-600 hover:text-red-800 transition duration-200 delete-topic-btn" title="Delete Topic" data-id="${topic.id}">
                        ${getDeleteIcon()}
                    </button>
                </div>
            `;

            topicElement.addEventListener('dragstart', (e) => {
                draggedTopicId = topic.id;
                e.currentTarget.classList.add('dragging');
            });

            topicElement.addEventListener('dragend', (e) => {
                e.currentTarget.classList.remove('dragging');
                draggedTopicId = null;
            });

            if (topic.category === 'beginner') {
                beginnerList.appendChild(topicElement);
            } else if (topic.category === 'intermediate') {
                intermediateList.appendChild(topicElement);
            } else if (topic.category === 'expert') {
                expertList.appendChild(topicElement);
            }
        });

        // Add event listeners for edit and delete buttons after rendering
        document.querySelectorAll('.edit-topic-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                openTopicModal({ id, name });
            });
        });

        document.querySelectorAll('.delete-topic-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteTopic(id);
            });
        });
    };

    const openTopicModal = (topic = null) => {
        if (topic) {
            topicModalTitle.textContent = 'Edit Topic';
            topicNameInput.value = topic.name;
            currentEditingTopicId = topic.id;
            saveTopicButton.textContent = 'Update';
        } else {
            topicModalTitle.textContent = 'Add New Topic';
            topicNameInput.value = '';
            currentEditingTopicId = null;
            saveTopicButton.textContent = 'Add';
        }
        topicModal.classList.remove('hidden');
    };

    const closeTopicModal = () => {
        topicModal.classList.add('hidden');
        topicNameInput.value = '';
        currentEditingTopicId = null;
    };

    const saveTopic = async () => {
        const name = topicNameInput.value.trim();
        if (!name) {
            alert('Topic name cannot be empty.');
            return;
        }

        try {
            let response;
            if (currentEditingTopicId) {
                response = await fetch(`/api/topics/${currentEditingTopicId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                });
            } else {
                response = await fetch('/api/topics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, category: 'beginner' }) // New topics default to 'beginner'
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            closeTopicModal();
            fetchTopics(); // Re-fetch all topics to update the UI
        } catch (error) {
            
            console.error("Error saving topic:", error);
            alert("Failed to save topic. Please try again.");
        }
    };

    const deleteTopic = async (id) => {
        if (!confirm('Are you sure you want to delete this topic?')) { // Using confirm for simplicity
            return;
        }
        try {
            const response = await fetch(`/api/topics/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchTopics(); // Re-fetch all topics to update the UI
        } catch (error) {
            console.error("Error deleting topic:", error);
            alert("Failed to delete topic. Please try again.");
        }
    };

    // --- Note Functions ---
    const fetchNotes = async () => {
        try {
            const response = await fetch('/api/notes');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const notes = await response.json();
            renderNotes(notes);
        } catch (error) {
            console.error("Error fetching notes:", error);
            alert("Failed to load notes. Please try again.");
        }
    };

    const renderNotes = (notes) => {
        notesList.innerHTML = '';
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="text-center text-gray-500 italic">No notes here yet!</p>';
            return;
        }

        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add(
                'bg-white', 'p-4', 'rounded-lg', 'shadow-md', 'flex', 'items-start', 'justify-between'
            );
            noteElement.innerHTML = `
                <p class="text-lg text-gray-800 break-words flex-grow mr-4">${note.content}</p>
                <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-800 transition duration-200 edit-note-btn" title="Edit Note" data-id="${note.id}" data-content="${note.content}">
                        ${getEditIcon()}
                    </button>
                    <button class="text-red-600 hover:text-red-800 transition duration-200 delete-note-btn" title="Delete Note" data-id="${note.id}">
                        ${getDeleteIcon()}
                    </button>
                </div>
            `;
            notesList.appendChild(noteElement);
        });

        document.querySelectorAll('.edit-note-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const content = e.currentTarget.dataset.content;
                openNoteModal({ id, content });
            });
        });

        document.querySelectorAll('.delete-note-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteNote(id);
            });
        });
    };

    const openNoteModal = (note = null) => {
        if (note) {
            noteModalTitle.textContent = 'Edit Note';
            noteContentInput.value = note.content;
            currentEditingNoteId = note.id;
            saveNoteButton.textContent = 'Update';
        } else {
            noteModalTitle.textContent = 'Add New Note';
            noteContentInput.value = '';
            currentEditingNoteId = null;
            saveNoteButton.textContent = 'Add';
        }
        noteModal.classList.remove('hidden');
    };

    const closeNoteModal = () => {
        noteModal.classList.add('hidden');
        noteContentInput.value = '';
        currentEditingNoteId = null;
    };

    const saveNote = async () => {
        const content = noteContentInput.value.trim();
        if (!content) {
            alert('Note content cannot be empty.');
            return;
        }

        try {
            let response;
            if (currentEditingNoteId) {
                response = await fetch(`/api/notes/${currentEditingNoteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: content })
                });
            } else {
                response = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: content })
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            closeNoteModal();
            fetchNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Failed to save note. Please try again.");
        }
    };

    const deleteNote = async (id) => {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }
        try {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchNotes();
        } catch (error) {
            console.error("Error deleting note:", error);
            alert("Failed to delete note. Please try again.");
        }
    };

    // --- Todo Functions ---
    const fetchTodos = async () => {
        try {
            const response = await fetch('/api/todos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const todos = await response.json();
            renderTodos(todos);
        } catch (error) {
            console.error("Error fetching todos:", error);
            alert("Failed to load todos. Please try again.");
        }
    };

    const renderTodos = (todos) => {
        todosList.innerHTML = '';
        if (todos.length === 0) {
            todosList.innerHTML = '<p class="text-center text-gray-500 italic">No todo items here yet!</p>';
            return;
        }

   todos.forEach(todo => {
    const todoElement = document.createElement('div');
    todoElement.classList.add(
    'bg-white', 'p-4', 'rounded-lg', 'shadow-md', 'flex', 'items-center', 'justify-between',
    ...(todo.completed ? ['opacity-60', 'line-through'] : []));
    todoElement.innerHTML = `
        <span class="text-lg font-medium text-gray-800 break-words flex-grow mr-4">
            ${todo.text}
        </span>
        <div class="flex space-x-2">
            <button class="px-3 py-1 rounded-full text-sm font-semibold toggle-todo-btn ${todo.completed ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'} hover:opacity-80 transition duration-200" data-id="${todo.id}" data-completed="${todo.completed}">
                ${todo.completed ? 'Undo' : 'Complete'}
            </button>
            <button class="text-blue-600 hover:text-blue-800 transition duration-200 edit-todo-btn" title="Edit Todo" data-id="${todo.id}" data-text="${todo.text}">
                ${getEditIcon()}
            </button>
            <button class="text-red-600 hover:text-red-800 transition duration-200 delete-todo-btn" title="Delete Todo" data-id="${todo.id}">
                ${getDeleteIcon()}
            </button>
        </div>
    `;
    todosList.appendChild(todoElement);
});


        document.querySelectorAll('.toggle-todo-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const completed = e.currentTarget.dataset.completed === 'true';
                toggleTodoComplete(id, completed);
            });
        });

        document.querySelectorAll('.edit-todo-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const text = e.currentTarget.dataset.text;
                openTodoModal({ id, text });
            });
        });

        document.querySelectorAll('.delete-todo-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteTodo(id);
            });
        });
    };

    const openTodoModal = (todo = null) => {
        if (todo) {
            todoModalTitle.textContent = 'Edit Todo';
            todoTextInput.value = todo.text;
            currentEditingTodoId = todo.id;
            saveTodoButton.textContent = 'Update';
        } else {
            todoModalTitle.textContent = 'Add New Todo';
            todoTextInput.value = '';
            currentEditingTodoId = null;
            saveTodoButton.textContent = 'Add';
        }
        todoModal.classList.remove('hidden');
    };

    const closeTodoModal = () => {
        todoModal.classList.add('hidden');
        todoTextInput.value = '';
        currentEditingTodoId = null;
    };

    const saveTodo = async () => {
        const text = todoTextInput.value.trim();
        if (!text) {
            alert('Todo text cannot be empty.');
            return;
        }

        try {
            let response;
            if (currentEditingTodoId) {
                response = await fetch(`/api/todos/${currentEditingTodoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });
            } else {
                response = await fetch('/api/todos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, completed: false })
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            closeTodoModal();
            fetchTodos();
        } catch (error) {
            console.error("Error saving todo:", error);
            alert("Failed to save todo. Please try again.");
        }
    };

    const toggleTodoComplete = async (id, currentStatus) => {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchTodos();
        } catch (error) {
            console.error("Error toggling todo status:", error);
            alert("Failed to update todo status. Please try again.");
        }
    };

    const deleteTodo = async (id) => {
        if (!confirm('Are you sure you want to delete this todo item?')) {
            return;
        }
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchTodos();
        } catch (error) {
            console.error("Error deleting todo:", error);
            alert("Failed to delete todo. Please try again.");
        }
    };

    // --- Drag and Drop Event Listeners for Topic Columns ---
    [beginnerColumn, intermediateColumn, expertColumn].forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            e.currentTarget.classList.add('border-dashed', 'border-2', 'border-blue-500'); // Visual feedback
        });

        column.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-blue-500');
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-blue-500');
            const newCategory = e.currentTarget.dataset.category;

            if (draggedTopicId && newCategory) {
                try {
                    const response = await fetch(`/api/topics/${draggedTopicId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ category: newCategory })
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    fetchTopics(); // Re-fetch to update UI
                } catch (error) {
                    console.error("Error updating topic category:", error);
                    alert("Failed to move topic. Please try again.");
                }
            }
            draggedTopicId = null;
        });
    });

    // --- Event Listeners ---
    topicsNavButton.addEventListener('click', () => showPage('topicsSection'));
    notesNavButton.addEventListener('click', () => showPage('notesSection'));
    todosNavButton.addEventListener('click', () => showPage('todosSection'));

    // Back buttons
    document.getElementById('backToTopicsFromNotes').addEventListener('click', () => showPage('topicsSection'));
    document.getElementById('backToTopicsFromTodos').addEventListener('click', () => showPage('topicsSection'));

    // Add buttons
    addTopicButton.addEventListener('click', () => openTopicModal());
    addNoteButton.addEventListener('click', () => openNoteModal());
    addTodoButton.addEventListener('click', () => openTodoModal());

    // Modal action buttons
    cancelTopicButton.addEventListener('click', closeTopicModal);
    saveTopicButton.addEventListener('click', saveTopic);

    cancelNoteButton.addEventListener('click', closeNoteModal);
    saveNoteButton.addEventListener('click', saveNote);

    cancelTodoButton.addEventListener('click', closeTodoModal);
    saveTodoButton.addEventListener('click', saveTodo);

    signOutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/logout');
            if (response.ok) {
                window.location.href = '/'; // Redirect to login page
            } else {
                alert('Failed to sign out.');
            }
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out.');
        }
    });

    // Initial load
    showPage('topicsSection'); // Show topics by default
});
