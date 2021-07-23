# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.4.0](https://github.com/blacha/cogeotiff/compare/v4.3.0...v4.4.0) (2021-07-23)

**Note:** Version bump only for package @cogeotiff/cli





# [4.3.0](https://github.com/blacha/cogeotiff/compare/v4.2.0...v4.3.0) (2021-06-22)

**Note:** Version bump only for package @cogeotiff/cli





# [4.2.0](https://github.com/blacha/cogeotiff/compare/v4.1.2...v4.2.0) (2021-03-25)

**Note:** Version bump only for package @cogeotiff/cli





## [4.1.2](https://github.com/blacha/cogeotiff/compare/v4.1.1...v4.1.2) (2021-03-18)

**Note:** Version bump only for package @cogeotiff/cli





## [4.1.1](https://github.com/blacha/cogeotiff/compare/v4.1.0...v4.1.1) (2021-03-10)

**Note:** Version bump only for package @cogeotiff/cli





# [4.1.0](https://github.com/blacha/cogeotiff/compare/v4.0.0...v4.1.0) (2021-02-23)

**Note:** Version bump only for package @cogeotiff/cli





# [4.0.0](https://github.com/blacha/cogeotiff/compare/v3.1.0...v4.0.0) (2021-02-02)

**Note:** Version bump only for package @cogeotiff/cli





# [3.1.0](https://github.com/blacha/cogeotiff/compare/v3.0.0...v3.1.0) (2021-01-18)


### Features

