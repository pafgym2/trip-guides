/* 몽치치 패밀리 라이프·일상 공용 도구 (v1, 2026-11-24)
   저장은 이 기기 브라우저에만(localStorage, 이름이 mf_ 로 시작). 설정·백업 화면에서 파일로 내보내 다른 기기로 옮길 수 있어요. */
(function(){
'use strict';
var MF=window.MF={};
var COLORS=['#7cc6f2','#ffb3a1','#ffd84d','#8fdcb4','#c9b5f0','#f7b267'];
MF.esc=function(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
MF.load=function(k,def){try{var v=JSON.parse(localStorage.getItem('mf_'+k));return v==null?def:v;}catch(e){return def;}};
MF.save=function(k,v){try{localStorage.setItem('mf_'+k,JSON.stringify(v));return true;}catch(e){MF.toast('저장하지 못했어요');return false;}};
MF.uid=function(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);};
MF.ymd=function(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);};
MF.parse=function(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
MF.day=function(s,year){var d=MF.parse(s);return (year?d.getFullYear()+'. ':'')+(d.getMonth()+1)+'. '+d.getDate()+' ('+'일월화수목금토'[d.getDay()]+')';};
MF.members=function(){var m=MF.load('members',null);if(!m||!m.length)m=[{id:'dad',name:'아빠'},{id:'mom',name:'엄마'},{id:'k1',name:'다윤',kid:true},{id:'k2',name:'시헌',kid:true}];
  m.forEach(function(x,i){x.color=COLORS[i%COLORS.length];});return m;};
MF.member=function(id){var m=MF.members();for(var i=0;i<m.length;i++)if(m[i].id===id)return m[i];return{id:id,name:'?',color:'#eee'};};
MF.toast=function(t){var e=document.getElementById('mfToast');if(!e){e=document.createElement('div');e.id='mfToast';document.body.appendChild(e);}e.textContent=t;e.style.opacity='1';clearTimeout(MF._tt);MF._tt=setTimeout(function(){e.style.opacity='0';},1800);};
/* 머리줄: 🏠(첫 화면의 해당 카테고리로) + 제목 */
MF.head=function(title,cat,sub){var m=document.querySelector('main');var h=document.createElement('div');
  h.innerHTML='<div class="mf-head"><a class="mf-home" href="../#'+cat+'" aria-label="몽치치 패밀리로 돌아가기">🏠</a><h1>'+title+'</h1></div>'+(sub?'<p class="mf-sub">'+sub+'</p>':'');
  m.insertBefore(h,m.firstChild);
  var f=document.createElement('p');f.className='mf-foot';f.innerHTML='<span id="mfSync">적은 내용은 이 기기에만 저장돼요.</span> <a href="../fam/">설정 · 공유 · 백업</a>';m.appendChild(f);};
/* 가족 고르기 줄. opt.kids 아이만, opt.all '모두' 버튼 추가. 고른 사람은 기억해 둡니다. */
MF.who=function(el,opt,cb){opt=opt||{};var list=MF.members().filter(function(x){return !opt.kids||x.kid;});if(!list.length)list=MF.members();
  var key='who'+(opt.kids?'_kid':'')+(opt.all?'_all':''),cur=MF.load(key,opt.all?'all':list[0].id);if(cur!=='all'&&!list.some(function(x){return x.id===cur;}))cur=opt.all?'all':list[0].id;
  function draw(){el.className='mf-who';el.innerHTML=(opt.all?'<button data-id="all" aria-pressed="'+(cur==='all')+'">모두</button>':'')+list.map(function(x){return '<button data-id="'+x.id+'" style="--c:'+x.color+'" aria-pressed="'+(cur===x.id)+'">'+MF.esc(x.name)+'</button>';}).join('');}
  el.onclick=function(e){var b=e.target.closest('button');if(!b)return;cur=b.dataset.id;MF.save(key,cur);draw();cb(cur);};draw();cb(cur);return{get:function(){return cur;},list:list};};
/* 입력 창. fields: [{k,label,type:'text|date|time|number|select|opts|stars|textarea|who',opts:[[값,이름]],ph,req,step,kids}] */
MF.form=function(o){var v=Object.assign({},o.value||{}),old=document.getElementById('mfSheet');if(old)old.remove();
  var root=document.createElement('div');root.id='mfSheet';
  var h='<div class="sh" role="dialog" aria-modal="true"><h2>'+MF.esc(o.title)+'</h2>';
  o.fields.forEach(function(f){var val=v[f.k]==null?'':v[f.k];h+='<label>'+MF.esc(f.label)+'</label>';
    if(f.type==='textarea')h+='<textarea data-k="'+f.k+'" maxlength="'+(f.max||300)+'" placeholder="'+MF.esc(f.ph||'')+'">'+MF.esc(val)+'</textarea>';
    else if(f.type==='select')h+='<select data-k="'+f.k+'">'+f.opts.map(function(x){return '<option value="'+MF.esc(x[0])+'"'+(String(val)===String(x[0])?' selected':'')+'>'+MF.esc(x[1])+'</option>';}).join('')+'</select>';
    else if(f.type==='opts'||f.type==='stars'||f.type==='who'){var op=f.type==='stars'?[1,2,3,4,5].map(function(n){return[n,'★'.repeat(n)];}):f.type==='who'?MF.members().filter(function(x){return !f.kids||x.kid;}).map(function(x){return[x.id,x.name];}):f.opts;
      h+='<div class="opts" data-k="'+f.k+'">'+op.map(function(x){return '<button type="button" data-v="'+MF.esc(x[0])+'" aria-pressed="'+(String(val)===String(x[0]))+'">'+MF.esc(x[1])+'</button>';}).join('')+'</div>';}
    else h+='<input type="'+(f.type||'text')+'" data-k="'+f.k+'" value="'+MF.esc(val)+'" placeholder="'+MF.esc(f.ph||'')+'"'+(f.type==='number'?' inputmode="decimal" step="'+(f.step||'any')+'"':'')+(f.max?' maxlength="'+f.max+'"':'')+' autocomplete="off">';});
  h+='<div class="acts">'+(o.onDelete?'<button class="btn del" data-a="del">지우기</button>':'')+'<button class="btn" data-a="x">취소</button><button class="btn go" data-a="ok">저장</button></div></div>';
  root.innerHTML=h;document.body.appendChild(root);
  root.addEventListener('click',function(e){if(e.target===root){root.remove();return;}var b=e.target.closest('button');if(!b)return;
    if(b.dataset.v!==undefined){var g=b.parentNode;v[g.dataset.k]=b.dataset.v;g.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b);});return;}
    if(b.dataset.a==='x'){root.remove();return;}
    if(b.dataset.a==='del'){if(confirm('지울까요? 되돌릴 수 없어요.')){root.remove();o.onDelete();}return;}
    if(b.dataset.a==='ok'){root.querySelectorAll('[data-k]').forEach(function(i){if(i.classList.contains('opts'))return;v[i.dataset.k]=i.value.trim();});
      for(var j=0;j<o.fields.length;j++){var f=o.fields[j];if(f.req&&(v[f.k]==null||v[f.k]==='')){MF.toast(f.label+'을(를) 넣어 주세요');return;}}
      root.remove();o.onSave(v);}});
  var first=root.querySelector('input[type=text],textarea');if(first&&!o.value)setTimeout(function(){try{first.focus();}catch(e){}},60);};
