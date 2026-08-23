// Audio Setup
const tickSFX = new Audio('assets/tick.wav');
const successSFX = new Audio('assets/success.wav');
tickSFX.volume = 0.4; 
successSFX.volume = 0.4;

// Mute State
let isMuted = false;

// Hero data
const heroes = [
    // --- DUELISTS ---
    { id: "black-cat", name: "Black Cat", role: "Duelist", img: "assets/blackcat.webp", staticImg: "assets/static/blackcat.jpg" },
    { id: "black-panther", name: "Black Panther", role: "Duelist", img: "assets/blackpanther.webp", staticImg: "assets/static/blackpanther.jpg" },
    { id: "black-widow", name: "Black Widow", role: "Duelist", img: "assets/blackwidow.webp", staticImg: "assets/static/blackwidow.jpg" },
    { id: "blade", name: "Blade", role: "Duelist", img: "assets/blade.webp", staticImg: "assets/static/blade.jpg" },
    { id: "cyclops", name: "Cyclops", role: "Duelist", img: "assets/cyclops.webp", staticImg: "assets/static/cyclops.jpg" },
    { id: "daredevil", name: "Daredevil", role: "Duelist", img: "assets/daredevil.webp", staticImg: "assets/static/daredevil.jpg" },
    { id: "deadpool", name: "Deadpool", role: "Duelist", img: "assets/deadpool.webp", staticImg: "assets/static/deadpool.jpg" },
    { id: "elsa-bloodstone", name: "Elsa Bloodstone", role: "Duelist", img: "assets/elsabloodstone.webp", staticImg: "assets/static/elsabloodstone.jpg" },
    { id: "hawkeye", name: "Hawkeye", role: "Duelist", img: "assets/hawkeye.webp", staticImg: "assets/static/hawkeye.jpg" },
    { id: "hela", name: "Hela", role: "Duelist", img: "assets/hela.webp", staticImg: "assets/static/hela.jpg" },
    { id: "human-torch", name: "Human Torch", role: "Duelist", img: "assets/humantorch.webp", staticImg: "assets/static/humantorch.jpg" },
    { id: "iron-fist", name: "Iron Fist", role: "Duelist", img: "assets/ironfist.webp", staticImg: "assets/static/ironfist.jpg" },
    { id: "iron-man", name: "Iron Man", role: "Duelist", img: "assets/ironman.webp", staticImg: "assets/static/ironman.jpg" },
    { id: "magik", name: "Magik", role: "Duelist", img: "assets/magik.webp", staticImg: "assets/static/magik.jpg" },
    { id: "mister-fantastic", name: "Mister Fantastic", role: "Duelist", img: "assets/misterfantastic.webp", staticImg: "assets/static/misterfantastic.jpg" },
    { id: "moon-knight", name: "Moon Knight", role: "Duelist", img: "assets/moonknight.webp", staticImg: "assets/static/moonknight.jpg" },
    { id: "namor", name: "Namor", role: "Duelist", img: "assets/namor.webp", staticImg: "assets/static/namor.jpg" },
    { id: "phoenix", name: "Phoenix", role: "Duelist", img: "assets/phoenix.webp", staticImg: "assets/static/phoenix.jpg" },
    { id: "psylocke", name: "Psylocke", role: "Duelist", img: "assets/psylocke.webp", staticImg: "assets/static/psylocke.jpg" },
    { id: "scarlet-witch", name: "Scarlet Witch", role: "Duelist", img: "assets/scarletwitch.webp", staticImg: "assets/static/scarletwitch.jpg" },
    { id: "spider-man", name: "Spider-Man", role: "Duelist", img: "assets/spiderman.webp", staticImg: "assets/static/spiderman.jpg" },
    { id: "squirrel-girl", name: "Squirrel Girl", role: "Duelist", img: "assets/squirrelgirl.webp", staticImg: "assets/static/squirrelgirl.jpg" },
    { id: "star-lord", name: "Star-Lord", role: "Duelist", img: "assets/starlord.webp", staticImg: "assets/static/starlord.jpg" },
    { id: "storm", name: "Storm", role: "Duelist", img: "assets/storm.webp", staticImg: "assets/static/storm.jpg" },
    { id: "the-punisher", name: "The Punisher", role: "Duelist", img: "assets/thepunisher.webp", staticImg: "assets/static/thepunisher.jpg" },
    { id: "winter-soldier", name: "Winter Soldier", role: "Duelist", img: "assets/wintersoldier.webp", staticImg: "assets/static/wintersoldier.jpg" },
    { id: "wolverine", name: "Wolverine", role: "Duelist", img: "assets/wolverine.webp", staticImg: "assets/static/wolverine.jpg" },

    // --- VANGUARDS ---
    { id: "angela", name: "Angela", role: "Vanguard", img: "assets/angela.webp", staticImg: "assets/static/angela.jpg" },
    { id: "captain-america", name: "Captain America", role: "Vanguard", img: "assets/captainamerica.webp", staticImg: "assets/static/captainamerica.jpg" },
    { id: "deadpool", name: "Deadpool", role: "Vanguard", img: "assets/deadpool.webp", staticImg: "assets/static/deadpool.jpg" },
    { id: "devil-dinosaur", name: "Devil Dinosaur", role: "Vanguard", img: "assets/devildinosaur.webp", staticImg: "assets/static/devildinosaur.jpg" },
    { id: "doctor-strange", name: "Doctor Strange", role: "Vanguard", img: "assets/doctorstrange.webp", staticImg: "assets/static/doctorstrange.jpg" },
    { id: "emma-frost", name: "Emma Frost", role: "Vanguard", img: "assets/emmafrost.webp", staticImg: "assets/static/emmafrost.jpg" },
    { id: "groot", name: "Groot", role: "Vanguard", img: "assets/groot.webp", staticImg: "assets/static/groot.jpg" },
    { id: "hulk", name: "Hulk", role: "Vanguard", img: "assets/hulk.webp", staticImg: "assets/static/hulk.jpg" },
    { id: "magneto", name: "Magneto", role: "Vanguard", img: "assets/magneto.webp", staticImg: "assets/static/magneto.jpg" },
    { id: "peni-parker", name: "Peni Parker", role: "Vanguard", img: "assets/peniparker.webp", staticImg: "assets/static/peniparker.jpg" },
    { id: "rogue", name: "Rogue", role: "Vanguard", img: "assets/rogue.webp", staticImg: "assets/static/rogue.jpg" },
    { id: "the-thing", name: "The Thing", role: "Vanguard", img: "assets/thething.webp", staticImg: "assets/static/thething.jpg" },
    { id: "thor", name: "Thor", role: "Vanguard", img: "assets/thor.webp", staticImg: "assets/static/thor.jpg" },
    { id: "venom", name: "Venom", role: "Vanguard", img: "assets/venom.webp", staticImg: "assets/static/venom.jpg" },

    // --- STRATEGISTS ---
    { id: "adam-warlock", name: "Adam Warlock", role: "Strategist", img: "assets/adamwarlock.webp", staticImg: "assets/static/adamwarlock.jpg" },
    { id: "cloak-and-dagger", name: "Cloak & Dagger", role: "Strategist", img: "assets/cloakanddagger.webp", staticImg: "assets/static/cloakanddagger.jpg" },
    { id: "deadpool", name: "Deadpool", role: "Strategist", img: "assets/deadpool.webp", staticImg: "assets/static/deadpool.jpg" },
    { id: "gambit", name: "Gambit", role: "Strategist", img: "assets/gambit.webp", staticImg: "assets/static/gambit.jpg" },
    { id: "invisible-woman", name: "Invisible Woman", role: "Strategist", img: "assets/invisiblewoman.webp", staticImg: "assets/static/invisiblewoman.jpg" },
    { id: "jeff-the-land-shark", name: "Jeff the Land Shark", role: "Strategist", img: "assets/jeffthelandshark.webp", staticImg: "assets/static/jeffthelandshark.jpg" },
    { id: "jubilee", name: "Jubilee", role: "Strategist", img: "assets/jubilee.webp", staticImg: "assets/static/jubilee.jpg"},
    { id: "loki", name: "Loki", role: "Strategist", img: "assets/loki.webp", staticImg: "assets/static/loki.jpg" },
    { id: "luna-snow", name: "Luna Snow", role: "Strategist", img: "assets/lunasnow.webp", staticImg: "assets/static/lunasnow.jpg" },
    { id: "mantis", name: "Mantis", role: "Strategist", img: "assets/mantis.webp", staticImg: "assets/static/mantis.jpg" },
    { id: "rocket-raccoon", name: "Rocket Raccoon", role: "Strategist", img: "assets/rocketraccoon.webp", staticImg: "assets/static/rocketraccoon.jpg" },
    { id: "ultron", name: "Ultron", role: "Strategist", img: "assets/ultron.webp", staticImg: "assets/static/ultron.jpg" },
    { id: "white-fox", name: "White Fox", role: "Strategist", img: "assets/whitefox.webp", staticImg: "assets/static/whitefox.jpg" }
];

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
const PRACTICE_STORAGE_KEY = 'marvelRivalsPracticeBlock';
const PRACTICE_STORAGE_VERSION = 1;

