phosphor-boxengine
==================

[![Build Status](https://travis-ci.org/phosphorjs/phosphor-boxengine.svg)](https://travis-ci.org/phosphorjs/phosphor-boxengine?branch=master)
[![Coverage Status](https://coveralls.io/repos/phosphorjs/phosphor-boxengine/badge.svg?branch=master&service=github)](https://coveralls.io/github/phosphorjs/phosphor-boxengine?branch=master)

A low-level box layout algorithm.

[API Docs](http://phosphorjs.github.io/phosphor-boxengine/api/)


Package Install
---------------

**Prerequisites**
- [node](http://nodejs.org/)

```bash
npm install --save phosphor-boxengine
```


Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node](http://nodejs.org/)

```bash
git clone https://github.com/phosphorjs/phosphor-boxengine.git
cd phosphor-boxengine
npm install
```

**Rebuild**
```bash
npm run clean
npm run build
```


Run Tests
---------

Follow the source build instructions first.

```bash
npm test
```


Build Docs
----------

Follow the source build instructions first.

```bash
npm run docs
```

Navigate to `docs/index.html`.


Supported Runtimes
------------------

The runtime versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- Node 0.12.7+
- IE 11+
- Firefox 32+
- Chrome 38+


Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. Simply
omit the type declarations when using a language other than TypeScript.
