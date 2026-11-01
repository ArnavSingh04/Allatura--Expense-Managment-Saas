'use strict';

// Next's installed font loader supports local mocked CSS. No font request leaves this runner.
module.exports = new Proxy({}, {
  get(_target, url) {
    if (typeof url !== 'string') return undefined;
    const parsed = new URL(url);
    if (parsed.origin !== 'https://fonts.googleapis.com') throw new Error('Unexpected font fixture URL');
    const family = parsed.searchParams.get('family')?.split(':')[0];
    if (!['Plus Jakarta Sans', 'Noto Serif'].includes(family)) throw new Error('Unexpected font fixture family');
    return `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400 700; src: local('Arial'); }`;
  },
});
