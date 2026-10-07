import * as THREE from './vendor/three.module.min.js';

// Visual controls: scene units, seconds and hexadecimal colours.
const LOTUS = {
    scale: 1, position: { x: 0, y: 0, z: 0 },
    ivory: '#fff2dc', tip: '#e9bdc6', tipStrength: 0.60,
    fadeDuration: 1.5, bloomDuration: 2,
    bloomRotation: Math.PI * 2 / 3, restingRotation: 0.22,
    accelerationEnd: 0.30,
    floatAmplitude: 0.025, floatPeriod: 9, maxPixelRatio: 2,
};

// Asymmetric ease-in-out: accelerate during the first 30%, then gently decelerate.
function bloomEase(progress) {
    const split = LOTUS.accelerationEnd;
    return progress < split
        ? progress * progress / split
        : 1 - (1 - progress) * (1 - progress) / (1 - split);
}

const host = document.querySelector('.portfolio-intro__lotus');
let completed = false;
let dispose;

function mount() {
    if (!host?.isConnected || dispose) return;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!context) { host.dataset.lotusState = 'unavailable'; return; }
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true }); }
    catch { host.dataset.lotusState = 'unavailable'; return; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOTUS.maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvas.style.opacity = '0';
    host.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
    camera.position.set(0, 5.4, 8.4);
    camera.lookAt(0, 0.9, 0);
    scene.add(new THREE.HemisphereLight('#fff5e8', '#9b8490', 2.1));
    const key = new THREE.DirectionalLight('#fff2df', 3.1);
    key.position.set(-3, 6, 5); scene.add(key);
    const fill = new THREE.DirectionalLight('#e7ebff', 1.15);
    fill.position.set(4, 2, -3); scene.add(fill);
    const flower = new THREE.Group();
    flower.scale.setScalar(LOTUS.scale);
    flower.position.set(LOTUS.position.x, LOTUS.position.y, LOTUS.position.z);
    flower.rotation.y = LOTUS.restingRotation - LOTUS.bloomRotation;
    scene.add(flower);
    const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.43, metalness: 0,
        sheen: 0.35, sheenColor: new THREE.Color('#fff1e6'), sheenRoughness: 0.7,
        clearcoat: 0.06, clearcoatRoughness: 0.6, side: THREE.DoubleSide,
    });
    const ivory = new THREE.Color(LOTUS.ivory), pink = new THREE.Color(LOTUS.tip);
    const petals = [];
    // A small receptacle joins the petal roots, without a visible stem or extra ornament.
    const receptacleGeometry = new THREE.SphereGeometry(0.26, 20, 12);
    const receptacleMaterial = new THREE.MeshStandardMaterial({ color: LOTUS.ivory, roughness: 0.65 });
    const receptacle = new THREE.Mesh(receptacleGeometry, receptacleMaterial);
    receptacle.scale.set(1, 0.55, 1);
    receptacle.position.y = 0.10;
    flower.add(receptacle);
    // Each petal is a closed, thin shell. Its root stays at the local origin.
    function petalGeometry(length, width, curl) {
        const rows = 28, columns = 12, stride = columns + 1;
        const layerSize = (rows + 1) * stride;
        const positions = [], colors = [], indices = [];
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i <= rows; i++) {
                const t = i / rows;
                const breadth = width * Math.pow(Math.sin(Math.PI * t), 0.82) * (0.45 + 0.55 * t);
                for (let j = 0; j <= columns; j++) {
                    const u = j / columns * 2 - 1;
                    const thickness = 0.012 * Math.sin(Math.PI * t) * (1 - u * u);
                    positions.push(breadth * u, length * (t - 0.08 * Math.sin(Math.PI * t)),
                        curl * t * t * t - 0.24 * Math.sin(Math.PI * t) +
                        0.27 * u * u * Math.sin(Math.PI * t) + (side ? -thickness : thickness));
                    // A soft blush reaches the middle while the root stays ivory.
                    const tint = Math.pow(t, 2) * LOTUS.tipStrength + 0.025 * Math.abs(u);
                    const color = ivory.clone().lerp(pink, tint);
                    colors.push(color.r, color.g, color.b);
                }
            }
        }
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) {
                const a = side * layerSize + i * stride + j, b = a + stride;
                if (side) indices.push(a, b, a + 1, b, b + 1, a + 1);
                else indices.push(a, a + 1, b, b, a + 1, b + 1);
            }
        }
        // Shell edges coincide (zero thickness at the perimeter).
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }
    [
        { count: 9, length: 2.25, width: 0.88, radius: 0.23, y: 0, open: 1.27 },
        { count: 8, length: 1.94, width: 0.76, radius: 0.17, y: 0.12, open: 0.91 },
        { count: 7, length: 1.58, width: 0.61, radius: 0.10, y: 0.23, open: 0.46 },
    ].forEach((ring, layer) => {
        for (let i = 0; i < ring.count; i++) {
            const variation = Math.sin(i * 12.73 + layer * 3.1);
            const angle = i / ring.count * Math.PI * 2 + layer * 0.39 + variation * 0.035;
            const root = new THREE.Group();
            root.rotation.y = angle;
            root.position.set(Math.sin(angle) * ring.radius, ring.y, Math.cos(angle) * ring.radius);
            const hinge = new THREE.Group();
            root.add(hinge); flower.add(root);
            const length = ring.length * (1 + variation * 0.035);
            const geometry = petalGeometry(length, ring.width, -0.47);
            const opened = petalGeometry(length, ring.width, -0.20);
            geometry.morphAttributes.position = [opened.attributes.position.clone()];
            geometry.morphAttributes.normal = [opened.attributes.normal.clone()];
            opened.dispose();
            const mesh = new THREE.Mesh(geometry, material);
            hinge.add(mesh);
            hinge.rotation.x = 0.08;
            petals.push({ hinge, mesh, open: ring.open + variation * 0.045, delay: layer * 0.6 + i * 0.025 });
        }
    });
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, started = false, frame = 0, lastTime = 0, floatTime = 0, dead = false;
    const state = { opacity: 0 };
    const timeline = window.gsap?.timeline({ paused: true, onComplete() {
        completed = true; host.dataset.lotusState = 'open';
    } });
    timeline?.to(state, { opacity: 1, duration: LOTUS.fadeDuration, ease: 'sine.inOut' }, 0);
    timeline?.to(flower.rotation, {
        y: LOTUS.restingRotation,
        duration: LOTUS.bloomDuration,
        ease: bloomEase,
    }, 0);
    petals.forEach(({ hinge, mesh, open, delay }) => {
        // Scale the stagger with the total duration to preserve the opening rhythm.
        const start = (0.12 + delay) * LOTUS.bloomDuration / 4.8;
        const duration = LOTUS.bloomDuration - start;
        timeline?.to(hinge.rotation, { x: open, duration, ease: bloomEase }, start);
        timeline?.to(mesh.morphTargetInfluences, { 0: 1, duration, ease: bloomEase }, start);
    });
    function still() {
        timeline?.progress(1).pause();
        petals.forEach(p => { p.hinge.rotation.x = p.open; p.mesh.morphTargetInfluences[0] = 1; });
        state.opacity = 1; completed = true;
        flower.rotation.y = LOTUS.restingRotation;
        flower.position.y = LOTUS.position.y;
        host.dataset.lotusState = 'open';
    }
    function draw() {
        canvas.style.opacity = String(state.opacity);
        renderer.render(scene, camera);
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; timeline?.pause(); }
    function tick(time) {
        frame = 0;
        if (dead || !visible || document.hidden) return;
        if (completed) {
            if (lastTime) floatTime += Math.min((time - lastTime) / 1000, 0.1);
            flower.position.y = LOTUS.position.y + Math.sin(floatTime * Math.PI * 2 / LOTUS.floatPeriod) * LOTUS.floatAmplitude;
        }
        lastTime = time; draw(); frame = requestAnimationFrame(tick);
    }
    function sync() {
        stop();
        if (dead || !visible || document.hidden) return;
        if (motion.matches || !timeline) { still(); draw(); return; }
        if (!started) {
            started = true;
            if (completed) still();
            else host.dataset.lotusState = 'blooming';
        }
        if (!completed) timeline.play();
        frame = requestAnimationFrame(tick);
    }
    function resize() {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height || dead) return;
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOTUS.maxPixelRatio));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Fit the complete flower in narrow containers as well as landscape screens.
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(33 / 2)) / Math.min(1, camera.aspect)));
        camera.updateProjectionMatrix();
        if (visible && !document.hidden) draw();
    }
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    visibility.observe(host);
    const size = new ResizeObserver(resize); size.observe(host);
    const removal = new MutationObserver(() => { if (!host.isConnected) dispose?.(); });
    removal.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    function contextLost(event) { event.preventDefault(); dispose?.(); host.dataset.lotusState = 'unavailable'; }
    canvas.addEventListener('webglcontextlost', contextLost);
    dispose = () => {
        dead = true; stop(); timeline?.kill(); visibility.disconnect(); size.disconnect(); removal.disconnect();
        document.removeEventListener('visibilitychange', sync);
        motion.removeEventListener('change', sync);
        canvas.removeEventListener('webglcontextlost', contextLost);
        petals.forEach(p => p.mesh.geometry.dispose()); material.dispose();
        receptacleGeometry.dispose(); receptacleMaterial.dispose();
        renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); dispose = undefined;
    };
    resize();
}
mount();
window.addEventListener('pagehide', () => { completed = true; dispose?.(); });
window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
