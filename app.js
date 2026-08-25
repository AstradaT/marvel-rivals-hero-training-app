// Audio Setup
const tickSFX = new Audio('assets/tick.wav');
const successSFX = new Audio('assets/success.wav');
tickSFX.volume = 0.4; 
successSFX.volume = 0.4;

// Persisted player preferences
const savedPreferences = preferencesStorage.load();
let isMuted = savedPreferences.isMuted;
let playerUid = savedPreferences.playerUid;
let playerUsername = savedPreferences.playerUsername;

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
const appModeButtons = document.querySelectorAll('.app-mode-btn');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const practicePanel = document.getElementById('practice-panel');
const practiceStatus = document.getElementById('practice-status');
const practiceCount = document.getElementById('practice-count');
const practiceProgress = document.getElementById('practice-progress');
const matchCompleteBtn = document.getElementById('match-complete-btn');
const undoMatchBtn = document.getElementById('undo-match-btn');
const extendBtn = document.getElementById('extend-btn');
const abandonBlockBtn = document.getElementById('abandon-block-btn');
const abandonModal = document.getElementById('abandon-modal');
const abandonModalDescription = document.getElementById('abandon-modal-description');
const keepPracticingBtn = document.getElementById('keep-practicing-btn');
const confirmAbandonBtn = document.getElementById('confirm-abandon-btn');
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
const externalStatsBtn = document.getElementById('external-stats-btn');
const externalStatsModal = document.getElementById('external-stats-modal');
const closeExternalStatsBtn = document.getElementById('close-external-stats-btn');
const playerProfileForm = document.getElementById('player-profile-form');
const playerUidInput = document.getElementById('player-uid');
const playerUsernameInput = document.getElementById('player-username');
const playerProfileMessage = document.getElementById('player-profile-message');
const externalStatsLinks = document.querySelectorAll('.external-stats-link');
const heroStatsPrompt = document.getElementById('hero-stats-prompt');
const heroStatsPromptMessage = document.getElementById('hero-stats-prompt-message');
const addHeroStatsBtn = document.getElementById('add-hero-stats-btn');
const dismissHeroStatsBtn = document.getElementById('dismiss-hero-stats-btn');
const manualStatsModal = document.getElementById('manual-stats-modal');
const manualStatsTitle = document.getElementById('manual-stats-title');
const closeManualStatsBtn = document.getElementById('close-manual-stats-btn');
const cancelManualStatsBtn = document.getElementById('cancel-manual-stats-btn');
const manualStatsForm = document.getElementById('manual-stats-form');
const manualStatsMode = document.getElementById('manual-stats-mode');
const manualStatsScope = document.getElementById('manual-stats-scope');
const manualSeasonFields = document.getElementById('manual-season-fields');
const manualSeasonId = document.getElementById('manual-season-id');
const manualRankField = document.getElementById('manual-rank-field');
const manualCompetitiveRank = document.getElementById('manual-competitive-rank');
const manualMatchesPlayed = document.getElementById('manual-matches-played');
const manualMetricFields = document.getElementById('manual-metric-fields');
const manualStatsMessage = document.getElementById('manual-stats-message');

// Guardamos los roles activos. Por defecto arrancan los 3 seleccionados
let activeRoles = new Set(savedPreferences.activeRoles);
let appMode = savedPreferences.appMode;
let isSpinning = false;
const validHeroIds = new Set(heroes.map(hero => hero.id));
let bannedHeroIds = new Set(
    savedPreferences.bannedHeroIds.filter(id => validHeroIds.has(id))
);
let banListRoleFilter = 'All';
let playerData = playerDataStorage.load();
let heroStatsPromptDismissed = false;
let quickRandomHero = null;

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
        isMuted,
        appMode,
        playerUid,
        playerUsername
    });
}

function updateAppModeUI() {
    appModeButtons.forEach(button => {
        const isActive = button.dataset.appMode === appMode;
        button.setAttribute('aria-pressed', String(isActive));
        button.classList.toggle('border-amber-400', isActive);
        button.classList.toggle('bg-amber-400/10', isActive);
        button.classList.toggle('text-amber-300', isActive);
        button.classList.toggle('border-slate-700', !isActive);
        button.classList.toggle('text-slate-400', !isActive);
    });
}

