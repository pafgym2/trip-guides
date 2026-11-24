/* 몽팸게임방 공용: 경기 티켓 + 코치 퀴즈 + 하루 성적표 (v1, 2026-11-24)
   - 게임 한 판에 티켓 1장. 하루 무료 FREE장, 퀴즈로 더 벌어 하루 최대 MAX판.
   - 퀴즈 3문제를 맞히면 티켓 1장. 틀리면 설명을 보여 주고 다른 문제.
   - 날이 바뀔 때 어제 성적표를 보고 과목별로 90점 이상이면 난이도 +1, 50점 미만이면 -1 (그날 5문제 이상 푼 과목만).
   - 저장은 이 기기 브라우저에만(localStorage). 게임 쪽에서는 MongGate.play(시작함수) 만 부르면 됩니다. */
(function(){
'use strict';
if(window.MongGate)return;
var KEY='mongfam_gate_v1',NEED=3,MINQ=5;
var SUBJ={
  clock:{name:'시계 읽기',max:5},hangul:{name:'한글 낱말',max:4},math1:{name:'덧셈·뺄셈',max:5},
  eng:{name:'영어 단어',max:4},math2:{name:'곱셈·나눗셈',max:5},skate:{name:'스케이트 상식',max:1}
};
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function defPlayer(name,subj){var lv={};Object.keys(SUBJ).forEach(function(k){lv[k]=1;});return{name:name,subj:subj,lv:lv,day:'',played:0,earned:0,q:{},prog:0,streak:0,dbl:0,hist:[],notice:''};}
function defState(){return{v:1,on:true,cur:'a',askedDay:'',pin:'',free:5,max:10,players:{a:defPlayer('다윤',['eng','math2','skate']),b:defPlayer('시헌',['clock','hangul','math1'])}};}
var mem=null;
function load(){var s=null;try{s=JSON.parse(localStorage.getItem(KEY));}catch(e){}
  if(!s||!s.players)s=mem||defState();var d=defState();
  ['a','b'].forEach(function(k){var p=s.players[k]||d.players[k],q=d.players[k];for(var f in q)if(p[f]===undefined)p[f]=q[f];for(var j in q.lv)if(!p.lv[j])p.lv[j]=1;s.players[k]=p;});
  for(var f in d)if(s[f]===undefined)s[f]=d[f];return s;}
var S=load();
function save(){mem=S;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function P(){return S.players[S.cur]||S.players.a;}
function score(a){return a&&a[0]?Math.round(a[1]/a[0]*100):null;}
function roll(p){var t=today();if(p.day===t)return;
  if(p.day){var tot=[0,0],msg=[];for(var k in p.q){var a=p.q[k];tot[0]+=a[0];tot[1]+=a[1];var sc=score(a);
      if(a[0]>=MINQ&&SUBJ[k]){if(sc>=90&&p.lv[k]<SUBJ[k].max){p.lv[k]++;msg.push(SUBJ[k].name+' '+sc+'점 → '+p.lv[k]+'단계로 올라갔어요 🎉');}
        else if(sc<50&&p.lv[k]>1){p.lv[k]--;msg.push(SUBJ[k].name+' '+sc+'점 → '+p.lv[k]+'단계로 다시 연습해요');}}}
    if(tot[0]){p.hist.push({d:p.day,asked:tot[0],ok:tot[1],played:p.played});if(p.hist.length>14)p.hist.shift();}
    p.notice=msg.join('\n');}
  p.day=t;p.played=0;p.earned=0;p.q={};p.prog=0;p.streak=0;}
function rollAll(){roll(S.players.a);roll(S.players.b);save();}
function left(p){return Math.max(0,Math.min(S.free+p.earned,S.max)-p.played);}
function canEarn(p){return S.free+p.earned<S.max;}

/* ---------- 문제 만들기 ---------- */
function R(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function mk(q,ans,wrong,why,say){var seen={},w=[];seen[String(ans)]=1;wrong.forEach(function(x){if(!seen[String(x)]&&w.length<3){seen[String(x)]=1;w.push(x);}});
  var ch=shuffle([ans].concat(w));return{q:q,choices:ch,ans:ch.indexOf(ans),why:why||'',say:say||''};}
function numQ(text,ans,why){var c=[ans+1,ans-1,ans+2,ans-2,ans+10,ans-10,ans+3].filter(function(x){return x>=0;});return mk('<b class="mg-big">'+text+'</b>',ans,shuffle(c.slice(0,4)).concat(c),why,text.replace('×','곱하기').replace('÷','나누기').replace('−','빼기').replace('+','더하기').replace('= ?','은?'));}
var GEN={
  math1:function(L){var a,b;
    if(L<=1){a=R(1,8);b=R(1,9-a);return numQ(a+' + '+b+' = ?',a+b,a+'에서 '+b+'만큼 더 세면 '+(a+b)+'이에요.');}
    if(L===2){a=R(2,9);b=R(1,a-1);return numQ(a+' − '+b+' = ?',a-b,a+'에서 '+b+'를 빼면 '+(a-b)+'이에요.');}
    if(L===3){a=R(2,9);b=R(Math.max(2,10-a),9);return numQ(a+' + '+b+' = ?',a+b,'10을 먼저 만들어요. '+a+'에 '+(10-a)+'을 더하면 10, 남은 '+(b-(10-a))+'을 더하면 '+(a+b)+'.');}
    if(L===4){a=R(11,18);b=R(a-9,9);return numQ(a+' − '+b+' = ?',a-b,a+'에서 '+(a-10)+'을 빼면 10, '+(b-(a-10))+'을 더 빼면 '+(a-b)+'.');}
    a=R(12,89);b=R(2,9);return numQ(a+' + '+b+' = ?',a+b,'일의 자리끼리 먼저 더해요. 답은 '+(a+b)+'.');},
  math2:function(L){var a,b;
    if(L<=1){a=R(2,5);b=R(2,9);return numQ(a+' × '+b+' = ?',a*b,a+'단: '+a+' × '+b+' = '+(a*b));}
    if(L===2){a=R(6,9);b=R(2,9);return numQ(a+' × '+b+' = ?',a*b,a+'단: '+a+' × '+b+' = '+(a*b));}
    if(L===3){a=R(2,9);b=R(2,9);return numQ((a*b)+' ÷ '+a+' = ?',b,a+' × '+b+' = '+(a*b)+'이니까 답은 '+b+'.');}
    if(L===4){a=R(12,29);b=R(2,6);return numQ(a+' × '+b+' = ?',a*b,'십의 자리와 일의 자리를 따로 곱해 더해요. '+(Math.floor(a/10)*10)+'×'+b+' + '+(a%10)+'×'+b+' = '+(a*b));}
    a=R(31,99);b=R(3,9);return numQ(a+' × '+b+' = ?',a*b,(Math.floor(a/10)*10)+'×'+b+' + '+(a%10)+'×'+b+' = '+(a*b));},
  clock:function(L){var h=R(1,12),m=L<=1?0:L===2?pick([0,30]):L===3?pick([0,15,30,45]):L===4?R(0,11)*5:R(0,59);
    var f=function(h,m){return h+'시'+(m?' '+m+'분':'');},h2=h%12+1,h0=(h+10)%12+1,m2=L<=1?30:(m+30)%60,m3=L>=4?(m+5)%60:(m+15)%60;
    var ma=m*6,ha=(h%12)*30+m*.5,tick='';for(var i=0;i<12;i++){var a=i*30*Math.PI/180;tick+='<circle cx="'+(60+Math.sin(a)*46).toFixed(1)+'" cy="'+(60-Math.cos(a)*46).toFixed(1)+'" r="'+(i%3?1.6:2.8)+'" fill="#1d1b3a"/>';}
    [12,3,6,9].forEach(function(n,i){var a=i*90*Math.PI/180;tick+='<text x="'+(60+Math.sin(a)*34).toFixed(1)+'" y="'+(64.5-Math.cos(a)*34).toFixed(1)+'" font-size="12" font-weight="700" text-anchor="middle" fill="#1d1b3a">'+n+'</text>';});
    var svg='<svg viewBox="0 0 120 120" class="mg-clock"><circle cx="60" cy="60" r="55" fill="#fffaf0" stroke="#1d1b3a" stroke-width="4"/>'+tick+
      '<line x1="60" y1="60" x2="60" y2="32" stroke="#1d1b3a" stroke-width="5" stroke-linecap="round" transform="rotate('+ha+' 60 60)"/>'+
      '<line x1="60" y1="60" x2="60" y2="17" stroke="#ff5a4d" stroke-width="3.2" stroke-linecap="round" transform="rotate('+ma+' 60 60)"/><circle cx="60" cy="60" r="3.5" fill="#1d1b3a"/></svg>';
    return mk(svg+'<div>몇 시일까요?</div>',f(h,m),shuffle([f(h2,m),f(h,m2),f(h0,m),f(h,m3),f(h2,m2)]),'짧은 바늘이 시, 긴 빨간 바늘이 분이에요. 답은 '+f(h,m)+'.','몇 시일까요?');},
  hangul:function(L){var W=[
      ['사과🍎','나무🌳','우유🥛','토끼🐰','기차🚂','포도🍇','모자🧢','나비🦋','고래🐳','하마🦛','오리🦆','구두👞','바지👖','치마👗','사자🦁','여우🦊','피자🍕','아기👶','의자🪑','가위✂️','개미🐜','파도🌊'],
      ['바나나🍌','고구마🍠','피아노🎹','코끼리🐘','도토리🌰','너구리🦝','카메라📷','토마토🍅','무지개🌈','개구리🐸','코알라🐨'],
      ['딸기🍓','수박🍉','당근🥕','연필✏️','학교🏫','병원🏥','우산☂️','신발👟','양말🧦','사탕🍬','풍선🎈','안경👓','가방🎒','장갑🧤','선물🎁','편지✉️','축구⚽','농구🏀','구름☁️'],
      ['강아지🐶','고양이🐱','호랑이🐯','자전거🚲','비행기✈️','눈사람⛄','거북이🐢','옥수수🌽','햄버거🍔','물고기🐟','원숭이🐵','소방차🚒','경찰차🚓','컴퓨터💻','초콜릿🍫']];
    var list=W[Math.min(L,4)-1],it=pick(list),ch=Array.from(it),n=L<=1?2:(L===3?2:3),word=ch.slice(0,n).join(''),em=ch.slice(n).join('');
    var k=R(0,n-1),ans=word[k],pool=[];W.forEach(function(l){l.forEach(function(x){Array.from(x).slice(0,3).forEach(function(c){if(/[가-힣]/.test(c)&&c!==ans)pool.push(c);});});});
    var show=word.split('').map(function(c,i){return i===k?'<i class="mg-blank">?</i>':c;}).join('');
    return mk('<div class="mg-em">'+em+'</div><b class="mg-big">'+show+'</b><div>빈칸에 들어갈 글자는?</div>',ans,shuffle(pool),'낱말은 「'+word+'」예요.',word);},
  eng:function(L){
    if(L>=4){var Sx=[['I ___ to school every day.','go',['goes','going','gone']],['She ___ a book now.','is reading',['reads','read','reading']],['He ___ soccer on Sundays.','plays',['play','playing','to play']],
        ['They ___ happy.','are',['is','am','be']],['I ___ ten years old.','am',['is','are','be']],['There ___ two cats.','are',['is','am','be']],['Can you ___ fast?','skate',['skates','skating','skated']],
        ['I ___ breakfast yesterday.','ate',['eat','eats','eating']],['We ___ to Sydney last week.','went',['go','goes','going']],['This is ___ apple.','an',['a','two','many']],
        ['She ___ like milk.',"doesn't",["don't","isn't","aren't"]],['What ___ your name?','is',['are','am','do']],['I have two ___.','brothers',['brother','a brother','brotheres']]];
      var s=pick(Sx);return mk('<b class="mg-mid">'+s[0]+'</b><div>빈칸에 알맞은 말은?</div>',s[1],s[2],'정답 문장: '+s[0].replace('___',s[1]));}
    var V=[[['사과','apple'],['개','dog'],['고양이','cat'],['책','book'],['물','water'],['학교','school'],['집','house'],['나무','tree'],['해','sun'],['달','moon'],['별','star'],['꽃','flower'],['새','bird'],['물고기','fish'],['우유','milk'],['빵','bread'],['의자','chair'],['문','door'],['손','hand'],['자동차','car'],['공','ball'],['비','rain']],
      [['달리다','run'],['먹다','eat'],['마시다','drink'],['자다','sleep'],['읽다','read'],['쓰다','write'],['수영하다','swim'],['뛰어오르다','jump'],['노래하다','sing'],['행복한','happy'],['슬픈','sad'],['큰','big'],['작은','small'],['빠른','fast'],['느린','slow'],['뜨거운','hot'],['차가운','cold'],['새로운','new'],['긴','long'],['짧은','short'],['열다','open'],['닫다','close'],['놀다','play']],
      [['도서관','library'],['날씨','weather'],['채소','vegetable'],['아침 식사','breakfast'],['공항','airport'],['병원','hospital'],['생일','birthday'],['친구','friend'],['가족','family'],['선생님','teacher'],['여름','summer'],['겨울','winter'],['봄','spring'],['가을','autumn'],['산','mountain'],['바다','sea'],['강','river'],['다리(건너는)','bridge'],['부엌','kitchen'],['창문','window'],['숙제','homework'],['질문','question'],['대답','answer'],['나라','country'],['도시','city'],['얼음','ice']]];
    var l=V[Math.min(L,3)-1],w=pick(l),rev=Math.random()<.4,oth=shuffle(l.filter(function(x){return x!==w;}));
    return rev?mk('<b class="mg-big">'+w[1]+'</b><div>무슨 뜻일까요?</div>',w[0],oth.map(function(x){return x[0];}),w[1]+' = '+w[0])
              :mk('<b class="mg-big">'+w[0]+'</b><div>영어로 뭐라고 할까요?</div>',w[1],oth.map(function(x){return x[1];}),w[0]+' = '+w[1]);},
  skate:function(){var B=[
      ['코너를 돌 때 어디로 도는 게 가장 짧을까요?','블록 가까이 안쪽',['바깥쪽 벽 가까이','가운데','어디든 같아요'],'안쪽으로 돌수록 달리는 거리가 짧아요.'],
      ['앞 선수 바로 뒤에 붙어 타면 어떻게 될까요?','바람을 덜 맞아 힘이 덜 들어요',['더 힘들어요','바로 실격이에요','속도가 줄어요'],'앞 선수가 바람을 막아 줘요. 이걸 드래프팅이라고 해요.'],
      ['쇼트트랙 한 바퀴는 몇 m일까요?','111.12m',['100m','200m','400m'],'쇼트트랙 한 바퀴는 111.12m예요.'],
      ['500m 경기는 몇 바퀴일까요?','4바퀴 반',['5바퀴','4바퀴','9바퀴'],'111.12m × 4.5 = 약 500m예요.'],
      ['1000m 경기는 몇 바퀴일까요?','9바퀴',['10바퀴','4바퀴 반','13바퀴 반'],'111.12m × 9 = 약 1000m예요.'],
      ['코너에 너무 빠르게 들어가면 어떻게 될까요?','바깥으로 밀리거나 넘어져요',['더 빨라져요','아무 일도 없어요','체력이 늘어요'],'코너 전에 속도를 살짝 줄이면 안쪽으로 돌 수 있어요.'],
      ['쇼트트랙은 어느 쪽으로 돌까요?','왼쪽(시계 반대 방향)',['오른쪽(시계 방향)','한 바퀴씩 번갈아','마음대로'],'항상 왼쪽으로 돌아요.'],
      ['코너에서 빙판을 짚는 손은 어느 손일까요?','왼손',['오른손','두 손 모두','짚으면 안 돼요'],'왼쪽으로 도니까 안쪽인 왼손을 짚어요.'],
      ['스케이트를 탈 때 꼭 써야 하는 것은?','헬멧',['모자','선글라스','이어폰'],'넘어질 때 머리를 지켜 줘요.'],
      ['긴 경기에서 처음부터 끝까지 힘껏 밀기만 하면?','체력이 일찍 떨어져 막판에 느려져요',['항상 1등을 해요','바로 실격이에요','기록이 더 좋아져요'],'체력을 나눠 쓰고 마지막에 힘을 내요.'],
      ['결승선에서 조금이라도 빨리 들어오려고 하는 동작은?','날 내밀기',['점프하기','손 흔들기','뒤돌아보기'],'스케이트 날이 결승선을 지나는 순간이 기록이에요.'],
      ['총소리가 나기 전에 출발하면?','부정출발이에요',['보너스를 받아요','괜찮아요','바로 우승이에요'],'총소리를 듣고 출발해야 해요.']];
    var b=pick(B);return mk('<b class="mg-mid">'+b[0]+'</b>',b[1],b[2],b[3],b[0]);}
};
var lastQ='';
function nextQ(p){var subs=p.subj.filter(function(k){return GEN[k];});if(!subs.length)subs=['math1'];
  p._i=((p._i|0)+1)%subs.length;var k=subs[p._i],q,n=0;do{q=GEN[k](p.lv[k]||1);n++;}while(q.q===lastQ&&n<6);lastQ=q.q;q.subj=k;return q;}

/* ---------- 화면 ---------- */
var root=null,onDone=null;
function css(){if(document.getElementById('mgCss'))return;var s=document.createElement('style');s.id='mgCss';s.textContent=
'#mgRoot{position:fixed;inset:0;z-index:99999;background:rgba(20,18,45,.72);display:flex;align-items:center;justify-content:center;padding:max(14px,env(safe-area-inset-top,0px)) 14px max(14px,env(safe-area-inset-bottom,0px));font-family:"Jua","IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;-webkit-tap-highlight-color:transparent}'+
'#mgRoot *{box-sizing:border-box}#mgRoot .mg-card{width:100%;max-width:420px;max-height:100%;overflow:auto;background:#fffaf0;color:#1d1b3a;border:3px solid #1d1b3a;border-radius:22px;box-shadow:0 7px 0 #1d1b3a;padding:16px 16px 18px;text-align:center;font-size:16px;line-height:1.45}'+
'#mgRoot h2{margin:0 0 6px;font-size:23px;font-weight:400;line-height:1.2}#mgRoot p{margin:6px 0}#mgRoot .mg-sub{font-size:13.5px;opacity:.75}'+
'#mgRoot button{font:inherit;color:#1d1b3a;cursor:pointer;touch-action:manipulation}#mgRoot .mg-b{display:block;width:100%;margin:9px 0 0;padding:13px 12px;font-size:19px;background:#ffd84d;border:3px solid #1d1b3a;border-radius:16px;box-shadow:0 4px 0 #1d1b3a}'+
'#mgRoot .mg-b:active{transform:translateY(3px);box-shadow:0 1px 0 #1d1b3a}#mgRoot .mg-b.go{background:#ff5a4d;color:#fffaf0}#mgRoot .mg-b.gh{background:#fff;box-shadow:none;border-width:2px;font-size:16px;padding:10px}'+
'#mgRoot .mg-ch{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}#mgRoot .mg-ch.one{grid-template-columns:1fr}#mgRoot .mg-ch button{margin:0;padding:14px 8px;font-size:20px;background:#fff;border:3px solid #1d1b3a;border-radius:16px;box-shadow:0 4px 0 #1d1b3a;min-height:58px}'+
'#mgRoot .mg-ch button.ok{background:#3fae5a;color:#fff}#mgRoot .mg-ch button.no{background:#ff5a4d;color:#fff}#mgRoot .mg-ch button:disabled{opacity:1}'+
'#mgRoot .mg-big{display:block;font-size:44px;font-weight:400;line-height:1.2;margin:4px 0}#mgRoot .mg-mid{display:block;font-size:21px;font-weight:400;line-height:1.35;margin:4px 0}#mgRoot .mg-em{font-size:54px;line-height:1.1}'+
'#mgRoot .mg-blank{font-style:normal;display:inline-block;min-width:1em;background:#ffd84d;border:3px dashed #1d1b3a;border-radius:10px;margin:0 3px;padding:0 4px}#mgRoot .mg-clock{width:150px;height:150px;display:block;margin:2px auto 4px}'+
'#mgRoot .mg-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13.5px;margin-bottom:8px}#mgRoot .mg-pill{background:#1d1b3a;color:#ffd84d;border-radius:999px;padding:3px 10px;white-space:nowrap}'+
'#mgRoot .mg-dots i{display:inline-block;width:15px;height:15px;border-radius:50%;border:2.5px solid #1d1b3a;margin:0 2px;background:#fff}#mgRoot .mg-dots i.on{background:#3fae5a}'+
'#mgRoot .mg-why{margin-top:10px;background:#e7f6ff;border:2px solid #1d1b3a;border-radius:14px;padding:9px 11px;font-size:15.5px;text-align:left}'+
'#mgRoot table{width:100%;border-collapse:collapse;font-size:14.5px;margin-top:8px}#mgRoot td,#mgRoot th{padding:6px 4px;border-bottom:1.5px solid rgba(29,27,58,.18);font-weight:400}#mgRoot th{font-size:12.5px;opacity:.7}#mgRoot td:first-child,#mgRoot th:first-child{text-align:left}'+
'#mgRoot .mg-seg{display:flex;gap:8px;margin:8px 0}#mgRoot .mg-seg button{flex:1;padding:9px 6px;font-size:17px;background:#fff;border:3px solid #1d1b3a;border-radius:14px}#mgRoot .mg-seg button[aria-pressed=true]{background:#7b5cf0;color:#fff}'+
'#mgRoot .mg-set{text-align:left;font-size:15px}#mgRoot .mg-set label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0}#mgRoot .mg-set input[type=text],#mgRoot .mg-set input[type=tel],#mgRoot .mg-set input[type=number]{font:inherit;width:96px;padding:6px 8px;border:2px solid #1d1b3a;border-radius:10px;background:#fff;color:#1d1b3a;text-align:center}'+
'#mgRoot .mg-set .chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}#mgRoot .mg-set .chips button{padding:5px 9px;font-size:13.5px;border:2px solid #1d1b3a;border-radius:999px;background:#fff}#mgRoot .mg-set .chips button[aria-pressed=true]{background:#35c9a3}'+
'#mgToast{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:99998;background:#1d1b3a;color:#ffd84d;border-radius:999px;padding:7px 14px;font:400 15px "Jua","Apple SD Gothic Neo",system-ui,sans-serif;white-space:nowrap;pointer-events:none;transition:opacity .4s}';
  document.head.appendChild(s);}
function open(html){css();if(!root){root=document.createElement('div');root.id='mgRoot';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
    ['keydown','keyup','pointerdown','touchstart','mousedown'].forEach(function(ev){root.addEventListener(ev,function(e){e.stopPropagation();});});document.body.appendChild(root);}
  root.innerHTML='<div class="mg-card">'+html+'</div>';return root.firstChild;}
function close(){if(root){root.remove();root=null;}try{speechSynthesis.cancel();}catch(e){}}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function toast(t){css();var e=document.getElementById('mgToast');if(!e){e=document.createElement('div');e.id='mgToast';document.body.appendChild(e);}e.textContent=t;e.style.opacity='1';clearTimeout(toast.t);toast.t=setTimeout(function(){e.style.opacity='0';},1900);}
function say(t){if(!t)return;try{var u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
function ticketsHtml(p){return '<span class="mg-pill">🎟 '+left(p)+'장</span>';}
function head(p,t){return '<div class="mg-top"><span>'+esc(p.name)+(t?' · '+t:'')+'</span>'+ticketsHtml(p)+'</div>';}

function startGame(cb){var p=P();p.played++;save();close();toast('🎟 남은 티켓 '+left(p)+'장 · '+p.name);if(cb)cb();}
function who(cb){var c=open('<h2>누가 할까요?</h2><p class="mg-sub">이름을 누르면 오늘 티켓과 퀴즈가 그 사람 것으로 돼요.</p>'+
    ['a','b'].map(function(k){return '<button class="mg-b" data-k="'+k+'">'+esc(S.players[k].name)+' <span style="font-size:14px">🎟 '+left(S.players[k])+'장</span></button>';}).join('')+
    '<button class="mg-b gh" data-k="">닫기</button>');
  c.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(!b.dataset.k){close();return;}S.cur=b.dataset.k;S.askedDay=today();save();close();cb();};}
function gate(cb){var p=P();
  if(p.notice){var n=p.notice;p.notice='';save();var c0=open(head(p)+'<h2>어제 성적표</h2><div class="mg-why">'+esc(n).replace(/\n/g,'<br>')+'</div><button class="mg-b go">좋아요!</button>');c0.querySelector('button').onclick=function(){close();gate(cb);};return;}
  if(left(p)>0){startGame(cb);return;}
  if(!canEarn(p)){var c=open(head(p)+'<div class="mg-em">🌙</div><h2>오늘은 '+S.max+'판을 다 했어요</h2><p>내일 또 만나요! 내일은 무료 티켓 '+S.free+'장이 다시 생겨요.</p><button class="mg-b" data-a="rep">📋 성적표 보기</button><button class="mg-b gh" data-a="x">닫기</button>');
    c.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='rep')panel();else close();};return;}
  var c2=open(head(p)+'<div class="mg-em">🎟</div><h2>티켓을 다 썼어요</h2><p>코치 퀴즈 <b>'+NEED+'문제</b>를 맞히면 티켓 1장을 받아요.</p><button class="mg-b go" data-a="q">퀴즈 풀기</button><button class="mg-b gh" data-a="x">그만하기</button>');
  c2.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='q')quiz(cb);else close();};}
function quiz(cb){var p=P(),q=nextQ(p),lock=false;
  var dots='';for(var i=0;i<NEED;i++)dots+='<i class="'+(i<p.prog?'on':'')+'"></i>';
  var long=q.choices.some(function(x){return String(x).length>9;});
  var c=open(head(p,SUBJ[q.subj].name+' '+(SUBJ[q.subj].max>1?p.lv[q.subj]+'단계':''))+'<div class="mg-q">'+q.q+'</div><div class="mg-ch'+(long?' one':'')+'">'+q.choices.map(function(x,i){return '<button data-i="'+i+'"'+(long?' style="font-size:17px"':'')+'>'+esc(x)+'</button>';}).join('')+'</div>'+
    '<p class="mg-dots" style="margin-top:12px">'+dots+'</p><div class="mg-x"></div><button class="mg-b gh" data-a="x" style="margin-top:10px">그만하기</button>');
  if(q.say&&(q.subj==='hangul'||q.subj==='clock'||q.subj==='math1'))setTimeout(function(){say(q.say);},250);
  c.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    if(b.dataset.a==='x'){close();return;}if(b.dataset.a==='n'){quiz(cb);return;}
    if(lock||b.dataset.i===undefined)return;lock=true;var i=+b.dataset.i,ok=i===q.ans,a=p.q[q.subj]||(p.q[q.subj]=[0,0]);a[0]++;
    c.querySelectorAll('.mg-ch button').forEach(function(x,j){x.disabled=true;if(j===q.ans)x.className='ok';});
    if(ok){a[1]++;p.prog++;p.streak++;var extra='';if(p.streak>0&&p.streak%3===0){p.dbl=Math.min(3,(p.dbl|0)+1);extra=' 🔥 3연속 정답! 포인트 2배 쿠폰 +1';}
      if(p.prog>=NEED&&canEarn(p)){p.prog=0;p.earned++;save();setTimeout(function(){earned(cb,extra);},650);}
      else{if(p.prog>=NEED)p.prog=0;save();c.querySelector('.mg-x').innerHTML='<div class="mg-why" style="background:#e3f7e7">⭕ 정답!'+extra+'</div>';setTimeout(function(){if(root)quiz(cb);},extra?1500:750);}}
    else{b.className='no';p.streak=0;save();c.querySelector('.mg-x').innerHTML='<div class="mg-why">❌ 아쉬워요. 정답은 <b>'+esc(q.choices[q.ans])+'</b><br>'+esc(q.why)+'</div><button class="mg-b" data-a="n">다음 문제</button>';}};}
