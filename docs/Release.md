# How to Release

This guide define the steps to use for release a **new version**.

We use the **semantinc versioning**, please follow this [guide](https://docs.npmjs.com/about-semantic-versioning)

Here the steps:

1. Move on **develop** branch

2. Create a new changeset (define [major/minor/patch](https://docs.npmjs.com/about-semantic-versioning))

- Bump versions & generate changelog

```shell
pnpm changeset
```

- Apply version changes

```shell
pnpm changeset version
```

- Build all packages in order of dependencies

```shell
pnpm build
```

3. Make a Pull Request from **develop** to **main**
