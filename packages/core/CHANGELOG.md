# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.6.0](https://github.com/blacha/coginfo/compare/v0.5.0...v0.6.0) (2019-11-22)


### Features

* parse geokeys to get projections ([2b2dcf6](https://github.com/blacha/coginfo/commit/2b2dcf6))





# [0.5.0](https://github.com/blacha/coginfo/compare/v0.4.1...v0.5.0) (2019-11-21)


### Bug Fixes

* force read in a few kb of data around the headers ([bf7a63a](https://github.com/blacha/coginfo/commit/bf7a63a))


### Features

* typescript 3.7 ([ada8c2b](https://github.com/blacha/coginfo/commit/ada8c2b))





## [0.4.1](https://github.com/blacha/coginfo/compare/v0.4.0...v0.4.1) (2019-10-08)

**Note:** Version bump only for package @cogeotiff/core





# [0.4.0](https://github.com/blacha/coginfo/compare/v0.3.1...v0.4.0) (2019-10-08)


### Bug Fixes

* eslint complains about log?.trace() syntax ([337224c](https://github.com/blacha/coginfo/commit/337224c))
* lgtm issues ([5ccde83](https://github.com/blacha/coginfo/commit/5ccde83))


### Features

* expose img.getTileBounds ([9bfd1c1](https://github.com/blacha/coginfo/commit/9bfd1c1))
* lazy load more data to reduce initial read time for ifd ([74e1dc7](https://github.com/blacha/coginfo/commit/74e1dc7))
* optimize reads if they are contained within one chunk ([824a629](https://github.com/blacha/coginfo/commit/824a629))
* switch to typescript 3.7 to remove some costly logging ([a585195](https://github.com/blacha/coginfo/commit/a585195))





## [0.3.1](https://github.com/blacha/coginfo/compare/v0.3.0...v0.3.1) (2019-09-25)

**Note:** Version bump only for package @cogeotiff/core





# [0.3.0](https://github.com/blacha/coginfo/compare/v0.2.3...v0.3.0) (2019-09-24)


### Bug Fixes

* guard always evaluates false ([dd9550b](https://github.com/blacha/coginfo/commit/dd9550b))


### Features

* adding support for getting by resolution ([69d3a5d](https://github.com/blacha/coginfo/commit/69d3a5d))
* include image size of a tile ([31aa174](https://github.com/blacha/coginfo/commit/31aa174))





## [0.2.2](https://github.com/blacha/coginfo/compare/v0.2.1...v0.2.2) (2019-09-12)


### Bug Fixes

* ignore tsconfig.tsbuildinfo when publishing ([8a27600](https://github.com/blacha/coginfo/commit/8a27600))





## [0.2.1](https://github.com/blacha/coginfo/compare/v0.2.0...v0.2.1) (2019-09-12)


### Bug Fixes

* cannot publish without access:public ([a408389](https://github.com/blacha/coginfo/commit/a408389))





# [0.2.0](https://github.com/blacha/coginfo/compare/v0.0.12...v0.2.0) (2019-09-12)


### Bug Fixes

* load required ifd tags when the image loads if they are not part of the same block as the ifd ([a6713cc](https://github.com/blacha/coginfo/commit/a6713cc))
* remove cyclic dependency ([d0ab5f5](https://github.com/blacha/coginfo/commit/d0ab5f5))


### Features

* rename to cogeotiff ([9a2c099](https://github.com/blacha/coginfo/commit/9a2c099))
* support lzw & deflate output ([dd0f6aa](https://github.com/blacha/coginfo/commit/dd0f6aa))
* support model transformation ([9af4034](https://github.com/blacha/coginfo/commit/9af4034))
