# CI/CD

How continuous integration and delivery work in this monorepo. CI and CD are **two separate
workflows** that never run in the same event: [`pr-checks.yml`](../.github/workflows/pr-checks.yml)
gates a pull request, [`release-deploy.yml`](../.github/workflows/release-deploy.yml) runs after a
merge to `main`. Shared setup lives in [`.github/actions`](../.github/actions).

## At a glance

| Workflow | Trigger | What it does |
|---|---|---|
| [`pr-checks.yml`](../.github/workflows/pr-checks.yml) | PR → `main` | validate → security → build (images built, not pushed) |
| [`release-deploy.yml`](../.github/workflows/release-deploy.yml) | push → `main`, manual dispatch | validate → security → build → release → deploy |
| [`codeql.yml`](../.github/workflows/codeql.yml) | weekly cron | Scheduled CodeQL scan (shares [`_codeql.yml`](../.github/workflows/_codeql.yml) with both workflows above) |

Docs-only changes (`docs/**`, `**/*.md`) are skipped. Azure provisioning: [deploy-azure.md](deploy-azure.md).

## The workflows

Both workflows chain their jobs with `needs:`, so **nothing builds/releases/deploys unless every
prior stage passed**. `pr-checks.yml` stops after `build` (no push, release, or deploy);
`release-deploy.yml` runs the full chain end to end.

```mermaid
flowchart LR
  PR[/"PR → main"/]
  PUSH[/"push → main"/]
  CRON[/"weekly cron"/]

  subgraph PRC["pr-checks.yml"]
    direction LR
    PVALIDATE["validate<br/>pnpm check"]
    PSECURITY["security<br/>CodeQL"]
    PBUILD["build<br/>client + server images<br/>(no push)"]
    PVALIDATE --> PBUILD
    PSECURITY --> PBUILD
  end

  subgraph RD["release-deploy.yml"]
    direction LR
    VALIDATE["validate<br/>pnpm check"]
    SECURITY["security<br/>CodeQL"]
    BUILD["build<br/>client + server images"]
    RELEASE["release<br/>semantic-release"]
    DEPLOY["deploy<br/>Azure Container Apps"]
    VALIDATE --> BUILD
    SECURITY --> BUILD
    BUILD --> RELEASE --> DEPLOY
  end

  PR --> PRC
  PUSH --> RD
  CRON --> WEEKLY["codeql.yml<br/>weekly scan"]

  BUILD -. push .-> GHCR[("ghcr.io/OWNER/REPO/{client,server}")]
  SECURITY -. results .-> SEC[("Security tab")]
  RELEASE -. "tag + notes" .-> REL[("GitHub Release")]
  DEPLOY -. rolls .-> AZ[("Azure Container Apps")]
```

### Stages

1. **validate** — `pnpm check` across the workspace: client (Biome + `tsc` + rstest), server
   (Biome + `tsc --noEmit` + unit tests), storybook (build). No database required. Runs in both
   workflows (each is self-contained; a PR run and the post-merge run are independent).
2. **security** — CodeQL (`javascript-typescript`, `build-mode: none`) via the reusable
   [`_codeql.yml`](../.github/workflows/_codeql.yml). Runs in parallel with `validate`; results land
   in the **Security → Code scanning** tab. Excluded paths live in
   [`.github/codeql/codeql-config.yml`](../.github/codeql/codeql-config.yml).
3. **build** — `needs: [validate, security]`. Matrix over `client` and `server`; each
   [Dockerfile](../apps/server/Dockerfile) builds from the **monorepo root** context and uses
   `pnpm fetch` + `pnpm deploy` for a lean, self-contained runtime. **In `pr-checks.yml`** the images
   are built only (verifies the Dockerfiles, safe for forks, no registry login). **In
   `release-deploy.yml`** they are pushed to `ghcr.io/<owner>/<repo>/{client,server}`, tagged
   `sha-<commit>` and `latest`, with `type=gha` layer caching.
