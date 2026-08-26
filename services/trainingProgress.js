const trainingProgress = (() => {
    const STATUS_DEFINITIONS = Object.freeze({
        untried: { label: 'Untried', rank: 0 },
        gathering: { label: 'Gathering data', rank: 1 },
        needsPractice: { label: 'Needs practice', rank: 2 },
        maintenance: { label: 'Maintenance', rank: 3 },
        wellCovered: { label: 'Well covered', rank: 4 }
    });

    function getReliabilityLabel(playerMatches, reliability) {
        if (playerMatches <= 0) return 'No evidence';
        if (reliability < 0.5) return 'Low';
        if (reliability < 0.75) return 'Growing';
        return 'Strong';
    }

    function getStatus(priority) {
        if (priority.experienceMatches === 0) return 'untried';
        if (
            priority.quickPlayPerformance.playerMatches === 0
            || priority.quickPlayPerformance.reliability < 0.5
        ) return 'gathering';
        if (
            priority.signals.quickPlayPerformance >= 0.1
            || priority.signals.competitive > 0
        ) return 'needsPractice';
        if (
            priority.daysSincePlayed === null
            || priority.daysSincePlayed >= 14
        ) return 'maintenance';
        return 'wellCovered';
    }

    function createEntry({ hero, priority, isBanned = false }) {
        const status = getStatus(priority);
        return {
            heroId: hero.id,
            heroName: hero.name,
            role: hero.role,
            staticImg: hero.staticImg,
            isBanned,
            status,
            statusLabel: STATUS_DEFINITIONS[status].label,
            statusRank: STATUS_DEFINITIONS[status].rank,
            priorityWeight: priority.weight,
            experienceMatches: priority.experienceMatches,
            quickPlayMatches: priority.experience.quickPlayMatches,
            competitiveMatches: priority.experience.competitiveMatches,
            evidenceMatches: priority.quickPlayPerformance.playerMatches,
            reliability: priority.quickPlayPerformance.reliability,
            reliabilityLabel: getReliabilityLabel(
                priority.quickPlayPerformance.playerMatches,
                priority.quickPlayPerformance.reliability
            ),
            lastPlayedAt: priority.lastPlayedAt,
            daysSincePlayed: priority.daysSincePlayed,
            reason: priority.reason
        };
    }

    function filterAndSort(entries, {
        search = '',
        role = 'All',
        status = 'all',
        sort = 'priority'
    } = {}) {
        const normalizedSearch = String(search).trim().toLowerCase();
        const filtered = entries.filter(entry => (
            (!normalizedSearch || entry.heroName.toLowerCase().includes(normalizedSearch))
            && (role === 'All' || entry.role === role)
            && (status === 'all' || entry.status === status)
        ));

        return filtered.sort((left, right) => {
            if (sort === 'name') return left.heroName.localeCompare(right.heroName);
            if (sort === 'experience') {
                return left.experienceMatches - right.experienceMatches
                    || right.priorityWeight - left.priorityWeight
                    || left.heroName.localeCompare(right.heroName);
            }
            if (sort === 'recency') {
                const leftDays = left.daysSincePlayed ?? Number.POSITIVE_INFINITY;
                const rightDays = right.daysSincePlayed ?? Number.POSITIVE_INFINITY;
                return rightDays - leftDays
                    || right.priorityWeight - left.priorityWeight
                    || left.heroName.localeCompare(right.heroName);
            }
            return right.priorityWeight - left.priorityWeight
                || left.statusRank - right.statusRank
                || left.heroName.localeCompare(right.heroName);
        });
    }

    function summarize(entries) {
        return entries.reduce((summary, entry) => {
            summary.total += 1;
            summary[entry.status] += 1;
            return summary;
        }, {
            total: 0,
            untried: 0,
            gathering: 0,
            needsPractice: 0,
            maintenance: 0,
            wellCovered: 0
        });
    }

    return {
        STATUS_DEFINITIONS,
        createEntry,
        filterAndSort,
        getReliabilityLabel,
        getStatus,
        summarize
    };
})();
