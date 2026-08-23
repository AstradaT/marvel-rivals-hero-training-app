// Audio Setup
const tickSFX = new Audio('assets/tick.wav');
const successSFX = new Audio('assets/success.wav');
tickSFX.volume = 0.4; 
successSFX.volume = 0.4;

// Mute State
let isMuted = false;

// UI role colors
const roleColors = {
    "Duelist": "border-red-500 text-red-400 bg-red-950/20",
    "Vanguard": "border-blue-500 text-blue-400 bg-blue-950/20",
    "Strategist": "border-emerald-500 text-emerald-400 bg-emerald-950/20",
    "default": "border-slate-700 text-slate-500 bg-slate-900"
};

// DOM elements
const spinBtn = document.getElementById('spin-btn');
const heroImg = document.getElementById('hero-img');
const heroName = document.getElementById('hero-name');
const heroRole = document.getElementById('hero-role');
const cardContainer = document.getElementById('card-container');
const roleButtons = document.querySelectorAll('.role-btn');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const practicePanel = document.getElementById('practice-panel');
const practiceStatus = document.getElementById('practice-status');
const practiceCount = document.getElementById('practice-count');
const practiceProgress = document.getElementById('practice-progress');
const matchCompleteBtn = document.getElementById('match-complete-btn');
const extendBtn = document.getElementById('extend-btn');

// Guardamos los roles activos. Por defecto arrancan los 3 seleccionados
let activeRoles = new Set(['Vanguard', 'Duelist', 'Strategist']);
let isSpinning = false;

// Practice block state
let currentHero = null;
let matchesCompleted = 0;
let matchTarget = 3;

function savePracticeState() {
    if (!currentHero) {
        practiceStorage.clear();
        return;
    }

    practiceStorage.save({
        heroId: currentHero.id,
        heroRole: currentHero.role,
        matchesCompleted,
        matchTarget
    });
}

function updatePracticeUI() {
    if (!currentHero) {
        practicePanel.classList.add('hidden');
        spinBtn.disabled = isSpinning;
        return;
    }

    practicePanel.classList.remove('hidden');

    const blockComplete = matchesCompleted >= matchTarget;
    const percentage = Math.min(100, (matchesCompleted / matchTarget) * 100);

    practiceCount.innerText = `${matchesCompleted} / ${matchTarget}`;
    practiceProgress.style.width = `${percentage}%`;

    if (blockComplete) {
        practiceStatus.innerText = matchTarget === 3
            ? 'Block complete — reroll or keep practicing.'
            : 'Extended block complete — ready for a new hero.';
    } else {
        const remaining = matchTarget - matchesCompleted;
        practiceStatus.innerText = `${matchesCompleted} of ${matchTarget} matches completed · ${remaining} remaining`;
    }

    matchCompleteBtn.disabled = blockComplete || isSpinning;
    extendBtn.disabled = matchTarget === 5 || isSpinning;
    extendBtn.innerText = matchTarget === 5 ? 'Extended to 5' : 'Extend to 5';

    // The roulette stays locked while the current practice block is unfinished.
    spinBtn.disabled = isSpinning || !blockComplete;
    spinBtn.innerText = blockComplete ? 'Spin Next Hero' : `Practice ${currentHero.name}`;
}

function startPracticeBlock(hero) {
    currentHero = hero;
    matchesCompleted = 0;
    matchTarget = 3;
    savePracticeState();
    updatePracticeUI();
}

function finishMatch() {
    if (!currentHero || matchesCompleted >= matchTarget || isSpinning) return;

    matchesCompleted += 1;
    savePracticeState();
    updatePracticeUI();
}

function extendPracticeBlock() {
    if (!currentHero || matchTarget === 5 || isSpinning) return;

    matchTarget = 5;
    savePracticeState();
    updatePracticeUI();
}

function restorePracticeState() {
    const savedBlock = practiceStorage.load();
    if (!savedBlock) return;

    const hero = heroes.find(h => {
        const hasStableId = typeof savedBlock.heroId === 'string';
        const heroMatches = hasStableId
            ? h.id === savedBlock.heroId
            : h.name === savedBlock.heroName;

        return heroMatches && h.role === savedBlock.heroRole;
    });

    if (!hero) {
        practiceStorage.clear();
        return;
    }

    currentHero = hero;
    matchTarget = Number(savedBlock.matchTarget) === 5 ? 5 : 3;
    matchesCompleted = Math.min(
        matchTarget,
        Math.max(0, Math.floor(Number(savedBlock.matchesCompleted) || 0))
    );

    // Re-save to migrate older storage formats after successful validation.
    savePracticeState();
    updateUI(currentHero, false);
    updatePracticeUI();
}

// Manejo de clicks con lógica Multiselect
roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSpinning || (currentHero && matchesCompleted < matchTarget)) return;

        const role = btn.getAttribute('data-role');

        if (activeRoles.has(role)) {
            // Si ya está activo, lo removemos (Apagar filtro)
            activeRoles.delete(role);
            // Estilos visuales de botón desactivado/apagado
            btn.className = btn.className.replace(/border-2 border-\w+-500/, 'border border-slate-800');
            btn.classList.remove('bg-slate-900', 'text-blue-400', 'text-red-400', 'text-emerald-400');
            btn.classList.add('bg-slate-950', 'text-slate-500');
        } else {
            // Si está apagado, lo encendemos
            activeRoles.add(role);
            // Restauramos sus colores dinámicos originales según el rol
            btn.classList.remove('bg-slate-950', 'text-slate-500', 'border-slate-800');
            btn.classList.add('bg-slate-900');
            
            if (role === 'Vanguard') btn.classList.add('border-2', 'border-blue-500', 'text-blue-400');
            if (role === 'Duelist') btn.classList.add('border-2', 'border-red-500', 'text-red-400');
            if (role === 'Strategist') btn.classList.add('border-2', 'border-emerald-500', 'text-emerald-400');
        }
    });
});

