/* Original toy-like geometry and lighting. Everything on the game board is 3D. */
(function(){
 'use strict';
 const T=THREE,S=32,COS=60/Math.hypot(60,33),colors=BusCore.colors;
 const renderer=new T.WebGLRenderer({canvas:document.getElementById('world'),antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setSize(576,1280,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor('#c8ccdc');renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-9,9,20,-20,.1,180);camera.position.set(0,60,33);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(0xeef8ff,0x8f88ab,.9));const sun=new T.DirectionalLight(0xfff6e7,2.0);sun.position.set(-15,38,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-17,right:17,top:27,bottom:-27,near:1,far:95});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun);
 const group=new T.Group(),vehicles=new T.Group(),crowd=new T.Group(),effects=new T.Group();scene.add(group,vehicles,crowd,effects);
 const materialCache=new Map(),geoCache=new Map();
 function mat(color,rough=.42,metal=0){const k=(color.isColor?color.getHexString():color)+'|'+rough+'|'+metal;if(!materialCache.has(k))materialCache.set(k,new T.MeshStandardMaterial({color,roughness:rough,metalness:metal}));return materialCache.get(k);}
 function ground(x,y,h=0){return new T.Vector3((x-288)/S,h,(y-640)/(S*COS));}
 function place(o,x,y,h=0){o.position.copy(ground(x,y,h));return o;}
 function rounded(w,h,d,r=.08){const key=[w,h,d,r].join(',');if(geoCache.has(key))return geoCache.get(key);const s=new T.Shape();const x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r,rad=Math.min(r,W/3,H/3);s.moveTo(x+rad,y);s.lineTo(x+W-rad,y);s.quadraticCurveTo(x+W,y,x+W,y+rad);s.lineTo(x+W,y+H-rad);s.quadraticCurveTo(x+W,y+H,x+W-rad,y+H);s.lineTo(x+rad,y+H);s.quadraticCurveTo(x,y+H,x,y+H-rad);s.lineTo(x,y+rad);s.quadraticCurveTo(x,y,x+rad,y);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:5});g.translate(0,0,-d/2+r);geoCache.set(key,g);return g;}
 function box(parent,w,h,d,color,x=0,y=0,z=0,r=.05){const o=new T.Mesh(rounded(w,h,d,r),mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function sphere(parent,r,color,x,y,z,sx=1,sy=1,sz=1){const key='sphere'+r;if(!geoCache.has(key))geoCache.set(key,new T.SphereGeometry(r,12,8));const o=new T.Mesh(geoCache.get(key),mat(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;}
 function canvasTexture(draw,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;}
 const arrowTex=canvasTexture((c,w,h)=>{c.fillStyle='#284663';c.beginPath();c.moveTo(128,19);c.lineTo(215,108);c.lineTo(160,108);c.lineTo(160,233);c.lineTo(96,233);c.lineTo(96,108);c.lineTo(41,108);c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.moveTo(128,30);c.lineTo(200,103);c.lineTo(152,103);c.lineTo(152,224);c.lineTo(104,224);c.lineTo(104,103);c.lineTo(56,103);c.closePath();c.fill();});
 const arrowMat=new T.MeshBasicMaterial({map:arrowTex,transparent:true,depthWrite:false,side:T.DoubleSide});
 const shadowTex=canvasTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(35,40,63,.4)');g.addColorStop(.55,'rgba(35,40,63,.18)');g.addColorStop(1,'rgba(35,40,63,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
 const shadowMat=new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false});
 const busSurface=new T.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.03}),busGeometryCache=new Map();
 function mergeBusParts(g,key){
   let geometry=busGeometryCache.get(key);
   if(!geometry){const ps=[],ns=[],cs=[];for(const o of g.children){o.updateMatrix();const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);const p=geo.getAttribute('position'),n=geo.getAttribute('normal'),c=o.material.color;for(let i=0;i<p.count;i++){ps.push(p.getX(i),p.getY(i),p.getZ(i));ns.push(n.getX(i),n.getY(i),n.getZ(i));cs.push(c.r,c.g,c.b);}geo.dispose();}geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(ps,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(ns,3));geometry.setAttribute('color',new T.Float32BufferAttribute(cs,3));geometry.computeBoundingSphere();busGeometryCache.set(key,geometry);}
   g.clear();const mesh=new T.Mesh(geometry,busSurface);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
 }
 function busModel(b){const g=new T.Group(),col=colors[b.color],dark=new T.Color(col).multiplyScalar(.67),light=new T.Color(col).lerp(new T.Color('#ffffff'),.15),len=b.len===3?3.35:2.15;
   box(g,.87,.35,len,col,0,.33,0,.11);box(g,.83,.26,len-.12,dark,0,.18,0,.07);box(g,.76,.29,len-.2,light,0,.60,0,.09);
   box(g,.70,.025,len-.42,col,0,.77,.02,.01);
   const front=box(g,.64,.23,.05,'#27496a',0,.55,-len/2-.003,.012);front.rotation.x=.13;
   box(g,.61,.13,.04,'#74c9ef',0,.56,-len/2-.04,.009);
   box(g,.57,.16,.035,'#244c66',0,.57,len/2-.01,.01);
   for(const side of [-1,1]){for(let i=0;i<(b.len===3?5:3);i++){const z=-len/2+.35+i*.38;box(g,.027,.19,.28,'#245473',side*.438,.52,z,.008);box(g,.02,.04,.21,'#7dd8f2',side*.455,.59,z-.02,.005);}for(const z of [-len*.31,len*.31]){const wheel=new T.Mesh(new T.CylinderGeometry(.17,.17,.11,12),mat('#283349',.8));wheel.rotation.z=Math.PI/2;wheel.position.set(side*.43,.19,z);g.add(wheel);const cap=new T.Mesh(new T.CylinderGeometry(.085,.085,.115,10),mat('#9fbbc9',.3,.4));cap.rotation.z=Math.PI/2;cap.position.copy(wheel.position);g.add(cap);}}
   for(const x of [-.26,.26]){box(g,.15,.09,.04,'#fff7a6',x,.29,-len/2-.02,.012);box(g,.1,.06,.025,'#ff685b',x,.29,len/2+.02,.009);}
   box(g,.7,.06,.07,'#c3d3df',0,.15,-len/2-.04,.012);
   mergeBusParts(g,b.color+'-'+b.len);
   const arrow=new T.Mesh(new T.PlaneGeometry(.49,Math.min(1.18,len*.65)),arrowMat);arrow.rotation.x=-Math.PI/2;arrow.position.set(0,.80,.02);g.add(arrow);g.userData.arrow=arrow;
   const shadow=new T.Mesh(new T.PlaneGeometry(1.45,len+.65),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;g.add(shadow);g.userData.bus=b;vehicles.add(g);return g;
 }
 function planeText(text,color,w=128,h=64){return canvasTexture((c,W,H)=>{c.textAlign='center';c.textBaseline='middle';c.font='bold '+Math.floor(H*.65)+'px Arial';c.fillStyle=color;c.fillText(text,W/2,H/2);},w,h);}
 function flatText(text,color,x,y,w,h,rotation=0){const mesh=new T.Mesh(new T.PlaneGeometry(w/S,h/(S*COS)),new T.MeshBasicMaterial({map:planeText(text,color),transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rotation;place(mesh,x,y,.035);group.add(mesh);return mesh;}
 function line(points,color,r=.035,closed=false,parent=group){const pts=points.map(([x,y])=>ground(x,y,.07));if(closed)pts.push(pts[0]);const curve=new T.CurvePath();for(let i=1;i<pts.length;i++)curve.add(new T.LineCurve3(pts[i-1],pts[i]));const geo=new T.TubeGeometry(curve,Math.max(12,points.length*8),r,5,false),mesh=new T.Mesh(geo,mat(color,.7));parent.add(mesh);return mesh;}
 function screenShape(build,color,h=.02){const sh=new T.Shape();const cv=(x,y)=>[(x-288)/S,-(y-640)/(S*COS)];const p={move:(x,y)=>sh.moveTo(...cv(x,y)),line:(x,y)=>sh.lineTo(...cv(x,y)),curve:(a,b,c,d,e,f)=>sh.bezierCurveTo(...cv(a,b),...cv(c,d),...cv(e,f)),hole:(arr)=>{const path=new T.Path();arr.forEach((v,i)=>i?path.lineTo(...cv(...v)):path.moveTo(...cv(...v)));sh.holes.push(path);}};build(p);const mesh=new T.Mesh(new T.ShapeGeometry(sh,30),mat(color,.9));mesh.rotation.x=-Math.PI/2;mesh.position.y=h;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 function buildGround(){
   const floor=new T.Mesh(new T.PlaneGeometry(24,60),mat('#cdd2ed',.95));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;floor.receiveShadow=true;group.add(floor);
   screenShape(p=>{p.move(-20,-30);p.line(596,-30);p.line(596,404);p.line(-20,404);p.line(-20,-30);},'#dae2e9');
   for(let x=0;x<=576;x+=28)line([[x,-20],[x,395]],'#ced7e1',.008);for(let y=0;y<=400;y+=24)line([[-20,y],[596,y]],'#ced7e1',.008);
   const road=p=>{p.move(-8,-45);p.line(126,-45);p.line(126,95);p.curve(126,153,178,169,223,150);p.curve(260,132,316,132,353,150);p.curve(400,170,450,155,450,95);p.line(450,-45);p.line(584,-45);p.line(584,115);p.curve(584,204,490,234,456,246);p.curve(458,345,391,380,320,380);p.line(256,380);p.curve(182,380,116,345,120,246);p.curve(85,234,-8,204,-8,115);p.line(-8,-45);};
   screenShape(road,'#f5f5f1',.03);const r=screenShape(road,'#75788c',.05);r.scale.set(.985,.985,1);
   screenShape(p=>{p.move(243,208);p.curve(265,217,309,217,333,208);p.curve(344,225,344,252,334,267);p.curve(308,278,268,278,243,267);p.curve(231,252,231,227,243,208);},'#f7f8f5',.06);
   screenShape(p=>{p.move(248,215);p.curve(268,224,309,224,328,215);p.curve(337,230,337,248,329,260);p.curve(307,270,271,270,248,260);p.curve(238,247,238,229,248,215);},'#d4dee8',.075);
   screenShape(p=>{p.move(-20,412);p.line(596,412);p.line(596,525);p.line(-20,525);p.line(-20,412);},'#77798b',.02);line([[-20,412],[596,412]],'#f4f5f5',.035);line([[-20,525],[596,525]],'#eef0f3',.04);
   for(let i=0;i<8;i++){const x=63+i*64;const pts=[[-17,-38],[17,-38],[17,38],[-17,38]].map(([a,b])=>[x+a*.965-b*.259,465+a*.259+b*.965]);line(pts,i===0?'#fbd45a':i<5?'#c6cddb':'#9ccdb4',.028,true);if(i===0)flatText('VIP','#ffd365',x,465,29,16,-.25);}
   for(const x of [47,529]){const stop=new T.Group();box(stop,1.5,.09,.92,'#c7d7e3',0,.07,0,.03);for(const a of [-.6,.6])for(const z of [-.32,.32])box(stop,.045,.85,.045,'#728ea5',a,.48,z,.008);box(stop,1.6,.09,1.02,'#8bc3e7',0,.95,0,.05);box(stop,1.3,.06,.28,'#bb814b',0,.3,.16,.012);box(stop,1.3,.30,.055,'#d59b62',0,.47,.32,.012);place(stop,x,335);group.add(stop);box(group,.48,.20,.50,'#b3bdc7',ground(x-10,378).x,.1,ground(x-10,378).z,.04);for(let a=0;a<3;a++)sphere(group,.17,'#7bb24e',ground(x-18+a*8,378).x,.30,ground(x-18+a*8,378).z,1,1,1);}
 }
 buildGround();
 const paths=[new T.CatmullRomCurve3([[274,360],[204,342],[167,300],[166,250],[124,204],[78,160],[66,80],[66,-380]].map(p=>new T.Vector3(...p,0))),new T.CatmullRomCurve3([[302,360],[372,342],[411,300],[410,250],[452,204],[498,160],[510,80],[510,-380]].map(p=>new T.Vector3(...p,0)))];
 const pathLengths=paths.map(p=>p.getLength());
 function queuePoint(lane,index,time=0){const row=Math.floor(index/8),col=index%8;const u=Math.min(.997,(row*10.5+4)/pathLengths[lane]);const p=paths[lane].getPointAt(u),t=paths[lane].getTangentAt(u);const offset=(col-3.5)*10.5;return {x:p.x-t.y*offset,y:p.y+t.x*offset};}
 let peopleMeshes=[],personCount=0;const dummy=new T.Object3D();
 function createCrowd(people){for(const m of peopleMeshes){crowd.remove(m);m.geometry.dispose();m.dispose();}peopleMeshes=[];personCount=people.length;const parts=[{geo:new T.SphereGeometry(.175,10,8),y:.60,s:[1,1.05,1]},{geo:new T.SphereGeometry(.16,9,7),y:.32,s:[.9,1.45,.75]},{geo:new T.SphereGeometry(.08,6,5),y:.10,s:[.7,1.35,.8],x:-.065},{geo:new T.SphereGeometry(.08,6,5),y:.10,s:[.7,1.35,.8],x:.065}];for(const part of parts){const m=new T.InstancedMesh(part.geo,mat('#ffffff',.53),people.length);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=false;m.userData.part=part;for(let i=0;i<people.length;i++)m.setColorAt(i,new T.Color(colors[people[i].color]));crowd.add(m);peopleMeshes.push(m);} }
 function updateCrowd(people,time){for(const m of peopleMeshes){const p=m.userData.part;for(let i=0;i<personCount;i++){const person=people[i];if(person.state==='done'){dummy.position.set(0,-20,0);dummy.scale.setScalar(0);}else{const g=ground(person.x,person.y);const walk=person.state==='boarding'?Math.sin(time*21+i)*.04:Math.sin(time*2+i*.5)*.012;dummy.position.set(g.x+(p.x||0),p.y+walk+(person.hop||0),g.z);dummy.scale.set(...p.s);dummy.rotation.y=person.rot||0;}dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.instanceMatrix.needsUpdate=true;}}
 const puffs=[];function puff(x,y,color='#ffffff',n=7){for(let i=0;i<n;i++){const o=sphere(effects,.05+Math.random()*.09,color,0,0,0);place(o,x+(Math.random()-.5)*12,y+(Math.random()-.5)*9,.09);puffs.push({o,life:.4+Math.random()*.35,total:.8,vx:(Math.random()-.5)*.7,vz:(Math.random()-.5)*.7});}}
 function updateEffects(dt){for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];p.life-=dt;if(p.life<=0){effects.remove(p.o);puffs.splice(i,1);continue;}p.o.position.x+=p.vx*dt;p.o.position.z+=p.vz*dt;p.o.position.y+=dt*.25;p.o.scale.setScalar(p.life/p.total);}}
 function clearVehicles(){for(const g of [...vehicles.children])vehicles.remove(g);}
 function gridPoint(b){return {x:126+(b.x+(b.dir%2?(b.len-1)/2:0))*36,y:666+(b.y+(b.dir%2?0:(b.len-1)/2))*36};}
 function angle(dir){return [0,-Math.PI/2,Math.PI,Math.PI/2][dir];}
 function hitBus(x,y,buses){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/576*2-1,-y/1280*2+1),camera);const hits=ray.intersectObjects(vehicles.children,true);for(const h of hits){let o=h.object;while(o&&!o.userData.bus)o=o.parent;if(o&&o.userData.bus.state==='grid')return o.userData.bus;}let best=null,dist=35;for(const b of buses)if(b.state==='grid'){const p=gridPoint(b);const dx=Math.abs(x-p.x),dy=Math.abs(y-p.y+9);if(dx<(b.dir%2?b.len*21:20)&&dy<(b.dir%2?21:b.len*21))return b;const d=Math.hypot(dx,dy);if(d<dist){dist=d;best=b;}}return best;}
 function render(){renderer.render(scene,camera);}
 function screenshot(){render();return renderer.domElement.toDataURL('image/png');}
 window.Art={renderer,scene,camera,vehicles,busModel,place,ground,gridPoint,angle,queuePoint,createCrowd,updateCrowd,puff,updateEffects,clearVehicles,hitBus,render,screenshot};
})();
