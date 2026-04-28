// --- CONFIGURATION ---
const RADIUS = 600;
const ELEMENT_COUNT = 80;
const WORDS = [
    "Amor", "Cariño", "Hermosa", "Morena", "Te quiero",
    "Mi vida", "Corazón", "Ternura", "Preciosa", "Te amo",
    "Bella", "Dulzura", "Mi todo", "Besos", "Abrazos",
    "Suspiros", "Eterno", "Pasión", "Soñar", "Juntos",
    "Mi alma", "Único", "Especial", "Cielo mío", "Adorada",
    "Mi luz", "Felicidad", "Ilusión", "Bonita", "Querida",
    "Encanto", "Mi ser", "Latidos", "Mi mundo", "Te quiero mucho",
    "Para siempre", "Mi princesa", "Mágico", "Mi luna"
];
// Las fotos y videos se cargan dinámicamente desde sus carpetas
let PHOTOS = [];
let VIDEOS = [];

// Carga fotos desde fotos/
function loadPhotosFromFolder() {
    return new Promise((resolve) => {
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
        const baseNames = [];
        for (let i = 1; i <= 30; i++) baseNames.push(`photo${i}`, `foto${i}`, `img${i}`, `image${i}`, `${i}`);

        const promises = baseNames.flatMap(name =>
            extensions.map(ext => new Promise((res) => {
                const src = `fotos/${name}.${ext}`;
                const img = new Image();
                img.onload = () => res(src);
                img.onerror = () => res(null);
                img.src = src;
            }))
        );

        Promise.all(promises).then(results => {
            PHOTOS = results.filter(Boolean);
            console.log(`✅ ${PHOTOS.length} foto(s) cargadas`);
            resolve();
        });
    });
}

// Carga videos desde videos/
function loadVideosFromFolder() {
    return new Promise((resolve) => {
        const extensions = ['mp4', 'webm', 'mov', 'ogg'];
        const baseNames = [];
        for (let i = 1; i <= 20; i++) baseNames.push(`video${i}`, `vid${i}`, `clip${i}`, `${i}`);

        const promises = baseNames.flatMap(name =>
            extensions.map(ext => new Promise((res) => {
                const src = `videos/${name}.${ext}`;
                const video = document.createElement('video');
                video.onloadeddata = () => res(src);
                video.onerror = () => res(null);
                video.preload = 'metadata';
                video.src = src;
            }))
        );

        Promise.all(promises).then(results => {
            VIDEOS = results.filter(Boolean);
            console.log(`✅ ${VIDEOS.length} video(s) cargados`);
            resolve();
        });
    });
}

// Configura la música de fondo
function setupMusic() {
    const audio = document.getElementById('bg-audio');
    const btn = document.getElementById('music-btn');
    const player = document.getElementById('music-player');
    const label = document.getElementById('music-label');

    // Busca tu archivo de música — puedes usar cualquier nombre de estos:
    const musicFiles = [
        'musica/music.mp3',     // ← Tu archivo actual
        'musica/music.ogg',
        'musica/musica.mp3',
        'musica/musica1.mp3',
        'musica/cancion.mp3',
        'musica/cancion1.mp3',
        'musica/song.mp3',
        'musica/song1.mp3',
        'musica/background.mp3',
        'musica/1.mp3',
        'musica/audio.mp3',
    ];
    
    let musicFound = false;
    const tryNext = (index) => {
        if (index >= musicFiles.length) return;
        audio.src = musicFiles[index];
        audio.oncanplaythrough = () => { musicFound = true; };
        audio.onerror = () => tryNext(index + 1);
    };
    tryNext(0);

    let isPlaying = false;
    player.addEventListener('click', () => {
        if (!audio.src) return;
        if (isPlaying) {
            audio.pause();
            player.classList.remove('playing');
            label.textContent = 'Música';
            isPlaying = false;
        } else {
            audio.play().then(() => {
                player.classList.add('playing');
                label.textContent = 'Sonando ♪';
                isPlaying = true;
            }).catch(() => {
                label.textContent = 'Sin audio';
            });
        }
    });
}

// --- SCENE SETUP ---
let scene, camera, renderer, container;
let group;
let ringGroup;

let isDragging = false;
let hasDragged = false; // Variable para diferenciar click de arrastre
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

    // Cargamos fotos, videos y configuramos música antes de construir el mundo
    Promise.all([loadPhotosFromFolder(), loadVideosFromFolder()]).then(() => {
        setupMusic();
        createPlanet();
        createRings();
        createStarfield();
        setupEvents();
        animate();
    });
}

