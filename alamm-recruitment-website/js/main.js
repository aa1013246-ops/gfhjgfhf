/* Main JavaScript for Al-Umam Recruitment Office */
/* samma-sa.com - Main JS File */

// Global Configuration
const CONFIG = {
    apiEndpoint: 'https://samma-sa.com/api',
    chatEnabled: true,
    animationDuration: 300,
    scrollOffset: 80,
    phone: '+966112345678',
    whatsapp: '+966500851716',
    email: 'info@samma-sa.com'
};

// Utility Functions
const Utils = {
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format phone number
    formatPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        return phone;
    },

    // Validate email
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate Saudi phone
    validateSaudiPhone: (phone) => {
        const phoneRegex = /^05[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Smooth scroll to element
    scrollTo: (element, offset = CONFIG.scrollOffset) => {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    // Show/hide element with animation
    toggleElement: (element, show) => {
        if (show) {
            element.style.display = 'block';
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transition = `opacity ${CONFIG.animationDuration}ms ease`;
            }, 10);
        } else {
            element.style.opacity = '0';
            element.style.transition = `opacity ${CONFIG.animationDuration}ms ease`;
            setTimeout(() => {
                element.style.display = 'none';
            }, CONFIG.animationDuration);
        }
    }
};

// Header Management
class HeaderManager {
    constructor() {
        this.header = document.querySelector('.header');
        this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.lastScrollY = window.scrollY;
        
        this.init();
    }

    init() {
        this.handleScroll();
        this.handleMobileMenu();
        this.highlightActiveLink();
    }

    handleScroll() {
        const throttledScroll = Utils.throttle(() => {
            const currentScrollY = window.scrollY;
            
            // Add scrolled class
            if (currentScrollY > 50) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
            
            this.lastScrollY = currentScrollY;
        }, 100);

        window.addEventListener('scroll', throttledScroll);
    }

    handleMobileMenu() {
        if (this.mobileMenuToggle && this.navLinks) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.navLinks.classList.toggle('mobile-open');
                this.mobileMenuToggle.textContent = 
                    this.navLinks.classList.contains('mobile-open') ? '✕' : '☰';
            });

            // Close mobile menu on link click
            this.navLinks.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    this.navLinks.classList.remove('mobile-open');
                    this.mobileMenuToggle.textContent = '☰';
                }
            });
        }
    }

    highlightActiveLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = this.navLinks.querySelectorAll('a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
}

// Smooth Scrolling for Anchor Links
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    Utils.scrollTo(targetElement);
                }
            });
        });
    }
}

// Counter Animation
class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('[data-target]');
        this.observer = null;
        
        if (this.counters.length > 0) {
            this.init();
        }
    }

    init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        this.counters.forEach(counter => {
            this.observer.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const suffix = element.textContent.replace(/[0-9]/g, '');
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            element.textContent = Math.floor(current) + suffix;
        }, 16);
    }
}

// Form Handler
class FormHandler {
    constructor() {
        this.forms = document.querySelectorAll('form');
        this.init();
    }

    init() {
        this.forms.forEach(form => {
            form.addEventListener('submit', this.handleSubmit.bind(this));
            this.addRealTimeValidation(form);
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        if (this.validateForm(form)) {
            this.submitForm(form);
        }
    }

    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Clear previous errors
        form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            }
        });

        // Validate email fields
        const emailFields = form.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value && !Utils.validateEmail(field.value)) {
                field.classList.add('error');
                isValid = false;
            }
        });

        // Validate phone fields
        const phoneFields = form.querySelectorAll('input[type="tel"]');
        phoneFields.forEach(field => {
            if (field.value && !Utils.validateSaudiPhone(field.value)) {
                field.classList.add('error');
                isValid = false;
            }
        });

        return isValid;
    }

    submitForm(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> جاري الإرسال...';
        
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Simulate API call
        setTimeout(() => {
            this.handleFormResponse(form, true);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }, 2000);
    }

    handleFormResponse(form, success) {
        const successAlert = form.querySelector('.alert.success');
        const errorAlert = form.querySelector('.alert.error');
        
        if (success) {
            if (successAlert) {
                successAlert.style.display = 'block';
                Utils.scrollTo(successAlert, 120);
            }
            form.reset();
            
            setTimeout(() => {
                if (successAlert) successAlert.style.display = 'none';
            }, 5000);
        } else {
            if (errorAlert) {
                errorAlert.style.display = 'block';
                Utils.scrollTo(errorAlert, 120);
            }
        }
    }

    addRealTimeValidation(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(field) {
        let isValid = true;
        
        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
        }
        
        // Email validation
        if (field.type === 'email' && field.value && !Utils.validateEmail(field.value)) {
            isValid = false;
        }
        
        // Phone validation
        if (field.type === 'tel' && field.value && !Utils.validateSaudiPhone(field.value)) {
            isValid = false;
        }
        
        if (isValid) {
            field.classList.remove('error');
        } else {
            field.classList.add('error');
        }
    }
}

