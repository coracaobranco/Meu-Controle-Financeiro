const Scanner={
pick(cap,accept='image/*'){return new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept=accept;if(cap)i.capture='environment';i.onchange=()=>r(i.files[0]);i.click()})},
shrink(f){return new Promise((res,rej)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const k=Math.min(1,1600/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.75))};i.onerror=()=>rej(new Error('Imagem inválida'));i.src=u})},
async ocr(url,cb){if(!window.Tesseract)throw new Error('biblioteca de OCR indisponível (conecte-se à internet na primeira vez)');const r=await Tesseract.recognize(url,'por',{logger:m=>m.progress!=null&&cb&&cb(m.progress)});return r.data.text},
money(s){return(s.match(/\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g)||[]).map(x=>parseFloat(x.replace(/\./g,'').replace(',','.')))},
date(s){const m=(s||'').match(/(\d{2})[\/.-](\d{2})[\/.-](\d{4})/);return m?`${m[3]}-${m[2]}-${m[1]}`:''},
parseNote(t){const L=t.split('\n').map(x=>x.trim()).filter(Boolean);
const store=L.find(l=>/[A-Za-zÀ-ú]{4,}/.test(l))||'',cnpj=(t.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)||[''])[0],time=(t.match(/\b([01]\d|2[0-3]):[0-5]\d/)||[''])[0];
let total=0;const items=[];
L.forEach(l=>{const v=this.money(l);if(/total/i.test(l)&&!/sub/i.test(l)&&v.length)total=Math.max(total,v[v.length-1]);
if(v.length<2||/total|troco|dinheiro|cart|cnpj|cpf|desconto|pagamento|tribut/i.test(l))return;
let name=l.split(/\s\d/)[0].replace(/^\d+\s*/,'').replace(/\b(KG|UN|LT|L|PC|CX|G|ML)\b\s*$/i,'').trim();if(name.length<3)return;
const tt=v[v.length-1],vu=v[v.length-2];items.push({name,qty:vu?Math.round(tt/vu*1000)/1000:1,unit:((l.match(/\b(KG|UN|LT|L|PC|CX|G|ML)\b/i)||[])[1]||'UN').toUpperCase().replace('LT','L'),vu,total:tt})});
if(!total)total=+items.reduce((s,i)=>s+i.total,0).toFixed(2);
const pay=/pix/i.test(t)?'Pix':/cr[eé]dito/i.test(t)?'Crédito':/d[eé]bito/i.test(t)?'Débito':/dinheiro/i.test(t)?'Dinheiro':'Outro';
return{store,cnpj,date:this.date(t),time,total,pay,items}},
parseBill(t){const low=t.toLowerCase();let type='outras';
[['agua',/[áa]gua|saneamento|sabesp|caesb|copasa|sanepar|esgoto/],['energia',/energia|kwh|cemig|enel|neoenergia|cpfl|equatorial|celesc/],['internet',/internet|fibra|banda larga/],['telefone',/telefon|celular/],['condominio',/condom[ií]nio/],['gas',/g[aá]s/],['aluguel',/alugu[eé]l/]].some(([k,r])=>r.test(low)&&(type=k,true));
const L=t.split('\n').map(x=>x.trim()).filter(Boolean),g=(r,i=1)=>(t.match(r)||[])[i]||'';
const company=L.find(l=>/[A-Za-zÀ-ú]{4,}/.test(l))||'';
const vl=L.find(l=>/venc/i.test(l)&&this.date(l)),due=vl?this.date(vl):this.date(t);
const il=L.find(l=>/emiss/i.test(l)&&this.date(l)),mr=t.match(/(?:refer[eê]ncia|m[eê]s)[^\d]{0,15}(\d{2})\s*[\/.-]\s*(\d{4})/i);
let value=0;L.forEach(l=>{if(/total|pagar|valor/i.test(l)){const v=this.money(l);if(v.length)value=Math.max(value,v[v.length-1])}});
if(!value)value=Math.max(0,...this.money(t));
const cons=type=='agua'?g(/(\d+(?:,\d+)?)\s*m[3³]/i):type=='energia'?g(/(\d+)\s*kwh/i):'';
return{type,company,holder:g(/(?:titular|cliente|nome)[:\s]+([^\n]{5,50})/i).trim(),value,due,issued:il?this.date(il):'',ref:mr?`${mr[2]}-${mr[1]}`:'',cons,
prev:g(/leitura anterior[^\d]{0,10}(\d+)/i),curr:g(/leitura atual[^\d]{0,10}(\d+)/i),barcode:(t.match(/(?:\d[\s.-]?){44,48}/)||[''])[0].trim(),inst:g(/(?:instala[cç][aã]o|unidade consumidora|\bUC\b)[^\d]{0,15}(\d{5,12})/i)}}};
