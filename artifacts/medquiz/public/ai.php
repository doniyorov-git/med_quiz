<?php
// MedQuiz AI proxy. The API key never reaches the browser.
// Setup: copy ai-config.sample.php -> ai-config.php and put your key in it.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function fail(int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');
$cfgFile = __DIR__ . '/ai-config.php';
if (!is_file($cfgFile)) fail(503, 'ai-config.php topilmadi');
$cfg = require $cfgFile;
if (empty($cfg['api_key'])) fail(503, 'API kalit sozlanmagan');

$raw = file_get_contents('php://input');
if (strlen($raw) > 14 * 1024 * 1024) fail(413, 'Juda katta so‘rov');
$in = json_decode($raw, true);
if (!is_array($in) || empty($in['messages']) || !is_array($in['messages'])) fail(400, 'Noto‘g‘ri so‘rov');

// very small per-IP rate limit (30 requests / 10 min)
$ip = preg_replace('/[^0-9a-f:.]/i', '', $_SERVER['REMOTE_ADDR'] ?? 'x');
$rl = sys_get_temp_dir() . '/medquiz_ai_' . md5($ip);
$hits = is_file($rl) ? array_filter(array_map('intval', explode(',', (string)@file_get_contents($rl))), fn($t) => $t > time() - 600) : [];
if (count($hits) >= ($cfg['rate_limit'] ?? 30)) fail(429, 'Ko‘p so‘rov yuborildi, biroz kuting');
$hits[] = time();
@file_put_contents($rl, implode(',', $hits));

$name = mb_substr((string)($in['user']['name'] ?? ''), 0, 60);
$system = "Sen MedQuiz ilovasining yordamchisi Pufi'san. Tibbiyot talabalariga do'stona, qisqa va aniq javob ber. "
    . "Foydalanuvchi qaysi tilda yozsa, shu tilda javob ber (asosan o'zbekcha). Tibbiy ma'lumotni o'quv maqsadida tushuntir; "
    . "shaxsiy tashxis yoki davolash buyurma, kerak bo'lsa shifokorga murojaat qilishni eslat. Emoji'ni me'yorida ishlat."
    . ($name !== '' ? " Foydalanuvchi ismi: $name." : '');

$messages = [];
foreach (array_slice($in['messages'], -12) as $m) {
    $role = ($m['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
    $text = mb_substr((string)($m['content'] ?? ''), 0, 8000);
    if ($text === '') continue;
    $messages[] = ['role' => $role, 'content' => [['type' => 'text', 'text' => $text]]];
}
if (!$messages) fail(400, 'Bo‘sh xabar');

// attach files to the last user message
$last = count($messages) - 1;
if ($messages[$last]['role'] !== 'user') fail(400, 'Oxirgi xabar foydalanuvchidan bo‘lishi kerak');
foreach (array_slice($in['attachments'] ?? [], 0, 4) as $a) {
    $data = (string)($a['data'] ?? '');
    $fname = mb_substr((string)($a['name'] ?? 'fayl'), 0, 80);
    if (($a['kind'] ?? '') === 'image' && preg_match('#^data:(image/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$#', $data, $mm)) {
        $messages[$last]['content'][] = ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $mm[1], 'data' => $mm[2]]];
    } elseif (($a['kind'] ?? '') === 'text' && $data !== '') {
        $messages[$last]['content'][] = ['type' => 'text', 'text' => "[Fayl: $fname]\n" . mb_substr($data, 0, 20000)];
    }
}

$payload = [
    'model' => $cfg['model'] ?? 'claude-sonnet-5-5',
    'max_tokens' => (int)($cfg['max_tokens'] ?? 1200),
    'system' => $system,
    'messages' => $messages,
];

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_HTTPHEADER => [
        'content-type: application/json',
        'x-api-key: ' . $cfg['api_key'],
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
]);
$res = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($res === false) fail(502, 'AI serverga ulanib bo‘lmadi: ' . $err);
$j = json_decode($res, true);
if ($status < 200 || $status >= 300 || !is_array($j)) fail(502, 'AI xatosi (' . $status . ')');
$reply = '';
foreach (($j['content'] ?? []) as $block) {
    if (($block['type'] ?? '') === 'text') $reply .= $block['text'];
}
if (trim($reply) === '') fail(502, 'AI bo‘sh javob qaytardi');
echo json_encode(['reply' => trim($reply)], JSON_UNESCAPED_UNICODE);