// Intersection Observer for Animations
class AnimationObserver {
    constructor() {
        this.observer = null;
        this.elements = document.querySelectorAll('.fade-in-up, .fade-in-down, .slide-in-right, .slide-in-left');
        
        if (this.elements.length > 0) {
            this.init();
        }
    }

    init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) translateX(0)';
                    this.observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        this.elements.forEach(element => {
            // Set initial state
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            // Set initial transform based on class
            if (element.classList.contains('fade-in-up')) {
                element.style.transform = 'translateY(30px)';
            } else if (element.classList.contains('fade-in-down')) {
                element.style.transform = 'translateY(-30px)';
            } else if (element.classList.contains('slide-in-right')) {
                element.style.transform = 'translateX(-30px)';
            } else if (element.classList.contains('slide-in-left')) {
                element.style.transform = 'translateX(30px)';
            }
            
            this.observer.observe(element);
        });
    }
}

// Local Storage Manager
class StorageManager {
    static set(key, value) {
        try {
            localStorage.setItem(`samma_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    static get(key) {
        try {
            const item = localStorage.getItem(`samma_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('Could not read from localStorage:', e);
            return null;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(`samma_${key}`);
        } catch (e) {
            console.warn('Could not remove from localStorage:', e);
        }
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.recordMetrics();
            }, 0);
        });
    }

    recordMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paintEntries = performance.getEntriesByType('paint');
            
            this.metrics = {
                loadTime: navigation.loadEventEnd - navigation.fetchStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
            };
            
            // Log to console in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Performance Metrics:', this.metrics);
            }
        }
    }
}

// Error Handler
class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('error', (e) => {
            this.logError('JavaScript Error', e.error, e.filename, e.lineno);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.logError('Unhandled Promise Rejection', e.reason);
        });
    }

    logError(type, error, filename = '', line = '') {
        const errorInfo = {
            type,
            message: error?.message || error,
            filename,
            line,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Error logged:', errorInfo);
        }

        // In production, you would send this to your error tracking service
        // this.sendToErrorService(errorInfo);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core components
    new HeaderManager();
    new SmoothScroll();
    new FormHandler();
    new CounterAnimation();
    new AnimationObserver();
    new PerformanceMonitor();
    new ErrorHandler();

    // Add loading complete class
    document.body.classList.add('loaded');
    
    // Initialize tooltips and other interactive elements
    initializeTooltips();
    initializeModalTriggers();
    initializeCopyToClipboard();
});

// Tooltip Initialization
function initializeTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: var(--text-primary);
        color: white;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
    tooltip.style.right = (window.innerWidth - rect.right) + 'px';
    
    setTimeout(() => tooltip.style.opacity = '1', 10);
    
    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target._tooltip) {
        e.target._tooltip.remove();
        delete e.target._tooltip;
    }
}

// Modal Triggers
function initializeModalTriggers() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                openModal(modal);
            }
        });
    });
}

function openModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Close modal on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// Copy to Clipboard
function initializeCopyToClipboard() {
    const copyTriggers = document.querySelectorAll('[data-copy]');
    
    copyTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const text = trigger.getAttribute('data-copy') || trigger.textContent;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    showCopyFeedback(trigger);
                });
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showCopyFeedback(trigger);
            }
        });
    });
}

function showCopyFeedback(element) {
    const originalText = element.textContent;
    element.textContent = 'تم النسخ ✓';
    element.style.color = 'var(--success-color)';
    
    setTimeout(() => {
        element.textContent = originalText;
        element.style.color = '';
    }, 2000);
}

// Export utilities for use in other scripts
window.SammaUtils = {
    Utils,
    StorageManager,
    CONFIG
};