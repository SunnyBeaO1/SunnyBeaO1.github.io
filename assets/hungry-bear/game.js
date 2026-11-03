'use strict';
const canvas=document.querySelector('#board'),ctx=canvas.getContext('2d'),N=20,C=42;
const $=s=>document.querySelector(s),dirs={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
let body,food,dir,next,score=0,best=0,state='ready',speed=220,timer=null,queued=false;

let language='en',won=false;
try { if(localStorage.getItem('hungry-bear-language')==='zh') language='zh'; } catch {}
const translations={
 en:{name:'🐻 Hungry Bear',score:'Score',best:'Best',slow:'Stroll',medium:'Jog',fast:'Sprint',speed:'Game speed',pause:'Ⅱ Pause',resume:'▶ Resume',pauseLabel:'Pause or resume',board:'Use arrow keys or WASD to guide the bear to honey',face:'Round-faced bear',readyTitle:'Snack time, bear!',readyMessage:'Collect honey to grow. Avoid the walls and yourself.',start:'Start adventure →',hint:'Arrows / WASD to move · Space to pause',ready:'Ready for an adventure',playing:'On the honey trail',paused:'Taking a break',over:'Adventure over',won:'All honey collected!',overTitle:'A little rest, then try again',wonTitle:'Forest honey champion!',pausedTitle:'A little bear nap',pausedMessage:'The honey can wait. Continue when you’re ready.',again:'Play again →',continue:'Continue adventure →',result:'Score: {score} · Best: {best}',honey:'🍯 +10 per jar',controls:'Direction controls',up:'Up',down:'Down',left:'Left',right:'Right',instructions:'Use keys or swipe · Closing the game pauses it',page:'Hungry Bear · A little forest break',language:'Game language'},
 zh:{name:'🐻 贪吃熊',score:'收获',best:'最佳',slow:'慢悠悠',medium:'小跑步',fast:'飞毛腿',speed:'游戏速度',pause:'Ⅱ 暂停',resume:'▶ 继续',pauseLabel:'暂停或继续',board:'使用方向键或 WASD 控制小熊吃蜂蜜',face:'圆脸熊',readyTitle:'开饭啦，小熊！',readyMessage:'吃蜂蜜长大，别撞到墙壁和自己。',start:'开始冒险 →',hint:'方向键 / WASD 移动 · 空格暂停',ready:'小熊准备出发',playing:'小熊正在寻找蜂蜜',paused:'已暂停',over:'冒险结束',won:'收集完成！',overTitle:'休息一下，再出发',wonTitle:'森林蜂蜜收藏家！',pausedTitle:'小熊打个盹',pausedMessage:'蜂蜜还在等你，准备好就继续吧。',again:'再玩一次 →',continue:'继续冒险 →',result:'这次收获 {score} 分，最佳纪录 {best} 分。',honey:'🍯 每罐 +10 分',controls:'方向控制',up:'向上',down:'向下',left:'向左',right:'向右',instructions:'键盘或滑动控制 · 收起彩蛋会自动暂停',page:'贪吃熊 · 森林小彩蛋',language:'游戏语言'}
};
function updateLanguage(){
 const t=translations[language];
 document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=t.page;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t[el.dataset.i18n]);
 document.querySelectorAll('[data-i18n-label]').forEach(el=>el.setAttribute('aria-label',t[el.dataset.i18nLabel]));
 document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===language)));
 $('#pause').textContent=state==='paused'?t.resume:t.pause;
 $('#status').textContent=t[state==='over'&&won?'won':state];
 $('#title').textContent=state==='paused'?t.pausedTitle:state==='over'?(won?t.wonTitle:t.overTitle):t.readyTitle;
 $('#message').textContent=state==='paused'?t.pausedMessage:state==='over'?t.result.replace('{score}',score).replace('{best}',best):t.readyMessage;
 $('#start').textContent=state==='paused'?t.continue:state==='over'?t.again:t.start;
}
function setLanguage(value){if(!translations[value])return;language=value;try{localStorage.setItem('hungry-bear-language',value)}catch{}updateLanguage()}

