const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..', '..');

function createLocalStorage(initialValues = {}) {
    const values = new Map(Object.entries(initialValues));

    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
        snapshot() {
            return Object.fromEntries(values);
        }
    };
}

function loadBrowserScripts(relativePaths, globals = {}) {
    const context = vm.createContext({
        console: {
            log() {},
            warn() {},
            error() {}
        },
        ...globals
    });

    relativePaths.forEach(relativePath => {
        const absolutePath = path.join(projectRoot, relativePath);
        const source = fs.readFileSync(absolutePath, 'utf8');
        vm.runInContext(source, context, { filename: relativePath });
    });

    return {
        evaluate(expression) {
            return vm.runInContext(expression, context);
        }
    };
}

module.exports = {
    createLocalStorage,
    loadBrowserScripts,
    projectRoot
};
