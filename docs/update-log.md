# Update Log

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