4. **release** — `needs: build`, **`release-deploy.yml` only**.
   `pnpm --filter @e-commerce/server semantic-release` reads conventional commits and, when there is
   something to release, updates `apps/server/CHANGELOG.md`, commits it back with
   `chore(release): <version> [skip ci]` (the `[skip ci]` avoids a loop), and creates the git tag +
   GitHub Release. GitHub Releases only, no npm publish. Config:
   [`apps/server/.releaserc`](../apps/server/.releaserc).
5. **deploy** — `needs: release`, **`release-deploy.yml` only**. `azure/login@v3` authenticates via
   **OIDC** (no long-lived secrets), then `azure/cli@v3` rolls each Container App to `:latest`
   (server first, then client). Uses the `production` environment.

### Required secrets / variables (deploy)

- **Secrets:** `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
- **Variables:** `AZURE_RESOURCE_GROUP`, `AZURE_SERVER_APP`, `AZURE_CLIENT_APP`.
- A repo **environment** named `production`.

See [deploy-azure.md](deploy-azure.md) for how these are created.

## Weekly security scan

[`codeql.yml`](../.github/workflows/codeql.yml) runs only on a weekly cron and calls the same
reusable [`_codeql.yml`](../.github/workflows/_codeql.yml) that `pr-checks.yml` and
`release-deploy.yml` use, so PR/push scans and the scheduled scan stay in sync.

## Shared building blocks

| Piece | Purpose |
|---|---|
| [`actions/setup`](../.github/actions/setup/action.yml) | Install pnpm, then Node (pnpm cache), then `pnpm install --frozen-lockfile`. Used by `validate` and `release` in both workflows. |
| [`_codeql.yml`](../.github/workflows/_codeql.yml) | Reusable CodeQL analysis, called by each workflow's `security` job. |

**pnpm ordering matters:** `pnpm/action-setup` runs *before* `setup-node`, otherwise `cache: pnpm`
can't find the binary. The pnpm version is read from the root `package.json` `packageManager` field.

## Conventions

- **Node 24.18** (pinned in the setup action and the Dockerfiles), **pnpm** via `packageManager`.
- **Action versions** pinned to current majors: `checkout@v7`, `setup-node@v6`,
  `pnpm/action-setup@v6`, `codeql-action@v4`, `docker/*` (buildx@v4, login@v4, metadata@v6,
  build-push@v7), `azure/login@v3`, `azure/cli@v3`.
- **Conventional commits** drive releases (Angular preset): `feat:` → minor, `fix:` → patch,
  `refactor:`/`style:`/`docs(README):` → patch, `BREAKING CHANGE:` → major.

## Reproduce locally

```bash
pnpm check                                                       # the validate stage
docker build -f apps/server/Dockerfile -t e-commerce-server .    # server image (root context)
docker build -f apps/client/Dockerfile -t e-commerce-client .    # client image (root context)
docker compose -f apps/server/docker-compose.yml build app       # same via compose
```

## Current state and limitations

- **`main` is unprotected (by design, for now).** The `release` stage pushes the CHANGELOG/tag commit
  straight to `main` using `GITHUB_TOKEN`. If branch protection that blocks direct pushes is added,
  the release push needs a bypass (or drop the `@semantic-release/git` plugin so it only tags +
  releases, no in-repo CHANGELOG commit).
- **No DB/e2e gate yet.** The server's Cucumber e2e + `dbmate` migrations (need Postgres) and the
  client's Playwright e2e are not wired into the pipeline.
- **Deploy uses `:latest`.** Fine for a single-environment setup; switch to image digests for fully
  immutable rollouts.

## Leftover cleanup (not urgent)

`apps/server/client` (`@marcoturi/fastify-boilerplate`) and the `@semantic-release/npm` /
`@semantic-release/exec` devDependencies are no longer used; template residue that can be removed
separately.
