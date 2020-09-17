# Vue 3 Breakpoints

JavaScript-based Media Queries for Vue 3. Internally uses `window.matchMedia` and the Composition API.

## Installation

`npm i vue-next-breakpoints`

## Usage

```javascript
<template>
    <desktop-nav v-if="breakpoints.desktop.matches" />
    <mobile-nav v-if="breakpoints.mobile.matches" />
</template>

<script>
import useBreakpoints from "vue-next-breakpoints";

export default {
    name: "YourComponent",
    setup() {
        const breakpoints = useBreakpoints({
            mobile: 600, // max-width: 600px
            desktop: [601] // min-width: 601px
        });

        return {
            breakpoints
        };
    },
    created() {
        // You can use the breakpoints constant directly in the setup method as well
        this.breakpoints.mobile.on("enter", (mq) => {
            console.log("Entered mobile breakpoint");
            console.log("Media Query", mq);
        });

        this.breakpoints.mobile.on("leave", (mq) => {
            console.log("Left mobile breakpoint");
            console.log("Media Query", mq);
        });
    }
};
</script>
```

## Options and methods

### 1. Defining breakpoints

Simply pass an object with key-value pairs to `useBreakpoints` function, where the key is **any name** you want and the value is one of the following:
- numeric value, e.g. `200` which converts to `@media screen and (max-width: 200px)`
- string value with any units you prefer, e.g. `80%` which converts to `@media screen and (max-width: 80%)`
- an array with one of the above values, e.g. `[600]` which converts to `@media screen and (min-width: 600px)`
- an array with two of the above values, e.g. `[601, "1200px"]` which converts to `@media screen and (min-width: 601px) and (max-width: 1200px)`
- any other media query, e.g. `@media screen and (-webkit-min-device-pixel-ratio: 1)` which will not be converted in any way (`@media` prefix is not required, e.g. `@media print` is the same as just `print`).

### 2. Determining media query state

Each of the specified media queries have `.matches` property which is either `true` or `false`. You can use them in a template or in any other method, computed property etc:

```javascript
<template>
    <desktop-nav v-if="breakpoints.desktop.matches" />
    <mobile-nav v-if="breakpoints.mobile.matches" />
</template>
```

### 3. Assigning event listeners

There are two types of listeners: `"enter"` and `"leave"` and these can be assigned to any media query previously configured

```javascript
const enterCallback = (mq) => {
    console.log("Entered mobile breakpoint");
    console.log("Media Query", mq);
};

const leaveCallback = (mq) => {
    console.log("Left mobile breakpoint");
    console.log("Media Query", mq);
};

created() {
    this.breakpoints.mobile.on("enter", enterCallback);
    this.breakpoints.mobile.on("leave", leaveCallback);
}
```
Event listener can be easily removed as well:
```javascript
this.breakpoints.mobile.off("enter", enterCallback);
```

You **don't have to remove** those event listeners manually before the component is unmounted, it's done automatically behind the scenes.

If you don't specify the callback to remove, all listeners of the given type will be removed:
```javascript
this.breakpoints.mobile.off("enter"); // all previously assigned listeners are gone
```

## Issues

If you find any problems using this library or you want to propose new features to it, feel free to open an issue on Github.
