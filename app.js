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
const practiceResultsSummary = document.getElementById('practice-results-summary');
const trainingRecommendation = document.getElementById('training-recommendation');
const trainingRecommendationMessage = document.getElementById('training-recommendation-message');
const matchCompleteBtn = document.getElementById('match-complete-btn');
const undoMatchBtn = document.getElementById('undo-match-btn');
const extendBtn = document.getElementById('extend-btn');
const abandonBlockBtn = document.getElementById('abandon-block-btn');
const abandonModal = document.getElementById('abandon-modal');
const abandonModalDescription = document.getElementById('abandon-modal-description');
const keepPracticingBtn = document.getElementById('keep-practicing-btn');
const confirmAbandonBtn = document.getElementById('confirm-abandon-btn');
const matchResultModal = document.getElementById('match-result-modal');
const closeMatchResultBtn = document.getElementById('close-match-result-btn');
const matchResultStep = document.getElementById('match-result-step');
const matchResultMode = document.getElementById('match-result-mode');
const matchOutcomeButtons = document.querySelectorAll('[data-match-outcome]');
const matchRecognitionButtons = document.querySelectorAll('[data-match-recognition]');
const matchFeelingButtons = document.querySelectorAll('[data-match-feeling]');
const matchRecognitionHint = document.getElementById('match-recognition-hint');
const skipMatchResultBtn = document.getElementById('skip-match-result-btn');
const saveMatchResultBtn = document.getElementById('save-match-result-btn');
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
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importDataFile = document.getElementById('import-data-file');
const dataTransferMessage = document.getElementById('data-transfer-message');
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
const manualMatchesWon = document.getElementById('manual-matches-won');
const manualWinRatePreview = document.getElementById('manual-win-rate-preview');
const manualMetricFields = document.getElementById('manual-metric-fields');
const manualStatsMessage = document.getElementById('manual-stats-message');
const heroEvaluationPanel = document.getElementById('hero-evaluation-panel');
const heroEvaluationSummary = document.getElementById('hero-evaluation-summary');
const heroEvaluationBadge = document.getElementById('hero-evaluation-badge');
const heroEvaluationComparison = document.getElementById('hero-evaluation-comparison');
const heroEvaluationPlayerValue = document.getElementById('hero-evaluation-player-value');
const heroEvaluationBenchmarkValue = document.getElementById('hero-evaluation-benchmark-value');
const heroEvaluationEvidence = document.getElementById('hero-evaluation-evidence');
const heroEvaluationExplanation = document.getElementById('hero-evaluation-explanation');
const heroEvaluationSourceRow = document.getElementById('hero-evaluation-source-row');
const heroEvaluationSource = document.getElementById('hero-evaluation-source');
const progressDashboardBtn = document.getElementById('progress-dashboard-btn');
const trainingHomeBtn = document.getElementById('training-home-btn');
const competitivePoolBtn = document.getElementById('competitive-pool-btn');
const competitivePoolModal = document.getElementById('competitive-pool-modal');
const closeCompetitivePoolBtn = document.getElementById('close-competitive-pool-btn');
const competitivePoolContext = document.getElementById('competitive-pool-context');
const competitivePoolRoleFilter = document.getElementById('competitive-pool-role-filter');
const competitivePoolSummary = document.getElementById('competitive-pool-summary');
const competitiveRecommendedSection = document.getElementById('competitive-recommended-section');
const competitiveRecommendedList = document.getElementById('competitive-recommended-list');
const competitiveRecommendedCount = document.getElementById('competitive-recommended-count');
const competitiveRecommendedEmpty = document.getElementById('competitive-recommended-empty');
const competitiveCoverageList = document.getElementById('competitive-coverage-list');
const competitiveCoverageCount = document.getElementById('competitive-coverage-count');
const competitiveUnratedSummary = document.getElementById('competitive-unrated-summary');
const competitiveAddStatsBtn = document.getElementById('competitive-add-stats-btn');
const progressDashboardModal = document.getElementById('progress-dashboard-modal');
const closeProgressDashboardBtn = document.getElementById('close-progress-dashboard-btn');
const progressSummary = document.getElementById('progress-summary');
const progressSearch = document.getElementById('progress-search');
const progressRoleFilter = document.getElementById('progress-role-filter');
const progressStatusFilter = document.getElementById('progress-status-filter');
const progressSort = document.getElementById('progress-sort');
const progressResultsCount = document.getElementById('progress-results-count');
const progressCatalogNote = document.getElementById('progress-catalog-note');
const progressHeroList = document.getElementById('progress-hero-list');
const progressEmptyState = document.getElementById('progress-empty-state');

// Guardamos los roles activos. Por defecto arrancan los 3 seleccionados
let activeRoles = new Set(savedPreferences.activeRoles);
let appMode = savedPreferences.appMode;
let isSpinning = false;
const validHeroIds = new Set(heroes.map(hero => hero.id));
const legacyDeadpoolHeroIds = heroes
    .filter(hero => hero.id.startsWith('deadpool-'))
    .map(hero => hero.id);
const migratedBannedHeroIds = savedPreferences.bannedHeroIds.flatMap(
    id => id === 'deadpool' ? legacyDeadpoolHeroIds : [id]
);
let bannedHeroIds = new Set(
    migratedBannedHeroIds.filter(id => validHeroIds.has(id))
);
let banListRoleFilter = 'All';
let playerData = playerDataStorage.load();
let activeBenchmarkCatalog = benchmarkCatalog.create({ schemaVersion: 2, records: [] });
let benchmarkCatalogState = 'loading';
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
let matchResults = [];
let pendingMatchResult = { outcome: null, recognition: null, feeling: null };

