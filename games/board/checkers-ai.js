/* Поиск хода вынесен в Worker, чтобы не блокировать доску. */
importScripts('checkers-engine.js');onmessage=e=>{const{board,side,request}=e.data;postMessage({request,move:RussianCheckers.best(board,side)});};
