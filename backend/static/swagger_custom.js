// Custom JavaScript to inject CSS and fix Swagger UI text visibility
(function() {
    'use strict';
    
    // Function to inject custom CSS
    function injectCustomCSS() {
        // Check if CSS is already injected
        if (document.getElementById('swagger-custom-css')) {
            return;
        }
        
        // Create link element for custom CSS
        const link = document.createElement('link');
        link.id = 'swagger-custom-css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = '/static/swagger_custom.css';
        document.head.appendChild(link);
    }
    
    // Function to inject CSS directly as style tag (fallback)
    function injectInlineCSS() {
        if (document.getElementById('swagger-custom-inline-css')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'swagger-custom-inline-css';
        style.textContent = `
            .swagger-ui input[type="text"],
            .swagger-ui input[type="password"],
            .swagger-ui input[type="email"],
            .swagger-ui input[type="number"],
            .swagger-ui input[type="date"],
            .swagger-ui input[type="datetime-local"],
            .swagger-ui textarea,
            .swagger-ui select {
                color: #333 !important;
                background-color: #fff !important;
            }
            .swagger-ui .parameter__name,
            .swagger-ui .parameter__type,
            .swagger-ui input.parameter__name,
            .swagger-ui input.parameter__type {
                color: #333 !important;
            }
            .swagger-ui .body-param__text,
            .swagger-ui .body-param__example,
            .swagger-ui textarea.body-param__text {
                color: #333 !important;
                background-color: #fff !important;
            }
            .swagger-ui input:not([type="checkbox"]):not([type="radio"]),
            .swagger-ui textarea,
            .swagger-ui select {
                color: #333333 !important;
                background-color: #ffffff !important;
            }
            .swagger-ui input:focus,
            .swagger-ui textarea:focus,
            .swagger-ui select:focus {
                color: #333 !important;
                background-color: #fff !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Function to fix input text colors directly
    function fixInputColors() {
        // Fix all input fields
        const inputs = document.querySelectorAll('.swagger-ui input[type="text"], .swagger-ui input[type="password"], .swagger-ui input[type="email"], .swagger-ui input[type="number"], .swagger-ui input[type="date"], .swagger-ui textarea, .swagger-ui select');
        inputs.forEach(function(input) {
            const computedColor = window.getComputedStyle(input).color;
            if (computedColor === 'rgb(255, 255, 255)' || computedColor === 'white' || input.style.color === 'white') {
                input.style.setProperty('color', '#333', 'important');
                input.style.setProperty('background-color', '#fff', 'important');
            }
        });
    }
    
    // Inject CSS immediately (both external and inline as fallback)
    injectCustomCSS();
    injectInlineCSS();
    
    // Fix colors when DOM is ready
    function applyFixes() {
        fixInputColors();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }
    
    // Watch for dynamically added input fields (Swagger UI loads content dynamically)
    let observer;
    function startObserving() {
        const swaggerContainer = document.getElementById('swagger-ui') || document.querySelector('.swagger-ui');
        if (swaggerContainer && !observer) {
            observer = new MutationObserver(function(mutations) {
                applyFixes();
            });
            observer.observe(swaggerContainer, {
                childList: true,
                subtree: true
            });
            applyFixes();
        } else if (!swaggerContainer) {
            setTimeout(startObserving, 100);
        }
    }
    
    startObserving();
    
    // Also fix on any click (when "Try it out" is clicked)
    document.addEventListener('click', function() {
        setTimeout(applyFixes, 100);
        setTimeout(applyFixes, 500);
    });
    
    // Fix on input focus
    document.addEventListener('focusin', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            setTimeout(applyFixes, 50);
        }
    });
    
    // Auto-extract access_token from login responses and populate authorization
    function setupTokenExtraction() {
        // Intercept fetch/XHR responses to extract tokens
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args).then(response => {
                // Clone response to read it without consuming it
                const clonedResponse = response.clone();
                
                // Check if this is a login endpoint response
                if (args[0] && typeof args[0] === 'string' && args[0].includes('/login')) {
                    clonedResponse.json().then(data => {
                        if (data && data.access_token) {
                            // Auto-populate the authorization field in Swagger UI
                            setTimeout(() => {
                                // Try multiple selectors to find the authorization input
                                let authInput = document.querySelector('input[placeholder*="Bearer"], input[placeholder*="token"], input[placeholder*="Token"], input[type="password"][name*="auth"], input[name*="Authorization"]');
                                
                                // Also try finding by looking for the auth modal/dialog
                                if (!authInput) {
                                    const authModal = document.querySelector('.auth-container, .auth-btn-wrapper, [class*="auth"]');
                                    if (authModal) {
                                        authInput = authModal.querySelector('input[type="text"], input[type="password"]');
                                    }
                                }
                                
                                // Try to find by Swagger UI's structure
                                if (!authInput) {
                                    const swaggerUI = document.querySelector('.swagger-ui');
                                    if (swaggerUI) {
                                        // Look for input in auth section
                                        const authSection = swaggerUI.querySelector('[class*="auth"], [id*="auth"]');
                                        if (authSection) {
                                            authInput = authSection.querySelector('input');
                                        }
                                    }
                                }
                                
                                if (authInput) {
                                    // Set the token value
                                    authInput.value = data.access_token;
                                    // Trigger events to notify Swagger UI
                                    authInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    authInput.dispatchEvent(new Event('change', { bubbles: true }));
                                    authInput.dispatchEvent(new Event('blur', { bubbles: true }));
                                    
                                    // Try to find and click the authorize button
                                    setTimeout(() => {
                                        const authorizeBtn = document.querySelector('button.authorize, .authorize-btn, [class*="authorize"]');
                                        if (authorizeBtn) {
                                            authorizeBtn.click();
                                        }
                                    }, 200);
                                    
                                    // Show a notification
                                    const notification = document.createElement('div');
                                    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 5px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
                                    notification.textContent = '✓ Access token extracted and authorized!';
                                    document.body.appendChild(notification);
                                    setTimeout(() => notification.remove(), 5000);
                                } else {
                                    // Show notification with manual instructions
                                    const notification = document.createElement('div');
                                    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #FF9800; color: white; padding: 15px 20px; border-radius: 5px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
                                    notification.innerHTML = 'Token extracted! Click "Authorize" button and paste: <br><code style="font-size: 10px; word-break: break-all;">' + data.access_token.substring(0, 50) + '...</code>';
                                    document.body.appendChild(notification);
                                    setTimeout(() => notification.remove(), 8000);
                                }
                            }, 500);
                        }
                    }).catch(() => {
                        // Ignore JSON parse errors
                    });
                }
                
                return response;
            });
        };
        
        // Also intercept XMLHttpRequest for older Swagger UI versions
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._url = url;
            return originalXHROpen.apply(this, [method, url, ...rest]);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
                if (this._url && this._url.includes('/login') && this.status === 200) {
                    try {
                        const data = JSON.parse(this.responseText);
                        if (data && data.access_token) {
                            setTimeout(() => {
                                const authInput = document.querySelector('input[placeholder*="Bearer"], input[placeholder*="token"], input[placeholder*="Token"]');
                                if (authInput) {
                                    authInput.value = data.access_token;
                                    authInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    authInput.dispatchEvent(new Event('change', { bubbles: true }));
                                    
                                    const notification = document.createElement('div');
                                    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 5px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
                                    notification.textContent = '✓ Access token extracted! Click "Authorize" to use it.';
                                    document.body.appendChild(notification);
                                    setTimeout(() => notification.remove(), 5000);
                                }
                            }, 500);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });
            return originalXHRSend.apply(this, args);
        };
    }
    
    // Setup token extraction when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTokenExtraction);
    } else {
        setupTokenExtraction();
    }
})();

