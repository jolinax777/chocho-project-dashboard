# Update Log

## 2026-06-10 - Stabilize PWA build workflow

- Confirmed `package.json` already includes `chart.js` in dependencies.
- Confirmed `vite.config.js` keeps the GitHub Pages base path as `/chocho-project-dashboard/`.
- Kept dependency installation on `npm install` because the repository does not currently include `package-lock.json`; switching to `npm ci` would fail without a lockfile.
- Updated the GitHub Pages workflow so pull requests to `main` run the build job for validation.
- Limited Pages artifact upload and deploy steps to non-PR events so PR validation does not deploy.
