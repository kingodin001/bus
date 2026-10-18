/* Deterministic puzzle rules, shared by the app and headless tests. */
(function(root){
  'use strict';
  const colors=['#f54751','#3678ef','#21bb88','#ffca28','#ab48ed','#22d5df','#f58b27','#f269c5'];
  const names=['красный','синий','зелёный','жёлтый','фиолетовый','бирюзовый','оранжевый','розовый'];
  function random(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function cells(b){let a=[];for(let i=0;i<b.len;i++)a.push([b.x+(b.dir%2?i:0),b.y+(b.dir%2?0:i)]);return a;}
  function blockers(b,buses){const occ=new Map();for(const q of buses)if(q.id!==b.id&&(!q.state||q.state==='grid'))for(const [x,y]of cells(q))occ.set(x+','+y,q.id);let x=b.x,y=b.y;const dx=[0,1,0,-1][b.dir],dy=[-1,0,1,0][b.dir];if(b.dir===1)x+=b.len-1;if(b.dir===2)y+=b.len-1;const hits=new Set();x+=dx;y+=dy;while(x>=0&&x<10&&y>=0&&y<9){if(occ.has(x+','+y))hits.add(occ.get(x+','+y));x+=dx;y+=dy;}return [...hits];}
  function layout(count,seed,fixedLengths=null){
    const r=random(seed),buses=[];let attempts=0;
    while(buses.length<count&&attempts++<20000){const dir=Math.floor(r()*4),size=r(),len=fixedLengths?fixedLengths[buses.length]:(size<.28?3:size<.67?2:1);const b={id:buses.length,x:Math.floor(r()*(dir%2?11-len:10)),y:Math.floor(r()*(dir%2?9:10-len)),dir,len,state:'grid'};const used=new Set(buses.flatMap(q=>cells(q).map(c=>c.join(','))));if(cells(b).some(c=>used.has(c.join(',')))||blockers(b,buses).length)continue;buses.push(b);}
    return buses;
  }
  function level(index){
    const count=[9,16,23][index-1],ncolors=[4,6,8][index-1];let buses=[];
    for(let k=0;k<100&&buses.length<count;k++)buses=layout(count,1071+index*913+k*71);
    if(buses.length!==count)throw Error('Level generation failed');
    const solution=buses.map(b=>b.id).reverse();
    solution.forEach((id,i)=>{buses[id].color=(i*3+Math.floor(i/ncolors))%ncolors;buses[id].capacity={1:16,2:24,3:40}[buses[id].len];});
    const lanes=[[],[]];solution.forEach((id,i)=>lanes[i%2].push({color:buses[id].color,count:buses[id].capacity,busId:id}));
    return {index,buses,solution,lanes};
  }
  function validate(l){const list=l.buses.map(b=>({...b}));const occupied=new Set();for(const b of list)for(const c of cells(b)){const k=c.join(',');if(occupied.has(k))throw Error('Overlap '+k);occupied.add(k);}for(const id of l.solution){const b=list.find(q=>q.id===id);if(blockers(b,list).length)throw Error('Blocked solution '+id);b.state='gone';}const supply={};for(const lane of l.lanes)for(const p of lane)supply[p.color]=(supply[p.color]||0)+p.count;for(const b of l.buses)supply[b.color]-=b.capacity;if(Object.values(supply).some(v=>v!==0))throw Error('Passenger count mismatch');return true;}
  const api={colors,names,random,cells,blockers,layout,level,validate};if(typeof module!=='undefined')module.exports=api;root.BusCore=api;
})(typeof window!=='undefined'?window:globalThis);
