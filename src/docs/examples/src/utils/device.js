export const isPhone = window.matchMedia('(max-width: 640px)').matches;

// NOTE All iOS browsers on iPhone have "iPhone" in the user agent
export const isIPhone = /iPhone/.test(navigator.userAgent);