function createPlanet() {
    const mediaPool = [
        ...PHOTOS.map(src => ({ type: 'photo', src })),
        ...VIDEOS.map(src => ({ type: 'video', src }))
    ];

    // Barajamos las palabras para que no se repitan
    const shuffledWords = [...WORDS].sort(() => Math.random() - 0.5);
    let wordIndex = 0;

    for (let i = 0; i < ELEMENT_COUNT; i++) {
        const phi = Math.acos(-1 + (2 * i) / ELEMENT_COUNT);
        const theta = Math.sqrt(ELEMENT_COUNT * Math.PI) * phi;

        const x = RADIUS * Math.cos(theta) * Math.sin(phi);
        const y = RADIUS * Math.sin(theta) * Math.sin(phi);
        const z = RADIUS * Math.cos(phi);

        let element;
        const rnd = Math.random();

        // 55% de probabilidad de foto/video, 45% de palabra
        if (rnd > 0.45 && mediaPool.length > 0) {
            const media = mediaPool[Math.floor(Math.random() * mediaPool.length)];
            element = media.type === 'video' ? createVideoElement(media.src) : createPhotoElement(media.src);
        } else {
            // Usamos la siguiente palabra del array barajado, sin repetir
            if (wordIndex < shuffledWords.length) {
                element = createWordElement(shuffledWords[wordIndex]);
                wordIndex++;
            } else {
                // Si se agotaron las palabras, ponemos más media
                const media = mediaPool.length > 0
                    ? mediaPool[Math.floor(Math.random() * mediaPool.length)]
                    : null;
                element = media
                    ? (media.type === 'video' ? createVideoElement(media.src) : createPhotoElement(media.src))
                    : createWordElement(shuffledWords[Math.floor(Math.random() * shuffledWords.length)]);
            }
        }

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

function createWordElement(word) {
    if (!word) word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const div = document.createElement('div');
    div.className = 'element-card word';
    div.innerHTML = `<span>${word}</span>`;
    div.addEventListener('click', () => {
        if (!hasDragged) openTextModal(word);
    });
    return div;
}

function createPhotoElement(photoSrc) {
    if (!photoSrc) photoSrc = PHOTOS[Math.floor(Math.random() * PHOTOS.length)];
    const div = document.createElement('div');
    div.className = 'element-card photo';
    div.innerHTML = `<img src="${photoSrc}" alt="Recuerdo">`;
    div.addEventListener('click', () => {
        if (!hasDragged) openImageModal(photoSrc);
    });
    return div;
}

function createVideoElement(videoSrc) {
    const div = document.createElement('div');
    div.className = 'element-card video';
    div.innerHTML = `
        <video muted preload="metadata">
            <source src="${videoSrc}">
        </video>
        <span class="video-play-icon">▶️</span>
    `;
    div.addEventListener('click', () => {
        if (!hasDragged) openVideoModal(videoSrc);
    });
    return div;
}

function openImageModal(src) {
    const modal = document.getElementById('content-modal');
    const modalImg = document.getElementById('modal-image');
    const modalVideo = document.getElementById('modal-video');
    const modalText = document.getElementById('modal-text');
    modalImg.src = src;
    modalImg.classList.remove('hidden');
    modalVideo.classList.add('hidden');
    modalVideo.pause();
    modalText.classList.add('hidden');
    modal.classList.remove('hidden');
}

function openVideoModal(src) {
    const modal = document.getElementById('content-modal');
    const modalImg = document.getElementById('modal-image');
    const modalVideo = document.getElementById('modal-video');
    const modalText = document.getElementById('modal-text');
    document.getElementById('modal-video-src').src = src;
    modalVideo.load();
    modalVideo.classList.remove('hidden');
    modalImg.classList.add('hidden');
    modalText.classList.add('hidden');
    modal.classList.remove('hidden');
}

function openTextModal(text) {
    const modal = document.getElementById('content-modal');
    const modalImg = document.getElementById('modal-image');
    const modalVideo = document.getElementById('modal-video');
    const modalText = document.getElementById('modal-text');
    modalText.textContent = text;
    modalText.classList.remove('hidden');
    modalImg.classList.add('hidden');
    modalVideo.classList.add('hidden');
    modalVideo.pause();
    modal.classList.remove('hidden');
}

function setupEvents() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false; // Reseteamos la variable al iniciar el toque
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        // Si nos movemos más de 2 píxeles, consideramos que es un arrastre y no un click
        if (Math.abs(deltaMove.x) > 2 || Math.abs(deltaMove.y) > 2) {
            hasDragged = true;
        }

        rotationVelocity.y = deltaMove.x * 0.005;
        rotationVelocity.x = deltaMove.y * 0.005;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    document.addEventListener('touchstart', (e) => {
        isDragging = true;
        hasDragged = false;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };

        if (Math.abs(deltaMove.x) > 2 || Math.abs(deltaMove.y) > 2) {
            hasDragged = true;
        }

        rotationVelocity.y = deltaMove.x * 0.005;
        rotationVelocity.x = deltaMove.y * 0.005;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    document.addEventListener('touchend', () => { isDragging = false; });

    // Función auxiliar para cerrar modal y pausar video
    function closeModal() {
        document.getElementById('content-modal').classList.add('hidden');
        const v = document.getElementById('modal-video');
        if (v) v.pause();
    }

    // Evento para cerrar el modal
    document.getElementById('close-modal').addEventListener('click', closeModal);

    // También cerrar si haces click fuera de la imagen/texto (en el fondo oscuro)
    document.getElementById('content-modal').addEventListener('click', (e) => {
        if (e.target.id === 'content-modal') closeModal();
    });
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
