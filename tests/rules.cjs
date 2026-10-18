const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/core.js');
for(let i=1;i<=3;i++){
 const l=C.level(i);assert(C.validate(l));assert.deepEqual(C.level(i),l);
 const buses=l.buses.map(b=>({...b}));
 for(const id of l.solution){const b=buses.find(b=>b.id===id);assert.deepEqual(C.blockers(b,buses),[]);b.state='gone';}
 console.log(`Level ${i}: ${l.buses.length} buses, deterministic, no overlaps, solution verified, passenger totals match.`);
}
const a={id:0,x:1,y:2,dir:1,len:2,state:'grid'},b={id:1,x:4,y:1,dir:2,len:3,state:'grid'};
assert.deepEqual(C.blockers(a,[a,b]),[1]);b.state='transit';assert.deepEqual(C.blockers(a,[a,b]),[]);
console.log('Directional obstruction and released grid cells verified.');