function savePracticeState() {
    if (!currentHero) {
        practiceStorage.clear();
        return;
    }

    practiceStorage.save({
        heroId: currentHero.id,
        heroRole: currentHero.role,
        matchesCompleted,
        matchTarget,
        matchResults
    });
}

function getCurrentPreferences() {
    return {
        bannedHeroIds: Array.from(bannedHeroIds),
        activeRoles: Array.from(activeRoles),
        isMuted,
        appMode,
        playerUid,
        playerUsername
    };
}

function savePreferences() {
    preferencesStorage.save(getCurrentPreferences());
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

function getPerformanceHeroLabel(hero) {
    return hero?.id?.startsWith('deadpool-') ? `${hero.name} (${hero.role})` : hero?.name;
}

function hasSavedHeroStats(hero) {
    const heroStats = playerData.heroStats[hero?.id];
    if (!heroStats) return false;

    const hasOverallStats = Object.keys(heroStats.overall || {}).length > 0;
    const hasSeasonStats = Object.values(heroStats.seasons || {})
        .some(season => Object.keys(season || {}).length > 0);

    return hasOverallStats || hasSeasonStats;
}

function getCompetitiveEvaluation(hero) {
    if (benchmarkCatalogState !== 'ready') {
        return { resolution: { status: 'unresolved', reason: 'catalogUnavailable', evaluationState: 'unrated' }, evaluation: null };
    }
    const resolved = performanceResolver.resolve({
        playerData,
        catalog: activeBenchmarkCatalog,
        heroId: hero.id
    });
    if (resolved.status !== 'resolved') {
        return { resolution: resolved, evaluation: null };
    }

    const evaluation = heroEvaluator.evaluate({
        heroId: hero.id,
        heroName: getPerformanceHeroLabel(hero),
        role: hero.role,
        playerStats: resolved.playerStats,
        benchmark: resolved.benchmark
    });
    return { resolution: resolved, evaluation };
}

function getPriorityEvaluation(hero) {
    const { resolution, evaluation } = getCompetitiveEvaluation(hero);
    return evaluation || { evaluationState: resolution.evaluationState };
}

function getTrainingBenchmarks(hero) {
    if (benchmarkCatalogState !== 'ready') {
        return { communityBenchmark: null, officialBenchmarks: [] };
    }

    const communityBenchmark = activeBenchmarkCatalog.findLatestCommunityQuickPlay({
        rankTier: 'all-ranks',
        tracker: 'counterwatch',
        heroId: hero.id
    });
    const benchmarkSeasonId = communityBenchmark?.context?.seasonId;
    const officialBenchmarks = benchmarkSeasonId
        ? ['pc', 'console'].map(platform => activeBenchmarkCatalog.findSeasonalQuickPlay({
            seasonId: benchmarkSeasonId,
            platform,
            heroId: hero.id
        })).filter(Boolean)
        : [];

    return { communityBenchmark, officialBenchmarks };
}

function getTrainingPriority(hero) {
    const benchmarks = getTrainingBenchmarks(hero);
    return trainingPriority.score({
        heroId: hero.id,
        heroStats: playerData.heroStats[hero.id] || null,
        trainingSessions: playerData.trainingSessions,
        evaluation: getPriorityEvaluation(hero),
        currentSeasonId: playerData.profile.currentSeasonId,
        ...benchmarks
    });
}

function getTrainingPriorityWeights(candidates) {
    return Object.fromEntries(candidates.map(hero => [
        hero.id,
        getTrainingPriority(hero).weight
    ]));
}

function formatProgressNumber(value) {
    const numericValue = Number(value) || 0;
    return Number.isInteger(numericValue)
        ? numericValue.toLocaleString()
        : numericValue.toFixed(1);
}

function formatProgressRecency(daysSincePlayed) {
    if (daysSincePlayed === null) return 'Never';
    if (daysSincePlayed < 1) return 'Today';
    const days = Math.floor(daysSincePlayed);
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
}

function getHeroProgressEntries() {
    return heroes.map(hero => trainingProgress.createEntry({
        hero,
        priority: getTrainingPriority(hero),
        isBanned: bannedHeroIds.has(hero.id)
    }));
}

function renderProgressSummary(entries) {
    const summary = trainingProgress.summarize(entries);
    const summaryItems = [
        ['untried', 'Untried'],
        ['gathering', 'Gathering data'],
        ['needsPractice', 'Needs practice'],
        ['maintenance', 'Maintenance'],
        ['wellCovered', 'Well covered']
    ];

    progressSummary.innerHTML = summaryItems.map(([status, label]) => `
        <div class="progress-summary-card progress-status--${status} rounded-lg border bg-slate-950/60 px-3 py-2.5">
            <p class="text-xl font-black text-white">${summary[status]}</p>
            <p class="text-[9px] font-black uppercase tracking-wider mt-0.5">${label}</p>
        </div>
    `).join('');
}

function renderProgressDashboard() {
    const entries = getHeroProgressEntries();
    const visibleEntries = trainingProgress.filterAndSort(entries, {
        search: progressSearch.value,
        role: progressRoleFilter.value,
        status: progressStatusFilter.value,
        sort: progressSort.value
    });

    renderProgressSummary(entries);
    progressResultsCount.innerText = `Showing ${visibleEntries.length} of ${entries.length} heroes`;
    progressCatalogNote.innerText = benchmarkCatalogState === 'ready'
        ? 'Quick Match-first · Counterwatch baseline · Competitive familiarity ×0.35'
        : benchmarkCatalogState === 'loading'
            ? 'Loading community benchmarks…'
            : 'Community benchmarks unavailable · Experience and recency only';
    progressEmptyState.classList.toggle('hidden', visibleEntries.length !== 0);

    progressHeroList.innerHTML = visibleEntries.map(entry => {
        const roleClass = entry.role === 'Vanguard'
            ? 'text-blue-400'
            : entry.role === 'Duelist'
                ? 'text-red-400'
                : 'text-emerald-400';
        const priorityWidth = Math.min(100, Math.max(5, (entry.priorityWeight / 5) * 100));
        const competitiveCopy = entry.competitiveMatches > 0
            ? `${formatProgressNumber(entry.competitiveMatches)} Competitive ×0.35`
            : 'No Competitive history';

        return `
            <article class="hero-progress-card progress-status--${entry.status} p-4" data-progress-hero-id="${entry.heroId}">
                <div class="flex items-start gap-3 min-w-0">
                    <img src="${entry.staticImg}" alt="" class="w-14 h-14 rounded-lg object-cover bg-slate-900 shrink-0">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <h3 class="font-black text-base leading-tight truncate">${entry.heroName}</h3>
                                <p class="${roleClass} text-[10px] font-bold uppercase tracking-wider mt-1">${entry.role}</p>
                            </div>
                            <span class="progress-status shrink-0 rounded-full border bg-slate-950/70 px-2 py-1 text-[8px] font-black uppercase tracking-wider">${entry.statusLabel}</span>
                        </div>
                        ${entry.isBanned ? '<span class="inline-block mt-2 rounded bg-red-950/70 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-red-300">Banned from roulette</span>' : ''}
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-4">
                    <div class="rounded-lg bg-slate-900/70 p-2.5">
                        <p class="text-[8px] font-bold uppercase tracking-wider text-slate-500">Effective</p>
                        <p class="text-base font-black text-white mt-0.5">${formatProgressNumber(entry.experienceMatches)}</p>
                    </div>
                    <div class="rounded-lg bg-slate-900/70 p-2.5">
                        <p class="text-[8px] font-bold uppercase tracking-wider text-slate-500">Quick Match</p>
                        <p class="text-base font-black text-white mt-0.5">${formatProgressNumber(entry.quickPlayMatches)}</p>
                    </div>
                    <div class="rounded-lg bg-slate-900/70 p-2.5">
                        <p class="text-[8px] font-bold uppercase tracking-wider text-slate-500">Last trained</p>
                        <p class="text-xs font-black text-white mt-1">${formatProgressRecency(entry.daysSincePlayed)}</p>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-wider">
                        <span class="text-slate-500">Training priority</span>
                        <span class="text-amber-300">${entry.priorityWeight.toFixed(2)} / 5</span>
                    </div>
                    <div class="progress-priority-track mt-1.5">
                        <div class="progress-priority-fill" style="width: ${priorityWidth}%"></div>
                    </div>
                </div>

                <div class="flex items-center justify-between gap-2 mt-3 text-[9px] text-slate-500">
                    <span>${competitiveCopy}</span>
                    <span>Evidence: <strong class="text-slate-300">${entry.reliabilityLabel}</strong></span>
                </div>
                <p class="progress-reason text-[10px] leading-relaxed text-slate-500 mt-2">${entry.reason}</p>
            </article>
        `;
    }).join('');
}

function openProgressDashboard() {
    renderProgressDashboard();
    progressDashboardModal.classList.remove('hidden');
    progressDashboardModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    progressSearch.focus();
}

function closeProgressDashboard() {
    progressDashboardModal.classList.add('hidden');
    progressDashboardModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
    progressDashboardBtn.focus();
}

function formatSeasonLabel(seasonId) {
    const value = manualStats.formatSeasonInputValue(seasonId);
    return value ? `Season ${value}` : 'Season not selected';
}

function getCompetitivePoolEntries() {
    return heroes.map(hero => {
        const { resolution, evaluation } = getCompetitiveEvaluation(hero);
        return competitivePool.createEntry({
            hero,
            resolution,
            evaluation,
            priority: getTrainingPriority(hero),
            isBanned: bannedHeroIds.has(hero.id)
        });
    });
}

function renderCompetitivePoolCard(entry, position = null) {
    const roleClasses = {
        Vanguard: 'text-blue-300 border-blue-900/70',
        Duelist: 'text-rose-300 border-rose-900/70',
        Strategist: 'text-emerald-300 border-emerald-900/70'
    };
    const stateClasses = {
        ready: 'competitive-state--ready',
        needsMoreData: 'competitive-state--evidence',
        developing: 'competitive-state--developing',
        unrated: 'competitive-state--unrated'
    };
    const scoreCopy = entry.skillScore === null
        ? '—'
        : entry.skillScore.toFixed(1);
    const positionCopy = position === null
        ? ''
        : `<span class="competitive-rank-number">${position}</span>`;

    return `
        <article class="competitive-card ${stateClasses[entry.state]}">
            ${positionCopy}
            <div class="flex gap-3 min-w-0">
                <img src="${entry.staticImg}" alt="" class="w-16 h-16 rounded-lg object-cover bg-slate-900 shrink-0">
                <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <h4 class="font-black text-white truncate">${entry.heroName}</h4>
                            <p class="text-[10px] font-bold ${roleClasses[entry.role] || 'text-slate-400'}">${entry.role}</p>
                        </div>
                        <span class="competitive-state-badge">${entry.stateLabel}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 mt-3">
                        <div><span class="competitive-metric-label">Skill</span><strong>${scoreCopy}</strong></div>
                        <div><span class="competitive-metric-label">Confidence</span><strong>${entry.confidenceLabel}</strong></div>
                        <div><span class="competitive-metric-label">Matches</span><strong>${formatProgressNumber(entry.competitiveMatches)}</strong></div>
                    </div>
                </div>
            </div>
            <p class="text-xs leading-relaxed text-slate-400 mt-3">${entry.summary}</p>
            <div class="flex items-center justify-between gap-2 mt-3 text-[10px] text-slate-600">
                <span>${entry.rankTier ? `${entry.rankTier} · ${formatSeasonLabel(entry.seasonId)}` : 'Competitive context incomplete'}</span>
                <span>${entry.daysSinceTrained === null ? 'Never trained' : `Trained ${formatProgressRecency(entry.daysSinceTrained)}`}</span>
            </div>
            ${entry.isBanned ? '<p class="text-[10px] text-rose-400 mt-2">Excluded from Training recommendations by your ban list.</p>' : ''}
        </article>
    `;
}

function renderCompetitivePool() {
    const entries = getCompetitivePoolEntries();
    const role = competitivePoolRoleFilter.value;
    const filteredEntries = competitivePool.rank(entries, { role });
    const recommended = competitivePool.getRecommended(
        role === 'All' ? entries : entries.filter(entry => entry.role === role)
    );
    const coverage = filteredEntries.filter(entry => (
        entry.state === 'needsMoreData' || entry.state === 'developing'
    ));
    const unratedCount = filteredEntries.filter(entry => entry.state === 'unrated').length;
    const summary = competitivePool.summarize(filteredEntries);
    const seasonId = playerData.profile.currentSeasonId;
    const rank = seasonId
        ? playerData.profile.competitiveRanks?.[seasonId]
        : null;

    competitivePoolContext.innerHTML = `
        <span class="context-chip">${formatSeasonLabel(seasonId)}</span>
        <span class="context-chip">${rank || 'Rank not selected'}</span>
        <span class="text-[11px] text-slate-600">Competitive snapshots update this pool; Training results do not assign ranked skill.</span>
    `;
    competitivePoolSummary.innerHTML = [
        ['ready', 'Recommended', summary.ready],
        ['needsMoreData', 'Needs evidence', summary.needsMoreData],
        ['developing', 'Developing', summary.developing],
        ['unrated', 'Not evaluated', summary.unrated]
    ].map(([state, label, count]) => `
        <div class="competitive-summary competitive-state--${state}">
            <strong>${count}</strong><span>${label}</span>
        </div>
    `).join('');

    competitiveRecommendedList.innerHTML = recommended
        .map((entry, index) => renderCompetitivePoolCard(entry, index + 1))
        .join('');
    competitiveRecommendedCount.textContent = `${recommended.length} heroes`;
    competitiveRecommendedEmpty.classList.toggle('hidden', recommended.length > 0);
    competitiveAddStatsBtn.textContent = currentHero
        ? `Update ${getPerformanceHeroLabel(currentHero)} stats`
        : 'Return to Training';

    competitiveCoverageList.innerHTML = coverage.map(entry => renderCompetitivePoolCard(entry)).join('');
    competitiveCoverageCount.textContent = `${coverage.length} ${coverage.length === 1 ? 'hero' : 'heroes'}`;
    competitiveUnratedSummary.classList.toggle('hidden', unratedCount === 0);
    competitiveUnratedSummary.innerHTML = unratedCount === 0 ? '' : `
        <div>
            <strong>${unratedCount} ${unratedCount === 1 ? 'hero is' : 'heroes are'} not evaluated yet</strong>
            <p>Add a current-season Competitive snapshot when you want to consider them for ranked.</p>
        </div>
        <span aria-hidden="true">Not in the pool</span>
    `;
}

function openCompetitivePool() {
    renderCompetitivePool();
    competitivePoolModal.classList.remove('hidden');
    competitivePoolModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    closeCompetitivePoolBtn.focus();
}

function closeCompetitivePool(returnFocus = true) {
    competitivePoolModal.classList.add('hidden');
    competitivePoolModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
    if (returnFocus) competitivePoolBtn.focus();
}

function formatPercentage(value) {
    return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatSourceDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

function setEvaluationBadge(state, label) {
    const stateClasses = {
        known: ['border-emerald-700', 'bg-emerald-950/40', 'text-emerald-300'],
        weak: ['border-red-800', 'bg-red-950/40', 'text-red-300'],
        unknown: ['border-amber-700', 'bg-amber-950/40', 'text-amber-300'],
        unrated: ['border-slate-700', 'bg-slate-900', 'text-slate-400']
    };
    const allClasses = Object.values(stateClasses).flat();
    heroEvaluationBadge.classList.remove(...allClasses);
    heroEvaluationBadge.classList.add(...(stateClasses[state] || stateClasses.unrated));
    heroEvaluationBadge.innerText = label;
}

function getUnratedEvaluationCopy(resolved) {
    const copy = {
        missingSeason: ['Season required', 'Save a current-season Competitive snapshot to select a compatible benchmark.'],
        missingCompetitiveRank: ['Rank required', 'Add your Competitive rank for the current season.'],
        noCompatibleBenchmark: ['No matching benchmark', 'A benchmark must match hero, season, mode, and rank exactly.'],
        noCompetitiveData: ['Competitive data required', 'Quick Play remains training evidence but cannot be used for peer evaluation.']
    };
    return copy[resolved.reason] || ['Not rated yet', 'Add compatible Competitive statistics to evaluate this hero.'];
}

function updateHeroEvaluation() {
    const canShow = appMode === 'training' && currentHero;
    if (!canShow) {
        heroEvaluationPanel.classList.add('hidden');
        return;
    }

    heroEvaluationPanel.classList.remove('hidden');
    heroEvaluationComparison.classList.add('hidden');
    heroEvaluationSourceRow.classList.add('hidden');

    const priority = getTrainingPriority(currentHero);
    const performance = priority.quickPlayPerformance;
    const quickPlayExperience = priority.experience.quickPlayMatches;
    const reliabilityLabel = performance.playerMatches === 0
        ? 'No results'
        : performance.reliability < 0.5
            ? 'Growing'
            : performance.reliability < 0.75
                ? 'Useful'
                : 'Strong';
    const insightState = performance.signal >= 0.1
        ? 'weak'
        : performance.playerMatches > 0
            ? 'known'
            : 'unknown';

    setEvaluationBadge(insightState, reliabilityLabel);
    heroEvaluationSummary.innerText = performance.playerMatches === 0
        ? quickPlayExperience > 0
            ? 'Experience saved; match outcomes would improve the signal.'
            : 'Start building a Quick Play baseline.'
        : performance.signal >= 0.1
            ? 'Your Quick Play results suggest more practice.'
            : 'Your Quick Play evidence is becoming useful.';
    heroEvaluationEvidence.innerText = `Experience: ${formatProgressNumber(quickPlayExperience)} Quick Play · Results: ${formatProgressNumber(performance.playerMatches)} · Last trained: ${formatProgressRecency(priority.daysSincePlayed)}`;
    heroEvaluationExplanation.innerText = priority.reason;

    if (
        Number.isFinite(performance.playerWinRate)
        && Number.isFinite(performance.benchmarkWinRate)
    ) {
        heroEvaluationPlayerValue.innerText = formatPercentage(performance.playerWinRate);
        heroEvaluationBenchmarkValue.innerText = formatPercentage(performance.benchmarkWinRate);
        heroEvaluationComparison.classList.remove('hidden');
    }

    const benchmark = getTrainingBenchmarks(currentHero).communityBenchmark;
    if (benchmark?.source?.url) {
        heroEvaluationSource.href = benchmark.source.url;
        heroEvaluationSource.innerText = `${benchmark.source.id} · ${formatSourceDate(benchmark.collectedAt)} · ${benchmark.sampleSize.matches.toLocaleString()} matches`;
        heroEvaluationSourceRow.classList.remove('hidden');
    }
}

async function loadBenchmarkCatalog() {
    try {
        const response = await fetch('data/benchmarks.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Benchmark request failed: ${response.status}`);

        activeBenchmarkCatalog = benchmarkCatalog.create(await response.json());
        benchmarkCatalogState = 'ready';
    } catch (error) {
        benchmarkCatalogState = 'error';
        console.warn('Benchmark catalog could not be loaded.', error);
    }

    updatePracticeUI();
    if (!progressDashboardModal.classList.contains('hidden')) {
        renderProgressDashboard();
    }
    if (!competitivePoolModal.classList.contains('hidden')) {
        renderCompetitivePool();
    }
}

function updateHeroStatsPrompt() {
    if (appMode !== 'training' || !currentHero || isSpinning || heroStatsPromptDismissed) {
        heroStatsPrompt.classList.add('hidden');
        return;
    }

    const hasStats = hasSavedHeroStats(currentHero);
    const heroLabel = getPerformanceHeroLabel(currentHero);
    heroStatsPromptMessage.innerText = hasStats
        ? `Your ${heroLabel} stats are saved.`
        : `We don't know your ${heroLabel} yet.`;
    addHeroStatsBtn.innerText = hasStats ? 'Update my stats' : 'Add my stats';
    dismissHeroStatsBtn.classList.toggle('hidden', hasStats);
    heroStatsPrompt.classList.remove('hidden');
}

function renderManualStatFields() {
    if (!currentHero) return;

    const scope = manualStatsScope.value;
    const mode = manualStatsMode.value;
    const isSeason = scope === 'season';
    const seasonInput = manualSeasonId.value
        || manualStats.formatSeasonInputValue(playerData.profile.currentSeasonId);
    const seasonId = manualStats.normalizeSeasonId(seasonInput);
    const snapshot = getHeroStatsSnapshot(
        currentHero.id,
        scope,
        mode,
        seasonId
    );

    manualSeasonFields.classList.toggle('hidden', !isSeason);
    manualRankField.classList.toggle('hidden', !isSeason || mode !== 'competitive');
    if (isSeason && !manualSeasonId.value) manualSeasonId.value = seasonInput;

    manualCompetitiveRank.value = seasonId
        ? playerData.profile.competitiveRanks[seasonId] || ''
        : '';
    manualMatchesPlayed.value = snapshot?.matchesPlayed ?? '';
    manualMatchesWon.value = Number.isInteger(snapshot?.matchesWon)
        ? snapshot.matchesWon
        : inferMatchesWon(snapshot);

    const statFields = getHeroStatFields(currentHero.role).filter(field => field.key !== 'winRate');
    manualMetricFields.classList.toggle('hidden', statFields.length === 0);
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
    updateManualWinRatePreview();
}

function inferMatchesWon(snapshot) {
    const matchesPlayed = Number(snapshot?.matchesPlayed);
    const winRate = Number(snapshot?.metrics?.winRate);
    if (!Number.isInteger(matchesPlayed) || matchesPlayed < 0) return '';
    if (!Number.isFinite(winRate) || winRate < 0 || winRate > 1) return '';

    return Math.round(matchesPlayed * winRate);
}

function updateManualWinRatePreview() {
    const matchesPlayed = Number(manualMatchesPlayed.value);
    const matchesWon = Number(manualMatchesWon.value);
    const hasBothValues = manualMatchesPlayed.value !== '' && manualMatchesWon.value !== '';
    const isValid = hasBothValues
        && Number.isInteger(matchesPlayed)
        && Number.isInteger(matchesWon)
        && matchesPlayed >= 0
        && matchesWon >= 0
        && matchesWon <= matchesPlayed;

    manualWinRatePreview.classList.toggle('text-red-400', hasBothValues && !isValid);
    manualWinRatePreview.classList.toggle('text-amber-300', !hasBothValues || isValid);

    if (!hasBothValues) {
        manualWinRatePreview.innerText = 'Calculated win rate: —';
    } else if (!isValid) {
        manualWinRatePreview.innerText = 'Matches won must be a whole number no greater than matches played.';
    } else if (matchesPlayed === 0) {
        manualWinRatePreview.innerText = 'Calculated win rate: unavailable with 0 matches';
    } else {
        manualWinRatePreview.innerText = `Calculated win rate: ${formatPercentage(matchesWon / matchesPlayed)}`;
    }
}

function openManualStatsModal() {
    if (!currentHero || isSpinning) return;

    manualStatsTitle.innerText = `${hasSavedHeroStats(currentHero) ? 'Update' : 'Add'} ${getPerformanceHeroLabel(currentHero)} stats`;
    manualStatsMessage.classList.add('hidden');
    manualStatsMode.value = 'competitive';
    manualStatsScope.value = 'season';
    manualSeasonId.value = manualStats.formatSeasonInputValue(
        playerData.profile.currentSeasonId
    );
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
            matchesWon: manualMatchesWon.value,
            metrics,
            updatedAt: new Date().toISOString()
        });

        playerData = playerDataStorage.save(updatedPlayerData);
        heroStatsPromptDismissed = false;
        closeManualStatsModal(false);
        updatePracticeUI();
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
    dataTransferMessage.classList.add('hidden');
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

function updatePracticeResultsSummary() {
    const summary = matchResult.summarize(matchResults);
    practiceResultsSummary.replaceChildren();

    if (summary.recorded === 0) {
        practiceResultsSummary.classList.add('hidden');
        practiceResultsSummary.classList.remove('flex');
        return;
    }

    const badges = [
        summary.wins ? `${summary.wins}W` : null,
        summary.losses ? `${summary.losses}L` : null,
        summary.mvpAwards ? `${summary.mvpAwards} MVP` : null,
        summary.svpAwards ? `${summary.svpAwards} SVP` : null
    ].filter(Boolean);
    const omittedCount = summary.recorded - summary.wins - summary.losses;
    if (omittedCount) badges.push(`${omittedCount} without details`);

    badges.forEach(label => {
        const badge = document.createElement('span');
        badge.className = 'rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300';
        badge.textContent = label;
        practiceResultsSummary.appendChild(badge);
    });

    practiceResultsSummary.classList.remove('hidden');
    practiceResultsSummary.classList.add('flex');
}

function updatePracticeUI() {
    if (appMode === 'quickRandom') {
        practicePanel.classList.add('hidden');
        trainingRecommendation.classList.add('hidden');
        heroStatsPrompt.classList.add('hidden');
        heroEvaluationPanel.classList.add('hidden');
        spinBtn.disabled = isSpinning;
        if (!isSpinning) {
            spinBtn.innerText = quickRandomHero ? 'Randomize Again' : 'Spin Roulette';
        }
        return;
    }

    if (!currentHero) {
        practicePanel.classList.add('hidden');
        trainingRecommendation.classList.add('hidden');
        heroStatsPrompt.classList.add('hidden');
        heroEvaluationPanel.classList.add('hidden');
        spinBtn.disabled = isSpinning;
        if (!isSpinning) spinBtn.innerText = 'Spin Roulette';
        return;
    }

    practicePanel.classList.remove('hidden');
    trainingRecommendationMessage.innerText = getTrainingPriority(currentHero).reason;
    trainingRecommendation.classList.remove('hidden');

    const blockComplete = matchesCompleted >= matchTarget;
    const percentage = Math.min(100, (matchesCompleted / matchTarget) * 100);

    practiceCount.innerText = `${matchesCompleted} / ${matchTarget}`;
    practiceProgress.style.width = `${percentage}%`;
    updatePracticeResultsSummary();

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
    updateHeroEvaluation();
}

function showDataTransferMessage(message, isError = false) {
    dataTransferMessage.innerText = message;
    dataTransferMessage.className = `text-xs mt-3 ${isError ? 'text-red-400' : 'text-emerald-400'}`;
}

function exportAppData() {
    try {
        const backup = appDataTransfer.createBackup({
            playerData,
            preferences: getCurrentPreferences(),
            practiceBlock: practiceStorage.load(),
            exportedAt: new Date().toISOString()
        });
        const serializedBackup = `${JSON.stringify(backup, null, 2)}\n`;
        const downloadLink = document.createElement('a');
        const date = backup.exportedAt.slice(0, 10);

        downloadLink.href = `data:application/json;charset=utf-8,${encodeURIComponent(serializedBackup)}`;
        downloadLink.download = `marvel-rivals-training-backup-${date}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        showDataTransferMessage('Backup downloaded. Keep the JSON file private.');
    } catch (error) {
        showDataTransferMessage(error.message, true);
    }
}

async function importAppData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const importedData = appDataTransfer.parseBackup(await file.text());
        const shouldReplace = window.confirm(
            'Importing this backup will replace the player data currently saved in this browser. Continue?'
        );
        if (!shouldReplace) return;

        playerDataStorage.save(importedData.playerData);
        preferencesStorage.save(importedData.preferences);
        if (importedData.practiceBlock) {
            practiceStorage.save(importedData.practiceBlock);
        } else {
            practiceStorage.clear();
        }

        showDataTransferMessage('Backup imported. Reloading your data...');
        window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
        showDataTransferMessage(error.message, true);
    } finally {
        importDataFile.value = '';
    }
}

function startPracticeBlock(hero) {
    currentHero = hero;
    matchesCompleted = 0;
    matchTarget = 3;
    matchResults = [];
    heroStatsPromptDismissed = false;
    savePracticeState();
    updatePracticeUI();
}

function updateMatchResultOptions() {
    matchOutcomeButtons.forEach(button => {
        const selected = button.dataset.matchOutcome === pendingMatchResult.outcome;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('border-amber-400', selected);
        button.classList.toggle('bg-slate-800', selected);
        button.classList.toggle('border-slate-700', !selected);
    });

    matchRecognitionButtons.forEach(button => {
        const recognition = button.dataset.matchRecognition || null;
        const isCompatible = !recognition
            || (recognition === 'mvp' && pendingMatchResult.outcome === 'win')
            || (recognition === 'svp' && pendingMatchResult.outcome === 'loss');
        const selected = recognition === pendingMatchResult.recognition;
        button.disabled = !isCompatible;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('border-amber-400', selected);
        button.classList.toggle('bg-slate-800', selected);
        button.classList.toggle('border-slate-700', !selected);
        button.classList.toggle('opacity-35', !isCompatible);
        button.classList.toggle('cursor-not-allowed', !isCompatible);
    });

    matchFeelingButtons.forEach(button => {
        const selected = button.dataset.matchFeeling === pendingMatchResult.feeling;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('border-amber-400', selected);
        button.classList.toggle('bg-slate-800', selected);
        button.classList.toggle('border-slate-700', !selected);
    });

    saveMatchResultBtn.disabled = !pendingMatchResult.outcome;
    matchRecognitionHint.textContent = pendingMatchResult.outcome === 'win'
        ? 'MVP is available for a victory.'
        : pendingMatchResult.outcome === 'loss'
            ? 'SVP is available for a defeat.'
            : 'Choose a result first to enable the matching recognition.';
}

function openMatchResultModal() {
    if (!currentHero || matchesCompleted >= matchTarget || isSpinning) return;

    pendingMatchResult = { outcome: null, recognition: null, feeling: null };
    matchResultMode.value = 'quickPlay';
    matchResultStep.textContent = `${currentHero.name} · Match ${matchesCompleted + 1} of ${matchTarget}`;
    updateMatchResultOptions();
    matchResultModal.classList.remove('hidden');
    matchResultModal.classList.add('flex');
    matchOutcomeButtons[0].focus();
}

function closeMatchResultModal(returnFocus = true) {
    matchResultModal.classList.add('hidden');
    matchResultModal.classList.remove('flex');
    if (returnFocus) matchCompleteBtn.focus();
}

function finishMatch({ withDetails = true } = {}) {
    if (!currentHero || matchesCompleted >= matchTarget || isSpinning) return;
    if (withDetails && !pendingMatchResult.outcome) return;

    matchResults.push(matchResult.create({
        id: `match-${Date.now()}-${currentHero.id}-${matchesCompleted + 1}`,
        playedAt: new Date().toISOString(),
        gameMode: matchResultMode.value,
        outcome: withDetails ? pendingMatchResult.outcome : null,
        recognition: withDetails ? pendingMatchResult.recognition : null,
        feeling: withDetails ? pendingMatchResult.feeling : null
    }));
    matchesCompleted += 1;
    savePracticeState();
    updatePracticeUI();
    closeMatchResultModal(false);
    (matchesCompleted >= matchTarget ? spinBtn : matchCompleteBtn).focus();
}

function undoMatch() {
    if (!currentHero || matchesCompleted === 0 || isSpinning) return;

    matchesCompleted -= 1;
    matchResults.pop();
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
    heroEvaluationPanel.classList.add('hidden');
    trainingRecommendation.classList.add('hidden');
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
    matchResults = [];
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
        const legacyDeadpoolMatches = savedBlock.heroId === 'deadpool'
            && h.id.startsWith('deadpool-');
        const heroMatches = hasStableId
            ? h.id === savedBlock.heroId || legacyDeadpoolMatches
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
    matchResults = matchResult.sanitizeMany(savedBlock.matchResults, matchesCompleted);

    // Re-save to migrate older storage formats after successful validation.
    savePracticeState();
    if (appMode === 'training') {
        updateUI(currentHero, false);
        updateHeroPageLink(currentHero, true);
    }
    updatePracticeUI();
}

function archiveCompletedPracticeBlock() {
    if (!currentHero || matchesCompleted < matchTarget) return;

    const playedAt = new Date().toISOString();
    const resultSummary = matchResult.summarize(matchResults);
    playerData.trainingSessions.push({
        id: `training-${Date.now()}-${currentHero.id}`,
        heroId: currentHero.id,
        gameMode: matchResult.getSessionGameMode(matchResults),
        seasonId: playerData.profile.currentSeasonId,
        playedAt,
        matches: matchTarget,
        metrics: {
            wins: resultSummary.wins,
            losses: resultSummary.losses,
            mvpAwards: resultSummary.mvpAwards,
            svpAwards: resultSummary.svpAwards
        },
        matchResults
    });
    playerData = playerDataStorage.save(playerData);
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

function selectHeroForActiveMode(candidates, trainingWeights = {}) {
    return appMode === 'quickRandom'
        ? heroSelector.selectQuickRandom(candidates)
        : heroSelector.selectTraining(candidates, trainingWeights);
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
        archiveCompletedPracticeBlock();
        currentHero = null;
        matchesCompleted = 0;
        matchTarget = 3;
        matchResults = [];
        savePracticeState();
    }
    const trainingWeights = appMode === 'training'
        ? getTrainingPriorityWeights(filteredPool)
        : {};
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
        const randomHero = selectHeroForActiveMode(filteredPool, trainingWeights);
        
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
        
        const finalHero = selectHeroForActiveMode(filteredPool, trainingWeights);
        
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

matchCompleteBtn.addEventListener('click', openMatchResultModal);
undoMatchBtn.addEventListener('click', undoMatch);
extendBtn.addEventListener('click', extendPracticeBlock);
abandonBlockBtn.addEventListener('click', openAbandonModal);
keepPracticingBtn.addEventListener('click', closeAbandonModal);
confirmAbandonBtn.addEventListener('click', confirmAbandonPracticeBlock);

closeMatchResultBtn.addEventListener('click', closeMatchResultModal);
skipMatchResultBtn.addEventListener('click', () => finishMatch({ withDetails: false }));
saveMatchResultBtn.addEventListener('click', () => finishMatch({ withDetails: true }));
matchOutcomeButtons.forEach(button => {
    button.addEventListener('click', () => {
        pendingMatchResult.outcome = button.dataset.matchOutcome;
        if (
            (pendingMatchResult.recognition === 'mvp' && pendingMatchResult.outcome !== 'win')
            || (pendingMatchResult.recognition === 'svp' && pendingMatchResult.outcome !== 'loss')
        ) pendingMatchResult.recognition = null;
        updateMatchResultOptions();
    });
});
matchRecognitionButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.disabled) return;
        pendingMatchResult.recognition = button.dataset.matchRecognition || null;
        updateMatchResultOptions();
    });
});
matchFeelingButtons.forEach(button => {
    button.addEventListener('click', () => {
        const selectedFeeling = button.dataset.matchFeeling;
        pendingMatchResult.feeling = pendingMatchResult.feeling === selectedFeeling
            ? null
            : selectedFeeling;
        updateMatchResultOptions();
    });
});
matchResultModal.addEventListener('click', event => {
    if (event.target === matchResultModal) closeMatchResultModal();
});

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
exportDataBtn.addEventListener('click', exportAppData);
importDataBtn.addEventListener('click', () => importDataFile.click());
importDataFile.addEventListener('change', importAppData);
externalStatsModal.addEventListener('click', event => {
    if (event.target === externalStatsModal) closeExternalStatsModal();
});

progressDashboardBtn.addEventListener('click', openProgressDashboard);
trainingHomeBtn.addEventListener('click', () => {
    if (!competitivePoolModal.classList.contains('hidden')) closeCompetitivePool(false);
    if (!progressDashboardModal.classList.contains('hidden')) closeProgressDashboard();
    trainingHomeBtn.focus();
});
competitivePoolBtn.addEventListener('click', openCompetitivePool);
closeCompetitivePoolBtn.addEventListener('click', closeCompetitivePool);
competitivePoolRoleFilter.addEventListener('change', renderCompetitivePool);
competitiveAddStatsBtn.addEventListener('click', () => {
    closeCompetitivePool(false);
    if (currentHero) openManualStatsModal();
    else trainingHomeBtn.focus();
});
competitivePoolModal.addEventListener('click', event => {
    if (event.target === competitivePoolModal) closeCompetitivePool();
});
closeProgressDashboardBtn.addEventListener('click', closeProgressDashboard);
progressSearch.addEventListener('input', renderProgressDashboard);
progressRoleFilter.addEventListener('change', renderProgressDashboard);
progressStatusFilter.addEventListener('change', renderProgressDashboard);
progressSort.addEventListener('change', renderProgressDashboard);
progressDashboardModal.addEventListener('click', event => {
    if (event.target === progressDashboardModal) closeProgressDashboard();
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
manualMatchesPlayed.addEventListener('input', updateManualWinRatePreview);
manualMatchesWon.addEventListener('input', updateManualWinRatePreview);
manualStatsModal.addEventListener('click', event => {
    if (event.target === manualStatsModal) closeManualStatsModal();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !competitivePoolModal.classList.contains('hidden')) {
        closeCompetitivePool();
        return;
    }

    if (event.key === 'Escape' && !matchResultModal.classList.contains('hidden')) {
        closeMatchResultModal();
        return;
    }

    if (event.key === 'Escape' && !progressDashboardModal.classList.contains('hidden')) {
        closeProgressDashboard();
        return;
    }

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
    loadBenchmarkCatalog();
    restorePracticeState();
});