* **cli:** support cogs that are not geolocated ([#632](https://github.com/blacha/cogeotiff/issues/632)) ([da73964](https://github.com/blacha/cogeotiff/commit/da73964944620dd32094eab14e475225de021857))





# [3.0.0](https://github.com/blacha/cogeotiff/compare/v2.2.0...v3.0.0) (2020-10-30)


### Features

* **source-aws:** remove aws-sdk typings ([#582](https://github.com/blacha/cogeotiff/issues/582)) ([45527e3](https://github.com/blacha/cogeotiff/commit/45527e3))


### BREAKING CHANGES

* **source-aws:** a default s3 object needs to be used when using the S3 Source, this can be set with `
CogSourceAwsS3.DefaultS3 = new S3();`

* build(deps): squash deps





# [2.2.0](https://github.com/blacha/cogeotiff/compare/v2.1.1...v2.2.0) (2020-07-01)

**Note:** Version bump only for package @cogeotiff/cli





## [2.1.1](https://github.com/blacha/cogeotiff/compare/v2.1.0...v2.1.1) (2020-06-25)

**Note:** Version bump only for package @cogeotiff/cli





# [2.1.0](https://github.com/blacha/cogeotiff/compare/v2.0.0...v2.1.0) (2020-06-14)


### Features

* **cli:** expose gdal metadata if it exists ([823b142](https://github.com/blacha/cogeotiff/commit/823b142))
* **cli:** expose resolution of overviews ([a7bf637](https://github.com/blacha/cogeotiff/commit/a7bf637))
* **core:** expose epsg information ([54ab940](https://github.com/blacha/cogeotiff/commit/54ab940))
* **core:** support striped tiffs ([#435](https://github.com/blacha/cogeotiff/issues/435)) ([8a5d68e](https://github.com/blacha/cogeotiff/commit/8a5d68e))





# [2.0.0](https://github.com/blacha/cogeotiff/compare/v1.1.0...v2.0.0) (2020-05-18)


* feat!: better support for sparse tiffs (#407) ([869073a](https://github.com/blacha/cogeotiff/commit/869073a)), closes [#407](https://github.com/blacha/cogeotiff/issues/407)


### BREAKING CHANGES

* getTile now may return null if there is no data for a tile

Co-authored-by: kodiakhq[bot] <49736102+kodiakhq[bot]@users.noreply.github.com>





# [1.1.0](https://github.com/blacha/cogeotiff/compare/v1.0.8...v1.1.0) (2020-05-12)


### Features

* replace chalk with ansi-colors ([#393](https://github.com/blacha/cogeotiff/issues/393)) ([80abca9](https://github.com/blacha/cogeotiff/commit/80abca9))





## [1.0.8](https://github.com/blacha/cogeotiff/compare/v1.0.7...v1.0.8) (2020-05-11)

**Note:** Version bump only for package @cogeotiff/cli





## [1.0.7](https://github.com/blacha/cogeotiff/compare/v1.0.6...v1.0.7) (2020-05-10)


### Bug Fixes

* **cli:** dump tiles sometimes failed with "Chunk is not ready"  ([#386](https://github.com/blacha/cogeotiff/issues/386)) ([890ef22](https://github.com/blacha/cogeotiff/commit/890ef22))





## [1.0.6](https://github.com/blacha/cogeotiff/compare/v1.0.5...v1.0.6) (2020-05-07)

**Note:** Version bump only for package @cogeotiff/cli





## [1.0.5](https://github.com/blacha/cogeotiff/compare/v1.0.4...v1.0.5) (2020-05-07)

**Note:** Version bump only for package @cogeotiff/cli





## [1.0.4](https://github.com/blacha/cogeotiff/compare/v1.0.3...v1.0.4) (2020-04-29)


### Bug Fixes

* **cli:** zoom has no correlation to any real world zoom ([#373](https://github.com/blacha/cogeotiff/issues/373)) ([dfccc3e](https://github.com/blacha/cogeotiff/commit/dfccc3e))





## [1.0.3](https://github.com/blacha/cogeotiff/compare/v1.0.2...v1.0.3) (2020-03-12)

**Note:** Version bump only for package @cogeotiff/cli





## [1.0.2](https://github.com/blacha/cogeotiff/compare/v1.0.1...v1.0.2) (2020-03-12)

**Note:** Version bump only for package @cogeotiff/cli





## [1.0.1](https://github.com/blacha/cogeotiff/compare/v1.0.0...v1.0.1) (2020-03-10)

**Note:** Version bump only for package @cogeotiff/cli





# [1.0.0](https://github.com/blacha/cogeotiff/compare/v0.9.1...v1.0.0) (2020-03-09)


* feat!: load geotags from other tiff tags ([a34f323](https://github.com/blacha/cogeotiff/commit/a34f323))


### Features

* dump all tiff tags with --tags ([70c4548](https://github.com/blacha/cogeotiff/commit/70c4548))
* show more information about tiff tags when requested ([d13ea48](https://github.com/blacha/cogeotiff/commit/d13ea48))


### BREAKING CHANGES

* this forces a async load to be called before geo tags can be accessed





## [0.9.1](https://github.com/blacha/cogeotiff/compare/v0.9.0...v0.9.1) (2020-01-16)


### Bug Fixes

* missing dep on source-aws ([f13f2a4](https://github.com/blacha/cogeotiff/commit/f13f2a4))





# [0.9.0](https://github.com/blacha/cogeotiff/compare/v0.8.0...v0.9.0) (2020-01-16)


### Bug Fixes

* force chalk v3 ([c68f498](https://github.com/blacha/cogeotiff/commit/c68f498))
* let the cli logger handle error messages ([4cedda6](https://github.com/blacha/cogeotiff/commit/4cedda6))


### Features

* allow the cli to load geotiffs from s3 ([8db14c9](https://github.com/blacha/cogeotiff/commit/8db14c9))





# [0.8.0](https://github.com/blacha/cogeotiff/compare/v0.7.0...v0.8.0) (2020-01-16)

**Note:** Version bump only for package @cogeotiff/cli





# [0.7.0](https://github.com/blacha/cogeotiff/compare/v0.6.0...v0.7.0) (2019-12-08)

**Note:** Version bump only for package @cogeotiff/cli





# [0.6.0](https://github.com/blacha/cogeotiff/compare/v0.5.0...v0.6.0) (2019-11-22)

**Note:** Version bump only for package @cogeotiff/cli





# [0.5.0](https://github.com/blacha/cogeotiff/compare/v0.4.1...v0.5.0) (2019-11-21)


### Bug Fixes

* remove lefthook ([0f4eb6e](https://github.com/blacha/cogeotiff/commit/0f4eb6e))


### Features

* switch to pretty-json-log ([694aa58](https://github.com/blacha/cogeotiff/commit/694aa58))
* typescript 3.7 ([ada8c2b](https://github.com/blacha/cogeotiff/commit/ada8c2b))





## [0.4.1](https://github.com/blacha/cogeotiff/compare/v0.4.0...v0.4.1) (2019-10-08)

**Note:** Version bump only for package @cogeotiff/cli





# [0.4.0](https://github.com/blacha/cogeotiff/compare/v0.3.1...v0.4.0) (2019-10-08)


### Bug Fixes

* lgtm issues ([5ccde83](https://github.com/blacha/cogeotiff/commit/5ccde83))


### Features

* switch to typescript 3.7 to remove some costly logging ([a585195](https://github.com/blacha/cogeotiff/commit/a585195))





## [0.3.1](https://github.com/blacha/cogeotiff/compare/v0.3.0...v0.3.1) (2019-09-25)

**Note:** Version bump only for package @cogeotiff/cli





# [0.3.0](https://github.com/blacha/cogeotiff/compare/v0.2.3...v0.3.0) (2019-09-24)

**Note:** Version bump only for package @cogeotiff/cli





## [0.2.3](https://github.com/blacha/cogeotiff/compare/v0.2.2...v0.2.3) (2019-09-12)


### Bug Fixes

* missed rename on file ([62160b7](https://github.com/blacha/cogeotiff/commit/62160b7))





## [0.2.2](https://github.com/blacha/cogeotiff/compare/v0.2.1...v0.2.2) (2019-09-12)


### Bug Fixes

* ignore tsconfig.tsbuildinfo when publishing ([8a27600](https://github.com/blacha/cogeotiff/commit/8a27600))





## [0.2.1](https://github.com/blacha/cogeotiff/compare/v0.2.0...v0.2.1) (2019-09-12)


### Bug Fixes

* cannot publish without access:public ([a408389](https://github.com/blacha/cogeotiff/commit/a408389))





# [0.2.0](https://github.com/blacha/cogeotiff/compare/v0.0.12...v0.2.0) (2019-09-12)


### Bug Fixes

* bad cli path ([b91d04f](https://github.com/blacha/cogeotiff/commit/b91d04f))
* expose aws cog source ([858990d](https://github.com/blacha/cogeotiff/commit/858990d))
* wait for the file write to finish ([324e934](https://github.com/blacha/cogeotiff/commit/324e934))


### Features

* rename to cogeotiff ([9a2c099](https://github.com/blacha/cogeotiff/commit/9a2c099))
* switch to cogeotiff ([6ab420a](https://github.com/blacha/cogeotiff/commit/6ab420a))
