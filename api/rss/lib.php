<?php
declare(strict_types=1);

// Непубличные адреса исключаются до подключения, а DNS фиксируется для каждого запроса.
function rss_public_ip(string $ip): bool {
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return false;
    $n=ip2long($ip);
    foreach ([['0.0.0.0',8],['100.64.0.0',10],['192.0.0.0',24],['192.0.2.0',24],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as [$base,$bits]) {
        $mask=(-1 << (32-$bits)); if (($n & $mask)===(ip2long($base) & $mask)) return false;
    }
    return true;
}
function rss_url(string $url): array {
    if (strlen($url)>2048 || preg_match('/[\x00-\x20\x7f]/',$url)) throw new RuntimeException('Некорректный адрес');
    $p=parse_url($url);
    if (!$p || !in_array(strtolower($p['scheme']??''),['http','https'],true) || empty($p['host']) || isset($p['user']) || isset($p['pass'])) throw new RuntimeException('Укажите адрес сайта или RSS с http:// или https://');
    $host=strtolower($p['host']); $scheme=strtolower($p['scheme']); $port=$p['port']??($scheme==='https'?443:80);
    if (($scheme==='https' && $port!==443) || ($scheme==='http' && $port!==80) || strlen($host)>253 || filter_var($host,FILTER_VALIDATE_IP) || !preg_match('/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/D',$host)) throw new RuntimeException('Адрес источника недоступен');
    $records=@dns_get_record($host,DNS_A); $ips=[];
    foreach ($records?:[] as $record) if (isset($record['ip'])) {if(!rss_public_ip($record['ip'])) throw new RuntimeException('Локальные и служебные адреса запрещены');$ips[]=$record['ip'];}
    if (!$ips) throw new RuntimeException('Не удалось определить адрес сайта');
    return [$scheme,$host,$port,$ips[0]];
}
function rss_absolute(string $base,string $url): string {
    $url=trim(html_entity_decode($url,ENT_QUOTES|ENT_HTML5,'UTF-8'));
    if ($url==='' || preg_match('/[\x00-\x20\x7f]/',$url)) return '';
    if (preg_match('~^https?://~i',$url)) return $url;
    if (str_starts_with($url,'//')) return (parse_url($base,PHP_URL_SCHEME)?:'https').':'.$url;
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i',$url)) return '';
    $p=parse_url($base);if(!$p||empty($p['host']))return '';
    $origin=$p['scheme'].'://'.$p['host'].(isset($p['port'])?':'.$p['port']:'');
    if(str_starts_with($url,'/'))return $origin.$url;
    if(str_starts_with($url,'?'))return $origin.($p['path']??'/').$url;
    $dir=preg_replace('~/[^/]*$~','/',$p['path']??'/');$parts=[];
    foreach(explode('/',$dir.$url) as $part){if($part==='..')array_pop($parts);elseif($part!=='' && $part!=='.')$parts[]=$part;}
    return $origin.'/'.implode('/',$parts);
}
function rss_fetch(string $url): array {
    for($i=0;$i<4;$i++){
        if(microtime(true)>=($GLOBALS['rssDeadline']??INF))throw new RuntimeException('Превышено время ожидания');
        [$scheme,$host,$port,$ip]=rss_url($url);$body='';$location='';$overflow=false;
        $c=curl_init($url);
        curl_setopt_array($c,[CURLOPT_RETURNTRANSFER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>min(7,max(1,(int)(($GLOBALS['rssDeadline']??(microtime(true)+7))-microtime(true)))),CURLOPT_PROXY=>'',CURLOPT_USERAGENT=>'Mozilla/5.0 (compatible; MultitoolRSS/1.0)',CURLOPT_RESOLVE=>[$host.':'.$port.':'.$ip],CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_ENCODING=>'',CURLOPT_PROTOCOLS=>CURLPROTO_HTTP|CURLPROTO_HTTPS,
            CURLOPT_HEADERFUNCTION=>static function($ch,$line)use(&$location){if(stripos($line,'location:')===0)$location=trim(substr($line,9));return strlen($line);},
            CURLOPT_WRITEFUNCTION=>static function($ch,$chunk)use(&$body,&$overflow){if(strlen($body)+strlen($chunk)>2000000){$overflow=true;return 0;}$body.=$chunk;return strlen($chunk);}]);
        $ok=curl_exec($c);$status=curl_getinfo($c,CURLINFO_RESPONSE_CODE);curl_close($c);
        if($overflow)throw new RuntimeException('Источник превышает 2 МБ');
        if($status>=300 && $status<400 && $location!==''){$url=rss_absolute($url,$location);if(!$url)throw new RuntimeException('Некорректное перенаправление');continue;}
        if($ok===false || $status!==200)throw new RuntimeException('Источник недоступен');
        return [$body,$url];
    }
    throw new RuntimeException('Слишком много перенаправлений');
}
function rss_parse(string $xml,string $url): array {
    if (stripos($xml,'<!DOCTYPE')!==false) throw new RuntimeException('Неподдерживаемый формат ленты');
    $doc=new DOMDocument();$old=libxml_use_internal_errors(true);$ok=$doc->loadXML($xml,LIBXML_NONET|LIBXML_NOERROR|LIBXML_NOWARNING);libxml_clear_errors();libxml_use_internal_errors($old);
    if(!$ok || !$doc->documentElement) return [];
    $xp=new DOMXPath($doc);$root=strtolower($doc->documentElement->localName);
    if(!in_array($root,['rss','rdf','feed'],true))return [];
    $title=trim($xp->query('/*[local-name()="feed"]/*[local-name()="title"] | /*/*[local-name()="channel"]/*[local-name()="title"]')->item(0)?->textContent??'');
    $items=[];
    foreach($xp->query('//*[local-name()="item" or local-name()="entry"]') as $node){
        if(count($items)>=100)break;
        $first=static fn(string $q):string=>trim($xp->query($q,$node)->item(0)?->textContent??'');
        $name=$first('./*[local-name()="title"]');$link='';
        foreach($xp->query('./*[local-name()="link"]',$node) as $l){$candidate=$l instanceof DOMElement && $l->hasAttribute('href')?$l->getAttribute('href'):$l->textContent;if(!$link || ($l instanceof DOMElement && $l->getAttribute('rel')==='alternate'))$link=trim($candidate);}
        $link=rss_absolute($url,$link);$p=parse_url($link);
        if($name==='' || !$p || !in_array(strtolower($p['scheme']??''),['http','https'],true) || empty($p['host']) || isset($p['user']) || isset($p['pass']))continue;
        $date=$first('./*[local-name()="pubDate" or local-name()="published" or local-name()="updated" or local-name()="date"]');$stamp=strtotime($date);
        $items[]=['title'=>mb_substr($name,0,500),'url'=>$link,'date'=>$date,'timestamp'=>$stamp?:0,'source'=>mb_substr($title?:parse_url($url,PHP_URL_HOST),0,150),'related'=>[]];
    }
    return ['title'=>mb_substr($title?:parse_url($url,PHP_URL_HOST),0,150),'url'=>$url,'items'=>$items];
}
function rss_discover(string $url): array {
    [$body,$actual]=rss_fetch($url);$result=rss_parse($body,$actual);if($result)return $result;
    $doc=new DOMDocument();$old=libxml_use_internal_errors(true);$ok=$doc->loadHTML($body,LIBXML_NONET|LIBXML_NOERROR|LIBXML_NOWARNING);libxml_clear_errors();libxml_use_internal_errors($old);
    if(!$ok)throw new RuntimeException('На странице не найдена RSS-лента');
    foreach($doc->getElementsByTagName('link') as $link){$type=strtolower($link->getAttribute('type'));$rel=strtolower($link->getAttribute('rel'));if(str_contains($rel,'alternate') && (str_contains($type,'rss')||str_contains($type,'atom'))){$candidate=rss_absolute($actual,$link->getAttribute('href'));if(!$candidate)continue;[$feed,$feedUrl]=rss_fetch($candidate);$result=rss_parse($feed,$feedUrl);if($result)return $result;}}
    throw new RuntimeException('RSS-лента не найдена. Укажите прямую ссылку на RSS или Atom.');
}