/* ---------- 가족 공유(폰끼리 같이 보기) ----------
   가족 비밀번호로 이 기기에서 내용을 잠근(AES-GCM) 뒤 공용 저장소에 올립니다. 저장소에는 잠긴 글자만 있고, 방 번호도 비밀번호에서 만들어져서
   비밀번호를 모르면 찾을 수도 읽을 수도 없어요. 두 기기가 따로 고친 내용은 항목 단위로 합칩니다(merge3). */
var SK=['members','schedule','chores','pack','eatout','diary','skate','growth','books'];
var API='https://dzmxwsxcwtugnyyfvnja.supabase.co/rest/v1/rpc/',AK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXh3c3hjd3R1Z255eWZ2bmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzUxNjcsImV4cCI6MjA5NjgxMTE2N30.PkzQD7JJuFdtMGWzm2FC9HFzf1wVW1Wh9wg41SxJKzg';
var LS=function(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}return null;};
MF._rpc=function(fn,body){return fetch(API+fn,{method:'POST',headers:{apikey:AK,Authorization:'Bearer '+AK,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('rpc '+r.status);return r.json();});};
function cfg(){try{return JSON.parse(LS('mfs_cfg'));}catch(e){return null;}}
MF.shared=function(){return !!cfg();};
function b64(buf){var s='',a=new Uint8Array(buf);for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);}
function unb64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
var keyCache=null;
function aes(){var c=cfg();if(keyCache&&keyCache.raw===c.key)return Promise.resolve(keyCache.k);return crypto.subtle.importKey('raw',unb64(c.key),'AES-GCM',false,['encrypt','decrypt']).then(function(k){keyCache={raw:c.key,k:k};return k;});}
function enc(obj){return aes().then(function(k){var iv=crypto.getRandomValues(new Uint8Array(12));return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(JSON.stringify(obj))).then(function(ct){var a=new Uint8Array(12+ct.byteLength);a.set(iv);a.set(new Uint8Array(ct),12);return b64(a);});});}
function dec(s){return aes().then(function(k){var a=unb64(s);return crypto.subtle.decrypt({name:'AES-GCM',iv:a.slice(0,12)},k,a.slice(12)).then(function(pt){return JSON.parse(new TextDecoder().decode(pt));});});}
function derive(pass){var e=new TextEncoder();return crypto.subtle.importKey('raw',e.encode(pass),'PBKDF2',false,['deriveBits']).then(function(bk){return crypto.subtle.deriveBits({name:'PBKDF2',salt:e.encode('mongfam-share-v1'),iterations:200000,hash:'SHA-256'},bk,512);})
  .then(function(bits){var a=new Uint8Array(bits),room='';for(var i=32;i<52;i++)room+=('0'+a[i].toString(16)).slice(-2);return{room:room,key:b64(a.slice(0,32))};});}