function switchAppMode(nextMode) {
    if (isSpinning || nextMode === appMode) return;
    if (!['quickRandom', 'training'].includes(nextMode)) return;

    appMode = nextMode;
    selectionMessage.classList.add('hidden');
    savePreferences();
    updateAppModeUI();

    const heroToDisplay = appMode === 'training' ? currentHero : quickRandomHero;
    if (heroToDisplay) {
        updateUI(heroToDisplay, false);
        updateHeroPageLink(heroToDisplay, true);
    } else {
        resetHeroSelectionUI();
    }

    updatePracticeUI();
}

function getHeroStatsSnapshot(heroId, scope, mode, seasonId) {
    const heroStats = playerData.heroStats[heroId];
    if (!heroStats) return null;

    if (scope === 'overall') return heroStats.overall?.[mode] || null;

    const normalizedSeasonId = manualStats.normalizeSeasonId(seasonId);
    return normalizedSeasonId
        ? heroStats.seasons?.[normalizedSeasonId]?.[mode] || null
        : null;
}

function hasSavedHeroStats(heroId) {
    const heroStats = playerData.heroStats[heroId];
    if (!heroStats) return false;

    const hasOverallStats = Object.keys(heroStats.overall || {}).length > 0;
    const hasSeasonStats = Object.values(heroStats.seasons || {})
        .some(season => Object.keys(season || {}).length > 0);

    return hasOverallStats || hasSeasonStats;
}

function updateHeroStatsPrompt() {
    if (appMode !== 'training' || !currentHero || isSpinning || heroStatsPromptDismissed) {
        heroStatsPrompt.classList.add('hidden');
        return;
    }

    const hasStats = hasSavedHeroStats(currentHero.id);
    heroStatsPromptMessage.innerText = hasStats
        ? `Your ${currentHero.name} stats are saved.`
        : `We don't know your ${currentHero.name} yet.`;
    addHeroStatsBtn.innerText = hasStats ? 'Update my stats' : 'Add my stats';
    dismissHeroStatsBtn.classList.toggle('hidden', hasStats);
    heroStatsPrompt.classList.remove('hidden');
}

function renderManualStatFields() {
    if (!currentHero) return;

    const scope = manualStatsScope.value;
    const mode = manualStatsMode.value;
    const isSeason = scope === 'season';
    const seasonId = manualSeasonId.value || playerData.profile.currentSeasonId || '';
    const snapshot = getHeroStatsSnapshot(currentHero.id, scope, mode, seasonId);

    manualSeasonFields.classList.toggle('hidden', !isSeason);
    manualRankField.classList.toggle('hidden', !isSeason || mode !== 'competitive');
    if (isSeason && !manualSeasonId.value) manualSeasonId.value = seasonId;

    const normalizedSeasonId = manualStats.normalizeSeasonId(seasonId);
    manualCompetitiveRank.value = normalizedSeasonId
        ? playerData.profile.competitiveRanks[normalizedSeasonId] || ''
        : '';
    manualMatchesPlayed.value = snapshot?.matchesPlayed ?? '';

    const statFields = getHeroStatFields(currentHero.role);
    manualMetricFields.classList.toggle('grid-cols-1', statFields.length === 1);
    manualMetricFields.classList.toggle('grid-cols-2', statFields.length !== 1);
    manualMetricFields.innerHTML = statFields.map(field => {
        const storedValue = snapshot?.metrics?.[field.key];
        const savedValue = typeof storedValue === 'number'
            ? storedValue * (field.displayMultiplier || 1)
            : '';
        const maximum = field.max ? ` max="${field.max}"` : '';
        const suffix = field.suffix ? ` <span class="normal-case text-slate-600">(${field.suffix})</span>` : '';

        return `
            <label class="text-xs font-bold uppercase tracking-wider text-slate-400">
                ${field.label}${suffix}
                <input data-metric-key="${field.key}" type="number" min="0"${maximum} step="0.1" required value="${savedValue}" class="block w-full mt-2 bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-lg px-3 py-3 text-sm normal-case tracking-normal text-white">
            </label>
        `;
    }).join('');
}

