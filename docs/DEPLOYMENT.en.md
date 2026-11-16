# Hosting Multitool

[Project overview](../README.en.md) · [Русский](DEPLOYMENT.ru.md)

The repository contains prepared browser builds and PHP files. Standard deployment does not require Node.js or rebuilding the integrated applications. Additional backend services are configured separately.

## Base installation

1. Download the repository or run `git clone https://github.com/upe4d/crrl-multitool.git`.
2. Place its contents at the root of a dedicated HTTPS domain. Absolute paths such as `/reference/` and `/tancn/` do not support an unchanged subdirectory installation.
3. Use PHP 8.1 or newer with `mbstring`, `dom`, `json` and `openssl`. PHP source requests need outbound HTTPS, `allow_url_fopen` and a valid certificate trust store.
4. Configure PrivateBin and the storage directories below. On shared hosting, set environment variables using the control panel or change the relevant PHP defaults.
5. Check HTTP headers and each required module. Serving a static page does not establish that its backend functions are configured.

## Instance data

| Module | Setting | Storage |
| --- | --- | --- |
| Favorites and profiles | `MULTITOOL_ACCOUNTS_DIR`, [api/favorites/index.php](../api/favorites/index.php) | Defaults to `/var/lib/multitool-accounts`. Use a separate directory outside the document root, writable by PHP. |
| Catalog click counts | `MULTITOOL_STATS_DIR`, [directions/stats.php](../directions/stats.php) | Defaults to `/var/lib/multitool-stats`. Use a separate directory outside the document root, writable by PHP. |
| TANCN component registry | `TANCN_REGISTRY_DIR`, [tancn/registry.php](../tancn/registry.php) | Defaults to `/var/lib/multitool-tancn/registry`. Use a separate directory outside the document root, writable by PHP. |
| PrivateBin notes | `n/cfg/conf.php`, `n/data/` | Instance configuration and data are excluded from Git. Create configuration for your installation using the [PrivateBin documentation](https://github.com/PrivateBin/PrivateBin/wiki/Configuration). |

The web server must deny direct access to `n/cfg/` and `n/data/`. Included `.htaccess` files target Apache with overrides enabled. Nginx does not read these files: equivalent access restrictions must be present in the site configuration. Public access is not a substitute for fixing PHP filesystem permissions.

A running-instance backup needs application files and its separate data directories. The GitHub repository does not contain user notes, profiles or keys.

## Domain and code execution

- The Origin check and generated CLI URL in `tancn/registry.php` use `https://tools.crrl.ru`. Change both bindings to your HTTPS domain before enabling the registry. Explicitly published components remain available for 24 hours.
- The execution environment needs `Access-Control-Allow-Origin: *` on public static resources under `/code-playground/`. Scope this rule to public files; do not apply it to PHP APIs or user data.
- Preserve JavaScript, WebAssembly and JSON content types. A host that blocks runtime or Worker downloads may display the editor while failing to execute code.
- Selected runtimes, models and libraries download resources on first use. Installing the PWA does not make every utility available offline.

## Additional services

| Capability | Requirement |
| --- | --- |
| ReClip and organization search | Separate backend applications and routes. Copying the PHP package does not start them. |
| Server-side document and media conversion | Configured backend processes and programs such as LibreOffice or FFmpeg. Browser operations have separate limits. |
| AI drafts and TANCN generation | A separately configured provider or local model. Keep API keys out of published client code. |
| DashBeam | Network relay access. The web client is not equivalent to direct connectivity in the desktop application. |

## Post-deployment checks

Open the home page, search, favorites, a cheat sheet and TANCN. Execute a short code example, create a test note, open its link and inspect the site on a phone. Verify that PrivateBin configuration and data cannot be read directly over HTTP. Checks of the CRRL production site do not validate another installation.

Preserve the licenses and source archives in the [component list](THIRD_PARTY.md). The original [installation notes in Russian](../README-ПЕРЕД-УСТАНОВКОЙ.txt) describe additional package limits.
