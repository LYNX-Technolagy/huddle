// scripts/post-web-export.js
// Runs after `expo export --platform web` to:
//   1. Generate dist/manifest.json (Expo doesn't do this for classic setups)
//   2. Inject PWA meta tags + service worker registration into dist/index.html
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
      src: '/assets/icon.png',
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any',
    },
  ],
};

fs.writeFileSync(
  path.join(distDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('✅ Created dist/manifest.json');

// -----------------------------------------------------------------------------
// 2. Copy service worker
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
// 3. Inject PWA tags into index.html
// -----------------------------------------------------------------------------
let html = fs.readFileSync(indexPath, 'utf8');

// Guard against running twice
if (!html.includes('rel="manifest"')) {
  const pwaTags = `
    <!-- PWA -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Huddle" />
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