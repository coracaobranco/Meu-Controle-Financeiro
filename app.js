const $=(s,r=document)=>r.querySelector(s);
const R=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>new Date().toISOString().slice(0,10),ym=d=>(d||'').slice(0,7),num=v=>parseFloat(String(v).replace(',','.'))||0;
const fdate=s=>s?s.split('-').reverse().join('/'):'',g=(r,n)=>r.querySelector(`[name=${n}]`).value;
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim();
const opts=(a,v)=>a.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('');
const BT={agua:'Água',energia:'Energia elétrica',internet:'Internet',telefone:'Telefone',aluguel:'Aluguel',condominio:'Condomínio',gas:'Gás',outras:'Outras contas'};
const CATI=['Salário','Trabalho extra','Serviços','Vendas','Outras entradas'],UN=['UN','KG','G','L','ML','PC','CX'],PAY=['Dinheiro','Pix','Débito','Crédito','Outro'];
const TABS=[['home','Início','🏠'],['purchases','Compras','🛒'],['bills','Contas','🧾'],['income','Receitas','💰'],['more','Mais','⚙️']];
let S={tab:'home',month:today().slice(0,7),q:'',charts:[]},dip;
const D=async()=>({p:await DB.all('purchases'),b:await DB.all('bills'),i:await DB.all('income')});
const prevM=m=>{let[y,o]=m.split('-').map(Number);o--;if(!o){o=12;y--}return y+'-'+String(o).padStart(2,'0')};
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',4500)};
const mpick=()=>`<input type="month" value="${S.month}" onchange="S.month=this.value||S.month;render()">`;
function theme(){const t=document.documentElement.dataset.theme=='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('theme',t);render()}
function modal(title,body,save,label='Salvar'){const d=$('#dlg');d.innerHTML=`<form><h2>${title}</h2>${body}<div class="row"><button type="button" class="ghost" onclick="$('#dlg').close()">Cancelar</button>${save?`<button class="pri">${label}</button>`:''}</div></form>`;
d.querySelector('form').onsubmit=async e=>{e.preventDefault();try{if(await save(e.target)!==false){d.close();render()}}catch(x){toast('Erro: '+x.message)}};d.showModal()}
async function render(){$('#nav').innerHTML=TABS.map(([k,l,i])=>`<button data-t="${k}" class="${S.tab==k?'on':''}"><span>${i}</span>${l}</button>`).join('');
S.charts.forEach(c=>c.destroy());S.charts=[];$('#main').innerHTML=await({home:vHome,purchases:vPurchases,bills:vBills,income:vIncome,more:vMore}[S.tab])();if(S.tab=='home')charts()}
function monthSum(d,m){const food=d.p.filter(x=>ym(x.date)==m).reduce((s,x)=>s+x.total,0),bt={};
d.b.filter(x=>x.paid&&ym(x.due)==m).forEach(x=>bt[x.type]=(bt[x.type]||0)+(x.paidValue||x.value));
const inc=d.i.filter(x=>ym(x.date)==m).reduce((s,x)=>s+x.value,0);return{food,bt,inc,exp:food+Object.values(bt).reduce((a,b)=>a+b,0)}}
async function vHome(){const d=await D(),s=monthSum(d,S.month),pm=monthSum(d,prevM(S.month));
const pend=d.b.filter(b=>!b.paid&&ym(b.due)==S.month),paid=d.b.filter(b=>b.paid&&ym(b.due)==S.month),late=d.b.filter(b=>!b.paid&&b.due<today()),al=[];
if(pm.exp>0&&s.exp>pm.exp*1.2)al.push(`Despesas ${((s.exp/pm.exp-1)*100).toFixed(0)}% acima do mês anterior`);
['agua','energia'].forEach(t=>{const a=s.bt[t]||0,b=pm.bt[t]||0;if(b&&a>b*1.15)al.push(`Conta de ${BT[t].toLowerCase()} subiu ${((a/b-1)*100).toFixed(0)}% vs. mês anterior`)});
if(late.length)al.push(`${late.length} conta(s) vencida(s) sem pagamento`);
const st={};d.p.filter(x=>ym(x.date)==S.month).forEach(x=>st[x.store]=(st[x.store]||0)+x.total);const top=Object.entries(st).sort((a,b)=>b[1]-a[1])[0];
const other=Object.entries(s.bt).filter(([k])=>!['agua','energia'].includes(k)).reduce((a,[,v])=>a+v,0);
const ms=[S.month];for(let i=0;i<5;i++)ms.unshift(prevM(ms[0]));const x=ms.map(m=>monthSum(d,m));
S.cd={cat:[s.food,s.bt.agua||0,s.bt.energia||0,other],ms,inc:x.map(a=>a.inc),exp:x.map(a=>a.exp)};
const K=(k,v)=>`<div class="card"><div class="k">${k}</div><div class="v">${v}</div></div>`;
return`<div class="row">${mpick()}</div>${al.map(a=>`<div class="alert">⚠️ ${a}</div>`).join('')}
<div class="grid">${K('Despesas',R(s.exp))}${K('Receitas',R(s.inc))}${K('Saldo',R(s.inc-s.exp))}${K('Pendentes',`${pend.length} · ${R(pend.reduce((a,b)=>a+b.value,0))}`)}${K('Pagas',paid.length+' conta(s)')}${K('Alimentação',R(s.food))}${K('Água',R(s.bt.agua||0))}${K('Energia',R(s.bt.energia||0))}${K('Outras categorias',R(other))}</div>
${top?`<div class="card"><div class="k">Estabelecimento com mais gastos</div><b>${esc(top[0])}</b> · ${R(top[1])}</div>`:''}
<div class="card"><canvas id="c1" height="200"></canvas></div><div class="card"><canvas id="c2" height="200"></canvas></div>`}
function charts(){if(!window.Chart)return;const c=S.cd;Chart.defaults.color=document.documentElement.dataset.theme=='dark'?'#ccc':'#444';
S.charts=[new Chart($('#c1'),{type:'doughnut',data:{labels:['Alimentação','Água','Energia','Outras'],datasets:[{data:c.cat,backgroundColor:['#111','#4a90d9','#e0a800','#999'],borderWidth:0}]},options:{plugins:{title:{display:true,text:'Despesas por categoria'},legend:{position:'bottom'}}}}),
new Chart($('#c2'),{type:'bar',data:{labels:c.ms.map(m=>m.slice(5)+'/'+m.slice(2,4)),datasets:[{label:'Receitas',data:c.inc,backgroundColor:'#2e9e5b'},{label:'Despesas',data:c.exp,backgroundColor:'#d64545'}]},options:{plugins:{title:{display:true,text:'Receitas × despesas (6 meses)'},legend:{position:'bottom'}}}})]}
/* SCAN */
async function scan(kind,cam){const f=await Scanner.pick(cam);if(!f)return;modal('Lendo documento…','<p id="prog">Preparando imagem…</p><progress id="pb" max="1" value="0" style="width:100%"></progress>',null);
let url='',p={};try{url=await Scanner.shrink(f);const t=await Scanner.ocr(url,x=>{$('#prog').textContent='Reconhecendo texto… '+Math.round(x*100)+'%';$('#pb').value=x});
p=kind=='p'?Scanner.parseNote(t):Scanner.parseBill(t);if(!(p.total||p.value))toast('Poucos dados reconhecidos. Complete manualmente.')}catch(e){toast('Falha no OCR: '+e.message+'. Preencha manualmente.')}
$('#dlg').close();kind=='p'?pForm(p,url):bForm(p,url)}
const scanBtns=k=>`<div class="row"><button class="pri" onclick="scan('${k}',true)">📷 Fotografar</button><button class="ghost" onclick="scan('${k}',false)">🖼 Galeria</button><button class="ghost" onclick="${k=='p'?'pForm()':'bForm()'}">✍ Manual</button></div>`;
async function delRec(s,id){if(confirm('Excluir este registro?')){await DB.del(s,id);render()}}
/* COMPRAS */
const itRow=i=>`<div class="it"><input name="n" placeholder="Produto" value="${esc(i.name)}" required><input name="q" type="number" step="any" min="0" value="${i.qty??1}" required><select name="u">${opts(UN,i.unit||'UN')}</select><input name="v" type="number" step="any" min="0" placeholder="R$ unit." value="${i.vu??''}" required><button type="button" class="x" onclick="this.parentNode.remove();sumIt()">✕</button></div>`;
const sumIt=()=>{let t=0;document.querySelectorAll('#dlg .it').forEach(r=>t+=num(g(r,'q'))*num(g(r,'v')));$('#dlg [name=total]').value=t.toFixed(2)};
const addIt=()=>$('#its').insertAdjacentHTML('beforeend',itRow({}));
function pForm(p={},photo=''){photo=photo||p.photo||'';
modal(p.id?'Editar compra':'Conferir compra',`${photo?`<img class="thumb" src="${photo}">`:''}
<label>Estabelecimento<input name="store" required value="${esc(p.store)}"></label><label>CNPJ<input name="cnpj" value="${esc(p.cnpj)}"></label>
<div class="g2"><label>Data<input name="date" type="date" required value="${p.date||today()}"></label><label>Hora<input name="time" type="time" value="${p.time||''}"></label></div>
<label>Pagamento<select name="pay">${opts(PAY,p.pay)}</select></label><h3>Produtos</h3><div id="its" oninput="sumIt()">${(p.items?.length?p.items:[{}]).map(itRow).join('')}</div>
<button type="button" class="ghost" onclick="addIt()">+ Produto</button><label>Total (R$)<input name="total" type="number" step="0.01" min="0.01" required value="${p.total||''}"></label>`,
async f=>{const items=[...f.querySelectorAll('.it')].map(r=>({name:g(r,'n').trim(),qty:num(g(r,'q')),unit:g(r,'u'),vu:num(g(r,'v')),total:+(num(g(r,'q'))*num(g(r,'v'))).toFixed(2)}));
if(!items.length)return toast('Adicione ao menos um produto'),false;const o=Object.fromEntries(new FormData(f));
const rec={...p,store:o.store.trim(),cnpj:o.cnpj.trim(),date:o.date,time:o.time,pay:o.pay,total:num(o.total),items,photo};rec.id=await DB.put('purchases',rec);
const d=await D(),m=items.map(i=>({i,r:pd(d,i,rec)})).filter(x=>x.r).slice(0,3).map(x=>`${x.i.name}: ${x.r.df>0?'subiu':'baixou'} ${R(Math.abs(x.r.df))}/${x.i.unit.toLowerCase()}`);if(m.length)toast(m.join(' · '))})}
function pd(d,it,p){const n=norm(it.name),k=x=>x.date+String(x.id||99999999).padStart(8,'0'),pk=k(p);let best=null;
for(const x of d.p){if(x.id===p.id||k(x)>=pk)continue;const m=x.items.find(i=>norm(i.name)==n);if(m&&(!best||k(x)>best.k))best={k:k(x),vu:m.vu}}
if(!best||!best.vu)return null;const df=it.vu-best.vu;return Math.abs(df)<.005?null:{df,pct:df/best.vu*100,prev:best.vu,unit:it.unit}}
const pdTxt=r=>r?`<small class="${r.df>0?'up':'dn'}">${r.df>0?'▲ +':'▼ −'}${R(Math.abs(r.df))}/${r.unit.toLowerCase()} (${r.pct>0?'+':''}${r.pct.toFixed(1)}%) · antes ${R(r.prev)}</small>`:'';
const editP=async id=>pForm(await DB.get('purchases',id));
function search(v){S.q=v;clearTimeout(S.t);S.t=setTimeout(async()=>{$('#main').innerHTML=await vPurchases();const e=$('#q');e.focus();e.setSelectionRange(99,99)},250)}
async function vPurchases(){const d=await D(),q=norm(S.q);
const L=d.p.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).filter(p=>!q||norm(`${p.store} ${p.items.map(i=>i.name).join(' ')} ${p.date} ${fdate(p.date)} ${p.total.toFixed(2).replace('.',',')}`).includes(q));
return`<h2>Compras</h2>${scanBtns('p')}<input id="q" type="search" placeholder="Buscar loja, produto, data ou valor" value="${esc(S.q)}" oninput="search(this.value)">
${L.map(p=>`<div class="card"><div class="top"><b>${esc(p.store)}</b><b>${R(p.total)}</b></div><small>${fdate(p.date)} ${p.time||''} · ${p.pay||''}</small>
<ul>${p.items.map(i=>`<li>${esc(i.name)} — ${i.qty} ${i.unit} × ${R(i.vu)}<br>${pdTxt(pd(d,i,p))}</li>`).join('')}</ul>
<div class="row"><button class="ghost" onclick="editP(${p.id})">Editar</button><button class="ghost" onclick="delRec('purchases',${p.id})">Excluir</button></div></div>`).join('')||'<p><small>Nenhuma compra registrada.</small></p>'}`}
/* CONTAS */
function st(b){if(b.paid)return['Paga','ok'];const n=Math.round((new Date(b.due)-new Date(today()))/864e5);return n<0?['Vencida há '+(-n)+'d','late']:n<=5?['Vence '+(n?'em '+n+'d':'hoje'),'soon']:['Pendente','pend']}
function bForm(b={},photo=''){photo=photo||b.photo||'';const I=(l,n,t='text',x='')=>`<label>${l}<input name="${n}" type="${t}" ${x} value="${esc(b[n])}"></label>`;
modal(b.id?'Editar conta':'Conferir conta',`${photo?`<img class="thumb" src="${photo}">`:''}
<label>Tipo<select name="type">${Object.entries(BT).map(([k,v])=>`<option value="${k}" ${k==(b.type||'outras')?'selected':''}>${v}</option>`).join('')}</select></label>
${I('Empresa fornecedora','company','text','required')}${I('Titular','holder')}${I('Valor (R$)','value','number','step="0.01" min="0.01" required')}
<div class="g2">${I('Vencimento','due','date','required')}${I('Emissão','issued','date')}</div>${I('Mês de referência','ref','month')}
<div class="g2">${I('Consumo (m³ / kWh)','cons')}${I('Nº instalação / UC','inst')}${I('Leitura anterior','prev')}${I('Leitura atual','curr')}</div>${I('Código de barras','barcode')}`,
async f=>{const o=Object.fromEntries(new FormData(f));await DB.put('bills',{...b,...o,company:o.company.trim(),value:num(o.value),photo,paid:!!b.paid})})}
const editB=async id=>bForm(await DB.get('bills',id));
async function pay(id){const b=await DB.get('bills',id);modal('Registrar pagamento',`<label>Data do pagamento<input name="pd" type="date" required value="${today()}"></label><label>Valor pago (R$)<input name="pv" type="number" step="0.01" min="0" required value="${b.value}"></label>`,async f=>{Object.assign(b,{paid:true,paidDate:f.pd.value,paidValue:num(f.pv.value)});await DB.put('bills',b)})}
async function unpay(id){const b=await DB.get('bills',id);b.paid=false;await DB.put('bills',b);render()}
async function vBills(){const d=await D(),L=d.b.sort((a,b)=>(a.paid-b.paid)||(a.paid?b.due.localeCompare(a.due):a.due.localeCompare(b.due)));
return`<h2>Contas e vencimentos</h2>${scanBtns('b')}${L.map(b=>{const[t,c]=st(b);return`<div class="card"><div class="top"><b>${BT[b.type]} · ${esc(b.company)}</b><span class="chip ${c}">${t}</span></div>
<div class="top"><span>${R(b.paid?b.paidValue:b.value)}</span><small>Venc. ${fdate(b.due)}${b.ref?' · ref. '+b.ref.split('-').reverse().join('/'):''}</small></div>
${b.cons?`<small>Consumo: ${esc(b.cons)} ${b.type=='agua'?'m³':b.type=='energia'?'kWh':''}${b.prev?` · leitura ${esc(b.prev)} → ${esc(b.curr)}`:''}</small><br>`:''}${b.paid?`<small>Paga em ${fdate(b.paidDate)}</small>`:''}
<div class="row">${b.paid?`<button class="ghost" onclick="unpay(${b.id})">Marcar pendente</button>`:`<button class="pri" onclick="pay(${b.id})">Marcar paga</button>`}<button class="ghost" onclick="editB(${b.id})">Editar</button><button class="ghost" onclick="delRec('bills',${b.id})">Excluir</button></div></div>`}).join('')||'<p><small>Nenhuma conta registrada.</small></p>'}`}
/* RECEITAS */
function iForm(x={}){modal(x.id?'Editar receita':'Nova receita',`<label>Descrição<input name="desc" required value="${esc(x.desc)}"></label><label>Categoria<select name="cat">${opts(CATI,x.cat)}</select></label><div class="g2"><label>Valor (R$)<input name="value" type="number" step="0.01" min="0.01" required value="${x.value??''}"></label><label>Data<input name="date" type="date" required value="${x.date||today()}"></label></div>`,
async f=>{const o=Object.fromEntries(new FormData(f));await DB.put('income',{...x,desc:o.desc.trim(),cat:o.cat,value:num(o.value),date:o.date})})}
const editI=async id=>iForm(await DB.get('income',id));
async function vIncome(){const d=await D(),L=d.i.filter(x=>ym(x.date)==S.month).sort((a,b)=>b.date.localeCompare(a.date));
return`<h2>Receitas</h2><div class="row">${mpick()}<button class="pri" onclick="iForm()">+ Nova receita</button></div><div class="card"><div class="k">Total do mês</div><div class="v">${R(L.reduce((s,x)=>s+x.value,0))}</div></div>
${L.map(x=>`<div class="card"><div class="top"><b>${esc(x.desc)}</b><b>${R(x.value)}</b></div><small>${x.cat} · ${fdate(x.date)}</small><div class="row"><button class="ghost" onclick="editI(${x.id})">Editar</button><button class="ghost" onclick="delRec('income',${x.id})">Excluir</button></div></div>`).join('')||'<p><small>Nenhuma receita neste mês.</small></p>'}`}
/* BACKUP */
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5e3)}
async function exportJSON(){const o={app:'mcf',v:1,date:new Date().toISOString()};for(const s of ST)o[s]=await DB.all(s);dl(new Blob([JSON.stringify(o)],{type:'application/json'}),`backup-controle-${today()}.json`);toast('Backup gerado. Guarde o arquivo em local seguro.')}
async function exportCSV(){const d=await D(),r=[['Tipo','Data','Descrição','Local/Empresa','Qtd','Unid','Valor unit.','Total']];
d.p.forEach(p=>p.items.forEach(i=>r.push(['Compra',p.date,i.name,p.store,i.qty,i.unit,i.vu,i.total])));
d.b.forEach(b=>r.push(['Conta '+BT[b.type],b.due,b.paid?'Paga':'Pendente',b.company,'','','',b.paid?b.paidValue:b.value]));
d.i.forEach(x=>r.push(['Receita',x.date,x.desc,x.cat,'','','',x.value]));
dl(new Blob(['\ufeff'+r.map(l=>l.map(c=>`"${(typeof c=='number'?String(c).replace('.',','):String(c??'')).replace(/"/g,'""')}"`).join(';')).join('\n')],{type:'text/csv'}),`relatorio-${today()}.csv`)}
async function imp(){try{const f=await Scanner.pick(false,'.json,application/json'),o=JSON.parse(await f.text());if(o.app!=='mcf')throw new Error('arquivo não é um backup válido');
if(!confirm('Isto SUBSTITUI todos os dados atuais pelo backup. Continuar?'))return;await DB.restore(o);toast('Backup restaurado.');render()}catch(e){toast('Falha ao importar: '+e.message)}}
async function wipe(){if(confirm('Apagar TODOS os dados deste aparelho? Não há como desfazer.')&&confirm('Tem certeza?')){await DB.restore({});render()}}
function inst(){if(dip){dip.prompt();dip=null}else toast('Android: menu ⋮ → Instalar app. iPhone: Compartilhar → Adicionar à Tela de Início.')}
async function vMore(){return`<h2>Backup e ajustes</h2><div class="card"><b>⚠️ Seus dados ficam só neste aparelho</b><p><small>Não há criptografia nem nuvem. Limpar os dados do navegador, perder ou formatar o aparelho apaga tudo. Faça backups periódicos.</small></p>
<div class="row"><button class="pri" onclick="exportJSON()">Exportar backup (JSON)</button><button class="ghost" onclick="imp()">Importar backup</button></div><div class="row"><button class="ghost" onclick="exportCSV()">Exportar relatório (CSV)</button></div></div>
<div class="card"><div class="row"><button class="ghost" onclick="inst()">📲 Instalar aplicativo</button><button class="ghost" onclick="theme()">◐ Alternar tema</button></div><div class="row"><button class="ghost" onclick="wipe()">Apagar todos os dados</button></div></div>`}
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b){S.tab=b.dataset.t;render()}};
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e});
document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
(async()=>{try{await DB.open();navigator.storage?.persist?.();if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');render()}catch(e){$('#main').innerHTML='<div class="alert">Não foi possível abrir o armazenamento local: '+esc(e.message)+'</div>'}})();
