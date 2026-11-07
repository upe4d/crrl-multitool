<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require __DIR__.'/lib.php';
function rss_answer(int $status,array $data): never {http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
try{
    if($_SERVER['REQUEST_METHOD']!=='POST')rss_answer(405,['error'=>'Используйте POST']);
    $raw=file_get_contents('php://input',false,null,0,20001);if($raw===false||strlen($raw)>20000)throw new RuntimeException('Слишком большой запрос');
    $data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);$urls=$data['urls']??null;
    if(!is_array($urls)||count($urls)<1||count($urls)>6)throw new RuntimeException('Выберите от одного до шести источников');
    foreach($urls as $url)if(!is_string($url))throw new RuntimeException('Некорректный адрес');
    $GLOBALS['rssDeadline']=microtime(true)+24;
    $items=[];$sources=[];$errors=[];
    foreach(array_unique($urls) as $url){if(!is_string($url))throw new RuntimeException('Некорректный адрес');try{$feed=rss_discover(trim($url));$sources[]=['title'=>$feed['title'],'url'=>$feed['url']];$items=array_merge($items,$feed['items']);}catch(Throwable $e){$errors[]=['url'=>mb_substr($url,0,200),'message'=>$e->getMessage()];}}
    usort($items,static fn($a,$b)=>$b['timestamp']<=>$a['timestamp']);$seen=[];$kept=[];$duplicates=0;
    foreach($items as $item){$key=mb_strtolower(preg_replace('/\s+/u',' ',trim($item['title'])));if(isset($seen[$item['url']])||isset($seen['title:'.$key])){$duplicates++;continue;}$seen[$item['url']]=true;$seen['title:'.$key]=true;$kept[]=$item;}
    rss_answer(200,['sources'=>$sources,'items'=>$kept,'errors'=>$errors,'stats'=>['received'=>count($items),'duplicates'=>$duplicates]]);
}catch(Throwable $e){rss_answer(400,['error'=>$e instanceof JsonException?'Некорректный JSON':$e->getMessage()]);}