/* 3방향 합치기: b=마지막으로 맞췄을 때, m=이 기기, t=저장소 */
function isObj(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function eq(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function idArr(a){return Array.isArray(a)&&a.every(function(x){return isObj(x)&&x.id!=null;});}
function idx(a){var o={};a.forEach(function(x){o[x.id]=x;});return o;}
function merge3(b,m,t,num){
  if(eq(m,t))return m;if(b!==undefined&&eq(m,b))return t;if(b!==undefined&&eq(t,b))return m;
  if(Array.isArray(m)&&Array.isArray(t)){var ba=Array.isArray(b)?b:[],out=[];
    if(idArr(m)&&idArr(t)&&idArr(ba)){var bi=idx(ba),mi=idx(m),seen={};
      t.forEach(function(x){seen[x.id]=1;var inB=bi[x.id],inM=mi[x.id];if(inM)out.push(merge3(inB,inM,x,num));else if(!inB||!eq(inB,x))out.push(x);});
      m.forEach(function(x){if(seen[x.id])return;var inB=bi[x.id];if(!inB||!eq(inB,x))out.push(x);});return out;}
    if(m.concat(t).every(function(x){return typeof x!=='object';})){out=t.filter(function(x){return m.indexOf(x)>=0||ba.indexOf(x)<0;});m.forEach(function(x){if(t.indexOf(x)<0&&ba.indexOf(x)<0)out.push(x);});return out;}
    return m;}
  if(isObj(m)&&isObj(t)){var bo=isObj(b)?b:{},o={},ks={};Object.keys(t).concat(Object.keys(m)).forEach(function(k){ks[k]=1;});
    Object.keys(ks).forEach(function(k){var inM=k in m,inT=k in t,inB=k in bo;
      if(inM&&inT)o[k]=merge3(inB?bo[k]:undefined,m[k],t[k],num||k==='bal');else if(inM){if(!inB||!eq(bo[k],m[k]))o[k]=m[k];}else if(!inB||!eq(bo[k],t[k]))o[k]=t[k];});return o;}
  if(num&&typeof m==='number'&&typeof t==='number')return Math.max(0,t+(m-(typeof b==='number'?b:0)));
  return m;}
MF._merge3=merge3;
var busy={},again={},lives=[],timers={},state='';
function setState(s){state=s;var e=document.getElementById('mfSync');if(e)e.textContent=MF.shared()?'가족 공유 켜짐 · '+s:'적은 내용은 이 기기에만 저장돼요.';}
function parse(s){if(s==null)return undefined;try{return JSON.parse(s);}catch(e){return undefined;}}
function runKey(k,n){var c=cfg();if(!c)return Promise.resolve(false);
  return MF._rpc('fam_get',{p_room:c.room,p_keys:[k]}).then(function(rows){var r=rows&&rows[0]||null,rv=r?r.ver:0,lv=+LS('mfs_v_'+k)||0,raw=LS('mf_'+k),local=parse(raw),dirty=LS('mfs_d_'+k)==='1';
    function done(obj,ver,pushedRaw){LS('mfs_b_'+k,JSON.stringify(obj));LS('mfs_v_'+k,String(ver));if(pushedRaw===undefined||LS('mf_'+k)===pushedRaw)LS('mfs_d_'+k,null);else again[k]=1;}
    function put(obj,expect,changed){var pushedRaw=JSON.stringify(obj);return enc(obj).then(function(d){return MF._rpc('fam_put',{p_room:c.room,p_k:k,p_data:d,p_ver:expect});}).then(function(nv){
        if(nv>0){done(obj,nv,pushedRaw);return changed;}if((n|0)>=3)throw new Error('conflict');return runKey(k,(n|0)+1).then(function(ch){return ch||changed;});});}
    if(r&&rv!==lv)return dec(r.data).then(function(theirs){var merged=local===undefined?theirs:merge3(parse(LS('mfs_b_'+k)),local,theirs),changed=!eq(merged,local);
        if(changed)LS('mf_'+k,JSON.stringify(merged));if(eq(merged,theirs)){done(theirs,rv);return changed;}return put(merged,rv,changed);});
    if(local!==undefined&&(dirty||!r))return put(local,rv,false);
    return false;});}
function syncKey(k){if(!cfg())return Promise.resolve(false);if(busy[k]){again[k]=1;return busy[k];}
  busy[k]=runKey(k,0).then(function(ch){setState('방금 맞췄어요');return ch;},function(e){setState(navigator.onLine===false?'인터넷이 연결되면 맞춰요':'잠시 뒤 다시 맞춰요');return false;})
    .then(function(ch){busy[k]=null;if(ch)lives.forEach(function(l){if(l.keys.indexOf(k)>=0)l.fire();});if(again[k]){again[k]=0;setTimeout(function(){syncKey(k);},300);}return ch;});
  return busy[k];}
MF.syncAll=function(keys){return Promise.all((keys||SK).map(syncKey));};
/* 페이지가 쓰는 묶음을 알려 주면: 열 때·돌아올 때·25초마다 맞추고, 다른 폰에서 바뀐 게 오면 cb 로 다시 그립니다(입력 창이 열려 있으면 닫힌 뒤). */
MF.live=function(keys,cb){keys=keys.concat(['members']);var l={keys:keys,pend:false,fire:function(){if(document.getElementById('mfSheet')){l.pend=true;return;}cb();}};lives.push(l);
  setInterval(function(){if(l.pend&&!document.getElementById('mfSheet')){l.pend=false;cb();}},800);
  if(!cfg()){setState('');return;}setState('맞추는 중');MF.syncAll(keys);
  setInterval(function(){if(!document.hidden&&cfg())MF.syncAll(keys);},25000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&cfg())MF.syncAll(keys);});
  addEventListener('online',function(){if(cfg())MF.syncAll(keys);});};
