const ST=['purchases','bills','income'];
const DB={db:null,
open(){return new Promise((res,rej)=>{const r=indexedDB.open('mcf',1);r.onupgradeneeded=()=>ST.forEach(s=>r.result.createObjectStore(s,{keyPath:'id',autoIncrement:true}));r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error)})},
tx(s,m,f){return new Promise((res,rej)=>{const t=this.db.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})},
all(s){return this.tx(s,'readonly',o=>o.getAll())},get(s,id){return this.tx(s,'readonly',o=>o.get(id))},
put(s,v){return this.tx(s,'readwrite',o=>o.put(v))},del(s,id){return this.tx(s,'readwrite',o=>o.delete(id))},
restore(o){return new Promise((res,rej)=>{const t=this.db.transaction(ST,'readwrite');ST.forEach(s=>{const os=t.objectStore(s);os.clear();(o[s]||[]).forEach(v=>os.put(v))});t.oncomplete=res;t.onerror=()=>rej(t.error)})}};
