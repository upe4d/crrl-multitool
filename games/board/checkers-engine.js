/* Русские шашки: обязательное взятие, бой назад, дальнобойные дамки и превращение во время боя. */
(function(root){
 'use strict';const dirs=[[-1,-1],[-1,1],[1,-1],[1,1]],inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8,idx=(r,c)=>r*8+c;
 const promote=(piece,row)=>Math.abs(piece)===1&&((piece>0&&row===0)||(piece<0&&row===7))?piece*2:piece;
 function initial(){return Array.from({length:64},(_,i)=>{const r=i>>3,c=i%8;return(r+c)%2===0?0:r<3?-1:r>4?1:0;});}
 function jumps(board,pos,piece,taken){const r=pos>>3,c=pos%8,out=[];
  for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;
   if(Math.abs(piece)===2){while(inside(rr,cc)&&!board[idx(rr,cc)]){rr+=dr;cc+=dc;}}
   if(!inside(rr,cc))continue;const victim=idx(rr,cc);if(board[victim]*piece>=0||!board[victim]||taken.includes(victim))continue;
   rr+=dr;cc+=dc;while(inside(rr,cc)&&!board[idx(rr,cc)]){out.push({to:idx(rr,cc),victim,piece:promote(piece,rr)});if(Math.abs(piece)!==2)break;rr+=dr;cc+=dc;}
  }return out;
 }
 function moves(board,side){const captures=[];
  function follow(b,pos,piece,path,taken){const options=jumps(b,pos,piece,taken);if(!options.length){if(taken.length)captures.push({path,taken,piece});return;}
   for(const step of options){const next=b.slice();next[pos]=0;next[step.to]=step.piece;
    // Побитые шашки остаются препятствиями до завершения всей серии («турецкий удар»).
    follow(next,step.to,step.piece,[...path,step.to],[...taken,step.victim]);}
  }
  for(let i=0;i<64;i++)if(board[i]*side>0)follow(board,i,board[i],[i],[]);
  if(captures.length)return captures;const out=[];
  for(let i=0;i<64;i++){const piece=board[i];if(piece*side<=0)continue;for(const[dr,dc]of dirs){if(Math.abs(piece)===1&&dr!==(piece>0?-1:1))continue;let r=(i>>3)+dr,c=i%8+dc;while(inside(r,c)&&!board[idx(r,c)]){out.push({path:[i,idx(r,c)],taken:[],piece:promote(piece,r)});if(Math.abs(piece)===1)break;r+=dr;c+=dc;}}}return out;
 }
 function apply(board,move){const next=board.slice();next[move.path[0]]=0;move.taken.forEach(i=>next[i]=0);next[move.path.at(-1)]=move.piece;return next;}
 function evaluate(board,side){return board.reduce((sum,p,i)=>sum+(p===0?0:Math.sign(p)*(Math.abs(p)===2?320:100+(p>0?7-(i>>3):(i>>3))*3)),0)*side;}
 function best(board,side,maxNodes=8000){let nodes=0;const deadline=Date.now()+350;
  function search(b,s,depth,alpha,beta){nodes++;if(nodes>maxNodes||Date.now()>deadline||depth===0)return evaluate(b,s);const legal=moves(b,s);if(!legal.length)return-10000-depth;let value=-Infinity;for(const m of legal){value=Math.max(value,-search(apply(b,m),-s,depth-1,-beta,-alpha));alpha=Math.max(alpha,value);if(alpha>=beta||nodes>maxNodes)break;}return value;}
  const legal=moves(board,side).sort((a,b)=>b.taken.length-a.taken.length);let chosen=legal[0],score=-Infinity;for(const m of legal){const n=-search(apply(board,m),-side,3,-Infinity,Infinity);if(n>score){score=n;chosen=m;}if(nodes>maxNodes)break;}return chosen;
 }
 const api={initial,moves,apply,best,promote};if(typeof module!=='undefined')module.exports=api;else root.RussianCheckers=api;
})(typeof self==='undefined'?globalThis:self);
