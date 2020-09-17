import matchMedia from "./matchmedia.mock";
import module, { __RewireAPI__ as Rewire } from "../src/index";

const breakpoints = new Proxy(module, {
    get(target, prop) {
        const fn = target.__get__(prop);
        return fn ? fn : target.prop;
    },
});

describe("Test media query string generation", () => {
    test("Adds units to a value", () => {
        expect(breakpoints.addUnits(200)).toBe("200px");
        expect(breakpoints.addUnits("200px")).toBe("200px");
        expect(breakpoints.addUnits("200%")).toBe("200%");
    });

    test("Generates max-width media query", () => {
        expect(breakpoints.getMediaQuery("200px")).toBe("screen and (max-width: 200px)");
    });

    test("Generates min-width media query", () => {
        expect(breakpoints.getMediaQuery([200])).toBe("screen and (min-width: 200px)");
    });

    test("Generates min-width and max-width media query", () => {
        expect(breakpoints.getMediaQuery([200, "1000px"])).toBe(
            "screen and (min-width: 200px) and (max-width: 1000px)"
        );
    });

    test("Generates custom media query", () => {
        expect(breakpoints.getMediaQuery("screen and (min-device-aspect-ratio: 16/9)")).toBe(
            "screen and (min-device-aspect-ratio: 16/9)"
        );

        expect(breakpoints.getMediaQuery("media print")).toBe("print");
        expect(breakpoints.getMediaQuery("@media print")).toBe("print");
    });
});

describe("Test callbacks registration", () => {
    let callbacks;

    beforeEach(() => {
        callbacks = {
            enter: [],
            leave: [],
        };
    });

    test("Adds callback", () => {
        const callback = () => {};

        breakpoints.addCallback(callbacks, "enter", callback);

        expect(callbacks["enter"]).toContain(callback);
    });

    test("Adds callback only once", () => {
        const callback = () => {};

        breakpoints.addCallback(callbacks, "enter", callback);
        breakpoints.addCallback(callbacks, "enter", callback);

        expect(callbacks["enter"].indexOf(callback)).toBe(callbacks["enter"].lastIndexOf(callback));
    });

    test("Removes callback", () => {
        const callback = () => {};

        breakpoints.addCallback(callbacks, "enter", callback);
        breakpoints.removeCallback(callbacks, "enter", callback);

        expect(callbacks["enter"]).not.toContain(callback);
    });

    test("Does nothing when callback being removed was not registered", () => {
        const callback = () => {};
        const callback2 = () => {};

        breakpoints.addCallback(callbacks, "enter", callback);
        breakpoints.removeCallback(callbacks, "enter", callback2);

        expect(callbacks["enter"]).toContain(callback);
        expect(callbacks["enter"]).not.toContain(callback2);
    });

    test("Removes all callbacks", () => {
        const callback = () => {};
        const callback2 = () => {};

        breakpoints.addCallback(callbacks, "enter", callback);
        breakpoints.addCallback(callbacks, "enter", callback2);

        expect(callbacks["enter"]).toHaveLength(2);

        breakpoints.removeCallback(callbacks, "enter");

        expect(callbacks["enter"]).toHaveLength(0);
    });

    test("Validates callback type", () => {
        const callback = () => {};

        expect(() => {
            breakpoints.addCallback(callbacks, "invalidtype", callback);
        }).toThrow();

        expect(() => {
            breakpoints.removeCallback(callbacks, "invalidtype", callback);
        }).toThrow();
    });

    test("Runs all callbacks", () => {
        const callback = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();

        breakpoints.addCallback(callbacks, "enter", callback);
        breakpoints.addCallback(callbacks, "enter", callback2);
        breakpoints.addCallback(callbacks, "leave", callback3);

        breakpoints.runCallbacks(callbacks["enter"]);
        breakpoints.runCallbacks(callbacks["leave"]);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback3).toHaveBeenCalledTimes(1);
    });
});

describe("Test media queries registration", () => {
    let obj;
    let onBeforeUnmount;

    const config = {
        mobile: 600,
        desktop: 1000,
    };

    beforeEach(() => {
        obj = {};
        onBeforeUnmount = jest.fn();
        Rewire.__Rewire__("reactive", () => obj);
        Rewire.__Rewire__("onBeforeUnmount", onBeforeUnmount);
    });

    afterEach(() => {
        matchMedia.clear();
    });

    test("Registers media query on matchMedia", () => {
        breakpoints(config);

        expect(matchMedia.getMediaQueries()).toEqual([
            breakpoints.getMediaQuery(config.mobile),
            breakpoints.getMediaQuery(config.desktop),
        ]);
    });

    test("Changes matches property based on media query", () => {
        const data = breakpoints(config);

        expect(data.mobile.matches).toBe(false);
        expect(data.desktop.matches).toBe(false);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));
        expect(data.mobile.matches).toBe(true);
        expect(data.desktop.matches).toBe(false);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.desktop));
        expect(data.mobile.matches).toBe(false);
        expect(data.desktop.matches).toBe(true);
    });

    test("Registers and runs callbacks", () => {
        const callback = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();

        const data = breakpoints(config);

        data.mobile.on("enter", callback);
        data.mobile.on("leave", callback2);
        data.desktop.on("enter", callback3);

        expect(callback).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).not.toHaveBeenCalled();

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));
        expect(callback).toHaveBeenCalledTimes(1);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.desktop));
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback3).toHaveBeenCalledTimes(1);
    });

    test("Unregister callback", () => {
        const callback = jest.fn();
        const callback2 = jest.fn();

        const data = breakpoints(config);

        data.mobile.on("enter", callback);
        data.mobile.on("enter", callback2);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));
        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));

        expect(callback).toBeCalledTimes(2);
        expect(callback2).toBeCalledTimes(2);

        data.mobile.off("enter", callback);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));

        expect(callback).toBeCalledTimes(2);
        expect(callback2).toBeCalledTimes(3);
    });

    test("Unregister all callbacks", () => {
        const callback = jest.fn();
        const callback2 = jest.fn();

        const data = breakpoints(config);

        data.mobile.on("enter", callback);
        data.mobile.on("enter", callback2);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));

        expect(callback).toBeCalledTimes(1);
        expect(callback2).toBeCalledTimes(1);

        data.mobile.off("enter");

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));

        expect(callback).toBeCalledTimes(1);
        expect(callback2).toBeCalledTimes(1);
    });

    test("Registers onBeforeUnmount to remove listeners", () => {
        const callback = jest.fn();

        const data = breakpoints(config);

        expect(onBeforeUnmount).toHaveBeenCalledTimes(2);

        data.mobile.on("enter", callback);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));
        expect(callback).toBeCalledTimes(1);

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));
        expect(callback).toBeCalledTimes(2);

        // Call all functions registered with onBeforeUnmount
        onBeforeUnmount.mock.calls.forEach((fns) => {
            fns.forEach((fn) => fn());
        });

        matchMedia.useMediaQuery(breakpoints.getMediaQuery(config.mobile));
        expect(callback).toBeCalledTimes(2);
    });
});
