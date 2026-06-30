export const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml`;

export const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

export const logoSocialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="-20 -20 140 140" fill="none">
    <!-- Solid Dark Background with Rounded Corners -->
    <rect x="-20" y="-20" width="140" height="140" fill="#080A12" rx="28"/>
    <!-- Logo SVG -->
    <path d="M 50 10 L 70 50 L 90 50 L 90 60 L 75 60 L 55 50 L 50 40 L 45 50 L 25 60 L 10 60 L 10 50 L 30 50 Z M 22.5 65 L 42.5 55 L 57.5 55 L 77.5 65 L 90 90 L 75 90 L 62.5 65 L 37.5 65 L 25 90 L 10 90 Z" fill="white"/>
</svg>`;

export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="-20 -20 140 140" fill="none">
    <rect x="-20" y="-20" width="140" height="140" fill="#080A12" rx="28"/>
    <path d="M 50 10 L 70 50 L 90 50 L 90 60 L 75 60 L 55 50 L 50 40 L 45 50 L 25 60 L 10 60 L 10 50 L 30 50 Z M 22.5 65 L 42.5 55 L 57.5 55 L 77.5 65 L 90 90 L 75 90 L 62.5 65 L 37.5 65 L 25 90 L 10 90 Z" fill="white"/>
</svg>`;
