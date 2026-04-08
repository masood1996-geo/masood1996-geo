/* ===========================================
   MASOOD SULTAN — v2 SCRIPTS
   Terrain mesh, scroll reveals, no gimmicks
   =========================================== */

// ---- Topographic Mesh Background ----
class TerrainMesh {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = 0;
        this.rows = 0;
        this.spacingX = 25;
        this.spacingY = 30; // Closer vertical spacing for 3D effect
        this.points = [];
        this.time = 0;
        this.mouse = { x: -1000, y: -1000 };
        this.resize();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cols = Math.ceil(this.canvas.width / this.spacingX) + 2;
        this.rows = Math.ceil(this.canvas.height / this.spacingY) + 4; // Extra rows for overlap
        this.buildGrid();
    }

    buildGrid() {
        this.points = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.points.push({
                    x: c * this.spacingX - this.spacingX,
                    y: r * this.spacingY - this.spacingY * 2,
                    baseX: c * this.spacingX - this.spacingX,
                    baseY: r * this.spacingY - this.spacingY * 2
                });
            }
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    animate() {
        this.time += 0.0015; // Slow, organic movement
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        
        // Use exact background color to mask out lines behind
        const bgColor = isLight ? '#f9f8f5' : '#0c0c0e'; 
        const lineColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(196, 240, 77, 0.06)';

        // Update points with organic wave displacement
        for (const p of this.points) {
            // Complex multi-octave sine field = pseudo-perlin noise
            const wave1 = Math.sin(p.baseX * 0.003 + this.time * 2) * 20;
            const wave2 = Math.cos(p.baseY * 0.004 + p.baseX * 0.002 - this.time) * 30;
            const wave3 = Math.sin((p.baseX + p.baseY) * 0.008 + this.time * 3) * 10;
            
            p.x = p.baseX;
            // Displacement mainly on Y axis to simulate elevation
            p.y = p.baseY + wave1 + wave2 + wave3;

            // Mouse interaction: push points away slightly
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 250) {
                const force = (250 - dist) / 250;
                p.y += dy * force * 0.2;
            }
        }

        // Draw horizontal lines from top to bottom
        this.ctx.lineWidth = 1;
        this.ctx.lineJoin = 'round';

        for (let r = 0; r < this.rows; r++) {
            this.ctx.beginPath();
            let firstPoint = this.points[r * this.cols];
            this.ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let c = 1; c < this.cols; c++) {
                const p = this.points[r * this.cols + c];
                // Smooth bezier curve through the points
                const prev = this.points[r * this.cols + c - 1];
                const cpX = (prev.x + p.x) / 2;
                const cpY = (prev.y + p.y) / 2;
                
                if (c === 1) {
                    this.ctx.lineTo(cpX, cpY);
                } else if (c === this.cols - 1) {
                    this.ctx.quadraticCurveTo(prev.x, prev.y, p.x, p.y);
                } else {
                    this.ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
                }
            }

            // To create the 3D masking effect, draw a polygon down to the bottom of the canvas and fill it
            const lastPoint = this.points[r * this.cols + this.cols - 1];
            this.ctx.lineTo(lastPoint.x, this.canvas.height + 100);
            this.ctx.lineTo(firstPoint.x, this.canvas.height + 100);
            this.ctx.closePath();

            this.ctx.fillStyle = bgColor;
            this.ctx.fill();

            // Then stroke the exact same path
            this.ctx.strokeStyle = lineColor;
            this.ctx.stroke();
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
    if (canvas) new TerrainMesh(canvas);

    initTheme();
    initTopbar();
    initReveal();
    initTerminals();
});