function openManualStatsModal() {
    if (!currentHero || isSpinning) return;

    manualStatsTitle.innerText = `${hasSavedHeroStats(currentHero.id) ? 'Update' : 'Add'} ${currentHero.name} stats`;
    manualStatsMessage.classList.add('hidden');
    manualStatsMode.value = 'competitive';
    manualStatsScope.value = 'season';
    manualSeasonId.value = playerData.profile.currentSeasonId || '';
    renderManualStatFields();
    manualStatsModal.classList.remove('hidden');
    manualStatsModal.classList.add('flex');
    (manualSeasonId.value ? manualMatchesPlayed : manualSeasonId).focus();
}

function closeManualStatsModal(returnFocus = true) {
    manualStatsModal.classList.add('hidden');
    manualStatsModal.classList.remove('flex');
    if (returnFocus) addHeroStatsBtn.focus();
}

function saveManualStats(event) {
    event.preventDefault();
    if (!currentHero) return;

    const metrics = Object.fromEntries(
        Array.from(manualMetricFields.querySelectorAll('[data-metric-key]'))
            .map(input => [input.dataset.metricKey, input.value])
    );

    try {
        const updatedPlayerData = manualStats.createUpdatedPlayerData(playerData, {
            heroId: currentHero.id,
            scope: manualStatsScope.value,
            seasonId: manualSeasonId.value,
            mode: manualStatsMode.value,
            competitiveRank: manualCompetitiveRank.value,
            matchesPlayed: manualMatchesPlayed.value,
            metrics,
            updatedAt: new Date().toISOString()
        });

        playerData = playerDataStorage.save(updatedPlayerData);
        heroStatsPromptDismissed = false;
        closeManualStatsModal(false);
        updateHeroStatsPrompt();
        addHeroStatsBtn.focus();
    } catch (error) {
        manualStatsMessage.innerText = error.message;
        manualStatsMessage.classList.remove('hidden');
    }
}

function updateExternalStatsLinks() {
    const trackerUrls = {
        rivalstracker: playerUid && `https://rivalstracker.com/profile/${encodeURIComponent(playerUid)}`,
        rivalsanalytics: playerUid && `https://rivalsanalytics.com/player/${encodeURIComponent(playerUid)}`,
        rivalsmeta: playerUid && `https://rivalsmeta.com/player/${encodeURIComponent(playerUid)}`,
        rivalsdata: playerUid && `https://rivalsdata.com/player/${encodeURIComponent(playerUid)}`,
        trackergg: playerUsername && `https://tracker.gg/marvel-rivals/profile/ign/${encodeURIComponent(playerUsername)}/`
    };

    externalStatsLinks.forEach(link => {
        const url = trackerUrls[link.dataset.tracker];

        if (url) {
            link.href = url;
            link.removeAttribute('aria-disabled');
            link.removeAttribute('tabindex');
        } else {
            link.removeAttribute('href');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('tabindex', '-1');
        }
    });
}

function openExternalStatsModal() {
    playerUidInput.value = playerUid;
    playerUsernameInput.value = playerUsername;
    playerProfileMessage.classList.add('hidden');
    updateExternalStatsLinks();
    externalStatsModal.classList.remove('hidden');
    externalStatsModal.classList.add('flex');
    (playerUid ? playerUsernameInput : playerUidInput).focus();
}

function closeExternalStatsModal() {
    externalStatsModal.classList.add('hidden');
    externalStatsModal.classList.remove('flex');
    externalStatsBtn.focus();
}

