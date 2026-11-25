(function(){
'use strict';
const SITE={
  title:'摩擦ゼロの朝',
  hashtag:'#摩擦ゼロの朝',
  url:'https://masatsu-zero.kumao.app/',
  api:'https://nofriction-ranking.saikyo-eigo.workers.dev',
  announce:'',
  contact:'support.kumaogoto@gmail.com',
};
const WEB_VERSION='1.0.1';
const BGM_DIR='bgm/';
const BGM_LIST=[];
const TERMS_VERSION=1, NAME_MAX=10, BOARD_SIZE=100, TIMEOUT_MS=8000;
const TODAY_TTL=5*60000, BOARD_TTL=20000, TITLE_TTL=60000;
const NATIVE=window.NF_NATIVE||null;
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
let QS; try{ QS=new URLSearchParams(location.search); }catch(e){ QS=new URLSearchParams(''); }
const API=LOCAL&&QS.get('ranking')==='local'?'http://127.0.0.1:8796':SITE.api;
const TRIAL=QS.has('debug');
const KEY={rank:'nofriction.web.rank',day:'nofriction.web.day'};
const MARK=(()=>{ try{ const s=(document.currentScript&&document.currentScript.src)||''; const m=/\/v\/([0-9a-f]{6,})\/js\/web\.js/.exec(s); return m?m[1].slice(0,7):''; }catch(e){ return ''; } })();
const TERMS=[
  'ランキングには、決めた名前と、家を出るまでの時間・投げた数が出ます。',
  '記録を確かめるため、その回に投げた時刻・物・向き・強さの列もサーバーに送ります。サーバーで同じように投げ直して、時間が合うかを確かめます。',
  '人を傷つける言葉、性的な言葉、ほかの人の権利を侵す名前は使わないでください。見つけたものは、知らせずに出さないようにしたり、変えたりすることがあります。',
  'ふさわしくない名前や、ありえない記録は「通報」できます。「表示しない」にした人は、あなたの画面に出なくなります。運営が確かめて、出さないようにすることがあります。',
  '「参加をやめる」で、名前と記録をいつでもサーバーから消せます。',
  'このブラウザのデータが消えると（しばらく開かないと消えるブラウザもあります）、同じ名前でも別の人として数えられ、前の記録を自分では消せなくなります。消すときは先に「参加をやめる」を。',
];
const termsLines=()=>SITE.contact?TERMS.concat([`お問い合わせ: ${SITE.contact}`]):TERMS.slice();
let g=null;
let titleInfo=null;
let res=null;
let resRun=null;
const load=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const save=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } };
const drop=k=>{ try{ localStorage.removeItem(k); }catch(e){} };
const $=id=>document.getElementById(id);
function el(tag,cls,text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
function btn(cls,text,on){ const b=el('button',cls,text); b.type='button'; if(on) b.onclick=on; return b; }
const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const isUid=u=>typeof u==='string'&&/^[0-9a-f]{32}$/.test(u);
const isInt=v=>Number.isInteger(v);
const reduce=(()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)'); }catch(e){ return {matches:false}; } })();
const SPRING='cubic-bezier(.2,.9,.25,1.15)';
function anim(e,frames,o){ if(!e||reduce.matches||typeof e.animate!=='function') return null; try{ return e.animate(frames,o); }catch(_){ return null; } }
const tap=()=>{ try{ if(g&&g.sfx&&typeof g.sfx.play==='function') g.sfx.play('ui'); }catch(e){} };
const phase=()=>{ try{ return g&&typeof g.phase==='function'?String(g.phase()):''; }catch(e){ return ''; } };
const gameVer=()=>{ const v=g&&g.ver; if(isInt(v)&&v>0) return v; try{ const c=window.NFCore.CONFIG.VER; return isInt(c)&&c>0?c:1; }catch(e){ return 1; } };
const deviceDay=()=>jstDay(Date.now());
const LAYOUTS=()=>Array.isArray(window.NF_LAYOUTS)?window.NF_LAYOUTS:[];
const layoutById=id=>LAYOUTS().find(l=>l&&l.id===id)||null;
function todayLayout(){
  try{ const t=g&&typeof g.today==='function'?g.today():null; if(isObj(t)&&t.id) return t; }catch(e){}
  if(titleInfo&&isObj(titleInfo.layout)&&titleInfo.layout.id) return titleInfo.layout;
  return null;
}
const DAY_MS=86400000, JST_MS=9*3600000, WD='日月火水木金土';
const jstDay=ms=>new Date(ms+JST_MS).toISOString().slice(0,10);
const jstStart=d=>Date.parse(`${d}T00:00:00Z`)-JST_MS;
const addDays=(d,k)=>new Date(Date.parse(`${d}T00:00:00Z`)+k*DAY_MS).toISOString().slice(0,10);
function isDay(d){ return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(`${d}T00:00:00Z`)); }
const ymd=d=>String(d).split('-').map(Number);
const dowOf=d=>{ const [y,m,dd]=ymd(d); return new Date(Date.UTC(y,m-1,dd)).getUTCDay(); };
const mdj=d=>{ const [,m,dd]=ymd(d); return `${m}月${dd}日`; };
const mdw=d=>{ const [,m,dd]=ymd(d); return `${m}/${dd}（${WD[dowOf(d)]}）`; };
const tenthsText=t=>{ const v=Math.max(0,Math.round(Number(t)||0)); return `${Math.floor(v/10)}.${v%10}`; };
const people=n=>{ try{ return Number(n||0).toLocaleString('ja-JP'); }catch(e){ return String(n||0); } };
const pnow=()=>(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
const Srv={
  info:null, atP:0, atW:0, asking:null,
  age(){ return this.info?Math.max(pnow()-this.atP,Math.abs(Date.now()-this.atW)):Infinity; },
  fresh(){ return this.age()<TODAY_TTL*2; },
  now(){ return this.info?this.info.now+(pnow()-this.atP):null; },
  day(){ const n=this.now(); return n==null?null:jstDay(n); },
  ask(force){
    if(!API) return Promise.resolve(null);
    if(this.asking) return this.asking;
    if(!force&&this.age()<TODAY_TTL) return Promise.resolve(this.info);
    this.asking=Rank.call('GET','/v1/today').then(j=>{
      if(isObj(j)&&Number.isFinite(j.now)&&isDay(j.date)){
        this.info={now:j.now,date:j.date,layout:typeof j.layout==='string'?j.layout:null,ver:isInt(j.ver)?j.ver:null,grace:Number.isFinite(j.grace)?j.grace:0,week:isObj(j.week)?j.week:null};
        this.atP=pnow(); this.atW=Date.now();
      }
      return this.info;
    }).catch(()=>this.info).finally(()=>{ this.asking=null; });
    return this.asking;
  },
};
function dayState(day){
  if(!Srv.fresh()) return null;
  const now=Srv.now(), today=jstDay(now);
  if(day===today) return 'ok';
  if(day===addDays(today,-1)&&now<jstStart(today)+Srv.info.grace) return 'ok';
  return day<today?'closed':'ahead';
}
const pageOld=()=>!!(Srv.info&&isInt(Srv.info.ver)&&Srv.info.ver>gameVer());
const today=()=>Srv.fresh()?Srv.day():deviceDay();
class HttpError extends Error{ constructor(status,code,reason,data){ super(code||`HTTP ${status}`); this.status=status; this.code=code||''; this.reason=reason||''; this.data=isObj(data)?data:{}; } }
function graphemes(t){ try{ if(typeof Intl!=='undefined'&&Intl.Segmenter) return Array.from(new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(t),x=>x.segment); }catch(e){} return Array.from(t); }
function cleanText(s){ return String(s||'').replace(/[\u0000-\u001f\u007f-\u009f​‌‎‏‪-‮⁦-⁩﻿]/g,'').trim(); }
function cleanName(s){ return graphemes(cleanText(s)).slice(0,NAME_MAX).join(''); }
let VISIBLE=null; try{ VISIBLE=new RegExp('[\\p{L}\\p{N}\\p{S}\\p{P}]','u'); }catch(e){}
function nameProblem(raw){
  const t=cleanText(raw), n=graphemes(t).length;
  if(!n||(VISIBLE&&!VISIBLE.test(t))) return ['名前を入れてください'];
  if(n>NAME_MAX) return [`${NAME_MAX} 文字までにしてください`];
  return null;
}
function newUid(){ const a=new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a,x=>x.toString(16).padStart(2,'0')).join(''); }
function better(a,b){ if(!b) return true; if(!a) return false; if(a.tenths!==b.tenths) return a.tenths<b.tenths; return a.throws<b.throws; }
function okLog(log){ return Array.isArray(log)&&log.length>0&&log.length<=9&&log.every(e=>Array.isArray(e)&&e.length===4&&e.every(isInt)); }
function okRec(r){ return isObj(r)&&isInt(r.tenths)&&r.tenths>=0&&r.tenths<=600&&isInt(r.throws)&&r.throws>=1&&okLog(r.log); }
function loadDay(){
  const d=load(KEY.day);
  if(!isObj(d)||!isDay(d.date)||typeof d.layout!=='string'||!isInt(d.ver)) return null;
  if(d.best!=null&&!okRec(d.best)) d.best=null;
  if(d.sent!=null&&!(isObj(d.sent)&&isInt(d.sent.tenths)&&isInt(d.sent.throws))) d.sent=null;
  return d;
}
const saveDay=d=>save(KEY.day,d);
function pendingRec(d){
  d=d===undefined?loadDay():d;
  if(!d||!d.best||d.ver!==gameVer()) return null;
  if(d.sent&&!better(d.best,d.sent)) return null;
  return {date:d.date,layout:d.layout,ver:d.ver,tenths:d.best.tenths,throws:d.best.throws,log:d.best.log};
}
function candidate(){
  const r=pendingRec();
  if(!r) return null;
  const st=dayState(r.date);
  if(st==='closed'||st==='ahead') return null;
  if(!st&&r.date!==deviceDay()) return null;
  return r;
}
const Rank={
  state:load(KEY.rank)||{},
  pushing:null,
  waiting:false,
  get joined(){ return !!(this.state.joined&&isUid(this.state.uid)&&this.state.name); },
  async call(method,path,body,auth){
    if(!API) throw new HttpError(0,'no api');
    if(method!=='GET') boardCache.clear();
    const ctl=typeof AbortController==='function'?new AbortController():null;
    const timer=ctl?setTimeout(()=>ctl.abort(),TIMEOUT_MS):0;
    const headers={};
    if(body) headers['content-type']='application/json';
    if(auth&&isUid(auth)) headers.authorization=`Bearer ${auth}`;
    const opt={method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'};
    if(ctl) opt.signal=ctl.signal;
    try{
      const net=NATIVE&&typeof NATIVE.fetch==='function'?NATIVE.fetch:null;
      const r=await (net?net.call(NATIVE,API+path,opt):fetch(API+path,opt));
      let j={}; try{ j=await r.json(); }catch(e){}
      if(!r.ok) throw new HttpError(r.status,j&&j.error,j&&j.reason,j);
      return isObj(j)?j:{};
    }catch(e){
      if(e instanceof HttpError) throw e;
      throw new HttpError(0,'offline');
    }finally{ if(timer) clearTimeout(timer); }
  },
  push(){
    if(this.pushing) return this.pushing.then(r=>pendingRec()&&this.joined&&!(r===null)?this.push():r);
    this.pushing=(async()=>{
      const d=loadDay(), rec=pendingRec(d);
      if(!rec||!this.joined) return {none:true};
      const uid=this.state.uid;
      try{
        const r=await this.call('POST','/v1/submit',{uid,ver:rec.ver,date:rec.date,layout:rec.layout,log:rec.log,tenths:rec.tenths,throws:rec.throws,src:NATIVE?'ios':'web'});
        const ranks=isObj(r.ranks)?r.ranks:{}, totals=isObj(r.totals)?r.totals:{};
        const now=loadDay()||d, prev=isInt(now.rank)?now.rank:null;
        if(now.date===rec.date){
          now.sent={tenths:rec.tenths,throws:rec.throws};
          now.rank=isInt(ranks.today)?ranks.today:null; now.total=isInt(totals.today)?totals.today:null;
          now.wrank=isInt(ranks.week)?ranks.week:null; now.wtotal=isInt(totals.week)?totals.week:null;
          now.hidden=!!r.hidden; now.at=Date.now();
          saveDay(now);
        }
        this.waiting=false;
        return {sent:true,date:isDay(r.date)?r.date:rec.date,rank:now.rank,total:now.total,wrank:now.wrank,wtotal:now.wtotal,prev,hidden:!!r.hidden,counted:r.counted!==false,tenths:rec.tenths,throws:rec.throws};
      }catch(e){
        if(e.status===409){ if(this.state.uid===uid) this.forget(); return {gone:true}; }
        if(e.status===0||e.status===429||e.status>=500){ this.waiting=true; return null; }
        if(e.code==='terms') return {rejected:true,code:'terms'};
        const now=loadDay();
        if(now&&now.date===rec.date&&now.best&&now.best.tenths===rec.tenths&&now.best.throws===rec.throws){ now.sent={tenths:rec.tenths,throws:rec.throws,rejected:e.code||'rejected'}; saveDay(now); }
        return {rejected:true,code:e.code,date:rec.date};
      }
    })().finally(()=>{ this.pushing=null; });
    return this.pushing;
  },
  async join(raw){
    const bad=nameProblem(raw);
    if(bad) return bad;
    const name=cleanName(raw);
    if(!isUid(this.state.uid)){ this.state={uid:newUid()}; save(KEY.rank,this.state); }
    const uid=this.state.uid;
    try{
      const r=await this.call('POST','/v1/register',{uid,name,terms:TERMS_VERSION});
      if(this.state.uid!==uid) return ['つながりませんでした'];
      this.state={joined:true,name:typeof r.name==='string'&&r.name?r.name:name,uid,pid:typeof r.pid==='string'?r.pid:'',terms:TERMS_VERSION};
      save(KEY.rank,this.state);
      return null;
    }catch(e){
      if(e.code==='ng name'&&e.reason==='taken') return ['その名前は、','ほかの人が使っています'];
      if(e.code==='ng name'||e.code==='bad name') return ['その名前は使えません'];
      if(e.code==='terms') return ['利用規約が新しくなりました。','ページを読み直してください'];
      if(e.status===429) return ['少し時間をおいて','試してください'];
      return ['つながりませんでした'];
    }
  },
  async leave(){
    try{ await this.call('POST','/v1/leave',{uid:this.state.uid}); this.forget(); return null; }
    catch(e){ return 'つながりませんでした。もう一度試してください'; }
  },
  forget(){
    this.state={}; drop(KEY.rank);
    const d=loadDay(); if(d){ d.sent=null; d.rank=d.total=d.wrank=d.wtotal=null; saveDay(d); }
  },
};
function onRun(o){
  if(!isObj(o)) o={};
  resRun=o; res=null;
  persist();
  const official=o.official===true&&!TRIAL;
  if(!official) return;
  const d0=loadDay();
  if(o.outcome!=='out'){
    if(Rank.joined&&d0&&d0.date===deviceDay()&&sentOk(d0)) res=keptRes(d0);
    return;
  }
  const rec={date:isDay(o.date)?o.date:deviceDay(),layout:String(o.layout||''),ver:isInt(o.ver)?o.ver:gameVer(),tenths:o.tenths,throws:o.throws,log:Array.isArray(o.log)?o.log.map(e=>Array.isArray(e)?e.slice():e):null};
  if(!okRec(rec)||!rec.layout) return;
  const st=dayState(rec.date);
  if(st==='closed'&&Srv.day()===addDays(rec.date,1)&&rec.date===addDays(deviceDay(),-1)){ res={kind:'msg',text:['遊んでいるあいだに日付が変わったので、','この回はランキングに載りません']}; return; }
  if(st==='closed'||st==='ahead'){ res={kind:'msg',text:['端末の日付が ずれていたので、','この回はランキングに載りません']}; return; }
  let d=d0&&d0.date===rec.date&&d0.layout===rec.layout&&d0.ver===rec.ver?d0:null;
  const improved=!d||better(rec,d.best);
  if(!d) d={date:rec.date,layout:rec.layout,ver:rec.ver,best:null,sent:null,rank:null,total:null,wrank:null,wtotal:null};
  if(improved){ d.best={tenths:rec.tenths,throws:rec.throws,log:rec.log}; saveDay(d); }
  if(!Rank.joined){ res={kind:'join'}; return; }
  if(!pendingRec(d)){ res=sentOk(d)?keptRes(d):null; return; }
  res={kind:'sending'};
  Rank.push().then(r=>{ if(resRun!==o) return; res=resFrom(r); renderResult(); }).catch(()=>{});
}
const sentOk=d=>!!(d&&d.sent&&!d.sent.rejected&&isInt(d.rank)&&isInt(d.total));
function resFrom(r){
  if(!r) return {kind:'later'};
  if(r.none) return null;
  if(r.gone) return {kind:'msg',text:['この名前はランキングを','やめています'],action:'join'};
  if(r.rejected){
    if(r.code==='closed') return {kind:'msg',text:[`${mdj(r.date)}の間取りは`,'締め切りました']};
    if(r.code==='not open') return {kind:'msg',text:['端末の日付が進んでいるので、','この回は載りません']};
    if(r.code==='wrong layout'||r.code==='no layout') return {kind:'msg',text:['この間取りは、','今日のランキングに入りません']};
    if(r.code==='implausible'||r.code==='not out') return {kind:'msg',text:['記録を確かめられなかったので、','この回は載りません']};
    if(r.code==='bad ver') return {kind:'msg',text:['新しい版が出ています。'],action:'reload'};
    if(r.code==='terms') return {kind:'msg',text:['利用規約が新しくなりました。'],action:'terms'};
    return {kind:'msg',text:['記録を送れませんでした']};
  }
  if(r.sent) return {kind:'rank',rank:r.rank,total:r.total,wrank:r.wrank,wtotal:r.wtotal,prev:r.prev,hidden:r.hidden,tenths:r.tenths,pop:true};
  return null;
}
function keptRes(d){ return {kind:'rank',rank:d.rank,total:d.total,wrank:d.wrank,wtotal:d.wtotal,prev:null,hidden:!!d.hidden,tenths:d.best?d.best.tenths:null,kept:true}; }
let resEl=null;
function onResultShown(elm,o){
  if(elm&&elm.nodeType===1) resEl=elm;
  if(isObj(o)&&o!==resRun) onRun(o);
  renderResult();
}
function renderResult(){
  const box=resEl||$('web-result'); if(!box) return;
  const shown=phase()==='result'&&!sheetOpen();
  const prevKind=box.firstChild&&box.firstChild.dataset?box.firstChild.dataset.kind:null;
  box.replaceChildren();
  const r=res;
  if(!r) return;
  const pop=!!(r.pop&&shown);
  if(pop) r.pop=false;
  const changed=shown&&(pop||(prevKind!=null&&prevKind!==r.kind));
  const tapTo=r.kind==='join'||(r.kind==='msg'&&(r.action==='terms'||r.action==='join'))?'join':(r.kind==='rank'?'board':null);
  const row=tapTo?btn('nfw-res tap',null,()=>openRank(tapTo,{from:'result'})):el('div','nfw-res');
  row.dataset.kind=r.kind;
  const icon=el('span','nfw-res-ic'); icon.innerHTML=svg(r.kind==='msg'||r.kind==='later'?'info':'rank');
  row.append(icon);
  const txt=el('span','nfw-res-t');
  if(r.kind==='join'){
    txt.append(el('span','nfw-res-main nfw-res-cta','ランキングに載せる'),nbP('nfw-res-sub',['名前を決めると、','今日の順位が出ます'],'span'));
  }else if(r.kind==='sending'){
    txt.append(el('span','nfw-res-lead nfw-wait','記録を送っています…'));
  }else if(r.kind==='later'){
    txt.append(nbP('nfw-res-lead nfw-quiet',['つながらないので、','記録はあとで送ります'],'span'));
  }else if(r.kind==='msg'){
    txt.append(nbP('nfw-res-lead',r.text,'span'));
    if(tapTo) txt.append(el('span','nfw-res-sub',r.action==='terms'?'押して、読んで同意する':'押して、名前を決める'));
  }else if(r.kind==='rank'){
    if(!isInt(r.rank)||!isInt(r.total)) txt.append(el('span','nfw-res-lead','記録を送りました'));
    else{
      const main=el('span','nfw-res-main');
      main.append(el('span','nfw-k','今日'),digits(String(r.rank),'nfw-n'),el('span','nfw-u','位'),el('span','nfw-of',`/ ${people(r.total)} 人`));
      const up=isInt(r.prev)&&r.rank<r.prev?r.prev-r.rank:0;
      if(up){ const c=el('span','nfw-up'); c.innerHTML=svg('up'); c.append(String(up)); c.setAttribute('aria-label',`${up} つ上がった`); main.append(c); }
      txt.append(main);
      const sub=r.hidden?'名前の確認中は、ほかの人に出ません':(r.kept&&isInt(r.tenths)?`今日のベスト ${tenthsText(r.tenths)} 秒${isInt(r.wrank)?`・今週 ${r.wrank} 位`:''}`:(isInt(r.wrank)&&isInt(r.wtotal)?`今週 ${r.wrank} 位 / ${people(r.wtotal)} 人`:''));
      if(sub) txt.append(el('span','nfw-res-sub',sub));
      if(pop){
        const n=main.querySelector('.nfw-n');
        anim(n,[{transform:'scale(1)'},{transform:'scale(1.35)',offset:.35},{transform:'scale(.96)',offset:.7},{transform:'scale(1)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});
        const c=main.querySelector('.nfw-up');
        if(c) anim(c,[{opacity:0,transform:'translateY(6px) scale(.6)'},{opacity:1,transform:'none'}],{duration:420,delay:180,easing:SPRING,fill:'backwards'});
      }
    }
  }
  row.append(txt);
  if(r.kind==='msg'&&r.action==='reload') row.append(reloadButton('btn btn-secondary nfw-res-btn'));
  if(tapTo){ const go=el('span','nfw-go'); go.innerHTML=svg('next'); row.append(go); row.setAttribute('aria-label',row.textContent.replace(/\s+/g,' ').trim()+(tapTo==='join'?'。名前を決める':'。ランキングを開く')); }
  box.append(row);
  if(changed) anim(row,[{opacity:.3,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
}
function reloadButton(cls){ return btn(cls,'読み直す',ev=>{ const b=ev.currentTarget; b.disabled=true; b.textContent='読み込んでいます…'; freshReload(); }); }
async function freshReload(){
  const within=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(r,ms))]);
  try{
    const reg='serviceWorker' in navigator?await within(navigator.serviceWorker.getRegistration(),2000):null;
    if(reg){
      await within(reg.update().catch(()=>{}),6000);
      const w=reg.installing||reg.waiting;
      if(w) await within(new Promise(r=>{ const f=()=>{ if(w.state==='activated'||w.state==='redundant') r(); }; w.addEventListener('statechange',f); f(); }),10000);
    }
  }catch(e){}
  location.reload();
}
let titleMsg=null, mineAt=0;
function onTitle(info){
  titleInfo=isObj(info)?info:null;
  build();
  res=null; resRun=null; titleMsg=null;
  if(reloadNow()) return;
  renderTitle();
  Srv.ask(false).then(()=>{ renderTitle(); pushPending(); refreshMine(false); }).catch(()=>{});
}
function renderTitle(){
  const box=$('web-title'); if(!box) return;
  box.replaceChildren();
  const sd=Srv.fresh()?Srv.day():null, dd=deviceDay();
  let warn=null;
  if(pageOld()) warn=['新しい版が出ています。'];
  else if(sd&&sd!==dd) warn=['端末の日付が ずれています',`（今日は ${mdj(sd)}）。`,'このままでは、','ランキングに載りません'];
  else if(titleMsg) warn=titleMsg;
  else if(Rank.joined&&Rank.waiting&&pendingRec()) warn=['送れていない記録があります。','つながったら送ります'];
  if(warn){
    const n=nbP('nfw-tnote',warn); n.setAttribute('role','status');
    if(pageOld()) n.append(reloadButton('nfw-link'));
    box.append(n);
    return;
  }
  const d=loadDay();
  if(!Rank.joined||!d||d.date!==dd||!d.sent||d.sent.rejected||!isInt(d.rank)||!isInt(d.total)) return;
  const b=btn('nfw-tline',null,()=>{ if(phase()!=='title') return; openRank('board',{from:'title'}); });
  const ic=el('span','nfw-tline-ic'); ic.innerHTML=svg('rank');
  const t=el('span','nfw-tline-t');
  t.append(el('span','nfw-k','今日'),digits(String(d.rank),'nfw-n'),el('span','nfw-u','位'),el('span','nfw-of',`/ ${people(d.total)} 人`));
  b.append(ic,t);
  if(d.best){ const tm=el('span','nfw-tline-tm'); tm.append(digits(tenthsText(d.best.tenths)),el('small',null,'秒')); b.append(tm); }
  b.setAttribute('aria-label',`今日 ${d.rank} 位、${d.total} 人中。ベスト ${d.best?tenthsText(d.best.tenths):''} 秒。ランキングを開く`);
  const chev=el('span','nfw-tline-go'); chev.innerHTML=svg('next'); b.append(chev);
  box.append(b);
}
function refreshMine(force){
  if(!API||!Rank.joined) return;
  const d=loadDay();
  if(!d||!d.sent||d.sent.rejected||d.date!==today()) return;
  if(!force&&Date.now()-mineAt<TITLE_TTL) return;
  mineAt=Date.now();
  const q=new URLSearchParams({ver:String(gameVer()),board:'today',limit:'1'});
  Rank.call('GET',`/v1/board?${q}`,null,Rank.state.uid).then(r=>{
    const m=isObj(r.mine)?r.mine:null, now=loadDay();
    if(!m||!now||now.date!==d.date) return;
    if(m.rank!==now.rank||r.total!==now.total){ now.rank=isInt(m.rank)?m.rank:now.rank; now.total=isInt(r.total)?r.total:now.total; saveDay(now); if(phase()==='title') renderTitle(); }
  }).catch(()=>{});
}
function pushPending(){
  if(!g||!Rank.joined||!pendingRec()) return;
  Rank.push().then(r=>{
    if(r&&r.rejected&&r.code!=='closed') titleMsg=['送れていなかった記録: ',...(resFrom(r)||{text:[]}).text];
    if(r&&r.gone) titleMsg=['この名前はランキングを','やめています'];
    if(phase()==='title') renderTitle();
    else if(phase()==='result'&&resRun&&r&&r.sent){ res=resFrom(r); renderResult(true); }
  }).catch(()=>{});
}
function renderFoot(){
  const box=$('web-foot'); if(!box||box.firstChild) return;
  const f=el('p','nfw-ft');
  const pv=el('a',null,'プライバシー'); pv.href='privacy.html';
  const tm=el('a',null,'利用規約'); tm.href='privacy.html#terms';
  const links=el('span','nfw-links'); links.append(pv,el('span','nfw-dot'),tm);
  f.append(el('span','nfw-ver',`ブラウザ版 ${WEB_VERSION}${MARK?`（${MARK}）`:''}`),links);
  box.append(f);
}
let view='board', rankTab='today', rankSeq=0, opener=null, behind=[], openFrom='title';
const boardCache=new Map();
const sheetOpen=()=>{ const l=$('nfwLayer'); return !!(l&&l.hasAttribute('data-on')); };
async function boardGet(tab){
  const q=new URLSearchParams({ver:String(gameVer()),board:tab,limit:String(BOARD_SIZE)});
  const me=Rank.joined?Rank.state.uid:'';
  const ck=`${q}|${me}`, hit=boardCache.get(ck);
  if(hit&&Date.now()-hit.t<BOARD_TTL) return hit.r;
  const r=await Rank.call('GET',`/v1/board?${q}`,null,me);
  boardCache.set(ck,{t:Date.now(),r});
  return r;
}
function openRank(v,o){
  build();
  if(isObj(o)&&typeof o.from==='string') openFrom=o.from;
  const layer=$('nfwLayer'), sheet=$('nfwSheet');
  if(!sheetOpen()){
    opener=document.activeElement;
    behind=Array.from(document.body.children).filter(c=>c!==$('nfw')&&c.tagName!=='SCRIPT'&&!c.inert);
    for(const c of behind){ c.inert=true; c.setAttribute('aria-hidden','true'); }
    layer.setAttribute('data-on','');
    layer.inert=false;
  }
  view=v==='join'||v==='rename'?v:'board';
  rankSeq++;
  render();
  if(!sheet.contains(document.activeElement)||document.activeElement===document.body){ requestAnimationFrame(()=>{ try{ sheet.focus({preventScroll:true}); }catch(e){} }); }
}
function closeRank(){
  rankSeq++;
  if(!sheetOpen()) return;
  const layer=$('nfwLayer');
  layer.removeAttribute('data-on');
  layer.inert=true;
  for(const c of behind){ c.inert=false; c.removeAttribute('aria-hidden'); }
  behind=[];
  const b=opener; opener=null;
  if(b&&b.isConnected&&b.getClientRects().length&&typeof b.focus==='function'){ requestAnimationFrame(()=>{ try{ b.focus({preventScroll:true}); }catch(e){} }); }
  if(phase()==='title') renderTitle();
  if(phase()==='result') renderResult(false);
  reloadNow();
}
function render(){
  const my=rankSeq;
  const head=$('nfwH'), bar=$('nfwBar'), body=$('nfwBody'), foot=$('nfwFoot');
  body.replaceChildren(); foot.replaceChildren(); foot.hidden=true;
  body.scrollTop=0; bar.classList.remove('sh');
  $('nfwSheet').dataset.view=view;
  if(view==='board'){
    head.textContent='ランキング';
    bar.hidden=false;
    renderTabs();
    renderBoard(body,foot,my);
  }else{
    head.textContent=view==='rename'?'名前を変える':'ランキングに載せる';
    bar.hidden=true;
    renderJoin(body,foot,view==='rename');
  }
}
function renderTabs(){
  const seg=$('nfwSeg');
  for(const b of seg.querySelectorAll('[role="tab"]')){ const on=b.dataset.tab===rankTab; b.setAttribute('aria-selected',String(on)); b.tabIndex=on?0:-1; }
  seg.style.setProperty('--idx',rankTab==='week'?'1':'0');
}
function setTab(t){ if(t===rankTab||view!=='board') return; tap(); rankTab=t; rankSeq++; render(); }
function whereText(tab,r){
  if(tab==='week') return isDay(r.from)&&isDay(r.to)?`${mdw(r.from)} 〜 ${mdw(r.to)}`:'今週';
  const id=typeof r.layout==='string'?r.layout:(Srv.info&&Srv.info.layout)||((todayLayout()||{}).id);
  const L=layoutById(id)||todayLayout();
  const day=isDay(r.from)?r.from:today();
  return L?`${WD[dowOf(day)]}曜日の間取り・${L.name}`:'今日の間取り';
}
function skeleton(){
  const list=el('ol','nfw-list nfw-sk'); list.setAttribute('aria-hidden','true');
  for(let i=0;i<7;i++){ const li=el('li','nfw-row sk'); li.append(el('span','sk-b sk-r'),el('span','sk-b sk-n'),el('span','sk-b sk-t')); li.style.setProperty('--i',String(i)); list.append(li); }
  return list;
}
async function renderBoard(body,foot,my){
  const tab=rankTab, meta=$('nfwMeta');
  meta.replaceChildren(el('span','nfw-where',whereText(tab,{})),el('span','nfw-count'));
  if(!API){ body.append(stateBox('info',['ランキングは','まだ準備中です'],null)); return; }
  body.append(skeleton());
  body.setAttribute('aria-busy','true');
  let r;
  try{
    if(Rank.joined&&pendingRec()) await Rank.push().catch(()=>{});
    if(Srv.age()>=TODAY_TTL) await Srv.ask(false);
    r=await boardGet(tab);
  }catch(e){
    if(my!==rankSeq) return;
    body.removeAttribute('aria-busy');
    body.replaceChildren(stateBox('offline',['つながりませんでした'],['通信できる所で、','もう一度読んでください'],btn('btn btn-secondary nfw-retry','もう一度読む',()=>{ tap(); boardCache.clear(); rankSeq++; render(); })));
    return;
  }
  if(my!==rankSeq) return;
  body.removeAttribute('aria-busy');
  body.replaceChildren();
  meta.replaceChildren(el('span','nfw-where',whereText(tab,r)));
  const cnt=el('span','nfw-count'); cnt.append('参加 ',digits(people(isInt(r.total)?r.total:0),'nfw-cn'),' 人'); meta.append(cnt);
  if(pageOld()) body.append(nbP('nfw-tnote nfw-in',['新しい版が出ています。']),reloadButton('btn btn-secondary nfw-wide'));
  const top=Array.isArray(r.top)?r.top.filter(isObj):[];
  const mine=isObj(r.mine)?r.mine:null;
  if(mine&&mine.hidden) body.append(nbP('nfw-small nfw-in',['あなたの名前は確認中のため、','ほかの人には出ていません']));
  if(!top.length&&!(mine&&Array.isArray(r.around)&&r.around.length)){
    body.append(stateBox('door',tab==='today'?['今日は まだ','だれも家を出ていません']:['今週は まだ','だれも家を出ていません'],['いちばん乗りの','チャンスです']));
  }else{
    const list=boardList(top,'top');
    body.append(list);
    const around=Array.isArray(r.around)?r.around.filter(isObj):[];
    if(Rank.joined&&!top.some(e=>e.mine)&&around.length){
      const gap=el('div','nfw-gap'); gap.setAttribute('aria-hidden','true'); gap.innerHTML=svg('dots');
      body.append(gap,boardList(around,'around'));
    }
  }
  const me=body.querySelector('.nfw-row.mine');
  if(me) requestAnimationFrame(()=>{ if(my!==rankSeq) return; const t=me.offsetTop-body.clientHeight/2+me.offsetHeight/2; if(t>0) body.scrollTop=t; });
  const notes=['同じ時間なら、投げた数が少ない方が上。'];
  if(Rank.joined){
    if(top.some(e=>!e.mine)) notes.push('ほかの人の名前を長押しすると、','表示しない・通報ができます。');
    const meBox=el('div','nfw-me');
    const nm=el('p','nfw-me-l'); nm.append(el('span','nfw-me-k','あなたの名前'),el('b','nfw-me-n',Rank.state.name));
    meBox.append(nm,btn('nfw-link','名前を変える',()=>{ tap(); openRank('rename'); }));
    body.append(meBox);
    if(!mine&&tab==='today') body.append(nbP('nfw-small',['今日の記録は まだありません。','今日の間取りで家を出ると、ここに載ります']));
  }else{
    const c=candidate();
    if(c){
      const go=btn('btn btn-primary btn-xl grow nfw-cta',null,()=>{ tap(); openRank('join'); });
      const inner=el('span','btn-in'); inner.append(el('span',null,`${c.date===today()?'今日':mdj(c.date)}の記録を載せる`));
      const tm=el('span','nfw-cta-tm'); tm.append(digits(tenthsText(c.tenths)),el('small',null,'秒')); inner.append(tm);
      go.append(inner);
      foot.append(go); foot.hidden=false;
    }else body.append(nbP('nfw-small',['今日の間取りで家を出ると、','記録をランキングに載せられます']));
  }
  body.append(nbP('nfw-note',notes));
  if(Rank.joined) body.append(leaveButton());
}
function boardList(rows,kind){
  const list=el('ol','nfw-list'); list.dataset.kind=kind;
  for(const e of rows){
    const rank=isInt(e.rank)?e.rank:0;
    const li=el('li','nfw-row'+(e.mine?' mine':'')+(rank>=1&&rank<=3?` r${rank}`:''));
    const rk=el('span','nfw-rk'); rk.append(digits(String(rank||'–')));
    const nm=el('span','nfw-nm'); nm.append(el('span','nfw-nm-t',String(e.name||'')));
    if(e.mine) nm.append(el('span','nfw-you','あなた'));
    const tm=el('span','nfw-tm'); tm.append(digits(tenthsText(e.tenths)),el('small',null,'秒'));
    const th=el('span','nfw-th',`投げた ${isInt(e.throws)?e.throws:'–'}`);
    li.append(rk,nm,tm,th);
    li.setAttribute('aria-label',`${rank} 位 ${String(e.name||'')}${e.mine?'（あなた）':''} ${tenthsText(e.tenths)} 秒 投げた ${e.throws}`);
    if(!e.mine&&Rank.joined&&typeof e.pid==='string'){
      li.classList.add('tap'); li.tabIndex=0; li.setAttribute('aria-expanded','false'); li.setAttribute('aria-haspopup','menu');
      pressable(li,()=>rowMenu(list,li,e));
    }
    list.append(li);
  }
  return list;
}
function pressable(li,fire){
  let t=0, x=0, y=0, done=false;
  const cancel=()=>{ clearTimeout(t); t=0; };
  li.addEventListener('pointerdown',ev=>{ if(ev.button>0||ev.target.closest('.nfw-menu')) return; done=false; x=ev.clientX; y=ev.clientY; cancel(); t=setTimeout(()=>{ t=0; done=true; fire(); },450); });
  li.addEventListener('pointermove',ev=>{ if(t&&Math.hypot(ev.clientX-x,ev.clientY-y)>8) cancel(); });
  li.addEventListener('pointerup',cancel);
  li.addEventListener('pointercancel',cancel);
  li.addEventListener('pointerleave',cancel);
  li.addEventListener('contextmenu',ev=>ev.preventDefault());
  li.addEventListener('click',ev=>{ if(ev.target.closest('.nfw-menu')) return; cancel(); if(done){ done=false; return; } fire(); });
  li.addEventListener('keydown',ev=>{ if(ev.target===li&&(ev.key==='Enter'||ev.key===' ')){ ev.preventDefault(); fire(); } });
}
function rowMenu(list,li,e){
  const open=li.querySelector('.nfw-menu');
  for(const m of list.parentNode.querySelectorAll('.nfw-menu')){ m.parentNode.setAttribute('aria-expanded','false'); m.remove(); }
  if(open) return;
  tap();
  const box=el('div','nfw-menu'); box.setAttribute('role','menu');
  const act=(label,path,extra,done,hide)=>{
    const b=btn('nfw-mi',label,async ev=>{
      ev.stopPropagation(); const bb=ev.currentTarget; bb.disabled=true; tap();
      try{ await Rank.call('POST',path,{uid:Rank.state.uid,pid:e.pid,...extra}); if(hide){ li.remove(); } else { box.remove(); li.setAttribute('aria-expanded','false'); } note(done); }
      catch(_){ bb.disabled=false; note('つながりませんでした'); }
    });
    b.setAttribute('role','menuitem');
    box.append(b);
  };
  act('この人を表示しない','/v1/block',{},`「${e.name}」を表示しないにしました`,true);
  act('名前を通報','/v1/report',{reason:'name'},'通報しました。ありがとうございます',false);
  act('記録を通報','/v1/report',{reason:'cheat'},'通報しました。ありがとうございます',false);
  li.append(box); li.setAttribute('aria-expanded','true');
  anim(box,[{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:200,easing:'cubic-bezier(.2,.8,.2,1)'});
  try{ box.scrollIntoView({block:'nearest'}); }catch(_){}
}
function leaveButton(){
  const b=btn('nfw-danger','参加をやめる'); let armed=false;
  b.onclick=async()=>{
    tap();
    if(!armed){ armed=true; b.classList.add('armed'); b.textContent='もう一度押すと、名前と記録を消します'; return; }
    b.disabled=true; b.textContent='消しています…';
    const my=rankSeq, err=await Rank.leave();
    if(err){ b.disabled=false; armed=false; b.classList.remove('armed'); b.textContent='参加をやめる'; note(err); return; }
    if(resRun) res=null;
    note('参加をやめました。名前と記録を消しました');
    if(my===rankSeq){ rankSeq++; render(); }
  };
  return b;
}
function stateBox(icon,title,sub,action){
  const box=el('div','nfw-state'); box.dataset.icon=icon;
  const ic=el('span','nfw-state-ic'); ic.innerHTML=svg(icon); box.append(ic,nbP('nfw-state-h',title));
  if(sub) box.append(nbP('nfw-state-p',sub));
  if(action) box.append(action);
  return box;
}
function termsBox(){
  const box=el('div','nfw-terms'); box.tabIndex=0; box.setAttribute('aria-label','利用規約');
  box.append(el('p','nfw-terms-h','利用規約'));
  const ol=el('ol'); for(const t of termsLines()) ol.append(el('li',null,t));
  box.append(ol);
  return box;
}
function renderJoin(body,foot,renaming){
  const box=el('div','nfw-join');
  const needTerms=!renaming||!(Rank.state.terms>=TERMS_VERSION);
  box.append(renaming?nbP('nfw-lead',['ランキングに出る','新しい名前']):nbP('nfw-lead',['ランキングに出る名前を','決めてください']));
  const field=el('label','nfw-field');
  const input=el('input','nfw-input'); input.type='text'; input.maxLength=40; input.placeholder='名前'; input.autocomplete='off'; input.spellcheck=false; input.setAttribute('enterkeyhint','done'); input.setAttribute('aria-label','名前'); input.value=renaming?Rank.state.name:'';
  const count=el('span','nfw-len');
  field.append(input,count);
  const upd=()=>{ const n=graphemes(cleanText(input.value)).length, over=n>NAME_MAX; count.textContent=`${n} / ${NAME_MAX}`; field.classList.toggle('over',over); };
  input.addEventListener('input',()=>{ upd(); msg.textContent=''; });
  upd();
  box.append(field,nbP('nfw-rule',[`${NAME_MAX} 文字まで。`,'ほかの人が使っている名前と、','人を傷つける言葉は使えません。']));
  let agree=null;
  if(needTerms){
    box.append(termsBox());
    const row=el('label','nfw-agree'); agree=el('input'); agree.type='checkbox';
    const mark=el('span','nfw-check'); mark.innerHTML=svg('check');
    const pv=el('a',null,'プライバシーポリシー'); pv.href='privacy.html'; pv.target='_blank'; pv.rel='noopener';
    const words=el('span','nfw-agree-t'); words.append(nbSpan('利用規約と'),pv,nbSpan('に同意する'));
    row.append(agree,mark,words);
    agree.addEventListener('change',()=>{ msg.textContent=''; });
    box.append(row);
  }
  const msg=el('p','nfw-err'); msg.setAttribute('role','alert');
  box.append(msg);
  if(renaming){
    const zone=el('div','nfw-zone');
    zone.append(leaveButton(),el('p','nfw-id',`ID（問い合わせのときに使います）: ${Rank.state.pid||''}`));
    box.append(zone);
  }
  body.append(box);
  const label=renaming?'この名前にする':candidate()?'この名前で載せる':'この名前で参加する';
  const back=btn('btn btn-secondary nfw-backbtn','もどる',()=>{ tap(); openRank('board'); });
  const go=btn('btn btn-primary btn-xl grow',null);
  const inner=el('span','btn-in',label); go.append(inner);
  go.onclick=async()=>{
    if(agree&&!agree.checked){ msg.replaceChildren(...['利用規約とプライバシーポリシーに','同意してください'].map(t=>el('span','nb',t))); tap(); return; }
    const bad=nameProblem(input.value);
    if(bad){ msg.replaceChildren(...bad.map(t=>el('span','nb',t))); tap(); input.focus(); return; }
    tap(); go.disabled=true; inner.textContent='送っています…';
    const my=rankSeq, err=await Rank.join(input.value);
    if(my!==rankSeq) return;
    if(err){ msg.replaceChildren(...[].concat(err).map(t=>el('span','nb',t))); go.disabled=false; inner.textContent=label; return; }
    if(pendingRec()){
      const r=await Rank.push().catch(()=>null);
      if(resRun){ res=resFrom(r)||res; renderResult(true); }
      renderTitle();
    }
    if(my!==rankSeq) return;
    rankTab='today'; openRank('board');
    if(renaming) note('名前を変えました');
  };
  input.addEventListener('keydown',ev=>{ if(ev.key==='Enter'&&!ev.isComposing){ ev.preventDefault(); go.click(); } });
  foot.append(back,go); foot.hidden=false;
  if(!renaming) requestAnimationFrame(()=>{ try{ if(matchMedia('(hover: hover)').matches) input.focus({preventScroll:true}); }catch(e){} });
}
let noteTimer=0;
function note(text){
  const t=$('nfwToast'); if(!t) return;
  clearTimeout(noteTimer);
  t.firstChild.textContent=text;
  t.removeAttribute('data-on'); void t.offsetWidth; t.setAttribute('data-on','');
  noteTimer=setTimeout(()=>t.removeAttribute('data-on'),2400);
}
const ICON={
  rank:'<path d="M4 20v-6h5V7.5h6V12h5v8z"/><path d="M12 10.5v3"/>',
  close:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  back:'<path d="M14.5 6l-6 6 6 6"/>',
  next:'<path d="M9.5 6l6 6-6 6"/>',
  up:'<path d="M12 18V6.5M7 11.5l5-5 5 5"/>',
  check:'<path d="M5.5 12.5l4 4 9-9"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
  door:'<path d="M6.5 20V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15M4 20h16M14.5 12.5v.5"/>',
  offline:'<path d="M3.5 9.5a12.5 12.5 0 0 1 17 0M6.5 12.8a8 8 0 0 1 11 0M9.6 16a3.6 3.6 0 0 1 4.8 0"/><path d="M12 19.3v.1M4 4l16 16"/>',
  dots:'<path d="M7 12h.01M12 12h.01M17 12h.01"/>',
};
const svg=name=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]||''}</svg>`;
function digits(str,cls){ const s=el('span','digits'+(cls?' '+cls:'')); for(const ch of String(str)){ s.append(el('span',ch==='.'?'dg dot':/[0-9]/.test(ch)?'dg':'dg ch',ch)); } return s; }
const nbSpan=t=>el('span','nb',t);
function nbP(cls,parts,tag){ const p=el(tag||'p',cls); for(const t of parts) p.append(typeof t==='string'?nbSpan(t):t); return p; }
function persist(){ try{ if(navigator.storage&&navigator.storage.persist&&!/Firefox\//.test(navigator.userAgent)) navigator.storage.persist().catch(()=>{}); }catch(e){} }
function registerSW(){
  try{
    if(!('serviceWorker' in navigator)||location.protocol!=='https:') return;
    let n=0;
    const t=setInterval(()=>{ if(window.__nfReady===true||++n>=60){ clearInterval(t); navigator.serviceWorker.register('sw.js').catch(()=>{}); } },250);
  }catch(e){}
}
let reloadWanted=false;
function reloadNow(){
  if(!reloadWanted||phase()!=='title'||sheetOpen()) return false;
  if(document.querySelector('#ui [data-top]:not([data-top=""])')) return false;
  reloadWanted=false; location.reload(); return true;
}
try{
  if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',e=>{ const d=e.data; if(isObj(d)&&d.type==='nf-update'){ reloadWanted=true; reloadNow(); } });
}catch(e){}
const SHEET_HTML=`
<div id="nfw" class="nfw">
 <section class="layer L-modal L-sheet nfw-layer" id="nfwLayer">
  <div class="scrim pe" data-nfw-close></div>
  <div class="sheet sheet-modal pe nfw-sheet" id="nfwSheet" role="dialog" aria-modal="true" aria-labelledby="nfwH" tabindex="-1" data-view="board">
   <header class="sheet-head row nfw-head">
    <h2 class="h-sheet" id="nfwH">ランキング</h2>
    <button type="button" class="btn-round sm" id="nfwClose" aria-label="閉じる"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>
   </header>
   <div class="nfw-bar" id="nfwBar">
    <div class="nfw-seg" id="nfwSeg" role="tablist" aria-label="ランキングの期間">
     <span class="nfw-seg-ind" aria-hidden="true"></span>
     <button type="button" role="tab" data-tab="today" aria-selected="true" aria-controls="nfwBody">今日</button>
     <button type="button" role="tab" data-tab="week" aria-selected="false" aria-controls="nfwBody" tabindex="-1">今週</button>
    </div>
    <p class="nfw-meta" id="nfwMeta"></p>
   </div>
   <div class="sheet-scroll nfw-body" id="nfwBody" role="tabpanel" aria-live="polite"></div>
   <footer class="sheet-foot nfw-foot" id="nfwFoot" hidden></footer>
  </div>
 </section>
 <div class="nfw-toast" id="nfwToast" role="status" aria-live="polite"><span class="nfw-toast-in"></span></div>
</div>`;
let built=false;
function build(){
  if(built) return;
  built=true;
  document.body.insertAdjacentHTML('beforeend',SHEET_HTML);
  $('nfwLayer').inert=true;
  $('nfwClose').onclick=()=>{ tap(); closeRank(); };
  $('nfw').querySelector('[data-nfw-close]').addEventListener('click',()=>closeRank());
  $('nfwBody').addEventListener('scroll',()=>{ $('nfwBar').classList.toggle('sh',$('nfwBody').scrollTop>2); },{passive:true});
  const seg=$('nfwSeg');
  seg.addEventListener('click',e=>{ const b=e.target.closest('[role="tab"]'); if(b) setTab(b.dataset.tab); });
  seg.addEventListener('keydown',e=>{
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight') return;
    e.preventDefault(); setTab(rankTab==='today'?'week':'today');
    const b=seg.querySelector(`[data-tab="${rankTab}"]`); if(b) b.focus();
  });
  $('nfw').addEventListener('keydown',e=>{ e.stopPropagation(); });
  window.addEventListener('keydown',e=>{
    if(!sheetOpen()) return;
    if(e.key==='Escape'&&!e.isComposing){ e.preventDefault(); e.stopImmediatePropagation(); closeRank(); return; }
    if(!$('nfw').contains(e.target)) e.stopImmediatePropagation();
  },true);
  document.addEventListener('focusin',e=>{ if(sheetOpen()&&!$('nfw').contains(e.target)){ try{ $('nfwSheet').focus({preventScroll:true}); }catch(_){} } });
  renderFoot();
}
window.addEventListener('storage',e=>{
  if(e.key===KEY.rank||e.key===null) Rank.state=load(KEY.rank)||{};
  if(e.key===KEY.rank||e.key===KEY.day||e.key===null){ boardCache.clear(); if(phase()==='title') renderTitle(); }
});
document.addEventListener('visibilitychange',()=>{ if(document.hidden||!g) return; Srv.ask(false).then(()=>{ if(phase()==='title'){ renderTitle(); refreshMine(false); } }).catch(()=>{}); });
window.addEventListener('online',()=>pushPending());
window.NF_WEB={
  attach(api){
    g=isObj(api)?api:null;
    build(); persist();
    Srv.ask(true).then(()=>{ if(phase()==='title') renderTitle(); pushPending(); refreshMine(true); }).catch(()=>{});
    registerSW();
  },
  onTitle,
  onRun(o){ try{ onRun(o); }catch(e){ try{ console.error('web',e); }catch(_){} } },
  onResultShown(elm,o){ try{ onResultShown(elm,o); }catch(e){ try{ console.error('web',e); }catch(_){} } },
  shareUrl:SITE.announce||SITE.url,
  bgmBase:(()=>{ try{ return new URL(BGM_DIR,document.baseURI).href; }catch(e){ return BGM_DIR; } })(),
  bgmList:BGM_LIST.slice(),
  openRanking(o){ const from=isObj(o)&&o.from==='result'?'result':'title'; if(phase()!=='title'&&phase()!=='result') return; openRank('board',{from}); },
};
if(NATIVE&&typeof NATIVE.haptic==='function') window.NF_WEB.haptic=h=>{ try{ NATIVE.haptic(h); }catch(e){} };
if(LOCAL) Object.assign(window.NF_WEB,{_rank:Rank,_srv:Srv,_boards:boardCache,_site:SITE,_day:()=>loadDay(),_res:()=>res,_api:API,_version:WEB_VERSION});
})();
