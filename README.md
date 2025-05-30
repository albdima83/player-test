# PLAYER TEST

The scope of to test the various player for ctv application

**Table of content:**

1. [Specs](#specs)
2. [Documents](#documents)
3. [Development](#development)
4. [How to Release](#how-to-release)

## Specs

We use this specific to parse VMAP and Vast files [guide](https://iabtechlab.com/standards/vast/)

## Documents

Please refer to the following documentation

- [Platform Compatibility](./docs/Platforms.md)
- [How to release](./docs/Release.md)

## Development

### Enviroments

- node@22
- pnpm@10

### Setup

In side the root use nvm manager to switch to correct node version

```shell
nvm use     # install dependencies
nvm i       # if not installed
```

### Install modules

```shell
pnpm i      # install dependencies
pnpm run ci # remove node_modules and install dependencies
```

### Build the libs

#### Build in watch mode

```shell
pnpm dev
```

#### Build the app and serve

```shell
pnpm build
```

#### Serve libraries

```shell
pnpm serve
```

#### Use ngrok to serve the test app

```shell
pnpm serve
```

## How to Release

We use changeset to release a new version of webapp or shell.  
Follow this [guide](./docs/Release.md)