// Función de la ruleta
function spinRoulette() {
    if (isSpinning) return;
    if (currentHero && matchesCompleted < matchTarget) return;

    // A completed block is replaced only when a new spin begins.
    currentHero = null;
    matchesCompleted = 0;
    matchTarget = 3;
    savePracticeState();
    
    const rolesToFilter = activeRoles.size === 0 
        ? ['Vanguard', 'Duelist', 'Strategist'] 
        : Array.from(activeRoles);

    const filteredPool = heroes.filter(h => rolesToFilter.includes(h.role));

    if (filteredPool.length === 0) return;

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.innerText = "Choosing...";
    
    roleButtons.forEach(b => b.style.opacity = "0.4");

    let duration = 2000; 
    let intervalSpeed = 70; 
    
    heroImg.classList.add('roulette-blur', 'anim-ticking');

    // Intervalo de giro (Efecto ruleta)
    const interval = setInterval(() => {
        const randomHero = heroSelector.selectRandom(filteredPool);
        
        // Pass a custom flag 'true' to show it's just spinning
        updateUI(randomHero, true);

        // REPRODUCIR TICK: Reiniciamos el audio al inicio para que pueda sonar superpuesto/rápido
        if (!isMuted) {
            tickSFX.currentTime = 0;
            tickSFX.play().catch(err => console.log("Audio prevent:", err));
        }
    }, intervalSpeed);

    // Stops the loop and drops the heavy animated file
    setTimeout(() => {
        clearInterval(interval);
        
        const finalHero = heroSelector.selectRandom(filteredPool);
        
        // Remove the spinning blur effect right away
        heroImg.classList.remove('roulette-blur', 'anim-ticking');

        // Step A: Immediately show the CORRECT final hero's STATIC image as a placeholder
        updateUI(finalHero, true);

        // Step B: Create an off-screen image element to preload the heavy animated WebP safely
        const imgPreloader = new Image();
        let spinFinished = false;
        let imageLoadTimeout;

        const finishSpin = (useAnimatedImage) => {
            if (spinFinished) return;

            spinFinished = true;
            clearTimeout(imageLoadTimeout);

            // Keep the static image when the animation cannot be loaded.
            updateUI(finalHero, !useAnimatedImage);

            // Play success.wav
            if (!isMuted) {
                successSFX.currentTime = 0;
                successSFX.play().catch(err => console.log("Audio prevent:", err));
            }

            cardContainer.classList.add('scale-105');
            setTimeout(() => cardContainer.classList.remove('scale-105'), 300);

            // The selected hero now becomes a 3-match practice block.
            isSpinning = false;
            startPracticeBlock(finalHero);
            roleButtons.forEach(b => b.style.opacity = "1");
        };

        // Step C: Swap to the animation when available, but never leave the app
        // locked if an asset is missing, corrupt, or unusually slow to load.
        imgPreloader.onload = () => finishSpin(true);
        imgPreloader.onerror = () => finishSpin(false);
        imageLoadTimeout = setTimeout(() => finishSpin(false), 5000);
        imgPreloader.src = finalHero.img;

    }, duration);
}

// updateUI Function
function updateUI(hero, isSpinningPhase) {
    // If it's spinning, use staticImg. If it's the result, drop the animated one.
    heroImg.src = isSpinningPhase ? hero.staticImg : hero.img;
    
    heroName.innerText = hero.name;
    heroRole.innerText = hero.role;

    const classes = roleColors[hero.role] || roleColors['default'];
    const [borderColor, textColor, bgColor] = classes.split(' ');

    cardContainer.className = `border-4 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform mb-8 ${borderColor} ${bgColor}`;
    heroRole.className = `text-sm font-semibold tracking-widest uppercase mt-1 ${textColor}`;
}

// Main button Event Listener
spinBtn.addEventListener('click', spinRoulette);

matchCompleteBtn.addEventListener('click', finishMatch);
extendBtn.addEventListener('click', extendPracticeBlock);

// Mute Button Listener
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted; // Toggle the state

    if (isMuted) {
        // Change icon styling to "Muted" (Adds a visual cross/slash line to the SVG)
        muteBtn.classList.remove('text-slate-400', 'border-slate-800');
        muteBtn.classList.add('text-red-500', 'border-red-900/50', 'bg-red-950/10');
        
        // Dynamically inject a slash line into the SVG and hide sound waves
        muteIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
    } else {
        // Restore icon styling to "Active"
        muteBtn.classList.remove('text-red-500', 'border-red-900/50', 'bg-red-950/10');
        muteBtn.classList.add('text-slate-400', 'border-slate-800');
        
        // Restore original waves inside the SVG
        muteIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path id="audio-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path id="audio-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        `;
    }
});

// --- Cache Logic ---
const imageCache = [];
window.addEventListener('DOMContentLoaded', () => {
    // We ONLY cache the static images. 
    // The browser will load the animated one dynamically on demand at the end.
    heroes.forEach(heroe => {
        const img = new Image();
        img.src = heroe.staticImg; 
        imageCache.push(img);
    });
    console.log(`Cached ${heroes.length} static assets for ultra-fast spinning.`);
    restorePracticeState();
});
