# Update Log

## 2026-06-10 - Extract constants and data utilities

- Branch: `refactor/extract-constants-data-utils`
- Modified files:
  - `src/App.jsx`
  - `src/constants.js`
  - `src/dataUtils.js`
  - `docs/update-log.md`
- Reason:
  - Reduce `src/App.jsx` complexity by moving UI-independent constants and data helper functions into focused modules.
  - Keep UI components, JSX structure, CSS classes, API behavior, and data mapping results unchanged.
- Build and dependency notes:
  - No package, lockfile, API config, CSS, or workflow changes.
  - `getDashboardData`, `buildCategoriesFromTasks`, `getTaskStatus`, and `getGroupKey` were moved without logic changes.
- Testing / GitHub Actions status:
  - Local `npm run build` was not available because the current environment has no usable `npm` command.
  - GitHub Actions run `27273932291` completed successfully, including `npm ci` and `npm run build`.
  - A follow-up documentation-only commit may trigger a final PR build; check the latest PR status before merge.
- Frontend / deployment impact:
  - No intended UI, API, deployment, or data format changes.
  - Main risk is import/export wiring after moving code; the PR build passed for the refactor commit.

## 2026-06-10 - Improve build and loading stability

- Branch: `fix/improve-build-and-loading-stability`
- Modified files:
  - `package-lock.json`
  - `.github/workflows/deploy.yml`
  - `src/App.jsx`
  - `docs/update-log.md`
- Reason:
  - Add a committed npm lockfile so CI installs are reproducible.
  - Switch GitHub Actions dependency installation from `npm install` to `npm ci` now that a lockfile exists.
  - Add minimal `loadData` protection so an unexpected data-loading exception does not leave the UI stuck in loading state.
- Build and dependency notes:
  - `package.json` dependencies were not changed.
  - `package-lock.json` was generated from the current `package.json` on GitHub Actions using Node 20.
  - `npm ci` is preferred in CI because it installs exactly from `package-lock.json`, fails when the lockfile is out of sync, and avoids silently changing dependency resolution during builds.
- Testing / GitHub Actions status:
  - Local `npm run build` was not available because the current environment has no usable `npm` command.
  - GitHub Actions run `27272508183` generated and committed `package-lock.json`, installed dependencies, and completed `npm run build` successfully.
  - GitHub Actions run `27272736329` applied the loading guard from the runner and completed `npm run build` successfully.
  - A final PR build with `npm ci` is expected after this workflow update.
- Frontend / deployment impact:
  - No UI layout or feature changes.
  - Data loading errors now clear the loading state and continue using the existing error banner path.
  - GitHub Pages deployment remains skipped for PRs and enabled for `main` pushes / manual dispatch.

## 2026-06-10 - Stabilize PWA build workflow

- Branch: `fix/stabilize-pwa-build`
- Modified files:
  - `.github/workflows/deploy.yml`
  - `docs/update-log.md`
- Reason:
  - Stabilize build verification for the GitHub Pages PWA without changing frontend behavior.
  - Allow pull requests to run the build job before merge.
  - Keep deployment limited to non-PR events.
- Build and dependency notes:
  - Confirmed `package.json` already includes `chart.js` in dependencies.
  - Confirmed `vite.config.js` keeps the GitHub Pages base path as `/chocho-project-dashboard/`.
  - Confirmed the repository does not currently include `package-lock.json`.
  - Kept dependency installation on `npm install` because switching to `npm ci` would fail without a lockfile.
- Testing / GitHub Actions status:
  - Local `npm run build` was not available because the current environment has no usable `npm` command.
  - GitHub Actions run `27269620369` completed successfully.
  - The PR build job completed successfully, including dependency install and `npm run build`.
  - The PR deploy job was skipped as intended.
- Frontend / deployment impact:
  - No UI or runtime feature changes.
  - Pull requests now validate build without deploying.
  - GitHub Pages deployment remains tied to `main` pushes or manual workflow dispatch.