function earned(cb,extra){var p=P();var c=open(head(p)+'<div class="mg-em">🎉</div><h2>티켓 1장을 받았어요!</h2>'+(extra?'<p>'+extra+'</p>':'')+(cb?'<button class="mg-b go" data-a="go">게임 시작</button>':'')+(canEarn(p)?'<button class="mg-b" data-a="q">퀴즈 더 풀기</button>':'')+'<button class="mg-b gh" data-a="x">닫기</button>');
  c.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='go')startGame(cb);else if(b.dataset.a==='q')quiz(cb);else close();};}
function reportHtml(p){var rows='',tot=[0,0];p.subj.forEach(function(k){if(!SUBJ[k])return;var a=p.q[k]||[0,0];tot[0]+=a[0];tot[1]+=a[1];var sc=score(a);
    rows+='<tr><td>'+SUBJ[k].name+'</td><td>'+(SUBJ[k].max>1?p.lv[k]+'단계':'-')+'</td><td>'+a[1]+' / '+a[0]+'</td><td>'+(sc===null?'-':sc+'점')+'</td></tr>';});
  var sc=score(tot),h='<table><tr><th>과목</th><th>난이도</th><th>맞힘</th><th>점수</th></tr>'+rows+'<tr><td><b>오늘 합계</b></td><td></td><td>'+tot[1]+' / '+tot[0]+'</td><td><b>'+(sc===null?'-':sc+'점')+'</b></td></tr></table>';
  h+='<p class="mg-sub">한 과목을 하루 '+MINQ+'문제 이상 풀어 90점이 넘으면 다음 날 그 과목이 한 단계 어려워져요.</p>';
  if(p.hist.length){h+='<table><tr><th>지난 날</th><th>맞힘</th><th>점수</th><th>게임</th></tr>'+p.hist.slice(-7).reverse().map(function(x){return '<tr><td>'+x.d.slice(5).replace('-','/')+'</td><td>'+x.ok+' / '+x.asked+'</td><td>'+Math.round(x.ok/x.asked*100)+'점</td><td>'+(x.played|0)+'판</td></tr>';}).join('')+'</table>';}
  return h;}
