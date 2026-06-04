import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const serverRoot = path.join(workspaceRoot, 'academy-server');
const distRoot = path.join(workspaceRoot, 'dist');
const rootHtaccessContent = `<IfModule mod_authz_core.c>
  <FilesMatch "^\\.">
    Require all denied
  </FilesMatch>
</IfModule>

<IfModule !mod_authz_core.c>
  <FilesMatch "^\\.">
    Order allow,deny
    Deny from all
  </FilesMatch>
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule (^|/)academy-data(/|$) - [F,L]

  RewriteCond %{HTTP_HOST} ^academy\\.digrro\\.com$ [NC]
  RewriteCond %{REQUEST_URI} !^/academy(/|$) [NC]
  RewriteRule ^(.*)$ academy/$1 [L]

  # Allow direct access to PHP API files
  RewriteCond %{REQUEST_URI} ^/academy/api/.*\\.php$ [NC]
  RewriteRule ^(.*)$ - [L]
</IfModule>
`;
const academyHtaccessContent = `DirectoryIndex index-live.html index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Don't rewrite API requests or existing files/directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/academy/api/ [NC]

  RewriteRule ^$ index-live.html [L]
  RewriteRule ^index\\.html$ index-live.html [L]
</IfModule>

# Ensure PHP files are served correctly
<FilesMatch \\.php$>
  Allow from all
</FilesMatch>
`;

async function main() {
  await mkdir(path.join(distRoot, 'academy', 'api'), { recursive: true });
  await mkdir(path.join(distRoot, 'academy-data'), { recursive: true });
  await writeFile(path.join(distRoot, '.htaccess'), rootHtaccessContent, 'utf8');
  await cp(
    path.join(distRoot, 'academy', 'index.html'),
    path.join(distRoot, 'academy', 'index-live.html'),
    { force: true },
  );
  await writeFile(
    path.join(distRoot, 'academy', '.htaccess'),
    academyHtaccessContent,
    'utf8',
  );

  await cp(path.join(serverRoot, 'api'), path.join(distRoot, 'academy', 'api'), {
    recursive: true,
    force: true
  });

  await cp(path.join(serverRoot, 'academy-data'), path.join(distRoot, 'academy-data'), {
    recursive: true,
    force: true
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
