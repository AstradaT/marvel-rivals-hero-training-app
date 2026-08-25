const appDataTransfer = (() => {
    const APP_ID = 'marvel-rivals-hero-training-app';
    const SCHEMA_VERSION = 1;

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createBackup({ playerData, preferences, practiceBlock, exportedAt }) {
        if (!isPlainObject(playerData)) throw new Error('Player data is required.');
        if (!isPlainObject(preferences)) throw new Error('Preferences are required.');
        if (practiceBlock !== null && !isPlainObject(practiceBlock)) {
            throw new Error('Practice block must be an object or null.');
        }

        return {
            appId: APP_ID,
            schemaVersion: SCHEMA_VERSION,
            exportedAt: exportedAt || new Date().toISOString(),
            data: clone({ playerData, preferences, practiceBlock })
        };
    }

    function parseBackup(serializedBackup) {
        let backup;
        try {
            backup = JSON.parse(serializedBackup);
        } catch (error) {
            throw new Error('This file is not valid JSON.');
        }

        if (!isPlainObject(backup) || backup.appId !== APP_ID) {
            throw new Error('This is not a Marvel Rivals Training App backup.');
        }
        if (backup.schemaVersion !== SCHEMA_VERSION) {
            throw new Error('This backup version is not supported.');
        }
        if (!isPlainObject(backup.data?.playerData)) {
            throw new Error('The backup does not contain valid player data.');
        }
        if (!isPlainObject(backup.data?.preferences)) {
            throw new Error('The backup does not contain valid preferences.');
        }
        if (backup.data.practiceBlock !== null && !isPlainObject(backup.data.practiceBlock)) {
            throw new Error('The backup contains an invalid practice block.');
        }

        return clone(backup.data);
    }

    return {
        createBackup,
        parseBackup,
        schemaVersion: SCHEMA_VERSION
    };
})();
