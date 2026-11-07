<?php
// Небольшая проверка разбора лент и запрета внутренних адресов.
if (!function_exists('rss_parse')) require __DIR__.'/../api/rss/lib.php';
$feed = '<rss version="2.0"><channel><title>Test</title><item><title>Первая</title><link>https://example.com/a</link><pubDate>Mon, 02 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>';
$a = rss_parse($feed, 'https://example.com/rss');
if (count($a['items']) !== 1 || $a['items'][0]['title'] !== 'Первая') exit(1);
$atom = '<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><title>Новость</title><link href="/story"/><updated>2026-11-02T12:00:00Z</updated></entry></feed>';
$b = rss_parse($atom, 'https://example.com/feed');
if (($b['items'][0]['url'] ?? '') !== 'https://example.com/story') exit(2);
foreach (['127.0.0.1','10.1.2.3','169.254.169.254','100.64.0.1','192.168.1.1'] as $ip) if (rss_public_ip($ip)) exit(3);
try { rss_url('http://127.0.0.1/'); exit(4); } catch (Throwable $e) {}
try { rss_parse('<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><rss><channel><title>&xxe;</title></channel></rss>', 'https://example.com'); exit(5); } catch (Throwable $e) {}
echo "RSS, Atom, IP, XXE: OK\n";
