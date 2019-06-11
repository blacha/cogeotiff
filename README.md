# cog-viewer

Utility to investigate access patterns for [Cloud optimized GEOTiff](https://www.cogeo.org/)

This is mostly just a learning exercise for Tiff/[BigTiff](http://bigtiff.org/) IFD access & GEOTiff in general


This is a work in progress and likely will not work


# Building
This requires [NodeJs](https://nodejs.org/en/) > 12 & [Yarn](https://yarnpkg.com/en/)

Use [n](https://github.com/tj/n) to manage nodeJs versions

```bash
# Download the latest nodejs & yarn
n latest
npm install -g yarn

# Install node deps
yarn

# Build everything into /build
yarn run build

# Run the unit tests
yarn run test
```
