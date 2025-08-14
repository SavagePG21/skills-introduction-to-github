// Global Variables
let currentPage = 'home';
let selectedElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let elementCounter = 0;
let currentColor = '#3498db';
let designHistory = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupNavigation();
    setupDesigner();
    setupCodeEditor();
    setupProjects();
    setupPropertyControls();
    showPage('home');
}

// Navigation Functions
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            navMenu.classList.remove('active');
        });
    });

    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
    }
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Designer Functions
function setupDesigner() {
    const canvas = document.getElementById('design-canvas');
    const elementItems = document.querySelectorAll('.element-item');
    const colorItems = document.querySelectorAll('.color-item');
    const customColor = document.getElementById('custom-color');
    const clearBtn = document.getElementById('clear-canvas');
    const saveBtn = document.getElementById('save-design');
    const exportBtn = document.getElementById('export-html');

    // Element drag start
    elementItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.getAttribute('data-element'));
        });
        item.setAttribute('draggable', 'true');
    });

    // Canvas drop zone
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvas.classList.add('drag-over');
    });

    canvas.addEventListener('dragleave', () => {
        canvas.classList.remove('drag-over');
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.classList.remove('drag-over');
        
        const elementType = e.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        createElement(elementType, x, y);
    });

    // Color selection
    colorItems.forEach(item => {
        item.addEventListener('click', () => {
            currentColor = item.getAttribute('data-color');
            updateActiveColor(item);
            if (selectedElement) {
                applyColorToElement(selectedElement, currentColor);
            }
        });
    });

    if (customColor) {
        customColor.addEventListener('change', (e) => {
            currentColor = e.target.value;
            if (selectedElement) {
                applyColorToElement(selectedElement, currentColor);
            }
        });
    }

    // Canvas controls
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveDesign);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToHTML);
    }

    // Canvas click (deselect elements)
    canvas.addEventListener('click', (e) => {
        if (e.target === canvas) {
            deselectAllElements();
        }
    });
}

function createElement(type, x, y) {
    const canvas = document.getElementById('design-canvas');
    const placeholder = canvas.querySelector('.canvas-placeholder');
    
    // Hide placeholder
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    const element = document.createElement('div');
    element.className = 'design-element';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.setAttribute('data-type', type);
    element.setAttribute('data-id', 'element-' + (++elementCounter));
    
    let content = '';
    switch (type) {
        case 'text':
            content = '<p contenteditable="true" style="margin: 0; padding: 10px; color: ' + currentColor + ';">Edit this text</p>';
            break;
        case 'button':
            content = '<button style="padding: 10px 20px; background: ' + currentColor + '; color: white; border: none; border-radius: 5px; cursor: pointer;">Button</button>';
            break;
        case 'image':
            content = '<div style="width: 150px; height: 100px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; border-radius: 5px; color: #999;"><i class="fas fa-image"></i> Image</div>';
            break;
        case 'container':
            content = '<div style="width: 200px; height: 150px; border: 2px dashed ' + currentColor + '; border-radius: 5px; padding: 20px; background: rgba(102, 126, 234, 0.1);">Container</div>';
            break;
    }
    
    element.innerHTML = content;
    
    // Make element interactive
    makeElementInteractive(element);
    
    canvas.appendChild(element);
    selectElement(element);
    
    // Save to history
    saveToHistory();
}

function makeElementInteractive(element) {
    // Click to select
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
    });
    
    // Double click to edit
    element.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        editElement(element);
    });
    
    // Mouse down for dragging
    element.addEventListener('mousedown', (e) => {
        if (e.target.contentEditable === 'true') return;
        
        isDragging = true;
        selectElement(element);
        element.classList.add('dragging');
        
        const rect = element.getBoundingClientRect();
        const canvasRect = element.parentElement.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        e.preventDefault();
    });
    
    // Context menu (right-click)
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showElementContextMenu(element, e.clientX, e.clientY);
    });
}

function selectElement(element) {
    deselectAllElements();
    element.classList.add('selected');
    selectedElement = element;
    updatePropertiesPanel(element);
}

function deselectAllElements() {
    const elements = document.querySelectorAll('.design-element');
    elements.forEach(el => el.classList.remove('selected'));
    selectedElement = null;
}

function editElement(element) {
    const type = element.getAttribute('data-type');
    
    switch (type) {
        case 'text':
            const textEl = element.querySelector('p');
            if (textEl) {
                textEl.focus();
            }
            break;
        case 'button':
            const btnEl = element.querySelector('button');
            if (btnEl) {
                const newText = prompt('Enter button text:', btnEl.textContent);
                if (newText !== null) {
                    btnEl.textContent = newText;
                }
            }
            break;
    }
}

function applyColorToElement(element, color) {
    const type = element.getAttribute('data-type');
    
    switch (type) {
        case 'text':
            const textEl = element.querySelector('p');
            if (textEl) {
                textEl.style.color = color;
            }
            break;
        case 'button':
            const btnEl = element.querySelector('button');
            if (btnEl) {
                btnEl.style.background = color;
            }
            break;
        case 'container':
            const containerEl = element.querySelector('div');
            if (containerEl) {
                containerEl.style.borderColor = color;
            }
            break;
    }
}

