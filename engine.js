/**
 * Chess Arena 3D — Core Rule & Move Generation Engine
 * 
 * Data Architecture:
 * - Board Representation: 64-element Int8Array indexed from 0 to 63.
 *   - Coordinate math: Rank = s >> 3 (0 to 7), File = s & 7 (0 to 7).
 *   - Square 0 = a1, Square 7 = h1, Square 56 = a8, Square 63 = h8.
 * - Piece Integer Encoding:
 *   - 1: Pawn (P)
 *   - 2: Knight (N)
 *   - 3: Bishop (B)
 *   - 4: Rook (R)
 *   - 5: Queen (Q)
 *   - 6: King (K)
 *   - Sign denotes side: Positive (> 0) = White, Negative (< 0) = Black.
 * - Castling Mask (cast): 4-bit integer bitmask (15 = 1111b):
 *   - Bit 1 (1): White King-side (O-O)
 *   - Bit 2 (2): White Queen-side (O-O-O)
 *   - Bit 3 (4): Black King-side (O-O)
 *   - Bit 4 (8): Black Queen-side (O-O-O)
 */
(function(g){'use strict';
const FILES='abcdefgh',LET='PNBRQK';

// Raycast direction offsets [rankDelta, fileDelta]
const KN=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]],DI=[[1,1],[1,-1],[-1,1],[-1,-1]],OR=[[1,0],[-1,0],[0,1],[0,-1]],AL=DI.concat(OR);

// Castling revocation bitmask lookup table (rooks and king starting squares)
const CM=new Int8Array(64);CM[0]=2;CM[7]=1;CM[4]=3;CM[56]=8;CM[63]=4;CM[60]=12;

// Convert 0..63 index to algebraic square name (e.g. 0 -> 'a1', 63 -> 'h8')
const sqn=s=>FILES[s&7]+((s>>3)+1);

class Game{
  constructor(){this.reset()}

  /**
   * Reset board to standard tournament initial starting position.
   */
  reset(){
    const b=this.b=new Int8Array(64),bk=[4,2,3,5,6,3,2,4];
    for(let f=0;f<8;f++){b[f]=bk[f];b[8+f]=1;b[48+f]=-1;b[56+f]=-bk[f]}
    this.turn=1;          // Active player: +1 = White, -1 = Black
    this.cast=15;         // Castling rights bitmask (all available initially)
    this.ep=-1;           // En passant target square (-1 if none)
    this.half=0;          // Half-move clock for 50-move draw rule
    this.full=1;          // Full-move counter
    this.ks=[4,60];       // King square index tracking: [WhiteKing, BlackKing]
    this.hist=[];         // Move history records
    this.keys=[this.key()];// Position signature cache for threefold repetition
  }

  /**
   * Compute unique position key for repetition and transposition detection.
   */
  key(){return this.b.join()+this.turn+this.cast+this.ep}

  /**
   * Determine if square 's' is attacked by side 'by' (+1 or -1).
   */
  att(s,by){
    const b=this.b,r=s>>3,f=s&7,pr=r-by;
    // Pawn attack vectors
    if(pr>=0&&pr<8)for(const d of[-1,1]){const x=f+d;if(x>=0&&x<8&&b[pr*8+x]===by)return true}
    // Knight attack vectors
    for(const[a,c]of KN){const y=r+a,x=f+c;if(y>=0&&y<8&&x>=0&&x<8&&b[y*8+x]===by*2)return true}
    // Sliding ray attacks (Bishop, Rook, Queen)
    for(let i=0;i<8;i++){
      const a=AL[i][0],c=AL[i][1];let y=r+a,x=f+c;const o=i<4?3:4;
      while(y>=0&&y<8&&x>=0&&x<8){const p=b[y*8+x];if(p){if(p===by*o||p===by*5)return true;break}y+=a;x+=c}
    }
    // King adjacent attacks
    for(const[a,c]of AL){const y=r+a,x=f+c;if(y>=0&&y<8&&x>=0&&x<8&&b[y*8+x]===by*6)return true}
    return false;
  }

  inCheck(){return this.att(this.ks[this.turn>0?0:1],-this.turn)}
  ok(){const mc=-this.turn;return!this.att(this.ks[mc>0?0:1],this.turn)}

