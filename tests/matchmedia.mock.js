import MatchMediaMock from "jest-matchmedia-mock";

const matchMedia = new MatchMediaMock();

matchMedia.useMediaQuery = function (mediaQuery) {
    if (typeof mediaQuery !== "string") throw new Error("Media Query must be a string");

    this.currentMediaQuery = mediaQuery;

    Object.keys(this.mediaQueries).forEach((key) => {
        this.mediaQueries[key].forEach((listener) => {
            listener.call(this.mediaQueryList, {
                matches: mediaQuery === key,
                media: mediaQuery,
            });
        });
    });
};

export default matchMedia;
