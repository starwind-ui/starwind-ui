# Starwind Contributing Guide

Welcome! I'm glad you're interested in contributing to the Starwind project. Before you start, please read the following guidelines.

## About this repository

This repository is a monorepo.

- We use [pnpm](https://pnpm.io) and [`workspaces`](https://pnpm.io/workspaces) for development.
- We use [Turborepo](https://turbo.build/repo) as our build system.
- [Tsup](https://tsup.egoist.sh/) to bundle packages.
- [Changeset](https://changeset.dev/) to manage versioning.
- [Node.js](https://nodejs.org/en) 20.6.0+ is required.

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone to your local machine

```bash
git clone https://github.com/your-username/starwind.git
```

### Navigate to the root folder

```bash
cd starwind
```

### Create a new branch

```bash
git checkout -b my-new-branch
```

### Run a workspace

You can use the `pnpm --filter=[WORKSPACE]` command to start the development process for a workspace. There are also a number of helper scripts in the root folder of the repository that you can use to run the development process for the different workspaces.

#### Examples

1. Run the `cli` workspace

```bash
pnpm cli:dev
```

2. Run the `demo` workspace

```bash
pnpm demo:dev
```

## Running the CLI Locally

To run the CLI locally, you can follow the workflow below:

1. Start by building the project. This builds the CLI, core components, and
   demo projects.

```bash
pnpm build
```

2. Install the built CLI globally on your own machine. This will allow you to
   run the CLI from anywhere on your machine.

```bash
pnpm l
```

3. Test the CLI by running `starwind` in another terminal. You should see the help
   message for the CLI.

```bash
pnpm starwind
```

## Conventions

### Commit Convention

Before you create a Pull Request, please check whether your commits comply with
the commit conventions used in this repository.

When you create a commit we kindly ask you to follow the convention
`category(scope or module): message` in your commit message while using one of
the following categories:

- `feat / feature`: all changes that introduce completely new code or new
  features
- `fix`: changes that fix a bug (ideally you will additionally reference an
  issue if present)
- `refactor`: any code related change that is not a fix nor a feature
- `build`: all changes regarding the build of the software, changes to
  dependencies or the addition of new dependencies
- `test`: all changes regarding tests (adding new tests or changing existing
  ones)
- `ci`: all changes regarding the configuration of continuous integration (i.e.
  github actions, ci system)
- `chore`: all changes to the repository that do not fit into any of the above
  categories

  e.g. `feat(components): add new prop to the avatar component`

If you are interested in the detailed specification you can visit
https://www.conventionalcommits.org/ or check out the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines).

### Steps to PR

1. Fork of the starwind-ui repository and clone your fork

2. Create a new branch out of the `main` branch. We follow the convention
   `[type/scope]`. For example `fix/dropdown-hook` or `docs/menu-typo`. `type`
   can be either `docs`, `fix`, `feat`, `build`, or any other conventional
   commit type. `scope` is just a short id that describes the scope of work.

3. Make and commit your changes following the
   [commit convention](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md#commit-convention).
   As you develop, you can run `pnpm lint` and
   `pnpm build` e.g. `pnpm lint && pnpm build` to make sure everything works as expected.

4. Please note that you might have to run `git fetch origin main:master` (where
   origin will be your fork on GitHub).
