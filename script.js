// --- CONFIGURATION ---
const RADIUS = 600;
const ELEMENT_COUNT = 80; 
const WORDS = [
    "Aventura", "Sueños", "Familia", "Amistad", "Viajes", 
    "Creatividad", "Amor", "Libertad", "Naturaleza", "Paz",
    "Futuro", "Magia", "Sonrisas", "Destino", "Explorar",
    "Cielo", "Estrellas", "Universo", "Alma", "Vida",
    "Alegría", "Pasión", "Música", "Arte", "Luz"
];
const PHOTOS = ["photo1.png", "photo2.png", "photo3.png"];

// --- SCENE SETUP ---
let scene, camera, renderer, container;
let group; 
let ringGroup; 

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0.002, y: 0.002 }; 

// Ring configuration
const RING_RADIUS = 1000;
const RING_COUNT = 15;

function init() {
    container = document.getElementById('scene-container');

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 1500;

    // CSS3D Renderer
    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    group = new THREE.Group();
    scene.add(group);

    ringGroup = new THREE.Group();
    ringGroup.rotation.x = Math.PI / 4; 
    scene.add(ringGroup);

    createPlanet();
    createRings();
    createStarfield();
    setupEvents();
    animate();
}

function createPlanet() {
    for (let i = 0; i < ELEMENT_COUNT; i++) {
        const phi = Math.acos(-1 + (2 * i) / ELEMENT_COUNT);
        const theta = Math.sqrt(ELEMENT_COUNT * Math.PI) * phi;

        const x = RADIUS * Math.cos(theta) * Math.sin(phi);
        const y = RADIUS * Math.sin(theta) * Math.sin(phi);
        const z = RADIUS * Math.cos(phi);

        const isPhoto = Math.random() > 0.75; 
        const element = isPhoto ? createPhotoElement() : createWordElement();
        
        const object = new THREE.CSS3DObject(element);
        object.position.set(x, y, z);

        const vector = new THREE.Vector3(x, y, z).multiplyScalar(2);
        object.lookAt(vector);

        group.add(object);
    }
}

function createRings() {
    for (let i = 0; i < RING_COUNT; i++) {
        const theta = (i / RING_COUNT) * Math.PI * 2;
        const x = RING_RADIUS * Math.cos(theta);
        const z = RING_RADIUS * Math.sin(theta);
        const y = (Math.random() - 0.5) * 50; 

        const element = createWordElement();
        element.classList.add('satellite');
        
        const object = new THREE.CSS3DObject(element);
        object.position.set(x, y, z);
        object.lookAt(0, 0, 0);
        
        ringGroup.add(object);
    }
}

function createStarfield() {
    const starContainer = document.getElementById('stars-container');
    const starCount = 150;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'twinkle-star';
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 2 + Math.random() * 3;
        const delay = Math.random() * 5;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.setProperty('--duration', `${duration}s`);
        star.style.setProperty('--delay', `${delay}s`);
        starContainer.appendChild(star);
    }
}

function createWordElement() {
    const div = document.createElement('div');
    div.className = 'element-card word';
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    div.innerHTML = `<span>${word}</span>`;
    return div;
}

function createPhotoElement() {
    const div = document.createElement('div');
    div.className = 'element-card photo';
    const photoSrc = PHOTOS[Math.floor(Math.random() * PHOTOS.length)];
    div.innerHTML = `<img src="${photoSrc}" alt="Recuerdo">`;
    return div;
}

function setupEvents() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };
        rotationVelocity.y = deltaMove.x * 0.005;
        rotationVelocity.x = deltaMove.y * 0.005;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    document.addEventListener('touchstart', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };
        rotationVelocity.y = deltaMove.x * 0.005;
        rotationVelocity.x = deltaMove.y * 0.005;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    document.addEventListener('touchend', () => { isDragging = false; });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += rotationVelocity.y;
    group.rotation.x += rotationVelocity.x;

    ringGroup.rotation.z += 0.001; 
    ringGroup.rotation.y += rotationVelocity.y * 0.5;

    if (!isDragging) {
        rotationVelocity.x *= 0.98;
        rotationVelocity.y *= 0.98;
        if (Math.abs(rotationVelocity.y) < 0.001) rotationVelocity.y += 0.0001;
    }
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
