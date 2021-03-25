# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.2.0](https://github.com/blacha/cogeotiff/compare/v4.1.2...v4.2.0) (2021-03-25)


### Features

* **chunk:** add ability to read entire file using .read() ([#664](https://github.com/blacha/cogeotiff/issues/664)) ([4db04ad](https://github.com/blacha/cogeotiff/commit/4db04adc43ab4c358526e469c712f7958381d738))





## [4.1.2](https://github.com/blacha/cogeotiff/compare/v4.1.1...v4.1.2) (2021-03-18)


### Bug Fixes

* **core:** lazy tags should cache the lazy value ([a30c0e1](https://github.com/blacha/cogeotiff/commit/a30c0e1b976cdf4956b2d962d1cfafdf0f74dce0))
* **core:** load additional bytes for ifdReading if needed ([d59bf2d](https://github.com/blacha/cogeotiff/commit/d59bf2d383d8748ba13dabd8915ea11bcb46adeb))





## [4.1.1](https://github.com/blacha/cogeotiff/compare/v4.1.0...v4.1.1) (2021-03-10)


### Bug Fixes

* **core:** actually fetch bytes when needed by a lazy tag loader ([0cb8e50](https://github.com/blacha/cogeotiff/commit/0cb8e5074d6753809c00def18dd6d900923b9085))





# [4.1.0](https://github.com/blacha/cogeotiff/compare/v4.0.0...v4.1.0) (2021-02-23)


### Features

* **core:** allow CogTiff.init to be called multiple times ([4a8ab20](https://github.com/blacha/cogeotiff/commit/4a8ab20946bb72121d080300c42404933d42fe06))
* **web:** support rendering in leaflet maps ([#482](https://github.com/blacha/cogeotiff/issues/482)) ([dfb40fa](https://github.com/blacha/cogeotiff/commit/dfb40fad836d4e762bd2485a435ac402fcf1c3d6))





# [4.0.0](https://github.com/blacha/cogeotiff/compare/v3.1.0...v4.0.0) (2021-02-02)

**Note:** Version bump only for package @cogeotiff/core





# [3.1.0](https://github.com/blacha/coginfo/compare/v3.0.0...v3.1.0) (2021-01-18)


### Features

* **cli:** support cogs that are not geolocated ([#632](https://github.com/blacha/coginfo/issues/632)) ([da73964](https://github.com/blacha/coginfo/commit/da73964944620dd32094eab14e475225de021857))





# [3.0.0](https://github.com/blacha/coginfo/compare/v2.2.0...v3.0.0) (2020-10-30)

**Note:** Version bump only for package @cogeotiff/core





# [2.2.0](https://github.com/blacha/coginfo/compare/v2.1.1...v2.2.0) (2020-07-01)


### Features

* adding uri for a full reference for any source ([#469](https://github.com/blacha/coginfo/issues/469)) ([137d9c9](https://github.com/blacha/coginfo/commit/137d9c9))





## [2.1.1](https://github.com/blacha/coginfo/compare/v2.1.0...v2.1.1) (2020-06-25)


### Bug Fixes

* **core:** sparse cogs should return null for sparse tiles ([#466](https://github.com/blacha/coginfo/issues/466)) ([322c4d1](https://github.com/blacha/coginfo/commit/322c4d1))





# [2.1.0](https://github.com/blacha/coginfo/compare/v2.0.0...v2.1.0) (2020-06-14)


### Features

* **cog:** allow file sources to be closed if they need to be ([#430](https://github.com/blacha/coginfo/issues/430)) ([d2441e0](https://github.com/blacha/coginfo/commit/d2441e0))
* **core:** expose epsg information ([54ab940](https://github.com/blacha/coginfo/commit/54ab940))
* **core:** support striped tiffs ([#435](https://github.com/blacha/coginfo/issues/435)) ([8a5d68e](https://github.com/blacha/coginfo/commit/8a5d68e))





# [2.0.0](https://github.com/blacha/coginfo/compare/v1.1.0...v2.0.0) (2020-05-18)


* feat!: better support for sparse tiffs (#407) ([869073a](https://github.com/blacha/coginfo/commit/869073a)), closes [#407](https://github.com/blacha/coginfo/issues/407)


### BREAKING CHANGES

* getTile now may return null if there is no data for a tile

Co-authored-by: kodiakhq[bot] <49736102+kodiakhq[bot]@users.noreply.github.com>





## [1.0.8](https://github.com/blacha/coginfo/compare/v1.0.7...v1.0.8) (2020-05-11)


### Bug Fixes

* **core:** do no read too many bytes from the file ([#388](https://github.com/blacha/coginfo/issues/388)) ([e745249](https://github.com/blacha/coginfo/commit/e745249))





## [1.0.7](https://github.com/blacha/coginfo/compare/v1.0.6...v1.0.7) (2020-05-10)


### Bug Fixes

* **cli:** dump tiles sometimes failed with "Chunk is not ready"  ([#386](https://github.com/blacha/coginfo/issues/386)) ([890ef22](https://github.com/blacha/coginfo/commit/890ef22))





## [1.0.6](https://github.com/blacha/coginfo/compare/v1.0.5...v1.0.6) (2020-05-07)

**Note:** Version bump only for package @cogeotiff/core





## [1.0.5](https://github.com/blacha/coginfo/compare/v1.0.4...v1.0.5) (2020-05-07)


### Bug Fixes

* allow CogTiff.init() to be called multiple times ([#382](https://github.com/blacha/coginfo/issues/382)) ([f282f9e](https://github.com/blacha/coginfo/commit/f282f9e))





## [1.0.4](https://github.com/blacha/coginfo/compare/v1.0.3...v1.0.4) (2020-04-29)


### Bug Fixes

* **cli:** zoom has no correlation to any real world zoom ([#373](https://github.com/blacha/coginfo/issues/373)) ([dfccc3e](https://github.com/blacha/coginfo/commit/dfccc3e))





## [1.0.3](https://github.com/blacha/coginfo/compare/v1.0.2...v1.0.3) (2020-03-12)

**Note:** Version bump only for package @cogeotiff/core





## [1.0.2](https://github.com/blacha/coginfo/compare/v1.0.1...v1.0.2) (2020-03-12)

**Note:** Version bump only for package @cogeotiff/core





## [1.0.1](https://github.com/blacha/coginfo/compare/v1.0.0...v1.0.1) (2020-03-10)


### Bug Fixes

* Offset is outside the bounds of the DataView ([3cc8e5b](https://github.com/blacha/coginfo/commit/3cc8e5b))





# [1.0.0](https://github.com/blacha/coginfo/compare/v0.9.1...v1.0.0) (2020-03-09)


* feat!: load geotags from other tiff tags ([a34f323](https://github.com/blacha/coginfo/commit/a34f323))


### Features

* show more information about tiff tags when requested ([d13ea48](https://github.com/blacha/coginfo/commit/d13ea48))


### BREAKING CHANGES

* this forces a async load to be called before geo tags can be accessed





# [0.9.0](https://github.com/blacha/coginfo/compare/v0.8.0...v0.9.0) (2020-01-16)


### Bug Fixes

* correctly reject excpetions thrown inside of a fetch ([ab8fe9a](https://github.com/blacha/coginfo/commit/ab8fe9a))


### Features

* allow the cli to load geotiffs from s3 ([8db14c9](https://github.com/blacha/coginfo/commit/8db14c9))





# [0.8.0](https://github.com/blacha/coginfo/compare/v0.7.0...v0.8.0) (2020-01-16)

**Note:** Version bump only for package @cogeotiff/core





# [0.7.0](https://github.com/blacha/coginfo/compare/v0.6.0...v0.7.0) (2019-12-08)

**Note:** Version bump only for package @cogeotiff/core





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