function updateActiveColor(colorItem) {
    const colorItems = document.querySelectorAll('.color-item');
    colorItems.forEach(item => item.classList.remove('active'));
    colorItem.classList.add('active');
}

// Mouse move for dragging
document.addEventListener('mousemove', (e) => {
    if (isDragging && selectedElement) {
        const canvas = document.getElementById('design-canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        const x = e.clientX - canvasRect.left - dragOffset.x;
        const y = e.clientY - canvasRect.top - dragOffset.y;
        
        selectedElement.style.left = Math.max(0, x) + 'px';
        selectedElement.style.top = Math.max(0, y) + 'px';
    }
});

// Mouse up for dragging
document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        if (selectedElement) {
            selectedElement.classList.remove('dragging');
        }
        saveToHistory();
    }
});

function clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
        const canvas = document.getElementById('design-canvas');
        const elements = canvas.querySelectorAll('.design-element');
        elements.forEach(el => el.remove());
        
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        deselectAllElements();
        saveToHistory();
    }
}

function saveDesign() {
    const canvas = document.getElementById('design-canvas');
    const elements = canvas.querySelectorAll('.design-element');
    
    const design = {
        timestamp: new Date().toISOString(),
        elements: Array.from(elements).map(el => ({
            type: el.getAttribute('data-type'),
            id: el.getAttribute('data-id'),
            left: el.style.left,
            top: el.style.top,
            html: el.innerHTML
        }))
    };
    
    localStorage.setItem('webcraft-design', JSON.stringify(design));
    
    // Show success message
    showNotification('Design saved successfully!', 'success');
}

function exportToHTML() {
    const canvas = document.getElementById('design-canvas');
    const elements = canvas.querySelectorAll('.design-element');
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Design</title>
    <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', sans-serif; }
        .container { position: relative; min-height: 500px; }
        .element { position: absolute; }
    </style>
</head>
<body>
    <div class="container">
`;
    
    elements.forEach(el => {
        html += `        <div class="element" style="left: ${el.style.left}; top: ${el.style.top};">
            ${el.innerHTML}
        </div>
`;
    });
    
    html += `    </div>
</body>
</html>`;
    
    // Download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.html';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Design exported successfully!', 'success');
}

// Property Controls
function setupPropertyControls() {
    const fontSizeSlider = document.getElementById('font-size');
    const paddingSlider = document.getElementById('padding');
    const borderRadiusSlider = document.getElementById('border-radius');
    
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.getElementById('font-size-value').textContent = value;
            
            if (selectedElement) {
                const textEl = selectedElement.querySelector('p, button');
                if (textEl) {
                    textEl.style.fontSize = value;
                }
            }
        });
    }
    
    if (paddingSlider) {
        paddingSlider.addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.getElementById('padding-value').textContent = value;
            
            if (selectedElement) {
                const targetEl = selectedElement.querySelector('p, button, div');
                if (targetEl) {
                    targetEl.style.padding = value;
                }
            }
        });
    }
    
    if (borderRadiusSlider) {
        borderRadiusSlider.addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.getElementById('border-radius-value').textContent = value;
            
            if (selectedElement) {
                const targetEl = selectedElement.querySelector('button, div');
                if (targetEl) {
                    targetEl.style.borderRadius = value;
                }
            }
        });
    }
}

function updatePropertiesPanel(element) {
    const type = element.getAttribute('data-type');
    const targetEl = element.querySelector('p, button, div');
    
    if (targetEl) {
        // Update sliders based on current element properties
        const fontSize = parseInt(getComputedStyle(targetEl).fontSize) || 16;
        const padding = parseInt(getComputedStyle(targetEl).padding) || 10;
        const borderRadius = parseInt(getComputedStyle(targetEl).borderRadius) || 5;
        
        const fontSizeSlider = document.getElementById('font-size');
        const paddingSlider = document.getElementById('padding');
        const borderRadiusSlider = document.getElementById('border-radius');
        
        if (fontSizeSlider) {
            fontSizeSlider.value = fontSize;
            document.getElementById('font-size-value').textContent = fontSize + 'px';
        }
        
        if (paddingSlider) {
            paddingSlider.value = padding;
            document.getElementById('padding-value').textContent = padding + 'px';
        }
        
        if (borderRadiusSlider) {
            borderRadiusSlider.value = borderRadius;
            document.getElementById('border-radius-value').textContent = borderRadius + 'px';
        }
    }
}

// Code Editor Functions
function setupCodeEditor() {
    const tabs = document.querySelectorAll('.tab');
    const textarea = document.getElementById('code-editor-textarea');
    const runBtn = document.getElementById('run-code');
    const formatBtn = document.getElementById('format-code');
    const preview = document.getElementById('code-preview');
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const lang = tab.getAttribute('data-lang');
            updateEditorContent(lang);
        });
    });
    
    // Run code
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            const code = textarea.value;
            if (preview) {
                const blob = new Blob([code], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                preview.src = url;
                
                // Clean up previous URL
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        });
    }
    
    // Format code
    if (formatBtn) {
        formatBtn.addEventListener('click', () => {
            formatCode();
        });
    }
    
    // Auto-save
    if (textarea) {
        textarea.addEventListener('input', () => {
            localStorage.setItem('webcraft-code', textarea.value);
        });
        
        // Load saved code
        const savedCode = localStorage.getItem('webcraft-code');
        if (savedCode) {
            textarea.value = savedCode;
        }
    }
}

function updateEditorContent(lang) {
    const textarea = document.getElementById('code-editor-textarea');
    
    const templates = {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Start coding your amazing project here.</p>
</body>
</html>`,
        css: `/* CSS Styles */
body {
    font-family: 'Segoe UI', sans-serif;
    margin: 0;
    padding: 20px;
    background: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}`,
        js: `// JavaScript Code
console.log('Hello, World!');

// DOM manipulation
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('button');
    
    if (button) {
        button.addEventListener('click', function() {
            alert('Button clicked!');
        });
    }
});

// Function example
function greetUser(name) {
    return \`Hello, \${name}! Welcome to WebCraft Studio.\`;
}`
    };
    
    if (textarea && templates[lang]) {
        textarea.value = templates[lang];
    }
}

