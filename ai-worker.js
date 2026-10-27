/**
 * Chess Arena 3D — Web Worker AI Engine
 * 
 * Architecture:
 * - Search: Minimax with Alpha-Beta pruning and Quiescence search (qs).
 * - Evaluation: Material counts + piece-square center/rank positioning + king safety.
 * - Move Ordering: Most Valuable Victim - Least Valuable Aggressor (MVV-LVA).
 * - Iterative Deepening: Dynamically searches d=1..maxDepth within allotted time limit.
 */
importScripts('engine.js');
const {Game}=self.Chess;

// Piece values: [Empty, Pawn, Knight, Bishop, Rook, Queen, King]
const V=[0,100,320,330,500,900,0],MATE=1e5,INF=1e9;
let nodes=0,stop=0,tEnd=0;

// MVV-LVA move ordering heuristic: captures scored by victim value minus attacker value
const sc=m=>(m.cap?10*V[Math.abs(m.cap)]-V[m.p]:0)+(m.promo?800:0);
const order=a=>a.sort((x,y)=>sc(y)-sc(x));

/**
 * Static position evaluation function.
 */
function ev(g){
  const b=g.b;let s=0,mat=0;
  for(let i=0;i<64;i++){
    const p=b[i];if(!p)continue;
    const k=Math.abs(p),c=p>0?1:-1,r=i>>3,f=i&7,rr=c>0?r:7-r,cd=Math.abs(f-3.5)+Math.abs(r-3.5);
    let v=V[k];
    if(k===1)v+=rr*rr*2+(rr<5?(3.5-Math.abs(f-3.5))*3:0);
    else if(k===2)v+=(7-cd)*5;
    else if(k===3)v+=(7-cd)*3;
    else if(k===5)v+=7-cd;
    else if(k===4&&rr===6)v+=12;
    if(k>1&&k<6)mat+=V[k];
    s+=c*v;
  }
  for(const c of[1,-1]){
    const q=g.ks[c>0?0:1],r=q>>3,f=q&7,rr=c>0?r:7-r,cd=Math.abs(f-3.5)+Math.abs(r-3.5);
    s+=c*(mat<2600?(7-cd)*8:(rr===0?15+(f<3||f>5?25:0):-25));
  }
  return s*g.turn;
}

/**
 * Quiescence search: resolves non-quiet capture positions to prevent horizon effect.
 */
function qs(g,a,b,d){
  if((++nodes&2047)===0&&Date.now()>tEnd)stop=1;if(stop)return 0;
  const s=ev(g);if(s>=b)return s;if(s>a)a=s;if(d<=0)return s;
  for(const m of order(g.gen(1))){
    const u=g.make(m);if(!g.ok()){g.unmake(u);continue}
    const x=-qs(g,-b,-a,d-1);g.unmake(u);if(x>=b)return x;if(x>a)a=x;
  }
  return a;
}

/**
 * Negamax search with Alpha-Beta cutoff.
 */
function ns(g,d,a,b,ply){
  if((++nodes&2047)===0&&Date.now()>tEnd)stop=1;if(stop)return 0;
  if(d<=0)return qs(g,a,b,4);
  let best=-INF,n=0;
  for(const m of order(g.gen())){
    const u=g.make(m);if(!g.ok()){g.unmake(u);continue}n++;
    const x=-ns(g,d-1,-b,-a,ply+1);g.unmake(u);if(stop)return 0;
    if(x>best)best=x;if(x>a)a=x;if(a>=b)break;
  }
  if(!n)return g.inCheck()?-MATE+ply:0;
  return best;
}

/**
 * Web Worker Message Handler: computes best move for level 1..5.
 */
onmessage=e=>{
  const {moves,level,id}=e.data,g=new Game();
  for(const[f,t,p]of moves)g.move(f,t,p);

  // Configuration profiles per level: depth (d), noise jitter (z), randomness (r), timeout (t)
  const C=[
    {d:1,z:170,r:.3,t:400},   // Level 1: Casual / Beginner
    {d:2,z:70,r:0,t:800},     // Level 2: Club Player
    {d:3,z:25,r:0,t:1800},    // Level 3: Intermediate
    {d:4,z:0,r:0,t:3500},     // Level 4: Advanced
    {d:10,z:0,r:0,t:6500}     // Level 5: Master / Deep Search
  ][level-1]||{d:3,z:25,r:0,t:1800};

  let ms=order(g.legal());if(!ms.length)return postMessage({id});
  let pick=ms[0];

  if(Math.random()<C.r)pick=ms[Math.floor(Math.random()*ms.length)];
  else if(ms.length>1){
    tEnd=Date.now()+C.t;nodes=0;let scored=ms.map(m=>({m,s:0}));
    // Iterative deepening search loop
    for(let d=1;d<=C.d;d++){
      stop=0;let a=-INF;const cur=[];
      for(const o of scored){
        const u=g.make(o.m);let x;
        if(g.keys.filter(k=>k===g.key()).length>=2)x=-50;
        else x=-ns(g,d-1,-INF,C.z?INF:-a,1);
        g.unmake(u);if(stop)break;
        cur.push({m:o.m,s:x});if(x>a)a=x;
      }
      if(stop&&d>1)break;
      if(cur.length===scored.length||d===1){scored=cur.sort((p,q)=>q.s-p.s)}
      if(Math.abs(scored[0].s)>MATE/2||stop)break;
    }
    let bs=-INF;
    for(const o of scored){const v=o.s+(Math.random()-.5)*C.z*2;if(v>bs){bs=v;pick=o.m}}
  }

  postMessage({id,from:pick.from,to:pick.to,promo:pick.promo||0});
};
