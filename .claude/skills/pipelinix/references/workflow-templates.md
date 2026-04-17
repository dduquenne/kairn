# Workflow Templates — YAML Complets

Reference extraite de SKILL.md — Templates de workflows GitHub Actions prets a l emploi.

---

## Template de workflow app (ci-links.yml)

```yaml
name: CI Links
on:
  push:
    branches: [main, dev]
    paths:
      - 'src/**'
      - 'src/**'
      - 'pnpm-lock.yaml'
  pull_request:
    paths:
      - 'src/**'
      - 'src/**'

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Turborepo cache
        uses: actions/cache@v4
        with:
          path: node_modules/.cache
          key: pnpm-cache-\${{ runner.os }}-\${{ hashFiles('**/pnpm-lock.yaml') }}-\${{ github.sha }}
          restore-keys: |
            turbo-\${{ runner.os }}-\${{ hashFiles('**/pnpm-lock.yaml') }}-
            turbo-\${{ runner.os }}-

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test
```

---

## Workflow socle cross-app (ci-packages.yml)

```yaml
name: CI Packages (Socle)
on:
  push:
    branches: [main, dev]
    paths:
      - 'src/**'
  pull_request:
    paths:
      - 'src/**'

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-all-apps:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        # single app, no matrix needed

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      - name: Build \${{ matrix.app }}
        run: npm run build

      - name: Test \${{ matrix.app }}
        run: npm run test
```

---

## Quality gate composite

```yaml
name: Quality Gate
on:
  pull_request:
    branches: [main]

jobs:
  gate:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test, build, security-scan]
    if: always()
    steps:
      - name: Check all jobs passed
        run: |
          if [[ "\${{ needs.lint.result }}" != "success" ]] ||
             [[ "\${{ needs.typecheck.result }}" != "success" ]] ||
             [[ "\${{ needs.test.result }}" != "success" ]] ||
             [[ "\${{ needs.build.result }}" != "success" ]]; then
            echo "Quality gate FAILED"
            exit 1
          fi
          echo "Quality gate PASSED"
```

---

## Reusable workflow pour les apps

```yaml
# .github/workflows/reusable-app-ci.yml
name: Reusable App CI
on:
  workflow_call:
    inputs:
      app-name:
        required: true
        type: string
      run-e2e:
        required: false
        type: boolean
        default: false

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npm run build
      - run: npm run test
      - name: E2E tests
        if: inputs.run-e2e
        run: npm run test:e2e
```

---

## Appel d un reusable workflow depuis une app

```yaml
# .github/workflows/ci-links.yml
name: CI Links
on:
  push:
    paths: ['src/**', 'src/**']

jobs:
  ci:
    uses: ./.github/workflows/reusable-app-ci.yml
    with:
      app-name: links
      run-e2e: \${{ github.ref == 'refs/heads/main' }}
    secrets: inherit
```

---

## Jobs paralleles (lint, typecheck, test, build)

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  typecheck:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    runs-on: ubuntu-latest
    steps: [...]

  build:
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps: [...]
```
