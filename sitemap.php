<?php
/* Elite Smart Hub sitemap (served as /sitemap.xml) */
header('Content-Type: application/xml; charset=utf-8');
$base = (((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') ? 'https' : 'http') . '://' . preg_replace('/[^a-z0-9.\-:]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost') . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
$t = @filemtime(__DIR__ . '/data/products.json') ?: time();
$pu = ''; $seen = [];
$pj = json_decode(@file_get_contents(__DIR__ . '/data/products.json'), true) ?: [];
foreach ($pj as $list) foreach ((array)$list as $x) { if (!empty($x['off'])) continue; $k = strtolower(trim($x['b'] ?? ($x['n'] ?? ''))); if ($k === '' || isset($seen[$k])) continue; $seen[$k] = 1; $pu .= '<url><loc>' . htmlspecialchars($base . 'product.html?s=' . rawurlencode($k)) . '</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>'; }
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' . htmlspecialchars($base) . '</loc><lastmod>' . date('Y-m-d', $t) . '</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url><url><loc>' . htmlspecialchars($base) . 'services.html</loc><changefreq>daily</changefreq><priority>0.9</priority></url>' . $pu . '</urlset>';
