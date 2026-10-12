import * as THREE from './vendor/three.module.min.js';

// Visual controls: scene units, seconds and hexadecimal colours.
const LOTUS = {
    scale: 1, position: { x: 0, y: 0, z: 0 },
    ivory: '#fffaf6', tip: '#ac9199', tipStrength: 0.96,
    fadeDuration: 1.5, bloomDuration: 2,
    bloomRotation: Math.PI * 2 / 3, restingRotation: 0.22,
    accelerationEnd: 0.30,
    spin: { entrySpeed: 0.3, idleSpeed: 0.24, slowdown: 1.2 },
    pointerTilt: { x: 0.06, z: 0.10, followSpeed: 4 },
    maxPixelRatio: 2,
};


// Water controls: scene units and seconds; point size is in CSS pixels.
const WATER = {
    count: 7200, mobileCount: 2400, mobileBreakpoint: 600,
    radius: 9, innerRadius: 0.30, level: -0.40,
    pointSize: 3.0, color: '#B8B8B8', opacity: 0.72,
    speed: 0.65, wavelength: 1.65, amplitude: 0.085,
    interval: 5.5, envelopeWidth: 1.8, damping: 0.16,
    edgeFade: 0.30, mobilePixelRatio: 1.25,
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
    renderer.toneMappingExposure = 1.05;
    canvas.style.opacity = '1';
    host.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
    camera.position.set(0, 5.4, 8.4);
    camera.lookAt(0, 0.9, 0);
    scene.add(new THREE.HemisphereLight('#fffaf7', '#908489', 1.8));
    const key = new THREE.DirectionalLight('#ffffff', 2.5);
    key.position.set(-3, 6, 5); scene.add(key);
    const fill = new THREE.DirectionalLight('#fff7f3', 1.15);
    fill.position.set(4, 2, -3); scene.add(fill);
    const flower = new THREE.Group();
    flower.scale.setScalar(LOTUS.scale);
    const flowerY = LOTUS.position.y;
    flower.position.set(LOTUS.position.x, flowerY, LOTUS.position.z);
    flower.rotation.y = LOTUS.restingRotation - LOTUS.bloomRotation;
    // Separate continuous rotation from bloom and mouse tilt.
    const spin = new THREE.Group();
    spin.add(flower);
    // Mouse tilt stays in screen axes, outside the automatic spinning group.
    const tilt = new THREE.Group();
    tilt.add(spin);
    scene.add(tilt);
    const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.43, metalness: 0,
        sheen: 0.18, sheenColor: new THREE.Color('#fff7f3'), sheenRoughness: 0.7,
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
    function petalGeometry(length, width, curl, belly = -0.24, edgeCup = 0.27) {
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
                        curl * t * t * t + belly * Math.sin(Math.PI * t) +
                        edgeCup * u * u * Math.sin(Math.PI * t) + (side ? -thickness : thickness));
                    // Keep a broad white base, with a soft pink gradient toward the tip.
                    const tint = Math.min(1, Math.pow(Math.max(0, (t - 0.12) / 0.88), 0.95) * LOTUS.tipStrength + 0.015 * Math.abs(u) * t);
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
        { count: 9, length: 2.25, width: 0.88, radius: 0.23, y: 0, open: 1.18, curl: -0.45 },
        { count: 8, length: 2.04, width: 0.82, radius: 0.17, y: 0.08, open: 1.04, curl: -0.52 },
        { count: 7, length: 1.58, width: 0.61, radius: 0.10, y: 0.23, open: 0.64, curl: -0.56 },
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
            // Positive belly gives volume; negative tip and rim turn toward the flower centre.
            const opened = petalGeometry(length, ring.width, ring.curl, 0.18, -0.13);
            geometry.morphAttributes.position = [opened.attributes.position.clone()];
            geometry.morphAttributes.normal = [opened.attributes.normal.clone()];
            opened.dispose();
            const mesh = new THREE.Mesh(geometry, material);
            hinge.add(mesh);
            hinge.rotation.x = 0.08;
            petals.push({ hinge, mesh, open: ring.open + variation * 0.045, delay: layer * 0.6 + i * 0.025 });
        }
    });

    // Fixed world-space water; never parent it to flower, spin or tilt.
    const waterGeometry = new THREE.BufferGeometry();
    const waterMaterial = new THREE.ShaderMaterial({
        transparent: true, depthTest: true, depthWrite: false,
        uniforms: {
            uTime: { value: 0 }, uMotion: { value: 1 },
            uColor: { value: new THREE.Color(WATER.color) },
            uOpacity: { value: WATER.opacity }, uSize: { value: WATER.pointSize },
            uPixelRatio: { value: 1 }, uRadius: { value: WATER.radius },
            uSpeed: { value: WATER.speed }, uWavelength: { value: WATER.wavelength },
            uAmplitude: { value: WATER.amplitude }, uInterval: { value: WATER.interval },
            uWidth: { value: WATER.envelopeWidth }, uDamping: { value: WATER.damping },
            uEdgeFade: { value: WATER.edgeFade },
        },
        vertexShader: `
            uniform float uTime, uMotion, uSize, uPixelRatio, uRadius;
            uniform float uSpeed, uWavelength, uAmplitude, uInterval, uWidth, uDamping, uEdgeFade;
            attribute float aVariation;
            varying float vOpacity, vShade;
            void main() {
                float r = length(position.xz);
                // Retarded time: each radius receives the same pulse later.
                float arrival = uTime - r / uSpeed;
                float phase = mod(arrival + uInterval * 0.5, uInterval) - uInterval * 0.5;
                float height = 0.0;
                // Smooth overlapping Gaussian packets; wrap occurs only at negligible tails.
                for (int i = -2; i <= 2; i++) {
                    float age = phase + float(i) * uInterval;
                    float distanceFromCrest = -uSpeed * age;
                    float envelope = exp(-pow(distanceFromCrest / uWidth, 2.0));
                    height += sin(6.2831853 * distanceFromCrest / uWavelength) * envelope;
                }
                height *= uAmplitude * exp(-uDamping * r) * smoothstep(0.3, 0.85, r) * uMotion;
                vec3 p = position;
                p.y += height;
                vOpacity = (1.0 - smoothstep(uRadius * (1.0 - uEdgeFade), uRadius, r))
                    * smoothstep(0.30, 0.7, r);
                vShade = 1.0 + height * 0.35;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = uSize * uPixelRatio * aVariation;
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vOpacity, vShade;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float coverage = 1.0 - smoothstep(0.34, 0.5, d);
                if (coverage < 0.01) discard;
                gl_FragColor = vec4(uColor * vShade, coverage * vOpacity * uOpacity);
                #include <colorspace_fragment>
            }
        `,
    });
    const water = new THREE.Points(waterGeometry, waterMaterial);
    water.position.set(LOTUS.position.x, WATER.level + flowerY, LOTUS.position.z);
    water.frustumCulled = false;
    scene.add(water);
    let waterCount = 0, waterTime = 0;
    function populateWater(mobile) {
        const count = mobile ? WATER.mobileCount : WATER.count;
        if (waterCount === count) return;
        waterCount = count;
        const positions = [], variations = [];
        const spacing = Math.sqrt(Math.PI * WATER.radius ** 2 / count);
        // Uniform staggered grid on a circular XZ surface; deterministic tiny jitter.
        let row = 0;
        for (let z = -WATER.radius; z <= WATER.radius; z += spacing, row++) {
            for (let x = -WATER.radius; x <= WATER.radius; x += spacing) {
                const seed = Math.sin(row * 127.1 + x * 311.7) * 43758.5453;
                const jitter = seed - Math.floor(seed) - 0.5;
                const px = x + (row % 2) * spacing * 0.5 + jitter * spacing * 0.16;
                const pz = z + Math.sin(seed) * spacing * 0.08;
                const r = Math.hypot(px, pz);
                if (r > WATER.radius || r < WATER.innerRadius) continue;
                positions.push(px, 0, pz);
                variations.push(1 + jitter * 0.12);
            }
        }
        waterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        waterGeometry.setAttribute('aVariation', new THREE.Float32BufferAttribute(variations, 1));
        waterGeometry.computeBoundingSphere();
    }

    function waterMotion(time) {
        return Math.sin(time * Math.PI * 2 / 12) * 0.007;
    }
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const mouse = matchMedia('(hover: hover) and (pointer: fine)');
    const pointer = { x: 0, y: 0 };
    function resetPointer() { pointer.x = 0; pointer.y = 0; }
    function trackPointer(event) {
        if (!completed || !visible || document.hidden || motion.matches || !mouse.matches || event.pointerType !== 'mouse') return;
        pointer.x = THREE.MathUtils.clamp(event.clientX / innerWidth * 2 - 1, -1, 1);
        pointer.y = THREE.MathUtils.clamp(event.clientY / innerHeight * 2 - 1, -1, 1);
    }
    window.addEventListener('pointermove', trackPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    mouse.addEventListener('change', resetPointer);
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
        resetPointer();
        tilt.rotation.set(0, 0, 0);
        spin.rotation.y = 0;
        flower.rotation.x = 0;
        flower.rotation.y = LOTUS.restingRotation;
        flower.position.y = flowerY;
        host.dataset.lotusState = 'open';
    }
    function draw() {
        // Fade only flower materials; the shared canvas remains fully opaque.
        material.transparent = state.opacity < 1;
        receptacleMaterial.transparent = state.opacity < 1;
        material.opacity = receptacleMaterial.opacity = state.opacity;
        flower.visible = state.opacity > 0;
        waterMaterial.uniforms.uMotion.value = motion.matches ? 0 : 1;
        renderer.render(scene, camera);
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; timeline?.pause(); }
    function tick(time) {
        frame = 0;
        if (dead || !visible || document.hidden) return;
        const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
        // Continue through the bloom, then ease down without stopping or snapping.
        const { entrySpeed, idleSpeed, slowdown } = LOTUS.spin;
        if (completed) {
            const decay = Math.exp(-slowdown * floatTime);
            spin.rotation.y += idleSpeed * delta +
                (entrySpeed - idleSpeed) * decay * (1 - Math.exp(-slowdown * delta)) / slowdown;
            floatTime += delta;
        } else {
            spin.rotation.y += entrySpeed * delta;
        }
        if (completed) {
            flower.position.y = flowerY + waterMotion(floatTime);
            const blend = 1 - Math.exp(-LOTUS.pointerTilt.followSpeed * delta);
            tilt.rotation.x = THREE.MathUtils.lerp(tilt.rotation.x, pointer.y * LOTUS.pointerTilt.x, blend);
            tilt.rotation.z = THREE.MathUtils.lerp(tilt.rotation.z, -pointer.x * LOTUS.pointerTilt.z, blend);
        }
        // Uncapped elapsed time keeps waves consistent on slow frames.
        waterTime += lastTime ? (time - lastTime) / 1000 : 0;
        waterMaterial.uniforms.uTime.value = waterTime;
        lastTime = time; draw(); frame = requestAnimationFrame(tick);
    }
    let printing = false, printState;
    const printMedia = matchMedia('print');
    const printImage = document.createElement('img');
    printImage.className = 'portfolio-intro__print-still';
    printImage.alt = '';
    printImage.hidden = true;
    function beginPrint() {
        if (printing || dead) return;
        printing = true;
        printState = {
            time: timeline?.time(), completed, opacity: state.opacity,
            tilt: tilt.rotation.clone(), spin: spin.rotation.clone(),
            rotation: flower.rotation.clone(), y: flower.position.y,
        };
        stop();
        still();
        resize();
        draw();
        // Render a high-resolution, fully opened flower synchronously for printing.
        renderer.setPixelRatio(Math.max(3, Math.min(4, 2400 / host.parentElement.clientWidth)));
        waterMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        waterMaterial.uniforms.uMotion.value = 0;
        renderer.render(scene, camera);
        printImage.src = canvas.toDataURL('image/png');
        host.parentElement.append(printImage);
    }
    function endPrint() {
        if (!printing) return;
        printing = false;
        printImage.remove();
        timeline?.time(printState.time, true);
        completed = printState.completed;
        state.opacity = printState.opacity;
        tilt.rotation.copy(printState.tilt);
        spin.rotation.copy(printState.spin);
        flower.rotation.copy(printState.rotation);
        flower.position.y = printState.y;
        resize();
        sync();
    }
    function changePrint(event) { if (event.matches) beginPrint(); else endPrint(); }
    window.addEventListener('beforeprint', beginPrint);
    window.addEventListener('afterprint', endPrint);
    printMedia.addEventListener('change', changePrint);
    function sync() {
        stop();
        if (printing) return;
        if (dead || !visible || document.hidden) { resetPointer(); return; }
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
        const panel = host.parentElement.getBoundingClientRect();
        const rect = host.getBoundingClientRect();
        const mobile = panel.width <= WATER.mobileBreakpoint;
        populateWater(mobile);
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? WATER.mobilePixelRatio : LOTUS.maxPixelRatio));
        waterMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        renderer.setSize(panel.width, panel.height, false);
        Object.assign(canvas.style, { position: 'absolute', left: (panel.left - rect.left) + 'px',
            top: (panel.top - rect.top) + 'px', width: panel.width + 'px', height: panel.height + 'px' });
        camera.aspect = width / height;
        // Frame the flower itself, with room for its opening rotation.
        const frameWidth = 5.2, frameHeight = 3.6;
        const target = new THREE.Vector3(0, 0.85, 0);
        // Preserve the original viewing angle; only recenter the common water plane.
        const forward = new THREE.Vector3(0, 4.5, 8.4).normalize();
        const distance = Math.max(frameHeight, frameWidth / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(33 / 2)));
        camera.position.copy(target).addScaledVector(forward, distance);
        camera.lookAt(target);
        camera.far = distance + 30;
        // Expand the frustum without changing the original flower's pixel scale or position.
        camera.aspect = panel.width / panel.height;
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(33 / 2)) * panel.height / height));
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
        window.removeEventListener('beforeprint', beginPrint);
        window.removeEventListener('afterprint', endPrint);
        printMedia.removeEventListener('change', changePrint);
        printImage.remove();
        document.removeEventListener('visibilitychange', sync);
        motion.removeEventListener('change', sync);
        window.removeEventListener('pointermove', trackPointer);
        document.documentElement.removeEventListener('pointerleave', resetPointer);
        window.removeEventListener('blur', resetPointer);
        mouse.removeEventListener('change', resetPointer);
        canvas.removeEventListener('webglcontextlost', contextLost);
        petals.forEach(p => p.mesh.geometry.dispose()); material.dispose();
        receptacleGeometry.dispose(); receptacleMaterial.dispose();
        waterGeometry.dispose(); waterMaterial.dispose();
        renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); dispose = undefined;
    };
    resize();
}
mount();
window.addEventListener('pagehide', () => { completed = true; dispose?.(); });
window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
