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
  var f=document.createElement('p');f.className='mf-foot';f.innerHTML='적은 내용은 이 기기에만 저장돼요. <a href="../fam/">설정 · 백업</a>';m.appendChild(f);};
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
MF.stars=function(n){n=+n||0;return '<span style="color:#f2a100;letter-spacing:1px">'+'★'.repeat(n)+'</span><span style="color:#d9d2c2;letter-spacing:1px">'+'★'.repeat(5-n)+'</span>';};
})();
