// scripts/post-web-export.js
// Runs after `expo export --platform web` to:
//   1. Generate dist/manifest.json with correct PWA icons
//   2. Inject PWA meta tags + service worker into dist/index.html
//   3. Copy public/service-worker.js to dist/

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found. Run `npx expo export --platform web` first.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 1. Write manifest.json
// -----------------------------------------------------------------------------
const manifest = {
  name: 'Huddle',
  short_name: 'Huddle',
  description: 'Find, join, and host local pickup sports games',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#F56A00',
  background_color: '#F7F5F0',
  lang: 'en',
  icons: [
    {
      src: '/assets/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/assets/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/assets/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

fs.writeFileSync(
  path.join(distDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('✅ Created dist/manifest.json');

// -----------------------------------------------------------------------------
// 2. Copy icons into dist/assets/ so they're deployed
// -----------------------------------------------------------------------------
// Expo web export copies `assets/` automatically, but let's make sure the
// icons we need are present with the exact names the manifest references.

const ASSETS_TO_COPY = [
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'favicon.png',
  'favicon-96x96.png',
];

const srcAssetsDir = path.join(projectRoot, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
}

for (const filename of ASSETS_TO_COPY) {
  const src = path.join(srcAssetsDir, filename);
  const dest = path.join(distAssetsDir, filename);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${filename} to dist/assets/`);
  } else {
    console.warn(`⚠️  Missing: ${filename} (skipped)`);
  }
}

// -----------------------------------------------------------------------------
// 3. Copy service worker
// -----------------------------------------------------------------------------
const swSrc = path.join(projectRoot, 'public', 'service-worker.js');
const swDst = path.join(distDir, 'service-worker.js');

if (fs.existsSync(swSrc)) {
  fs.copyFileSync(swSrc, swDst);
  console.log('✅ Copied service-worker.js to dist/');
} else {
  console.warn('⚠️  public/service-worker.js not found — skipping');
}

// -----------------------------------------------------------------------------
// 4. Inject PWA tags into index.html
// -----------------------------------------------------------------------------
let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('rel="manifest"')) {
  const pwaTags = `
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/assets/favicon-96x96.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />

    <!-- iOS PWA -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Huddle" />

    <!-- Android / generic PWA -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="Huddle" />

    <!-- Service Worker -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker
            .register('/service-worker.js')
            .then(function (reg) { console.log('SW registered:', reg.scope); })
            .catch(function (err) { console.warn('SW registration failed:', err); });
        });
      }
    </script>
  `;

  html = html.replace('</head>', pwaTags + '</head>');
  fs.writeFileSync(indexPath, html);
  console.log('✅ Injected PWA tags into dist/index.html');
} else {
  console.log('ℹ️  PWA tags already present — skipping injection');
}

console.log('🚀 PWA post-export complete');