  /**
   * Generate pseudo-legal moves (or captures only if caps is true).
   */
  gen(caps){
    const b=this.b,t=this.turn,out=[];
    for(let s=0;s<64;s++){
      const p=b[s];if(!p||p*t<0)continue;const k=Math.abs(p),r=s>>3,f=s&7;
      if(k===1){
        const n=r+t,pr=n===(t>0?7:0);
        const add=(to,cap,fl)=>{if(pr)for(const q of[5,4,3,2])out.push({from:s,to,p:1,cap,promo:q,fl});else out.push({from:s,to,p:1,cap,fl})};
        if(n<0||n>7)continue;
        if((!caps||pr)&&!b[n*8+f]){add(n*8+f,0);if(!caps&&r===(t>0?1:6)&&!b[(n+t)*8+f])out.push({from:s,to:(n+t)*8+f,p:1,cap:0,fl:'d'})}
        for(const d of[-1,1]){const x=f+d;if(x<0||x>7)continue;const to=n*8+x,c=b[to];if(c*t<0)add(to,c);else if(to===this.ep&&!c)out.push({from:s,to,p:1,cap:-t,fl:'e'})}
      }else if(k===2||k===6){
        for(const[a,c]of(k===2?KN:AL)){const y=r+a,x=f+c;if(y<0||y>7||x<0||x>7)continue;const to=y*8+x,q=b[to];if(q*t>0)continue;if(q||!caps)out.push({from:s,to,p:k,cap:q})}
        if(k===6&&!caps&&f===4&&r===(t>0?0:7)){
          const rk=r*8,o=-t;
          if(this.cast&(t>0?1:4)&&!b[rk+5]&&!b[rk+6]&&!this.att(rk+4,o)&&!this.att(rk+5,o))out.push({from:s,to:rk+6,p:6,cap:0,fl:'c'});
          if(this.cast&(t>0?2:8)&&!b[rk+1]&&!b[rk+2]&&!b[rk+3]&&!this.att(rk+4,o)&&!this.att(rk+3,o))out.push({from:s,to:rk+2,p:6,cap:0,fl:'c'});
        }
      }else{
        for(const[a,c]of(k===3?DI:k===4?OR:AL)){let y=r+a,x=f+c;while(y>=0&&y<8&&x>=0&&x<8){const to=y*8+x,q=b[to];if(q*t>0)break;if(q||!caps)out.push({from:s,to,p:k,cap:q});if(q)break;y+=a;x+=c}}
      }
    }
    return out;
  }

  /**
   * Apply move to board state, returning an undo descriptor.
   */
  make(m){
    const b=this.b,t=this.turn,u={m,c:this.cast,e:this.ep,h:this.half,mv:b[m.from]};
    if(m.fl==='e')b[m.to-8*t]=0;
    b[m.to]=m.promo?t*m.promo:u.mv;b[m.from]=0;
    if(m.fl==='c'){const rk=m.from&~7;if(m.to>m.from){b[rk+5]=b[rk+7];b[rk+7]=0}else{b[rk+3]=b[rk];b[rk]=0}}
    if(m.p===6)this.ks[t>0?0:1]=m.to;
    this.cast&=~(CM[m.from]|CM[m.to]);this.ep=m.fl==='d'?(m.from+m.to)>>1:-1;
    this.half=(m.p===1||m.cap)?0:this.half+1;if(t<0)this.full++;this.turn=-t;return u;
  }

  /**
   * Revert move using undo descriptor.
   */
  unmake(u){
    const m=u.m,b=this.b;this.turn=-this.turn;const t=this.turn;
    b[m.from]=u.mv;b[m.to]=0;if(m.fl==='e')b[m.to-8*t]=m.cap;else b[m.to]=m.cap;
    if(m.fl==='c'){const rk=m.from&~7;if(m.to>m.from){b[rk+7]=b[rk+5];b[rk+5]=0}else{b[rk]=b[rk+3];b[rk+3]=0}}
    if(m.p===6)this.ks[t>0?0:1]=m.from;
    this.cast=u.c;this.ep=u.e;this.half=u.h;if(t<0)this.full--;
  }

  /**
   * Generate strictly legal moves by verifying king safety.
   */
  legal(){const o=[];for(const m of this.gen()){const u=this.make(m);if(this.ok())o.push(m);this.unmake(u)}return o}

  move(from,to,promo){const L=this.legal(),m=L.find(x=>x.from===from&&x.to===to&&(x.promo||0)===(promo||0));return m?this.apply(m,L):null}

  /**
   * Format move into Standard Algebraic Notation (SAN).
   */
  apply(m,L){
    const t=this.turn;let san;
    if(m.fl==='c')san=m.to>m.from?'O-O':'O-O-O';
    else{
      san=m.p>1?LET[m.p-1]:'';
      if(m.p>1){
        const o=L.filter(x=>x!==m&&x.p===m.p&&x.to===m.to);
        if(o.length){if(!o.some(x=>(x.from&7)===(m.from&7)))san+=FILES[m.from&7];else if(!o.some(x=>(x.from>>3)===(m.from>>3)))san+=(m.from>>3)+1;else san+=sqn(m.from)}
      }else if(m.cap)san+=FILES[m.from&7];
      if(m.cap)san+='x';san+=sqn(m.to);if(m.promo)san+='='+LET[m.promo-1];
    }
    this.make(m);
    if(this.inCheck())san+=this.legal().length?'+':'#';
    const rec={m,san,cap:m.cap,color:t};this.hist.push(rec);this.keys.push(this.key());return rec;
  }

  insuf(){let n=0;for(const p of this.b){const k=Math.abs(p);if(k===1||k===4||k===5)return false;if(k===2||k===3)n++}return n<2}

  status(){
    if(!this.legal().length)return this.inCheck()?{over:1,win:-this.turn,why:'Checkmate'}:{over:1,win:0,why:'Stalemate'};
    if(this.half>=100)return{over:1,win:0,why:'Fifty-move draw'};
    const k=this.key();if(this.keys.filter(x=>x===k).length>=3)return{over:1,win:0,why:'Repetition'};
    if(this.insuf())return{over:1,win:0,why:'Draw'};
    return{over:0,check:this.inCheck()};
  }
}

g.Chess={Game,sqn};
})(typeof self!=='undefined'?self:this);
