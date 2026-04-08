/* ===========================================
   MASOOD SULTAN — v2 SCRIPTS
   Terrain mesh, scroll reveals, no gimmicks
   =========================================== */

// ---- Seismic Mouse Trail ----
class SeismicTrail {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.maxPoints = 40;
        this.mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
        this.lastMouse = { x: -1000, y: -1000 };
        this.resize();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.lastMouse.x = this.mouse.x;
            this.lastMouse.y = this.mouse.y;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Calculate velocity
            this.mouse.vx = this.mouse.x - this.lastMouse.x;
            this.mouse.vy = this.mouse.y - this.lastMouse.y;
            let speed = Math.sqrt(this.mouse.vx ** 2 + this.mouse.vy ** 2);
            
            // Generate jitter purely based on speed
            let jitter = 0;
            if (speed > 5) {
                // High amplitude for high speed, resembling seismic P/S waves
                jitter = (Math.random() - 0.5) * speed * 1.5;
                if (jitter > 80) jitter = 80; // cap amplitude
                if (jitter < -80) jitter = -80;
            }

            this.points.push({
                x: this.mouse.x,
                y: this.mouse.y + jitter, // Apply displacement perpendicular
                age: 0
            });

            if (this.points.length > this.maxPoints) {
                this.points.shift();
            }
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        // Accent colors: terracotta in light, neon green in dark
        const rgb = isLight ? '202, 93, 34' : '196, 240, 77';

        if (this.points.length > 1) {
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';

            for (let i = 1; i < this.points.length; i++) {
                let p1 = this.points[i - 1];
                let p2 = this.points[i];
                
                // Opacity fades significantly with age
                let opacity = 1 - (p2.age / 40);
                if (opacity < 0) opacity = 0;

                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                
                // Dynamic line width and glow
                this.ctx.lineWidth = 2 * opacity;
                this.ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
                this.ctx.shadowBlur = 10 * opacity;
                this.ctx.shadowColor = `rgba(${rgb}, ${opacity})`;
                
                this.ctx.stroke();

                // Age the points
                p1.age += 1;
            }
            // Age the last point
            this.points[this.points.length - 1].age += 1;
            
            // Remove completely faded points
            this.points = this.points.filter(p => p.age < 40);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ---- Topbar scroll ----
function initTopbar() {
    const topbar = document.getElementById('topbar');
    const navLinks = document.querySelectorAll('.topbar-nav a');

    window.addEventListener('scroll', () => {
        topbar.classList.toggle('scrolled', window.scrollY > 60);
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ---- Scroll reveal ----
function initReveal() {
    // Tag everything that should animate
    const targets = document.querySelectorAll(
        '.project, .about-heading, .about-prose, .about-sidebar, .stack-col, ' +
        '.contact-heading, .contact-body, .contact-link, .section-label'
    );

    targets.forEach(el => el.classList.add('reveal-up'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // stagger siblings
                const siblings = entry.target.parentElement.querySelectorAll('.reveal-up');
                const idx = Array.from(siblings).indexOf(entry.target);
                entry.target.style.transitionDelay = `${idx * 0.08}s`;
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(t => observer.observe(t));
}

// ---- Terminal typing animation ----
function initTerminals() {
    const terminals = document.querySelectorAll('.terminal-body');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const lines = entry.target.querySelectorAll('.term-line');
                lines.forEach((line, i) => {
                    line.style.opacity = '0';
                    line.style.transform = 'translateX(-10px)';
                    line.style.transition = `opacity 0.4s ease ${i * 0.12}s, transform 0.4s ease ${i * 0.12}s`;
                    setTimeout(() => {
                        line.style.opacity = '1';
                        line.style.transform = 'translateX(0)';
                    }, 50);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    terminals.forEach(t => observer.observe(t));
}

// ---- Theme Logic ----
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    let currentTheme = savedTheme || (prefersLight ? 'light' : 'dark');

    const updateTheme = (theme) => {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        } else {
            document.documentElement.removeAttribute('data-theme');
            toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        }
        localStorage.setItem('theme', theme);
    };

    updateTheme(currentTheme);

    toggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        updateTheme(currentTheme);
    });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    // Terrain background
    const canvas = document.getElementById('terrain-canvas');
    if (canvas) new SeismicTrail(canvas);

    initTheme();
    initTopbar();
    initReveal();
    initTerminals();
});