function panel(){rollAll();var p=P();
  var c=open('<h2>🎟 티켓 · 📋 성적표</h2><div class="mg-seg">'+['a','b'].map(function(k){return '<button data-k="'+k+'" aria-pressed="'+(S.cur===k)+'">'+esc(S.players[k].name)+'</button>';}).join('')+'</div>'+
    '<p>오늘 <b>'+p.played+'판</b> 했어요 · 남은 티켓 <b>'+left(p)+'장</b>'+(S.on?'':' <span class="mg-sub">(티켓 꺼짐)</span>')+((p.dbl|0)?'<br>🔥 포인트 2배 쿠폰 '+p.dbl+'장 (아이스 대시)':'')+'</p>'+reportHtml(p)+
    '<button class="mg-b go" data-a="q">퀴즈 풀기</button><button class="mg-b gh" data-a="set">부모 설정</button><button class="mg-b gh" data-a="x">닫기</button>');
  c.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    if(b.dataset.k){S.cur=b.dataset.k;S.askedDay=today();save();panel();return;}
    if(b.dataset.a==='q')quiz(null);else if(b.dataset.a==='set')pinGate();else if(b.dataset.a==='x'){close();if(onDone)onDone();}};}
function pinGate(){var set=!S.pin;var c=open('<h2>부모 확인</h2><p class="mg-sub">'+(set?'처음이에요. 부모님만 아는 숫자 4자리를 정해 주세요.':'비밀번호 4자리를 넣어 주세요.')+'</p><div class="mg-set"><label>비밀번호<input type="tel" inputmode="numeric" maxlength="4" id="mgPin" autocomplete="off"></label></div><p class="mg-sub" id="mgPinMsg"></p><button class="mg-b go" data-a="ok">확인</button><button class="mg-b gh" data-a="x">뒤로</button>');
  c.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='x'){panel();return;}
    var v=(c.querySelector('#mgPin').value||'').replace(/\D/g,'');if(v.length!==4){c.querySelector('#mgPinMsg').textContent='숫자 4자리를 넣어 주세요.';return;}
    if(set){S.pin=v;save();settings();}else if(v===S.pin)settings();else c.querySelector('#mgPinMsg').textContent='비밀번호가 달라요.';};}
