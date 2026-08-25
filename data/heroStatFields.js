const heroStatFields = Object.freeze({
    Duelist: Object.freeze([
        { key: 'winRate', label: 'Win rate', suffix: '%', max: 100, displayMultiplier: 100 },
        { key: 'killsPerMinute', label: 'Kills / minute' },
        { key: 'deathsPerMinute', label: 'Deaths / minute' },
        { key: 'damagePerMinute', label: 'Damage / minute' }
    ]),
    Vanguard: Object.freeze([
        { key: 'winRate', label: 'Win rate', suffix: '%', max: 100, displayMultiplier: 100 },
        { key: 'deathsPerMinute', label: 'Deaths / minute' },
        { key: 'damagePerMinute', label: 'Damage / minute' },
        { key: 'damageTakenPerMinute', label: 'Damage taken / minute' }
    ]),
    Strategist: Object.freeze([
        { key: 'winRate', label: 'Win rate', suffix: '%', max: 100, displayMultiplier: 100 },
        { key: 'deathsPerMinute', label: 'Deaths / minute' },
        { key: 'assistsPerMinute', label: 'Assists / minute' },
        { key: 'healingPerMinute', label: 'Healing / minute' }
    ])
});

function getHeroStatFields(role, enabledMetricKeys = ['winRate']) {
    const enabledMetrics = new Set(enabledMetricKeys);
    return (heroStatFields[role] || []).filter(field => enabledMetrics.has(field.key));
}
