import { reactive, onBeforeUnmount } from "vue";

function addUnits(value) {
    if (isNaN(value)) {
        return value;
    }

    return `${value}px`;
}

function getMediaQuery(param) {
    let mediaQuery = "screen and ";

    if (Array.isArray(param)) {
        mediaQuery += `(min-width: ${addUnits(param[0])})`;

        if (param.length === 2) {
            mediaQuery += ` and (max-width: ${addUnits(param[1])})`;
        }

        return mediaQuery;
    }

    if (!isNaN(parseInt(param))) {
        mediaQuery += `(max-width: ${addUnits(param)})`;
        return mediaQuery;
    }

    return String(param)
        .replace(/^@?media/i, "")
        .trim();
}

function addCallback(callbacks, type, callback) {
    if (!callbacks[type]) {
        throw new Error(`Event of type "${type}" is not available for registration`);
    }

    if (callbacks[type].indexOf(callback) === -1) {
        callbacks[type].push(callback);
    }
}

function removeCallback(callbacks, type, callback) {
    if (!callbacks[type]) {
        throw new Error(`Event of type "${type}" is not available for unregistration`);
    }

    if (callback === undefined) {
        callbacks[type] = [];
    } else {
        let index = callbacks[type].indexOf(callback);

        if (index !== -1) {
            callbacks[type].splice(index, 1);
        }
    }
}

function runCallbacks(callbacks, mq) {
    callbacks.forEach((callback) => callback(mq));
}

function registerMediaQuery(name, param, breakpoints) {
    const mq = window.matchMedia(getMediaQuery(param));

    const callbacks = {
        enter: [],
        leave: [],
    };

    breakpoints[name] = {
        matches: mq.matches,
        on(type, callback) {
            addCallback(callbacks, type, callback);
        },
        off(type, callback) {
            removeCallback(callbacks, type, callback);
        },
    };

    const setValue = (e) => {
        breakpoints[name].matches = e.matches;

        runCallbacks(e.matches ? callbacks["enter"] : callbacks["leave"], mq);
    };

    mq.addListener(setValue);

    onBeforeUnmount(() => {
        mq.removeListener(setValue);
    });
}

export default function (config) {
    const breakpoints = reactive({});

    Object.keys(config).forEach((key) => {
        registerMediaQuery(key, config[key], breakpoints);
    });

    return breakpoints;
}