function savePlayerProfile(event) {
    event.preventDefault();

    const nextUid = playerUidInput.value.trim();
    const nextUsername = playerUsernameInput.value.trim();

    if (nextUid && !/^\d+$/.test(nextUid)) {
        playerProfileMessage.innerText = 'Player UID should contain numbers only.';
        playerProfileMessage.className = 'text-xs mt-3 text-red-400';
        return;
    }

    playerUid = nextUid;
    playerUsername = nextUsername;
    savePreferences();
    updateExternalStatsLinks();
    playerProfileMessage.innerText = playerUid || playerUsername
        ? 'Player saved. Your available profile links are ready.'
        : 'Player details cleared.';
    playerProfileMessage.className = 'text-xs mt-3 text-emerald-400';
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
    if (appMode === 'quickRandom') {
        practicePanel.classList.add('hidden');
        heroStatsPrompt.classList.add('hidden');
        spinBtn.disabled = isSpinning;
        if (!isSpinning) {
            spinBtn.innerText = quickRandomHero ? 'Randomize Again' : 'Spin Roulette';
        }
        return;
    }

    if (!currentHero) {
        practicePanel.classList.add('hidden');
        heroStatsPrompt.classList.add('hidden');
        spinBtn.disabled = isSpinning;
        if (!isSpinning) spinBtn.innerText = 'Spin Roulette';
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
    undoMatchBtn.disabled = matchesCompleted === 0 || isSpinning;
    extendBtn.disabled = matchTarget === 5 || isSpinning;
    abandonBlockBtn.disabled = blockComplete || isSpinning;
    extendBtn.innerText = matchTarget === 5 ? 'Extended to 5' : 'Extend to 5';

    // The roulette stays locked while the current practice block is unfinished.
    spinBtn.disabled = isSpinning || !blockComplete;
    spinBtn.innerText = blockComplete ? 'Spin Next Hero' : `Practice ${currentHero.name}`;
    updateHeroStatsPrompt();
}

function startPracticeBlock(hero) {
    currentHero = hero;
    matchesCompleted = 0;
    matchTarget = 3;
    heroStatsPromptDismissed = false;
    savePracticeState();
    updatePracticeUI();
}

function finishMatch() {
    if (!currentHero || matchesCompleted >= matchTarget || isSpinning) return;

    matchesCompleted += 1;
    savePracticeState();
    updatePracticeUI();
}

function undoMatch() {
    if (!currentHero || matchesCompleted === 0 || isSpinning) return;

    matchesCompleted -= 1;
    savePracticeState();
    updatePracticeUI();
}

function extendPracticeBlock() {
    if (!currentHero || matchTarget === 5 || isSpinning) return;

    matchTarget = 5;
    savePracticeState();
    updatePracticeUI();
}

function openAbandonModal() {
    if (!currentHero || matchesCompleted >= matchTarget || isSpinning) return;

    abandonModalDescription.innerText = `${matchesCompleted} of ${matchTarget} matches are complete for ${currentHero.name}. This practice-block progress will be cleared.`;
    abandonModal.classList.remove('hidden');
    abandonModal.classList.add('flex');
    keepPracticingBtn.focus();
}

function closeAbandonModal(returnFocus = true) {
    abandonModal.classList.add('hidden');
    abandonModal.classList.remove('flex');
    if (returnFocus) abandonBlockBtn.focus();
}

function resetHeroSelectionUI() {
    heroImg.src = 'https://placehold.co/300x300/1e293b/ffffff?text=?';
    heroImg.alt = 'No hero selected';
    heroName.innerText = 'Who will step up?';
    heroRole.innerText = '-';
    cardContainer.className = 'border-4 border-slate-700 bg-slate-900 rounded-2xl p-6 lg:p-4 shadow-2xl transition-all duration-300 transform mb-8 lg:mb-0 lg:col-start-1 lg:row-start-1 lg:row-span-4 lg:self-center lg:w-full lg:max-w-[460px]';
    heroRole.className = 'text-sm font-semibold tracking-widest uppercase text-slate-500 mt-1';
    heroStatsPromptDismissed = false;
    heroStatsPrompt.classList.add('hidden');
    updateHeroPageLink(null, false);
}

function confirmAbandonPracticeBlock() {
    if (!currentHero || matchesCompleted >= matchTarget || isSpinning) {
        closeAbandonModal();
        return;
    }

    currentHero = null;
    matchesCompleted = 0;
    matchTarget = 3;
    savePracticeState();
    resetHeroSelectionUI();
    updatePracticeUI();
    closeAbandonModal(false);
    spinBtn.focus();
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
    if (appMode === 'training') {
        updateUI(currentHero, false);
        updateHeroPageLink(currentHero, true);
    }
    updatePracticeUI();
}

// Manejo de clicks con lógica Multiselect
roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (
            isSpinning
            || (appMode === 'training' && currentHero && matchesCompleted < matchTarget)
        ) return;

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

appModeButtons.forEach(button => {
    button.addEventListener('click', () => switchAppMode(button.dataset.appMode));
});

function selectHeroForActiveMode(candidates) {
    return appMode === 'quickRandom'
        ? heroSelector.selectQuickRandom(candidates)
        : heroSelector.selectTraining(candidates);
}

// Función de la ruleta
function spinRoulette() {
    if (isSpinning) return;
    if (appMode === 'training' && currentHero && matchesCompleted < matchTarget) return;
    
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

    // A completed training block is replaced only when a valid training spin begins.
    if (appMode === 'training') {
        currentHero = null;
        matchesCompleted = 0;
        matchTarget = 3;
        savePracticeState();
    }
    updateHeroPageLink(null, false);

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.innerText = "Choosing...";
    
    roleButtons.forEach(b => b.style.opacity = "0.4");
    appModeButtons.forEach(b => b.style.opacity = "0.4");

    let duration = 2000; 
    let intervalSpeed = 70; 
    
    heroImg.classList.add('roulette-blur', 'anim-ticking');

    // Intervalo de giro (Efecto ruleta)
    const interval = setInterval(() => {
        const randomHero = selectHeroForActiveMode(filteredPool);
        
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
        
        const finalHero = selectHeroForActiveMode(filteredPool);
        
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

            isSpinning = false;
            if (appMode === 'training') {
                // Training selections become three-match practice blocks.
                startPracticeBlock(finalHero);
            } else {
                // Quick Random results remain freely rerollable and untracked.
                quickRandomHero = finalHero;
                updatePracticeUI();
            }
            roleButtons.forEach(b => b.style.opacity = "1");
            appModeButtons.forEach(b => b.style.opacity = "1");
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
undoMatchBtn.addEventListener('click', undoMatch);
extendBtn.addEventListener('click', extendPracticeBlock);
abandonBlockBtn.addEventListener('click', openAbandonModal);
keepPracticingBtn.addEventListener('click', closeAbandonModal);
confirmAbandonBtn.addEventListener('click', confirmAbandonPracticeBlock);

abandonModal.addEventListener('click', event => {
    if (event.target === abandonModal) closeAbandonModal();
});

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

externalStatsBtn.addEventListener('click', openExternalStatsModal);
closeExternalStatsBtn.addEventListener('click', closeExternalStatsModal);
playerProfileForm.addEventListener('submit', savePlayerProfile);
externalStatsModal.addEventListener('click', event => {
    if (event.target === externalStatsModal) closeExternalStatsModal();
});

addHeroStatsBtn.addEventListener('click', openManualStatsModal);
dismissHeroStatsBtn.addEventListener('click', () => {
    heroStatsPromptDismissed = true;
    updateHeroStatsPrompt();
});
closeManualStatsBtn.addEventListener('click', closeManualStatsModal);
cancelManualStatsBtn.addEventListener('click', () => {
    heroStatsPromptDismissed = true;
    closeManualStatsModal();
    updateHeroStatsPrompt();
});
manualStatsForm.addEventListener('submit', saveManualStats);
manualStatsMode.addEventListener('change', renderManualStatFields);
manualStatsScope.addEventListener('change', renderManualStatFields);
manualStatsModal.addEventListener('click', event => {
    if (event.target === manualStatsModal) closeManualStatsModal();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !abandonModal.classList.contains('hidden')) {
        closeAbandonModal();
        return;
    }

    if (event.key === 'Escape' && !banModal.classList.contains('hidden')) {
        closeBanModal();
        return;
    }

    if (event.key === 'Escape' && !manualStatsModal.classList.contains('hidden')) {
        closeManualStatsModal();
        return;
    }

    if (event.key === 'Escape' && !externalStatsModal.classList.contains('hidden')) {
        closeExternalStatsModal();
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
    updateAppModeUI();
    updateMuteUI();
    renderBanList();
    restorePracticeState();
});
