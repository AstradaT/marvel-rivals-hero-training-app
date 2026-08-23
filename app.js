// Audio Setup
const tickSFX = new Audio('assets/tick.wav');
const successSFX = new Audio('assets/success.wav');
tickSFX.volume = 0.4; 
successSFX.volume = 0.4;

// Persisted player preferences
const savedPreferences = preferencesStorage.load();
let isMuted = savedPreferences.isMuted;

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
const heroPageLink = document.getElementById('hero-page-link');
const heroPageHint = document.getElementById('hero-page-hint');
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
const banListBtn = document.getElementById('ban-list-btn');
const banCount = document.getElementById('ban-count');
const banModal = document.getElementById('ban-modal');
const closeBanModalBtn = document.getElementById('close-ban-modal-btn');
const banHeroList = document.getElementById('ban-hero-list');
const banSearch = document.getElementById('ban-search');
const banRoleFilters = document.querySelectorAll('.ban-role-filter');
const banWarning = document.getElementById('ban-warning');
const banEmptyState = document.getElementById('ban-empty-state');
const banSummary = document.getElementById('ban-summary');
const clearBansBtn = document.getElementById('clear-bans-btn');
const selectionMessage = document.getElementById('selection-message');

// Guardamos los roles activos. Por defecto arrancan los 3 seleccionados
let activeRoles = new Set(savedPreferences.activeRoles);
let isSpinning = false;
const validHeroIds = new Set(heroes.map(hero => hero.id));
let bannedHeroIds = new Set(
    savedPreferences.bannedHeroIds.filter(id => validHeroIds.has(id))
);
let banListRoleFilter = 'All';

const uniqueHeroes = Array.from(heroes.reduce((heroMap, hero) => {
    if (!heroMap.has(hero.id)) {
        heroMap.set(hero.id, {
            id: hero.id,
            name: hero.name,
            staticImg: hero.staticImg,
            roles: []
        });
    }

    heroMap.get(hero.id).roles.push(hero.role);
    return heroMap;
}, new Map()).values()).sort((a, b) => a.name.localeCompare(b.name));

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

function savePreferences() {
    preferencesStorage.save({
        bannedHeroIds: Array.from(bannedHeroIds),
        activeRoles: Array.from(activeRoles),
        isMuted
    });
}

function updateRoleFiltersUI() {
    const activeStyles = {
        Vanguard: ['border-2', 'border-blue-500', 'text-blue-400'],
        Duelist: ['border-2', 'border-red-500', 'text-red-400'],
        Strategist: ['border-2', 'border-emerald-500', 'text-emerald-400']
    };

    roleButtons.forEach(button => {
        const role = button.dataset.role;
        const isActive = activeRoles.has(role);

        button.classList.remove(
            'border', 'border-2', 'border-slate-800', 'border-blue-500',
            'border-red-500', 'border-emerald-500', 'bg-slate-900',
            'bg-slate-950', 'text-blue-400', 'text-red-400',
            'text-emerald-400', 'text-slate-500'
        );

        if (isActive) {
            button.classList.add('bg-slate-900', ...activeStyles[role]);
        } else {
            button.classList.add('border', 'border-slate-800', 'bg-slate-950', 'text-slate-500');
        }

        button.setAttribute('aria-pressed', String(isActive));
    });
}

