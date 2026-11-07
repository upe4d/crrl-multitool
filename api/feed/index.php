<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
function answer(int $code, array $data): never { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
try {
  $q=trim((string)($_GET['q']??'')); $lang=(string)($_GET['lang']??'ru'); $period=(string)($_GET['period']??'week'); $order=(string)($_GET['order']??'newest');
  $periods=['week'=>7,'month'=>30,'quarter'=>90,'any'=>null];
  if (!array_key_exists($period,$periods) || !in_array($lang,['ru','en'],true) || !in_array($order,['newest','relevance'],true) || mb_strlen($q)>200) throw new RuntimeException('Некорректные параметры поиска');
  $days=$periods[$period]; $queries=[$q];
  $items=[]; $failed=0;
  foreach ($queries as $query) {
    $params=['hl'=>$lang==='ru'?'ru-RU':'en-US','gl'=>$lang==='ru'?'RU':'US','ceid'=>$lang==='ru'?'RU:ru':'US:en']; if($query!=='')$params['q']=$query.($days?' when:'.$days.'d':''); $url='https://news.google.com/rss'.($query!==''?'/search':'').'?'.http_build_query($params);
    $context=stream_context_create(['http'=>['timeout'=>15,'header'=>"User-Agent: Mozilla/5.0\r\n",'follow_location'=>0],'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true]]);
    // Google иногда перенаправляет на канонический адрес. Разрешаем переходы только внутри Google News.
    $xml=false;
    for($redirect=0;$redirect<4;$redirect++) {
      $parts=parse_url($url);
      if(!$parts || strtolower($parts['scheme']??'')!=='https' || strtolower($parts['host']??'')!=='news.google.com' || isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port']!==443)) break;
      $http_response_header=[];
      $body=@file_get_contents($url,false,$context,0,2000001);
      $status=0;$location='';
      foreach($http_response_header as $header){if(preg_match('~^HTTP/\\S+\\s+(\\d{3})~i',$header,$match))$status=(int)$match[1];elseif(stripos($header,'Location:')===0)$location=trim(substr($header,9));}
      if(in_array($status,[301,302,303,307,308],true) && $location!==''){$url=str_starts_with($location,'/')?'https://news.google.com'.$location:$location;continue;}
      if($status===200 && is_string($body))$xml=$body;
      break;
    }
    if ($xml===false || $xml==='' || strlen($xml)>2000000) {$failed++;continue;}
    $doc=new DOMDocument(); $old=libxml_use_internal_errors(true); $ok=$doc->loadXML($xml,LIBXML_NONET); libxml_clear_errors(); libxml_use_internal_errors($old); if(!$ok) {$failed++;continue;}
    foreach ($doc->getElementsByTagName('item') as $item) {
      $get=static function(string $key) use($item): string {return trim($item->getElementsByTagName($key)->item(0)?->textContent??'');};
      $title=$get('title');$link=$get('link');$date=$get('pubDate');$stamp=strtotime($date);if(!str_starts_with($link,'https://news.google.com/'))continue;
      if($days && (!$stamp || $stamp<time()-$days*86400 || $stamp>time()+3600))continue;
      $items[]=['title'=>$title,'url'=>$link,'date'=>$date,'timestamp'=>$stamp?:0,'source'=>$get('source')];
    }
  }
  if($failed===count($queries))throw new RuntimeException('Google News недоступен');
  if($order==='newest')usort($items,static fn($a,$b)=>$b['timestamp']<=>$a['timestamp']);
  $filtered=0;$duplicates=0;$kept=[];$strict=($_GET['strict']??'0')==='1';$dedup=($_GET['dedup']??'0')==='1';
  foreach($items as $item){
    $norm=mb_strtolower(trim(preg_replace('/\s+-\s+[^-]+$/u','',$item['title'])));$dupe=null;
    if($dedup)foreach($kept as $i=>$existing){similar_text($norm,$existing['_norm'],$similar);if($item['url']===$existing['url'] || ($similar>=90 && mb_strlen($norm)>35)){$dupe=$i;break;}}
    if($dupe!==null){$duplicates++;$kept[$dupe]['related'][]=$item;continue;}$item['_norm']=$norm;$item['related']=[];$kept[]=$item;
  }
  foreach($kept as &$item)unset($item['_norm']);unset($item);
  answer(200,['items'=>$kept,'stats'=>['received'=>count($items),'filtered'=>$filtered,'duplicates'=>$duplicates,'failed_queries'=>$failed]]);
} catch(Throwable $e){answer(502,['error'=>'Не удалось получить ленту: '.$e->getMessage()]);}
