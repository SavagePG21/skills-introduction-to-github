// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/current');
        const data = await response.json();
        
        if (data.success) {
            // User is logged in, redirect to chat
            if (window.location.pathname !== '/chat') {
                window.location.href = '/chat';
            }
        }
    } catch (error) {
        console.log('User not authenticated');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const loginBtn = document.getElementById('loginBtn');
    const errorAlert = document.getElementById('errorAlert');
    
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    errorAlert.classList.add('d-none');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Login successful, redirect to chat
            window.location.href = '/chat';
        } else {
            // Show error message
            showError(errorAlert, data.message);
        }
    } catch (error) {
        showError(errorAlert, 'An error occurred. Please try again.');
    } finally {
        // Remove loading state
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const registerBtn = document.getElementById('registerBtn');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    // Validate passwords match
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        showError(errorAlert, 'Passwords do not match');
        return;
    }
    
    // Show loading state
    registerBtn.classList.add('loading');
    registerBtn.disabled = true;
    errorAlert.classList.add('d-none');
    successAlert.classList.add('d-none');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formData.get('username'),
                email: formData.get('email'),
                displayName: formData.get('displayName'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Registration successful
            showSuccess(successAlert, 'Registration successful! You can now login.');
            form.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            // Show error message
            showError(errorAlert, data.message);
        }
    } catch (error) {
        showError(errorAlert, 'An error occurred. Please try again.');
    } finally {
        // Remove loading state
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
    }
}

function showError(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove('d-none');
}

function showSuccess(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove('d-none');
}

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Real-time form validation
document.addEventListener('input', function(event) {
    if (event.target.matches('input[required]')) {
        if (event.target.value.trim()) {
            event.target.classList.remove('is-invalid');
        }
    }
});

// Password confirmation validation
document.addEventListener('input', function(event) {
    if (event.target.id === 'confirmPassword') {
        const password = document.getElementById('password');
        const confirmPassword = event.target;
        
        if (password && confirmPassword.value) {
            if (password.value !== confirmPassword.value) {
                confirmPassword.classList.add('is-invalid');
            } else {
                confirmPassword.classList.remove('is-invalid');
            }
        }
    }
});