var save0=MF.save;
MF.save=function(k,v){var ok=save0(k,v);if(ok&&SK.indexOf(k)>=0&&cfg()){LS('mfs_d_'+k,'1');clearTimeout(timers[k]);timers[k]=setTimeout(function(){syncKey(k);},700);}return ok;};
/* 설정 화면에서 쓰는 것 */
MF.shareProbe=function(){return MF._rpc('fam_get',{p_room:'0000000000000000000000000000000000000000',p_keys:['x']}).then(function(){return true;},function(){return false;});};
MF.shareOn=function(pass){return derive(pass).then(function(c){LS('mfs_cfg',JSON.stringify(c));keyCache=null;SK.forEach(function(k){LS('mfs_v_'+k,null);LS('mfs_b_'+k,null);if(LS('mf_'+k)!=null)LS('mfs_d_'+k,'1');});
    return MF._rpc('fam_get',{p_room:c.room,p_keys:SK}).then(function(rows){return Promise.all(SK.map(function(k){return runKey(k,0);})).then(function(){return{existing:rows.length};});});})
    .catch(function(e){MF.shareOff();throw e;});};
MF.shareOff=function(){LS('mfs_cfg',null);SK.forEach(function(k){LS('mfs_v_'+k,null);LS('mfs_b_'+k,null);LS('mfs_d_'+k,null);});keyCache=null;};
MF.markAllDirty=function(){SK.forEach(function(k){if(LS('mf_'+k)!=null)LS('mfs_d_'+k,'1');});};
MF.stars=function(n){n=+n||0;return '<span style="color:#f2a100;letter-spacing:1px">'+'★'.repeat(n)+'</span><span style="color:#d9d2c2;letter-spacing:1px">'+'★'.repeat(5-n)+'</span>';};
})();
