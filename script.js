/* ===========================================
   MASOOD SULTAN — v2 SCRIPTS
   Terrain mesh, scroll reveals, no gimmicks
   =========================================== */

// ---- Terrain Mesh Background ----
class TerrainMesh {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = 0;
        this.rows = 0;
        this.spacing = 30;
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
        this.cols = Math.ceil(this.canvas.width / this.spacing) + 2;
        this.rows = Math.ceil(this.canvas.height / this.spacing) + 2;
        this.buildGrid();
    }

    buildGrid() {
        this.points = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.points.push({
                    x: c * this.spacing,
                    y: r * this.spacing,
                    baseX: c * this.spacing,
                    baseY: r * this.spacing
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
        this.time += 0.003;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update points with wave displacement
        for (const p of this.points) {
            const wave1 = Math.sin(p.baseX * 0.008 + this.time * 2) * 4;
            const wave2 = Math.cos(p.baseY * 0.006 + this.time * 1.5) * 3;
            p.x = p.baseX + wave1;
            p.y = p.baseY + wave2;

            // Mouse push
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                p.x += dx * force * 0.15;
                p.y += dy * force * 0.15;
            }
        }

        // Draw horizontal lines
        this.ctx.strokeStyle = 'rgba(196, 240, 77, 0.03)';
        this.ctx.lineWidth = 0.5;

        for (let r = 0; r < this.rows; r++) {
            this.ctx.beginPath();
            for (let c = 0; c < this.cols; c++) {
                const idx = r * this.cols + c;
                const p = this.points[idx];
                if (c === 0) this.ctx.moveTo(p.x, p.y);
                else this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.stroke();
        }

        // Draw vertical lines
        for (let c = 0; c < this.cols; c++) {
            this.ctx.beginPath();
            for (let r = 0; r < this.rows; r++) {
                const idx = r * this.cols + c;
                const p = this.points[idx];
                if (r === 0) this.ctx.moveTo(p.x, p.y);
                else this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.stroke();
        }

        // Draw dots at intersections near mouse
        for (const p of this.points) {
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                const alpha = (1 - dist / 200) * 0.4;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(196, 240, 77, ${alpha})`;
                this.ctx.fill();
            }
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

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    // Terrain background
    const canvas = document.getElementById('terrain-canvas');
    if (canvas) new TerrainMesh(canvas);

    initTopbar();
    initReveal();
    initTerminals();
});
