const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:576,height:1280},deviceScaleFactor:1});const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('file://'+path.resolve(__dirname,'../app/src/main/assets/index.html')+'?qa=1');await page.waitForFunction(()=>window.BusGame&&BusGame.ready);
 const snap=()=>page.evaluate(()=>BusGame.snapshot());const act=(a,arg)=>page.evaluate(([a,arg])=>BusGame.action(a,arg),[a,arg]);
 const out=path.resolve(__dirname,'../out/qa');fs.mkdirSync(out,{recursive:true});
 await page.screenshot({animations:'disabled',path:path.join(out,'home.png')});
 for(const action of ['starter','premium','shop','supplies','spin','daily','settings','levels']){await page.locator(`[data-action="${action}"]`).first().click();assert((await snap()).modal);await page.locator('.close').click();assert(!(await snap()).modal);}
 const before=await snap();await act('buy','vip');await act('close');assert.equal((await snap()).coins,before.coins-80);assert.equal((await snap()).boosts.vip,before.boosts.vip+1);
 await act('claimDaily');const afterDaily=(await snap()).coins;await act('claimDaily');assert.equal((await snap()).coins,afterDaily);await act('close');
 console.log('Menu navigation, shop accounting, daily reward idempotence: PASS');
 for(let i=1;i<=3;i++){
   await page.evaluate(i=>BusGame.start(i),i);let s=await snap();
   const blocked=await page.evaluate(()=>{const s=BusGame.snapshot();return s.buses.find(b=>BusCore.blockers(b,s.buses).length)?.id;});
   if(blocked!==undefined){await page.evaluate(id=>BusGame.tap(id),blocked);assert.equal((await snap()).buses.find(b=>b.id===blocked).state,'grid');}
   for(const id of s.solution){
     const ok=await page.evaluate(id=>BusGame.tap(id),id);assert(ok,`Level ${i}, bus ${id} did not move`);
     await page.evaluate(()=>BusGame.advance(11));
     const t=await snap();assert(t.won||!t.modal,`Unexpected loss on level ${i}, bus ${id}`);
   }
   s=await snap();assert(s.won);assert.equal(s.arrived,s.total);assert(s.buses.every(b=>b.state==='gone'));assert(s.completed[i-1]>0);
   await page.screenshot({animations:'disabled',path:path.join(out,`victory-${i}.png`)});await act('close');console.log(`Level ${i}: full playthrough, ${s.total} passengers, victory and reward: PASS`);
 }
 const completed=(await snap()).completed;await page.reload();await page.waitForFunction(()=>window.BusGame?.ready);assert.deepEqual((await snap()).completed,completed);console.log('Progress after reload: PASS');
 await page.evaluate(()=>BusGame.start(3));
 // Check a real pointer hit, rather than only invoking the controller.
 const pick=await page.evaluate(()=>{const s=BusGame.snapshot(),id=s.solution[0];return {id,...BusGame.point(id)};});
 await page.mouse.click(pick.x,pick.y-7);assert.notEqual((await snap()).buses.find(b=>b.id===pick.id).state,'grid');await page.evaluate(()=>BusGame.advance(1.5));
 await page.screenshot({animations:'disabled',path:path.join(out,'gameplay.png')});
 await act('pause');await page.screenshot({animations:'disabled',path:path.join(out,'pause.png')});await act('close');
 await act('vip');assert((await snap()).unlocked[0]);await act('unlock',5);assert((await snap()).unlocked[5]);
 await act('sort');await act('shuffle');console.log('Pointer selection, pause, extra parking, all three boosters: PASS');
 for(const size of [{width:360,height:800},{width:412,height:915},{width:800,height:1280}]){await page.setViewportSize(size);await page.waitForFunction(({width,height})=>{const r=document.getElementById('stage').getBoundingClientRect();return r.width<=width+.1&&r.height<=height+.1;},size);const r=await page.locator('#stage').boundingBox();assert(r.width<=size.width+.1&&r.height<=size.height+.1);}
 assert.equal(errors.length,0,errors.join('\n'));assert(requests.every(u=>u.startsWith('file:')));console.log('Adaptive frame, no external requests, no JavaScript errors: PASS');
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({passed:true,completed,errors,externalRequests:requests.filter(u=>!u.startsWith('file:')),testedAt:new Date().toISOString()},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