function formatCode() {
    const textarea = document.getElementById('code-editor-textarea');
    let code = textarea.value;
    
    // Basic formatting (this is a simplified version)
    code = code.replace(/\s*{\s*/g, ' {\n    ');
    code = code.replace(/;\s*/g, ';\n    ');
    code = code.replace(/}\s*/g, '\n}\n');
    code = code.replace(/\n\s*\n/g, '\n');
    
    textarea.value = code;
    showNotification('Code formatted!', 'success');
}

// Projects Functions
function setupProjects() {
    const newProjectBtn = document.getElementById('new-project');
    
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            createNewProject();
        });
    }
    
    // Setup project card interactions
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const editBtn = card.querySelector('.btn:not(.btn-outline)');
        const deleteBtn = card.querySelector('.btn-outline');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                showPage('code-editor');
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to delete this project?')) {
                    card.remove();
                    showNotification('Project deleted', 'info');
                }
            });
        }
    });
}

function createNewProject() {
    const name = prompt('Enter project name:');
    if (name) {
        showNotification(`Project "${name}" created!`, 'success');
        showPage('code-editor');
    }
}

// History and Undo/Redo
function saveToHistory() {
    const canvas = document.getElementById('design-canvas');
    const elements = canvas.querySelectorAll('.design-element');
    
    const state = Array.from(elements).map(el => ({
        type: el.getAttribute('data-type'),
        id: el.getAttribute('data-id'),
        left: el.style.left,
        top: el.style.top,
        html: el.innerHTML
    }));
    
    designHistory.push(state);
    
    // Limit history size
    if (designHistory.length > 50) {
        designHistory.shift();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Delete selected element
    if (e.key === 'Delete' && selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        saveToHistory();
    }
    
    // Copy element (Ctrl+C)
    if (e.ctrlKey && e.key === 'c' && selectedElement) {
        e.preventDefault();
        copyElement();
    }
    
    // Paste element (Ctrl+V)
    if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteElement();
    }
    
    // Save design (Ctrl+S)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentPage === 'designer') {
            saveDesign();
        }
    }
});

let copiedElement = null;

function copyElement() {
    if (selectedElement) {
        copiedElement = {
            type: selectedElement.getAttribute('data-type'),
            html: selectedElement.innerHTML,
            left: selectedElement.style.left,
            top: selectedElement.style.top
        };
        showNotification('Element copied', 'info');
    }
}

function pasteElement() {
    if (copiedElement && currentPage === 'designer') {
        const canvas = document.getElementById('design-canvas');
        const element = document.createElement('div');
        element.className = 'design-element';
        element.setAttribute('data-type', copiedElement.type);
        element.setAttribute('data-id', 'element-' + (++elementCounter));
        element.innerHTML = copiedElement.html;
        
        // Offset the pasted element
        const left = parseInt(copiedElement.left) + 20;
        const top = parseInt(copiedElement.top) + 20;
        element.style.left = left + 'px';
        element.style.top = top + 'px';
        
        makeElementInteractive(element);
        canvas.appendChild(element);
        selectElement(element);
        saveToHistory();
        
        showNotification('Element pasted', 'success');
    }
}

// Context Menu
function showElementContextMenu(element, x, y) {
    // Remove existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${y}px;
        left: ${x}px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 120px;
        padding: 5px 0;
    `;
    
    const menuItems = [
        { label: 'Edit', action: () => editElement(element) },
        { label: 'Copy', action: () => { selectElement(element); copyElement(); } },
        { label: 'Delete', action: () => { element.remove(); saveToHistory(); } },
        { label: 'Bring to Front', action: () => { element.style.zIndex = '1000'; } },
        { label: 'Send to Back', action: () => { element.style.zIndex = '1'; } }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.textContent = item.label;
        menuItem.style.cssText = `
            padding: 8px 15px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = '#f0f0f0';
        });
        
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });
        
        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });
        
        menu.appendChild(menuItem);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        });
    }, 100);
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}