const bearPortrait=new Image();
bearPortrait.onload=()=>draw();
bearPortrait.src='bear-face.png';
try{best=Number(localStorage.getItem('hungry-bear-best'))||0}catch{}$('#best').textContent=best;
function reset(){body=[{x:7,y:10},{x:6,y:10},{x:5,y:10}];dir={...dirs.right};next={...dir};score=0;queued=false;$('#score').textContent=0;placeFood();draw()}
function placeFood(){const empty=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!body.some(p=>p.x===x&&p.y===y))empty.push({x,y});food=empty.length?empty[Math.floor(Math.random()*empty.length)]:null}
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function bear(x,y){if(bearPortrait.complete&&bearPortrait.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bearPortrait,x-C/2,y-C/2,C,C);return}ctx.fillStyle='#93613b';for(const dx of [-10,10]){ctx.beginPath();ctx.arc(x+dx,y-10,7,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#bd8751';ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ebc995';ctx.beginPath();ctx.ellipse(x,y+6,10,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#35291f';for(const dx of [-6,6]){ctx.beginPath();ctx.arc(x+dx,y-2,2,0,Math.PI*2);ctx.fill()}ctx.beginPath();ctx.ellipse(x,y+4,3,2.3,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6b4732';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y+6,4,0,Math.PI);ctx.stroke()}
function draw(){ctx.clearRect(0,0,840,840);for(let y=0;y<N;y++)for(let x=0;x<N;x++){ctx.fillStyle=(x+y)%2?'#edf1df':'#f3f5e7';ctx.fillRect(x*C,y*C,C,C)}if(food){ctx.font='29px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🍯',food.x*C+21,food.y*C+22)}for(let i=body.length-1;i>0;i--){const p=body[i];round(p.x*C+4,p.y*C+4,34,34,12,i%2?'#b38b55':'#c49b62');ctx.fillStyle='#d6b77d';ctx.beginPath();ctx.arc(p.x*C+21,p.y*C+21,8,0,Math.PI*2);ctx.fill()}bear(body[0].x*C+21,body[0].y*C+21)}
function schedule(){clearInterval(timer);timer=setInterval(tick,speed)}
function start(){reset();won=false;state='playing';$('#overlay').classList.add('hidden');updateLanguage();schedule()}
function finish(win=false){state='over';won=win;clearInterval(timer);$('#overlay').classList.remove('hidden');$('#face').classList.toggle('portrait',!win);$('#face').textContent=win?'🏆':'';updateLanguage()}
function tick(){if(state!=='playing')return;dir={...next};queued=false;const head={x:body[0].x+dir.x,y:body[0].y+dir.y},eating=food&&head.x===food.x&&head.y===food.y;const occupied=eating?body:body.slice(0,-1);if(head.x<0||head.x>=N||head.y<0||head.y>=N||occupied.some(p=>p.x===head.x&&p.y===head.y)){finish();return}body.unshift(head);if(eating){score+=10;$('#score').textContent=score;if(score>best){best=score;$('#best').textContent=best;try{localStorage.setItem('hungry-bear-best',best)}catch{}}placeFood();if(!food){draw();finish(true);return}}else body.pop();draw()}
function turn(name){if(state!=='playing'||queued)return;const d=dirs[name];if(d.x===-dir.x&&d.y===-dir.y)return;if(d.x===dir.x&&d.y===dir.y)return;next={...d};queued=true}
function pause(){if(state!=='playing'&&state!=='paused')return;if(state==='playing'){state='paused';clearInterval(timer);$('#overlay').classList.remove('hidden');$('#face').classList.remove('portrait');$('#face').textContent='💤'}else{state='playing';$('#overlay').classList.add('hidden');schedule()}updateLanguage()}
$('#start').onclick=()=>state==='paused'?pause():start();$('#pause').onclick=pause;
const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
document.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(keyMap[k]){e.preventDefault();turn(keyMap[k])}else if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();if(state==='ready'||state==='over')start();else pause()}});
document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>turn(b.dataset.dir));document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=+b.dataset.speed;document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));if(state==='playing')schedule()});
let touch=null;canvas.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;turn(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')});canvas.addEventListener('pointercancel',()=>touch=null);window.addEventListener('message',e=>{if(e.source===window.parent&&e.data==='hungry-bear:pause'&&state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});reset();

document.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.language));
updateLanguage();