function settings(){var h='<h2>부모 설정</h2><div class="mg-set"><label>티켓 제도 켜기<button class="mg-tg" data-a="on" style="padding:6px 14px;border:2px solid #1d1b3a;border-radius:999px;background:'+(S.on?'#3fae5a;color:#fff':'#fff')+'">'+(S.on?'켜짐':'꺼짐')+'</button></label>'+
    '<label>하루 무료 판수<input type="number" id="mgFree" min="0" max="30" value="'+S.free+'"></label><label>하루 최대 판수<input type="number" id="mgMax" min="1" max="50" value="'+S.max+'"></label>';
  ['a','b'].forEach(function(k){var p=S.players[k];h+='<hr style="border:0;border-top:2px solid rgba(29,27,58,.2);margin:10px 0"><label>이름<input type="text" maxlength="6" data-n="'+k+'" value="'+esc(p.name)+'"></label><div class="chips">'+
      Object.keys(SUBJ).map(function(s){return '<button data-p="'+k+'" data-s="'+s+'" aria-pressed="'+(p.subj.indexOf(s)>=0)+'">'+SUBJ[s].name+(SUBJ[s].max>1?' '+p.lv[s]+'단계':'')+'</button>';}).join('')+'</div>'+
      '<div class="chips">'+p.subj.filter(function(s){return SUBJ[s]&&SUBJ[s].max>1;}).map(function(s){return '<button data-p="'+k+'" data-lv="'+s+'" data-d="-1">'+SUBJ[s].name+' ▼</button><button data-p="'+k+'" data-lv="'+s+'" data-d="1">'+SUBJ[s].name+' ▲</button>';}).join('')+'</div>'+
      '<button class="mg-b gh" data-a="reset" data-p="'+k+'" style="font-size:14px;padding:7px">'+esc(p.name)+' 오늘 기록 지우기(티켓 다시 '+S.free+'장)</button>';});
  h+='</div><button class="mg-b go" data-a="save">저장</button>';
  var c=open(h);
  function read(){S.free=Math.max(0,Math.min(30,parseInt(c.querySelector('#mgFree').value,10)||0));S.max=Math.max(S.free,Math.min(50,parseInt(c.querySelector('#mgMax').value,10)||S.free));
    c.querySelectorAll('input[data-n]').forEach(function(i){var v=i.value.trim().slice(0,6);if(v)S.players[i.dataset.n].name=v;});save();}
  c.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    if(b.dataset.a==='on'){read();S.on=!S.on;save();settings();return;}
    if(b.dataset.a==='save'){read();panel();return;}
    var p=S.players[b.dataset.p];if(!p)return;read();
    if(b.dataset.a==='reset'){p.played=0;p.earned=0;p.q={};p.prog=0;p.streak=0;save();settings();return;}
    if(b.dataset.s){var i=p.subj.indexOf(b.dataset.s);if(i>=0){if(p.subj.length>1)p.subj.splice(i,1);}else p.subj.push(b.dataset.s);save();settings();return;}
    if(b.dataset.lv){var s=b.dataset.lv;p.lv[s]=Math.max(1,Math.min(SUBJ[s].max,p.lv[s]+(+b.dataset.d)));save();settings();}};}

window.MongGate={
  /* 게임 시작 전에 부른다. 티켓이 있으면 바로 cb, 없으면 퀴즈 화면. */
  play:function(cb){S=load();rollAll();if(!S.on){cb();return;}if(S.askedDay!==today()){who(function(){gate(cb);});return;}gate(cb);},
  panel:function(done){S=load();onDone=done||null;panel();},
  info:function(){S=load();rollAll();var p=P();return{name:p.name,left:left(p),played:p.played,on:S.on,free:S.free,max:S.max,dbl:p.dbl|0,correct:Object.keys(p.q).reduce(function(n,k){return n+p.q[k][1];},0)};},
  takeDouble:function(){S=load();var p=P();if((p.dbl|0)>0){p.dbl--;save();return true;}return false;},
  _test:{gen:GEN,subj:SUBJ,state:function(){return S;},set:function(s){S=s;save();},roll:rollAll,reset:function(){try{localStorage.removeItem(KEY);}catch(e){}mem=null;S=load();}}
};
})();