function updateMuteUI() {
    muteBtn.setAttribute('aria-pressed', String(isMuted));
    muteBtn.title = isMuted ? 'Unmute sound' : 'Mute sound';

    if (isMuted) {
        muteBtn.classList.remove('text-slate-400', 'border-slate-800');
        muteBtn.classList.add('text-red-500', 'border-red-900/50', 'bg-red-950/10');
        muteIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
    } else {
        muteBtn.classList.remove('text-red-500', 'border-red-900/50', 'bg-red-950/10');
        muteBtn.classList.add('text-slate-400', 'border-slate-800');
        muteIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        `;
    }
}

function updateBanListUI() {
    const availableHeroCount = uniqueHeroes.length - bannedHeroIds.size;

    banCount.innerText = bannedHeroIds.size;
    banSummary.innerText = bannedHeroIds.size === 0
        ? 'No heroes banned'
        : `${bannedHeroIds.size} ${bannedHeroIds.size === 1 ? 'hero' : 'heroes'} banned`;
    clearBansBtn.disabled = bannedHeroIds.size === 0;

    if (availableHeroCount <= 5) {
        banWarning.innerText = availableHeroCount === 0
            ? 'Every hero is banned. The roulette cannot select a hero.'
            : `Only ${availableHeroCount} ${availableHeroCount === 1 ? 'hero remains' : 'heroes remain'} available.`;
        banWarning.classList.remove('hidden');
    } else {
        banWarning.classList.add('hidden');
    }

    banHeroList.querySelectorAll('[data-hero-id]').forEach(button => {
        const isBanned = bannedHeroIds.has(button.dataset.heroId);
        button.setAttribute('aria-pressed', String(isBanned));
        button.className = isBanned
            ? 'p-2 rounded-lg border border-red-500 bg-red-950/40 text-red-300 text-left cursor-pointer transition-all flex items-center gap-3 min-w-0'
            : 'p-2 rounded-lg border border-slate-700 bg-slate-950/50 hover:border-slate-500 text-slate-200 text-left cursor-pointer transition-all flex items-center gap-3 min-w-0';
    });

    updateBanListFilters();
}

function updateBanListFilters() {
    const searchTerm = banSearch.value.trim().toLowerCase();
    let visibleHeroCount = 0;

    banHeroList.querySelectorAll('[data-hero-id]').forEach(button => {
        const matchesSearch = button.dataset.heroName.includes(searchTerm);
        const matchesRole = banListRoleFilter === 'All'
            || button.dataset.heroRoles.split('|').includes(banListRoleFilter);
        const isVisible = matchesSearch && matchesRole;

        button.classList.toggle('hidden', !isVisible);
        if (isVisible) visibleHeroCount += 1;
    });

    banEmptyState.classList.toggle('hidden', visibleHeroCount !== 0);

    banRoleFilters.forEach(button => {
        const isActive = button.dataset.banRole === banListRoleFilter;
        button.setAttribute('aria-pressed', String(isActive));
        button.classList.toggle('border-amber-400', isActive);
        button.classList.toggle('bg-amber-400/10', isActive);
        button.classList.toggle('text-amber-300', isActive);
        button.classList.toggle('border-slate-700', !isActive);
        button.classList.toggle('text-slate-400', !isActive);
    });
}

function renderBanList() {
    const fragment = document.createDocumentFragment();

    uniqueHeroes.forEach(hero => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.heroId = hero.id;
        button.dataset.heroName = hero.name.toLowerCase();
        button.dataset.heroRoles = hero.roles.join('|');
        button.innerHTML = `
            <img src="${hero.staticImg}" alt="" class="w-11 h-11 rounded-md object-cover shrink-0">
            <span class="min-w-0">
                <span class="block text-sm font-bold truncate">${hero.name}</span>
                <span class="block text-[9px] uppercase tracking-wider text-slate-500 mt-1 truncate">${hero.roles.join(' · ')}</span>
            </span>
        `;

        button.addEventListener('click', () => {
            if (bannedHeroIds.has(hero.id)) {
                bannedHeroIds.delete(hero.id);
            } else {
                bannedHeroIds.add(hero.id);
            }

            savePreferences();
            updateBanListUI();
        });

        fragment.appendChild(button);
    });

    banHeroList.appendChild(fragment);
    updateBanListUI();
}

function openBanModal() {
    banModal.classList.remove('hidden');
    banModal.classList.add('flex');
    banSearch.focus();
}

function closeBanModal() {
    banModal.classList.add('hidden');
    banModal.classList.remove('flex');
    banListBtn.focus();
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
    updateHeroPageLink(currentHero, true);
    updatePracticeUI();
}

// Manejo de clicks con lógica Multiselect
roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSpinning || (currentHero && matchesCompleted < matchTarget)) return;

        selectionMessage.classList.add('hidden');

        const role = btn.getAttribute('data-role');

        if (activeRoles.has(role)) {
            activeRoles.delete(role);
        } else {
            activeRoles.add(role);
        }

        savePreferences();
        updateRoleFiltersUI();
    });
});

// Función de la ruleta
function spinRoulette() {
    if (isSpinning) return;
    if (currentHero && matchesCompleted < matchTarget) return;
    
    const rolesToFilter = activeRoles.size === 0 
        ? ['Vanguard', 'Duelist', 'Strategist'] 
        : Array.from(activeRoles);

    const filteredPool = heroes.filter(hero => (
        rolesToFilter.includes(hero.role) && !bannedHeroIds.has(hero.id)
    ));

    if (filteredPool.length === 0) {
        selectionMessage.innerText = 'No available heroes. Adjust your role filters or ban list.';
        selectionMessage.classList.remove('hidden');
        return;
    }

    selectionMessage.classList.add('hidden');

    // A completed block is replaced only when a valid new spin begins.
    currentHero = null;
    matchesCompleted = 0;
    matchTarget = 3;
    savePracticeState();
    updateHeroPageLink(null, false);

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
            updateHeroPageLink(finalHero, true);

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

function updateHeroPageLink(hero, isEnabled) {
    const officialUrl = hero ? getOfficialHeroPageUrl(hero.id) : null;

    if (!isEnabled || !officialUrl) {
        heroPageLink.removeAttribute('href');
        heroPageLink.removeAttribute('title');
        heroPageLink.removeAttribute('aria-label');
        heroPageLink.setAttribute('aria-disabled', 'true');
        heroPageLink.setAttribute('tabindex', '-1');
        heroPageLink.classList.add('pointer-events-none');
        heroPageHint.classList.add('hidden');
        return;
    }

    heroPageLink.href = officialUrl;
    heroPageLink.title = `Open ${hero.name} on the official Marvel Rivals website`;
    heroPageLink.setAttribute('aria-label', `Open ${hero.name} on the official Marvel Rivals website in a new tab`);
    heroPageLink.setAttribute('aria-disabled', 'false');
    heroPageLink.setAttribute('tabindex', '0');
    heroPageLink.classList.remove('pointer-events-none');
    heroPageHint.classList.remove('hidden');
}

// updateUI Function
function updateUI(hero, isSpinningPhase) {
    // If it's spinning, use staticImg. If it's the result, drop the animated one.
    heroImg.src = isSpinningPhase ? hero.staticImg : hero.img;
    heroImg.alt = `${hero.name} hero portrait`;
    
    heroName.innerText = hero.name;
    heroRole.innerText = hero.role;

    const classes = roleColors[hero.role] || roleColors['default'];
    const [borderColor, textColor, bgColor] = classes.split(' ');

    cardContainer.className = `border-4 rounded-2xl p-6 lg:p-4 shadow-2xl transition-all duration-300 transform mb-8 lg:mb-0 lg:col-start-1 lg:row-start-1 lg:row-span-4 lg:self-center lg:w-full lg:max-w-[460px] ${borderColor} ${bgColor}`;
    heroRole.className = `text-sm font-semibold tracking-widest uppercase mt-1 ${textColor}`;
}

// Main button Event Listener
spinBtn.addEventListener('click', spinRoulette);

matchCompleteBtn.addEventListener('click', finishMatch);
extendBtn.addEventListener('click', extendPracticeBlock);

banListBtn.addEventListener('click', openBanModal);
closeBanModalBtn.addEventListener('click', closeBanModal);
banSearch.addEventListener('input', updateBanListFilters);
banRoleFilters.forEach(button => {
    button.addEventListener('click', () => {
        banListRoleFilter = button.dataset.banRole;
        updateBanListFilters();
    });
});
clearBansBtn.addEventListener('click', () => {
    bannedHeroIds.clear();
    savePreferences();
    updateBanListUI();
});

banModal.addEventListener('click', event => {
    if (event.target === banModal) closeBanModal();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !banModal.classList.contains('hidden')) {
        closeBanModal();
    }
});

// Mute Button Listener
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    savePreferences();
    updateMuteUI();
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
    updateRoleFiltersUI();
    updateMuteUI();
    renderBanList();
    restorePracticeState();
});
