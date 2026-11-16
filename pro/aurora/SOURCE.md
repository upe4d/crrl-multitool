# Aurora OS.js in Multitool

Upstream: https://github.com/mental-os/Aurora-OS.js
Commit: 599b454fc2ceeb5b3ef0de470c094171006ff2bc
Version: 0.8.5
License: AGPL-3.0 (see LICENSE).

Multitool adaptation, 2026-11-16:
- Default locale for new users is ru-RU; saved locale retains priority.
- Manifest uses a relative path for installation below /pro/aurora/app/.
- ScreenGuard accepts landscape viewports from 1024x540; small-screen help is in Russian.
- Independent Multitool navigation and help are outside the application.

Build this exact application:
1. Install Node.js >=24.
2. npm ci --ignore-scripts
3. npm run build
4. Serve dist/ as static files.

The source archive includes all tracked upstream files, the three modified source files and this notice. No node_modules or local configuration is required in the archive.
