/* ═══════════════════════════════════════════════════════════════════
   MASOOD SULTAN — Portfolio Engine
   Three.js Globe · SPA Router · Excavation · Sound · Theme
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    // ─── Seismic Mouse Trail ───────────────────────────────────────
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
                this.mouse.vx = this.mouse.x - this.lastMouse.x;
                this.mouse.vy = this.mouse.y - this.lastMouse.y;
                let speed = Math.sqrt(this.mouse.vx ** 2 + this.mouse.vy ** 2);
                let jitter = 0;
                if (speed > 5) {
                    jitter = (Math.random() - 0.5) * speed * 1.5;
                    if (jitter > 80) jitter = 80;
                    if (jitter < -80) jitter = -80;
                }
                this.points.push({ x: this.mouse.x, y: this.mouse.y + jitter, age: 0 });
                if (this.points.length > this.maxPoints) this.points.shift();
            });
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const rgb = isLight ? '0, 100, 170' : '0, 240, 255';

            if (this.points.length > 1) {
                this.ctx.lineJoin = 'round';
                this.ctx.lineCap = 'round';
                for (let i = 1; i < this.points.length; i++) {
                    let p1 = this.points[i - 1];
                    let p2 = this.points[i];
                    let opacity = 1 - (p2.age / 40);
                    if (opacity < 0) opacity = 0;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.lineWidth = 2 * opacity;
                    this.ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
                    this.ctx.shadowBlur = 10 * opacity;
                    this.ctx.shadowColor = `rgba(${rgb}, ${opacity})`;
                    this.ctx.stroke();
                    p1.age += 1;
                }
                this.points[this.points.length - 1].age += 1;
                this.points = this.points.filter(p => p.age < 40);
            }
            requestAnimationFrame(() => this.animate());
        }
    }

    // ─── Sound Engine (Web Audio API) ──────────────────────────────
    let audioCtx = null;
    let soundEnabled = true;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playPickaxeSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            // Metallic strike
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain2.gain.setValueAtTime(0.1, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            osc.connect(gain).connect(ctx.destination);
            osc2.connect(gain2).connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
            osc2.stop(ctx.currentTime + 0.2);
        } catch (e) { /* Silent fail */ }
    }

    function playSeismicPulse(intensity) {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            // Low rumble
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40 + intensity * 10, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.2 + intensity * 0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain).connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.7);

            // High crackle
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.08 + intensity * 0.02, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            noise.connect(noiseGain).connect(ctx.destination);
            noise.start(ctx.currentTime);
        } catch (e) { /* Silent fail */ }
    }

    function playRevealSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5-E5-G5-C6
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
                gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.8);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 1);
            });
        } catch (e) { /* Silent fail */ }
    }

    function playClickSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain).connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { /* Silent fail */ }
    }

    // ─── Configuration ─────────────────────────────────────────────
    const GLOBE_RADIUS = 1.0;
    const GLOBE_SEGMENTS = 64;
    const AUTO_ROTATE_SPEED = 0.0008;
    const CAMERA_DISTANCE = 2.6;
    const MAX_DIGS = 5;
    const BERLIN = { lat: 52.52, lng: 13.405 };
    const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

    // ─── State ─────────────────────────────────────────────────────
    let currentPage = 'home';
    let digStage = 0;
    let globeReady = false;
    let excavated = false;
    let countriesLoaded = false; // Guard against double-load

    // Three.js objects
    let scene, camera, renderer;
    let globeGroup, countryLinesMesh, globeMesh, atmosphereMesh, gridGroup, berlinMarker;
    let cracksGroup;
    let activeParticles = [];
    let mouseX = 0, mouseY = 0;
    let animationId = null;

    // ─── DOM References ────────────────────────────────────────────
    const refs = {};
    function cacheDom() {
        refs.app = document.getElementById('app');
        refs.nav = document.getElementById('main-nav');
        refs.navLinks = document.getElementById('nav-links');
        refs.navToggle = document.getElementById('nav-toggle');
        refs.globeContainer = document.getElementById('globe-container');
        refs.globeCanvas = document.getElementById('globe-canvas');
        refs.digPrompt = document.getElementById('dig-prompt');
        refs.nameReveal = document.getElementById('name-reveal');
        refs.pickaxeCursor = null; // Using CSS cursor instead
        refs.footer = document.getElementById('site-footer');
        refs.pages = document.querySelectorAll('.page');
        refs.navAnchors = document.querySelectorAll('.nav-links a');
        refs.digSegments = document.querySelectorAll('.dig-segment');
        refs.soundToggle = document.getElementById('sound-toggle');
        refs.themeToggle = document.getElementById('theme-toggle');
    }

    // ─── Utility ───────────────────────────────────────────────────
    function latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    // ─── SPA Router ────────────────────────────────────────────────
    function initRouter() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    function handleRoute() {
        const hash = window.location.hash || '#/';
        const route = hash.replace('#/', '').replace('/', '') || 'home';
        navigateTo(route);
    }

    function navigateTo(page) {
        if (page === currentPage && document.querySelector('.page.active')) return;

        refs.pages.forEach(p => p.classList.remove('active'));

        const target = document.getElementById('page-' + page);
        if (!target) {
            document.getElementById('page-home').classList.add('active');
            currentPage = 'home';
        } else {
            target.classList.add('active');
            currentPage = page;
        }

        document.body.setAttribute('data-page', currentPage);

        refs.navAnchors.forEach(a => {
            a.classList.toggle('active', a.dataset.page === currentPage);
        });

        window.scrollTo(0, 0);

        if (refs.navLinks.classList.contains('open')) {
            refs.navLinks.classList.remove('open');
            refs.navToggle.classList.remove('open');
        }

        if (currentPage === 'home' && globeReady) {
            startGlobeAnimation();
        } else if (currentPage !== 'home') {
            stopGlobeAnimation();
        }

        playClickSound();
    }

    // ─── Mobile Menu ───────────────────────────────────────────────
    function initMobileMenu() {
        refs.navToggle.addEventListener('click', () => {
            refs.navLinks.classList.toggle('open');
            refs.navToggle.classList.toggle('open');
        });
    }

    // ─── Theme Toggle ──────────────────────────────────────────────
    function initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            updateThemeIcons('light');
            // Globe colours set after initGlobe runs
        }

        refs.themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            if (next === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            localStorage.setItem('theme', next);
            updateThemeIcons(next);
            updateGlobeTheme(next);
            playClickSound();
        });
    }

    function updateThemeIcons(theme) {
        const moon = document.getElementById('theme-moon');
        const sun = document.getElementById('theme-sun');
        if (theme === 'light') {
            moon.style.display = 'none';
            sun.style.display = 'block';
        } else {
            moon.style.display = 'block';
            sun.style.display = 'none';
        }
    }

    function updateGlobeTheme(theme) {
        if (!renderer) return;
        if (theme === 'light') {
            renderer.setClearColor(0xd4c4a8, 1);
            if (globeMesh) {
                globeMesh.material.color.setHex(0x2a2520);
                globeMesh.material.emissive.setHex(0x1a1510);
            }
            if (gridGroup) gridGroup.children.forEach(l => { l.material.color.setHex(0x8a7a60); });
            if (countryLinesMesh) countryLinesMesh.material.color.setHex(0x0077aa);
        } else {
            renderer.setClearColor(0x07080f, 1);
            if (globeMesh) {
                globeMesh.material.color.setHex(0x0d1117);
                globeMesh.material.emissive.setHex(0x050810);
            }
            if (gridGroup) gridGroup.children.forEach(l => { l.material.color.setHex(0x1a1a3e); });
            if (countryLinesMesh) countryLinesMesh.material.color.setHex(0x00f0ff);
        }
    }

    // ─── Sound Toggle ──────────────────────────────────────────────
    function initSound() {
        const saved = localStorage.getItem('sound');
        if (saved === 'off') {
            soundEnabled = false;
            updateSoundIcons();
        }

        refs.soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('sound', soundEnabled ? 'on' : 'off');
            updateSoundIcons();
            if (soundEnabled) playClickSound();
        });
    }

    function updateSoundIcons() {
        const on = document.getElementById('sound-on-icon');
        const off = document.getElementById('sound-off-icon');
        on.style.display = soundEnabled ? 'block' : 'none';
        off.style.display = soundEnabled ? 'none' : 'block';
    }

    // ─── Globe Engine ──────────────────────────────────────────────
    function initGlobe() {
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not available.');
            showNameDirectly();
            return;
        }

        // NO sessionStorage check — always show fresh globe

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = CAMERA_DISTANCE;

        renderer = new THREE.WebGLRenderer({
            canvas: refs.globeCanvas,
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x07080f, 1);

        const ambient = new THREE.AmbientLight(0x222244, 0.6);
        scene.add(ambient);
        const point = new THREE.PointLight(0x00f0ff, 0.8, 50);
        point.position.set(5, 3, 5);
        scene.add(point);
        const point2 = new THREE.PointLight(0xff3366, 0.3, 50);
        point2.position.set(-5, -2, 3);
        scene.add(point2);

        globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, GLOBE_SEGMENTS, GLOBE_SEGMENTS);
        const sphereMat = new THREE.MeshPhongMaterial({
            color: 0x0d1117,
            emissive: 0x050810,
            shininess: 5,
            transparent: true,
            opacity: 1.0
        });
        globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
        globeGroup.add(globeMesh);

        createGridLines();
        createAtmosphere();
        createStars();

        cracksGroup = new THREE.Group();
        globeGroup.add(cracksGroup);

        loadCountryData();
        addBerlinMarker();

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousemove', handleMouseMove);

        globeReady = true;
        startGlobeAnimation();
    }

    function createStars() {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 80;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.7 });
        scene.add(new THREE.Points(geo, mat));
    }

    function createAtmosphere() {
        const geo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 64, 64);
        const mat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 color = mix(vec3(0.0, 0.94, 1.0), vec3(0.49, 0.23, 0.93), 0.25);
                    gl_FragColor = vec4(color, intensity * 0.5);
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        atmosphereMesh = new THREE.Mesh(geo, mat);
        globeGroup.add(atmosphereMesh);
    }

    function createGridLines() {
        gridGroup = new THREE.Group();
        const gridMat = new THREE.LineBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.25 });

        for (let lat = -60; lat <= 60; lat += 30) {
            const pts = [];
            for (let lng = -180; lng <= 180; lng += 3) {
                pts.push(latLngToVector3(lat, lng, GLOBE_RADIUS * 1.001));
            }
            gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
        }

        for (let lng = -180; lng < 180; lng += 30) {
            const pts = [];
            for (let lat = -90; lat <= 90; lat += 3) {
                pts.push(latLngToVector3(lat, lng, GLOBE_RADIUS * 1.001));
            }
            gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
        }

        globeGroup.add(gridGroup);
    }

    function loadCountryData() {
        // Guard: only load once
        if (countriesLoaded) return;
        countriesLoaded = true;

        fetch(WORLD_ATLAS_URL)
            .then(r => r.json())
            .then(worldData => {
                if (typeof topojson === 'undefined') return;
                const mesh = topojson.mesh(worldData, worldData.objects.countries);
                const points = [];

                mesh.coordinates.forEach(line => {
                    for (let i = 0; i < line.length - 1; i++) {
                        const [lng1, lat1] = line[i];
                        const [lng2, lat2] = line[i + 1];
                        points.push(latLngToVector3(lat1, lng1, GLOBE_RADIUS * 1.002));
                        points.push(latLngToVector3(lat2, lng2, GLOBE_RADIUS * 1.002));
                    }
                });

                const geo = new THREE.BufferGeometry().setFromPoints(points);
                const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
                countryLinesMesh = new THREE.LineSegments(geo, mat);
                globeGroup.add(countryLinesMesh);
            })
            .catch(err => console.warn('Failed to load world atlas:', err));
    }

    function addBerlinMarker() {
        const pos = latLngToVector3(BERLIN.lat, BERLIN.lng, GLOBE_RADIUS * 1.01);
        const geo = new THREE.SphereGeometry(0.012, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
        berlinMarker = new THREE.Mesh(geo, mat);
        berlinMarker.position.copy(pos);
        globeGroup.add(berlinMarker);

        const ringGeo = new THREE.RingGeometry(0.018, 0.024, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        globeGroup.add(ring);
    }

    function handleResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function handleMouseMove(e) {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }

    // ─── Globe Animation Loop ──────────────────────────────────────
    function startGlobeAnimation() {
        if (animationId) return;
        animateGlobe();
    }

    function stopGlobeAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function animateGlobe() {
        animationId = requestAnimationFrame(animateGlobe);
        if (!globeGroup) return;

        globeGroup.rotation.y += AUTO_ROTATE_SPEED;

        globeGroup.rotation.x += (mouseY * 0.15 - globeGroup.rotation.x) * 0.02;
        const targetRotY = globeGroup.rotation.y + mouseX * 0.1;
        globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.01;

        // No per-frame opacity manipulation — keep globe solid until final reveal

        updateParticles();

        if (berlinMarker && !excavated) {
            const s = 1 + Math.sin(Date.now() * 0.004) * 0.3;
            berlinMarker.scale.setScalar(s);
        }

        renderer.render(scene, camera);
    }

    // ─── Particles ─────────────────────────────────────────────────
    function createDigParticles(origin, count, isReveal) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = [];

        const earthColors = [[0.6,0.4,0.2],[0.5,0.35,0.15],[0.7,0.55,0.3],[0.4,0.3,0.15]];
        const revealColors = [[0.0,0.94,1.0],[0.49,0.23,0.93],[1.0,0.2,0.4],[0.0,0.8,0.9]];
        const palette = isReveal ? revealColors : earthColors;

        for (let i = 0; i < count; i++) {
            positions[i*3] = origin.x;
            positions[i*3+1] = origin.y;
            positions[i*3+2] = origin.z;
            const dir = origin.clone().normalize();
            const spread = isReveal ? 0.06 : 0.04;
            const speed = isReveal ? 0.04 : 0.025;
            velocities.push(dir.clone().multiplyScalar(speed + Math.random() * speed).add(
                new THREE.Vector3((Math.random()-0.5)*spread, Math.random()*spread*0.5, (Math.random()-0.5)*spread)
            ));
            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i*3] = c[0]; colors[i*3+1] = c[1]; colors[i*3+2] = c[2];
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: isReveal ? 0.04 : 0.025, vertexColors: true, transparent: true, opacity: 1.0 });
        const pts = new THREE.Points(geo, mat);
        scene.add(pts);
        activeParticles.push({ mesh: pts, velocities, born: Date.now(), life: isReveal ? 3000 : 2000 });
    }

    function updateParticles() {
        const now = Date.now();
        for (let i = activeParticles.length - 1; i >= 0; i--) {
            const p = activeParticles[i];
            const age = (now - p.born) / p.life;
            if (age > 1) {
                scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                activeParticles.splice(i, 1);
                continue;
            }
            const pos = p.mesh.geometry.attributes.position.array;
            for (let j = 0; j < pos.length / 3; j++) {
                pos[j*3] += p.velocities[j].x;
                pos[j*3+1] += p.velocities[j].y - 0.0004 * age;
                pos[j*3+2] += p.velocities[j].z;
                p.velocities[j].multiplyScalar(0.98);
            }
            p.mesh.geometry.attributes.position.needsUpdate = true;
            p.mesh.material.opacity = Math.max(0, 1 - age);
        }
    }

    // ─── Excavation Controller ─────────────────────────────────────
    function initExcavation() {
        refs.globeCanvas.addEventListener('click', onGlobeClick);
        refs.globeCanvas.addEventListener('touchend', onGlobeTouch);
    }

    function onGlobeTouch(e) {
        e.preventDefault();
        if (excavated || digStage >= MAX_DIGS) return;
        const touch = e.changedTouches[0];
        performDig(touch.clientX, touch.clientY);
    }

    function onGlobeClick(e) {
        if (excavated || digStage >= MAX_DIGS) return;
        performDig(e.clientX, e.clientY);
    }

    function performDig(clientX, clientY) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(globeMesh);
        if (intersects.length === 0) return;

        const hitPoint = intersects[0].point;
        digStage++;

        // Sound effects
        playPickaxeSound();
        playSeismicPulse(digStage);

        // Animate pickaxe hit feedback
        refs.globeContainer.classList.remove('digging');
        void refs.globeContainer.offsetWidth;
        refs.globeContainer.classList.add('digging');

        // Screen shake (CSS + camera)
        document.body.classList.remove('screen-shake');
        void document.body.offsetWidth;
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 400);

        updateDigProgress();
        addCracks(hitPoint);
        createDigParticles(hitPoint, 15 + digStage * 8, false);
        shakeCamera(0.03 + digStage * 0.015, 300 + digStage * 80);

        if (digStage === 4) refs.nameReveal.classList.add('revealing');

        if (digStage >= MAX_DIGS) {
            setTimeout(() => completeExcavation(hitPoint), 400);
        }
    }

    function updateDigProgress() {
        refs.digSegments.forEach((seg, i) => {
            if (i < digStage) seg.classList.add('filled');
        });
    }

    function addCracks(hitPoint) {
        const crackCount = 2 + digStage;
        for (let c = 0; c < crackCount; c++) {
            const pts = [];
            let current = hitPoint.clone();
            const segments = 5 + Math.floor(Math.random() * 6);
            for (let i = 0; i < segments; i++) {
                const next = current.clone().add(new THREE.Vector3(
                    (Math.random()-0.5)*0.08, (Math.random()-0.5)*0.08, (Math.random()-0.5)*0.08
                ));
                next.normalize().multiplyScalar(GLOBE_RADIUS * 1.003);
                pts.push(current, next);
                current = next;
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = new THREE.LineBasicMaterial({ color: digStage >= 3 ? 0xff3366 : 0xff6b4a, transparent: true, opacity: 0.7 });
            cracksGroup.add(new THREE.LineSegments(geo, mat));
        }
    }

    // No intermediate dissolve — globe stays solid and only fades on final reveal

    function completeExcavation(hitPoint) {
        excavated = true;

        // Reveal sound
        playRevealSound();

        // Massive particle burst
        for (let i = 0; i < 5; i++) {
            const offset = new THREE.Vector3(
                (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.3 + 0.5
            );
            createDigParticles(offset, 40, true);
        }

        // Final dissolve
        const duration = 1200;
        const startTime = Date.now();
        function finalDissolve() {
            const t = Math.min(1, (Date.now() - startTime) / duration);
            const ease = 1 - Math.pow(1 - t, 3);
            if (globeMesh) globeMesh.material.opacity = Math.max(0, globeMesh.material.opacity - 0.03);
            if (countryLinesMesh) countryLinesMesh.material.opacity = Math.max(0, countryLinesMesh.material.opacity - 0.02);
            if (gridGroup) gridGroup.children.forEach(l => { l.material.opacity = Math.max(0, l.material.opacity - 0.02); });
            cracksGroup.children.forEach(c => { c.material.opacity = Math.max(0, c.material.opacity - 0.03); });
            if (berlinMarker) berlinMarker.material.opacity = Math.max(0, 1 - ease);
            if (t < 1) requestAnimationFrame(finalDissolve);
        }
        finalDissolve();

        refs.nameReveal.classList.remove('revealing');
        refs.nameReveal.classList.add('revealed');
        refs.digPrompt.classList.add('hidden');
        refs.globeContainer.classList.remove('pickaxe-active');

        refs.globeCanvas.removeEventListener('click', onGlobeClick);
        refs.globeCanvas.removeEventListener('touchend', onGlobeTouch);
    }

    function showNameDirectly() {
        digStage = MAX_DIGS;
        excavated = true;
        if (refs.nameReveal) refs.nameReveal.classList.add('revealed');
        if (refs.digPrompt) refs.digPrompt.classList.add('hidden');
        if (refs.digSegments) refs.digSegments.forEach(s => s.classList.add('filled'));
        if (globeMesh) globeMesh.material.opacity = 0.15;
        if (countryLinesMesh) countryLinesMesh.material.opacity = 0.1;
        if (gridGroup) gridGroup.children.forEach(l => { l.material.opacity = 0.05; });
    }

    function shakeCamera(intensity, duration) {
        if (!camera) return;
        const origX = camera.position.x;
        const origY = camera.position.y;
        const origZ = camera.position.z;
        const startTime = Date.now();
        function shake() {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const decay = 1 - elapsed / duration;
                camera.position.x = origX + (Math.random() - 0.5) * intensity * decay;
                camera.position.y = origY + (Math.random() - 0.5) * intensity * decay;
                requestAnimationFrame(shake);
            } else {
                camera.position.x = origX;
                camera.position.y = origY;
                camera.position.z = origZ;
            }
        }
        shake();
    }

    // ─── Pickaxe Cursor ────────────────────────────────────────────
    function initPickaxeCursor() {
        if (!refs.globeContainer) return;
        // Add pickaxe cursor class (CSS handles the actual cursor image)
        if (!excavated) {
            refs.globeContainer.classList.add('pickaxe-active');
        }
    }

    // ─── Initialization ────────────────────────────────────────────
    function init() {
        cacheDom();
        initRouter();
        initMobileMenu();
        initTheme();
        initSound();
        initGlobe();
        // Apply saved theme to globe (initTheme runs before initGlobe)
        if (localStorage.getItem('theme') === 'light') updateGlobeTheme('light');
        initPickaxeCursor();
        initExcavation();

        const seismicCanvas = document.getElementById('seismic-canvas');
        if (seismicCanvas) new SeismicTrail(seismicCanvas);

        // Email obfuscation — assemble address client-side
        const emailEl = document.getElementById('email-display');
        if (emailEl) emailEl.textContent = 'masood.geo' + '@' + 'yahoo.com';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
