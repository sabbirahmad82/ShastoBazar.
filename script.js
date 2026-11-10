const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => '৳ ' + Number(n||0).toLocaleString('en-US');
const today = () => new Date().toISOString().slice(0,10);
const uid = prefix => prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
const seed = {
 products:[
  {id:'P-1001',name:'Wireless Headphones',sku:'EL-001',category:'Electronics',price:2450,cost:1680,stock:42,reorder:15,supplier:'TechSource BD',icon:'♫'},
  {id:'P-1002',name:'Smart Watch Pro',sku:'EL-002',category:'Electronics',price:3850,cost:2700,stock:8,reorder:12,supplier:'TechSource BD',icon:'◷'},
  {id:'P-1003',name:'Bluetooth Speaker',sku:'EL-003',category:'Electronics',price:1850,cost:1200,stock:26,reorder:10,supplier:'Gadget Hub',icon:'◖'},
  {id:'P-1004',name:'USB-C Hub 7-in-1',sku:'AC-001',category:'Accessories',price:1650,cost:980,stock:5,reorder:10,supplier:'Gadget Hub',icon:'▦'},
  {id:'P-1005',name:'Mechanical Keyboard',sku:'AC-002',category:'Accessories',price:3200,cost:2200,stock:31,reorder:12,supplier:'TechSource BD',icon:'⌨'},
  {id:'P-1006',name:'Office Chair',sku:'FU-001',category:'Furniture',price:7800,cost:5900,stock:14,reorder:6,supplier:'Comfort Living',icon:'▣'},
  {id:'P-1007',name:'Desk Lamp',sku:'FU-002',category:'Furniture',price:1250,cost:760,stock:0,reorder:8,supplier:'Comfort Living',icon:'☼'},
  {id:'P-1008',name:'Notebook Set',sku:'OT-001',category:'Others',price:350,cost:180,stock:68,reorder:20,supplier:'Paper Planet',icon:'▤'}
 ],
 suppliers:[
  {id:'S-01',name:'TechSource BD',contact:'Mahmud Hasan',email:'sales@techsource.example',phone:'+880 1712-345678',category:'Electronics'},
  {id:'S-02',name:'Gadget Hub',contact:'Nusrat Jahan',email:'hello@gadgethub.example',phone:'+880 1812-345678',category:'Electronics'},
  {id:'S-03',name:'Comfort Living',contact:'Tanvir Ahmed',email:'info@comfortliving.example',phone:'+880 1912-345678',category:'Furniture'},
  {id:'S-04',name:'Paper Planet',contact:'Sadia Islam',email:'orders@paperplanet.example',phone:'+880 1612-345678',category:'Stationery'}
 ],
 purchases:[
  {id:'PUR-2026-001',date:'2026-11-08',supplier:'TechSource BD',product:'Wireless Headphones',qty:20,total:33600,status:'Received'},
  {id:'PUR-2026-002',date:'2026-11-06',supplier:'Comfort Living',product:'Office Chair',qty:5,total:29500,status:'Received'}
 ],
 sales:[
  {id:'INV-2026-021',date:'2026-11-10',customer:'Ayesha Traders',product:'Mechanical Keyboard',qty:2,total:6400,status:'Completed'},
  {id:'INV-2026-020',date:'2026-11-09',customer:'Nexa Store',product:'Wireless Headphones',qty:3,total:7350,status:'Completed'},
  {id:'INV-2026-019',date:'2026-11-08',customer:'Walk-in Customer',product:'Desk Lamp',qty:1,total:1250,status:'Completed'}
 ],
 movements:[
  {product:'Wireless Headphones',type:'In',qty:20,date:'2026-11-08',note:'Purchase received'},
  {product:'Office Chair',type:'In',qty:5,date:'2026-11-06',note:'Purchase received'},
  {product:'Mechanical Keyboard',type:'Out',qty:2,date:'2026-11-10',note:'Sale completed'},
  {product:'Wireless Headphones',type:'Out',qty:3,date:'2026-11-09',note:'Sale completed'}
 ]
};
let db = loadDB(), modalType = '', editId = null, toastTimer;
function loadDB(){try{return JSON.parse(localStorage.getItem('stockpilot_db'))||structuredClone(seed)}catch(e){return structuredClone(seed)}}
function saveDB(){localStorage.setItem('stockpilot_db',JSON.stringify(db));renderAll()}
function notify(msg){$('#toastMessage').textContent=msg;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500)}
function statusOf(p){return p.stock<=0?'Out of stock':p.stock<=p.reorder?'Low stock':'In stock'}
function statusClass(p){return p.stock<=0?'out':p.stock<=p.reorder?'low':'good'}
function productIcon(p){return `<span class="product-thumb">${p.icon||p.name.slice(0,1)}</span>`}
function productCell(p){return `<div class="product-cell">${productIcon(p)}<span><b>${esc(p.name)}</b><small>${esc(p.category)}</small></span></div>`}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function emptyRow(cols,msg='No records found'){return `<tr><td colspan="${cols}" class="empty-state"><b>${msg}</b>Try adding a new record.</td></tr>`}
function go(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#breadcrumb').textContent=({dashboard:'Dashboard',products:'Products',stock:'Stock Management',suppliers:'Suppliers',purchase:'Purchase',sales:'Sales',reports:'Reports'})[page];$('#sidebar').classList.remove('open');renderAll()}
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.addEventListener('click',e=>{const goBtn=e.target.closest('[data-go]');if(goBtn)go(goBtn.dataset.go);const open=e.target.closest('[data-open]');if(open)openModal(open.dataset.open)});
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#notificationBtn').addEventListener('click',()=>{go('stock');notify('Showing stock items that need attention.')});
$('#helpBtn').addEventListener('click',()=>notify('Use the left menu to manage products, stock, suppliers, purchases and sales.'));
$('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){go('products');$('#productSearch').value=e.target.value;renderProducts()}});
function renderAll(){renderDashboard();renderProducts();renderStock();renderSuppliers();renderPurchases();renderSales();renderReports();$('#productNavCount').textContent=db.products.length}
function renderDashboard(){
 const stockValue=db.products.reduce((s,p)=>s+p.stock*p.cost,0), low=db.products.filter(p=>p.stock<=p.reorder).length;
 const sales=db.sales.reduce((s,t)=>s+t.total,0), units=db.products.reduce((s,p)=>s+p.stock,0);
 $('#statProducts').textContent=db.products.length.toLocaleString('en-US');$('#statValue').textContent=money(stockValue);$('#statLow').textContent=low;$('#statSales').textContent=money(sales);
 $('#alertCount').textContent=low;
 const recent=[...db.sales.map(t=>({...t,type:'Sale',party:t.customer})),...db.purchases.map(t=>({...t,type:'Purchase',party:t.supplier}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 $('#recentTransactions').innerHTML=recent.length?recent.map(t=>`<tr><td><b>${esc(t.id)}</b></td><td>${t.date}</td><td><span class="type-pill ${t.type.toLowerCase()}">${t.type}</span></td><td><b>${money(t.total)}</b></td><td><span class="status good">${t.status}</span></td></tr>`).join(''):emptyRow(5);
 const lows=db.products.filter(p=>p.stock<=p.reorder).sort((a,b)=>a.stock-b.stock).slice(0,4);
 $('#lowStockList').innerHTML=lows.length?lows.map(p=>`<div class="low-stock-item">${productIcon(p)}<span><b>${esc(p.name)}</b><small>${esc(p.sku)} · Reorder at ${p.reorder}</small></span><strong>${p.stock} left</strong></div>`):'<div class="empty-state">All products are well stocked.</div>';
}
function renderProducts(){
 const q=($('#productSearch')?.value||'').toLowerCase(),cat=$('#categoryFilter')?.value||'',status=$('#statusFilter')?.value||'';
 const arr=db.products.filter(p=>(p.name+' '+p.sku+' '+p.category).toLowerCase().includes(q)&&(!cat||p.category===cat)&&(!status||statusOf(p)===status));
 $('#productResultCount').textContent=`${arr.length} products`;
 $('#productsTable').innerHTML=arr.length?arr.map(p=>`<tr><td>${productCell(p)}</td><td>${esc(p.sku)}</td><td>${esc(p.category)}</td><td><b>${money(p.price)}</b></td><td>${p.stock} units</td><td><span class="status ${statusClass(p)}">${statusOf(p)}</span></td><td><button class="action-btn" data-edit-product="${p.id}">Edit</button> <button class="action-btn" data-delete-product="${p.id}">Delete</button></td></tr>`).join(''):emptyRow(7);
}
function renderStock(){
 const q=($('#stockSearch')?.value||'').toLowerCase(),f=$('#stockFilter')?.value||'';
 const arr=db.products.filter(p=>(p.name+' '+p.sku).toLowerCase().includes(q)&&(!f||(f==='low'?p.stock>0&&p.stock<=p.reorder:p.stock<=0)));
 $('#stockTable').innerHTML=arr.length?arr.map(p=>`<tr><td>${productCell(p)}</td><td>${esc(p.sku)}</td><td><b>${p.stock}</b> units</td><td>${p.reorder} units</td><td><span class="status ${statusClass(p)}">${statusOf(p)}</span></td><td><button class="action-btn" data-adjust="${p.id}">Adjust</button></td></tr>`).join(''):emptyRow(6);
 $('#stockUnits').textContent=db.products.reduce((s,p)=>s+p.stock,0).toLocaleString();$('#stockLow').textContent=db.products.filter(p=>p.stock>0&&p.stock<=p.reorder).length;$('#stockOut').textContent=db.products.filter(p=>p.stock===0).length;
 $('#movementTable').innerHTML=db.movements.length?[...db.movements].reverse().slice(0,8).map(m=>`<tr><td>${esc(m.product)}</td><td><span class="type-pill ${m.type==='In'?'purchase':'sale'}">${m.type==='In'?'Stock in':'Stock out'}</span></td><td>${m.type==='In'?'+':'−'}${m.qty}</td><td>${m.date}</td><td>${esc(m.note)}</td></tr>`).join(''):emptyRow(5);
}
function renderSuppliers(){
 const q=($('#supplierSearch')?.value||'').toLowerCase(),arr=db.suppliers.filter(s=>(s.name+' '+s.contact+' '+s.email).toLowerCase().includes(q));
 $('#supplierCount').textContent=`${arr.length} suppliers`;
 $('#supplierGrid').innerHTML=arr.length?arr.map(s=>`<article class="supplier-card"><div class="supplier-head"><div class="supplier-logo">${esc(s.name.slice(0,1))}</div><span><b>${esc(s.name)}</b><small>${esc(s.category)} supplier</small></span></div><div class="supplier-info"><span>Contact person <b>${esc(s.contact)}</b></span><span>Email <b>${esc(s.email)}</b></span><span>Phone <b>${esc(s.phone)}</b></span><span>Products supplied <b>${db.products.filter(p=>p.supplier===s.name).length}</b></span></div><div class="supplier-actions"><button class="action-btn" data-edit-supplier="${s.id}">Edit supplier</button> <button class="action-btn" data-delete-supplier="${s.id}">Delete</button></div></article>`).join(''):'<article class="panel empty-state">No suppliers found.</article>';
}
function renderPurchases(){
 const total=db.purchases.reduce((s,t)=>s+t.total,0),qty=db.purchases.reduce((s,t)=>s+t.qty,0);
 $('#purchaseTotal').textContent=money(total);$('#purchaseOrders').textContent=db.purchases.length;$('#itemsReceived').textContent=qty;
 $('#purchaseTable').innerHTML=db.purchases.length?[...db.purchases].reverse().map(t=>`<tr><td><b>${esc(t.id)}</b></td><td>${t.date}</td><td>${esc(t.supplier)}</td><td>${esc(t.product)}</td><td>${t.qty}</td><td><b>${money(t.total)}</b></td><td><span class="status good">${t.status}</span></td></tr>`).join(''):emptyRow(7);
}
function renderSales(){
 const total=db.sales.reduce((s,t)=>s+t.total,0),qty=db.sales.reduce((s,t)=>s+t.qty,0);
 $('#salesTotal').textContent=money(total);$('#salesOrders').textContent=db.sales.length;$('#unitsSold').textContent=qty;
 $('#salesTable').innerHTML=db.sales.length?[...db.sales].reverse().map(t=>`<tr><td><b>${esc(t.id)}</b></td><td>${t.date}</td><td>${esc(t.customer)}</td><td>${esc(t.product)}</td><td>${t.qty}</td><td><b>${money(t.total)}</b></td><td><span class="status good">${t.status}</span></td></tr>`).join(''):emptyRow(7);
}
function renderReports(){
 const value=db.products.reduce((s,p)=>s+p.stock*p.cost,0),purchase=db.purchases.reduce((s,t)=>s+t.total,0),sales=db.sales.reduce((s,t)=>s+t.total,0);
 const cost=db.sales.reduce((s,t)=>{const p=db.products.find(x=>x.name===t.product);return s+(p?p.cost*t.qty:0)},0);
 $('#reportValue').textContent=money(value);$('#reportPurchase').textContent=money(purchase);$('#reportSales').textContent=money(sales);$('#reportMargin').textContent=money(sales-cost);
 const total=db.products.length||1,low=db.products.filter(p=>p.stock>0&&p.stock<=p.reorder).length,out=db.products.filter(p=>p.stock===0).length,healthy=total-low-out;
 $('#healthBars').innerHTML=[['Healthy stock',healthy,'#6c5ce7'],['Low stock',low,'lowbar'],['Out of stock',out,'outbar']].map(([label,n,c])=>`<div class="health-row"><span>${label}</span><div class="bar-track"><div class="bar-fill ${c==='lowbar'?'lowbar':c==='outbar'?'outbar':''}" style="width:${n/total*100}%"></div></div><b>${n}</b></div>`).join('');
 $('#topProducts').innerHTML=[...db.products].sort((a,b)=>b.stock*b.cost-a.stock*a.cost).slice(0,5).map(p=>`<div class="top-product">${productIcon(p)}<span><b>${esc(p.name)}</b><small>${p.stock} units in stock</small></span><strong>${money(p.stock*p.cost)}</strong></div>`).join('');
 const rows=[...db.purchases.map(t=>({...t,type:'Purchase'})),...db.sales.map(t=>({...t,type:'Sale'}))].sort((a,b)=>b.date.localeCompare(a.date));
 $('#reportTable').innerHTML=rows.length?rows.map(t=>`<tr><td><b>${esc(t.id)}</b></td><td><span class="type-pill ${t.type.toLowerCase()}">${t.type}</span></td><td>${esc(t.product)}</td><td>${t.qty}</td><td><b>${money(t.total)}</b></td><td>${t.date}</td></tr>`).join(''):emptyRow(6);
}
function field(name,label,type='text',value='',opts={},full=false){let control=type==='select'?`<select name="${name}" required>${opts.options.map(o=>`<option ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input name="${name}" type="${type}" value="${esc(value)}" ${opts.min!==undefined?`min="${opts.min}"`:''} ${opts.step?`step="${opts.step}"`:''} placeholder="${opts.placeholder||''}" required>`;return `<div class="field ${full?'full':''}"><label>${label}</label>${control}</div>`}
function openModal(type,data=null){
 modalType=type;editId=data?.id||null;let title='',fields='';
 if(type==='product'){title=data?'Edit product':'Add new product';fields=field('name','Product name','text',data?.name||'')+field('sku','SKU','text',data?.sku||'')+field('category','Category','select',data?.category||'Electronics',{options:['Electronics','Accessories','Furniture','Others']})+field('price','Selling price (BDT)','number',data?.price??'',{min:0,step:'0.01'})+field('cost','Cost price (BDT)','number',data?.cost??'',{min:0,step:'0.01'})+field('stock','Opening stock','number',data?.stock??0,{min:0})+field('reorder','Reorder level','number',data?.reorder??5,{min:0})+field('supplier','Supplier','select',data?.supplier||db.suppliers[0]?.name||'',{options:db.suppliers.map(s=>s.name).length?db.suppliers.map(s=>s.name):['Unassigned']})}
 if(type==='supplier'){title=data?'Edit supplier':'Add new supplier';fields=field('name','Supplier / company name','text',data?.name||'')+field('contact','Contact person','text',data?.contact||'')+field('email','Email address','email',data?.email||'')+field('phone','Phone number','text',data?.phone||'')+field('category','Category','select',data?.category||'Electronics',{options:['Electronics','Accessories','Furniture','Stationery','Others']},true)}
 if(type==='adjustment'){title='Adjust stock';fields=field('product','Select product','select',data?.name||db.products[0]?.name||'',{options:db.products.map(p=>p.name)})+field('direction','Adjustment type','select','Add stock',{options:['Add stock','Remove stock']})+field('qty','Quantity','number',1,{min:1})+field('note','Reason / note','text','Stock count adjustment',{},true)}
 if(type==='purchase'){title='Record a purchase';fields=field('supplier','Supplier','select',db.suppliers[0]?.name||'',{options:db.suppliers.map(s=>s.name)})+field('product','Product','select',db.products[0]?.name||'',{options:db.products.map(p=>p.name)})+field('qty','Quantity received','number',1,{min:1})+field('cost','Unit cost (BDT)','number',db.products[0]?.cost||0,{min:0,step:'0.01'})}
 if(type==='sale'){title='Record a sale';fields=field('customer','Customer name','text','Walk-in Customer')+field('product','Product','select',db.products.find(p=>p.stock>0)?.name||'',{options:db.products.filter(p=>p.stock>0).map(p=>p.name)})+field('qty','Quantity sold','number',1,{min:1})+field('price','Unit selling price (BDT)','number',db.products.find(p=>p.stock>0)?.price||0,{min:0,step:'0.01'})}
 $('#modalTitle').textContent=title;$('#modalFields').innerHTML=fields;$('#modalBackdrop').classList.add('show');setTimeout(()=>$('#modalFields input')?.focus(),50);
}
function closeModal(){$('#modalBackdrop').classList.remove('show');$('#modalForm').reset();editId=null}
$('#modalClose').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);$('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});
$('#modalForm').addEventListener('submit',e=>{
 e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());
 if(modalType==='product'){
  const duplicate=db.products.find(p=>p.sku.toLowerCase()===d.sku.toLowerCase()&&p.id!==editId);if(duplicate){notify('This SKU already exists.');return}
  const p={id:editId||uid('P'),...d,price:+d.price,cost:+d.cost,stock:+d.stock,reorder:+d.reorder,icon:db.products.find(p=>p.id===editId)?.icon||d.name.slice(0,1).toUpperCase()};
  if(editId)db.products=db.products.map(x=>x.id===editId?p:x);else{db.products.unshift(p);db.movements.push({product:p.name,type:'In',qty:p.stock,date:today(),note:'Opening stock'});}
  notify(editId?'Product updated':'Product added');
 }
 if(modalType==='supplier'){
  const s={id:editId||uid('S'),...d};if(editId)db.suppliers=db.suppliers.map(x=>x.id===editId?s:x);else db.suppliers.unshift(s);notify(editId?'Supplier updated':'Supplier added');
 }
 if(modalType==='adjustment'){
  const p=db.products.find(x=>x.name===d.product),qty=+d.qty;if(!p)return;
  if(d.direction==='Remove stock'&&qty>p.stock){notify('Not enough stock available.');return}
  p.stock+=d.direction==='Add stock'?qty:-qty;db.movements.push({product:p.name,type:d.direction==='Add stock'?'In':'Out',qty,date:today(),note:d.note||'Manual adjustment'});notify('Stock adjusted successfully');
 }
 if(modalType==='purchase'){
  const p=db.products.find(x=>x.name===d.product),qty=+d.qty,cost=+d.cost;if(!p)return;
  p.stock+=qty;p.cost=cost;p.supplier=d.supplier;db.purchases.push({id:uid('PUR'),date:today(),supplier:d.supplier,product:p.name,qty,total:qty*cost,status:'Received'});db.movements.push({product:p.name,type:'In',qty,date:today(),note:'Purchase received'});notify('Purchase saved and stock updated');
 }
 if(modalType==='sale'){
  const p=db.products.find(x=>x.name===d.product),qty=+d.qty,price=+d.price;if(!p)return;
  if(qty>p.stock){notify(`Only ${p.stock} units available.`);return}
  p.stock-=qty;db.sales.push({id:uid('INV'),date:today(),customer:d.customer,product:p.name,qty,total:qty*price,status:'Completed'});db.movements.push({product:p.name,type:'Out',qty,date:today(),note:'Sale completed'});notify('Sale recorded and stock updated');
 }
 closeModal();saveDB();
});
document.addEventListener('click',e=>{
 const editP=e.target.closest('[data-edit-product]');if(editP){const p=db.products.find(x=>x.id===editP.dataset.editProduct);openModal('product',p)}
 const delP=e.target.closest('[data-delete-product]');if(delP&&confirm('Delete this product?')){db.products=db.products.filter(x=>x.id!==delP.dataset.deleteProduct);saveDB();notify('Product deleted')}
 const adj=e.target.closest('[data-adjust]');if(adj){const p=db.products.find(x=>x.id===adj.dataset.adjust);openModal('adjustment',p)}
 const editS=e.target.closest('[data-edit-supplier]');if(editS){openModal('supplier',db.suppliers.find(x=>x.id===editS.dataset.editSupplier))}
 const delS=e.target.closest('[data-delete-supplier]');if(delS&&confirm('Delete this supplier?')){db.suppliers=db.suppliers.filter(x=>x.id!==delS.dataset.deleteSupplier);saveDB();notify('Supplier deleted')}
});
['productSearch','categoryFilter','statusFilter'].forEach(id=>$('#'+id).addEventListener('input',renderProducts));
['stockSearch','stockFilter'].forEach(id=>$('#'+id).addEventListener('input',renderStock));
$('#supplierSearch').addEventListener('input',renderSuppliers);
function downloadCSV(filename,rows){const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download=filename;a.click();URL.revokeObjectURL(a.href)}
$('#exportProducts').addEventListener('click',()=>downloadCSV('stockpilot-products.csv',[['Name','SKU','Category','Price','Cost','Stock','Reorder level','Supplier'],...db.products.map(p=>[p.name,p.sku,p.category,p.price,p.cost,p.stock,p.reorder,p.supplier])]));
$('#exportDashboard').addEventListener('click',()=>{go('reports');notify('Open reports to download your summary.')});
$('#exportReport').addEventListener('click',()=>downloadCSV('stockpilot-transactions.csv',[['Reference','Type','Product','Quantity','Amount','Date'],...db.purchases.map(t=>[t.id,'Purchase',t.product,t.qty,t.total,t.date]),...db.sales.map(t=>[t.id,'Sale',t.product,t.qty,t.total,t.date])]));
$('#salesPeriod').addEventListener('change',e=>{const vals=e.target.value==='week'?['৳ 1,84,250','৳ 1,84,250']:['৳ 7,42,800','৳ 7,42,800'];$('#chartTotal').textContent=vals[0]});
renderAll();