function savePracticeState() {
    if (!currentHero) {
        localStorage.removeItem(PRACTICE_STORAGE_KEY);
        return;
    }

    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify({
        version: PRACTICE_STORAGE_VERSION,
        activePracticeBlock: {
            heroId: currentHero.id,
            heroRole: currentHero.role,
            matchesCompleted,
            matchTarget
        }
    }));
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
    try {
        const saved = JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY));
        if (!saved) return;

        // Older saves stored the practice block directly. Supporting both shapes
        // lets existing progress migrate without asking the player to start over.
        const savedBlock = saved.version === PRACTICE_STORAGE_VERSION
            ? saved.activePracticeBlock
            : saved;

        if (!savedBlock || typeof savedBlock !== 'object') {
            localStorage.removeItem(PRACTICE_STORAGE_KEY);
            return;
        }

        const hero = heroes.find(h => {
            const hasStableId = typeof savedBlock.heroId === 'string';
            const heroMatches = hasStableId
                ? h.id === savedBlock.heroId
                : h.name === savedBlock.heroName;

            return heroMatches && h.role === savedBlock.heroRole;
        });

        if (!hero) {
            localStorage.removeItem(PRACTICE_STORAGE_KEY);
            return;
        }

        currentHero = hero;
        matchTarget = Number(savedBlock.matchTarget) === 5 ? 5 : 3;
        matchesCompleted = Math.min(
            matchTarget,
            Math.max(0, Math.floor(Number(savedBlock.matchesCompleted) || 0))
        );

        savePracticeState();
        updateUI(currentHero, false);
        updatePracticeUI();
    } catch (error) {
        console.warn('Could not restore practice block:', error);
        localStorage.removeItem(PRACTICE_STORAGE_KEY);
    }
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
        const randomHero = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        
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
        
        const finalHero = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        
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
