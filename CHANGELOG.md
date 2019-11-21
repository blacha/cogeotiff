# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.5.0](https://github.com/blacha/cogeotiff/compare/v0.4.1...v0.5.0) (2019-11-21)


### Bug Fixes

* force read in a few kb of data around the headers ([bf7a63a](https://github.com/blacha/cogeotiff/commit/bf7a63a))
* remove lefthook ([0f4eb6e](https://github.com/blacha/cogeotiff/commit/0f4eb6e))


### Features

* switch to pretty-json-log ([694aa58](https://github.com/blacha/cogeotiff/commit/694aa58))
* typescript 3.7 ([ada8c2b](https://github.com/blacha/cogeotiff/commit/ada8c2b))





## [0.4.1](https://github.com/blacha/cogeotiff/compare/v0.4.0...v0.4.1) (2019-10-08)

**Note:** Version bump only for package @cogeotiff/base





# [0.4.0](https://github.com/blacha/cogeotiff/compare/v0.3.1...v0.4.0) (2019-10-08)


### Bug Fixes

* eslint complains about log?.trace() syntax ([337224c](https://github.com/blacha/cogeotiff/commit/337224c))
* lgtm issues ([5ccde83](https://github.com/blacha/cogeotiff/commit/5ccde83))


### Features

* expose img.getTileBounds ([9bfd1c1](https://github.com/blacha/cogeotiff/commit/9bfd1c1))
* lazy load more data to reduce initial read time for ifd ([74e1dc7](https://github.com/blacha/cogeotiff/commit/74e1dc7))
* optimize reads if they are contained within one chunk ([824a629](https://github.com/blacha/cogeotiff/commit/824a629))
* switch to typescript 3.7 to remove some costly logging ([a585195](https://github.com/blacha/cogeotiff/commit/a585195))





## [0.3.1](https://github.com/blacha/cogeotiff/compare/v0.3.0...v0.3.1) (2019-09-25)

**Note:** Version bump only for package @cogeotiff/base





# [0.3.0](https://github.com/blacha/cogeotiff/compare/v0.2.3...v0.3.0) (2019-09-24)


### Bug Fixes

* guard always evaluates false ([dd9550b](https://github.com/blacha/cogeotiff/commit/dd9550b))


### Features

* adding support for getting by resolution ([69d3a5d](https://github.com/blacha/cogeotiff/commit/69d3a5d))
* include image size of a tile ([31aa174](https://github.com/blacha/cogeotiff/commit/31aa174))





## [0.2.3](https://github.com/blacha/cogeotiff/compare/v0.2.2...v0.2.3) (2019-09-12)


### Bug Fixes

* missed rename on file ([62160b7](https://github.com/blacha/cogeotiff/commit/62160b7))





## [0.2.2](https://github.com/blacha/coginfo/compare/v0.2.1...v0.2.2) (2019-09-12)


### Bug Fixes

* ignore tsconfig.tsbuildinfo when publishing ([8a27600](https://github.com/blacha/coginfo/commit/8a27600))





## [0.2.1](https://github.com/blacha/coginfo/compare/v0.2.0...v0.2.1) (2019-09-12)


### Bug Fixes

* cannot publish without access:public ([a408389](https://github.com/blacha/coginfo/commit/a408389))





# [0.2.0](https://github.com/blacha/coginfo/compare/v0.0.12...v0.2.0) (2019-09-12)


### Bug Fixes

* allow jumping to source in different packages ([3796790](https://github.com/blacha/coginfo/commit/3796790))
* bad cli path ([b91d04f](https://github.com/blacha/coginfo/commit/b91d04f))
* expose aws cog source ([858990d](https://github.com/blacha/coginfo/commit/858990d))
* load required ifd tags when the image loads if they are not part of the same block as the ifd ([a6713cc](https://github.com/blacha/coginfo/commit/a6713cc))
* remove cyclic dependency ([d0ab5f5](https://github.com/blacha/coginfo/commit/d0ab5f5))
* wait for the file write to finish ([324e934](https://github.com/blacha/coginfo/commit/324e934))


### Features

* rename to cogeotiff ([9a2c099](https://github.com/blacha/coginfo/commit/9a2c099))
* support lzw & deflate output ([dd0f6aa](https://github.com/blacha/coginfo/commit/dd0f6aa))
* support model transformation ([9af4034](https://github.com/blacha/coginfo/commit/9af4034))
* switch to cogeotiff ([6ab420a](https://github.com/blacha/coginfo/commit/6ab420a))
