const $=id=>document.getElementById(id);
async function api(url,opt){const r=await fetch(url,{headers:{"Content-Type":"application/json"},...opt});const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d}
function show(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");if(id==="plans")loadPlans();if(id==="portal")loadSubs();if(id==="admin")loadAdmin()}
async function loadPlans(){
 const plans=await api("/api/plans"); $("planGrid").innerHTML=plans.map(p=>`
 <div class="plan"><span class="tag">${p.billing_cycle}</span><h3>${p.name}</h3>
 <div class="price">₹${p.price}<small> / ${p.billing_cycle}</small></div>
 <ul>${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>
 <button class="primary" onclick="choose(${p.id})">Choose ${p.name}</button></div>`).join("");
}
function choose(id){$("portalPlan").value=id;show("portal");}
async function createCustomer(){
 try{const d=await api("/api/customers",{method:"POST",body:JSON.stringify({name:"Demo Customer",email:"demo"+Date.now()+"@example.com"})});$("customerId").value=d.id;$("portalMsg").textContent="Customer created. ID: "+d.id}
 catch(e){$("portalMsg").textContent=e.message}
}
async function subscribe(){
 try{const d=await api("/api/subscriptions",{method:"POST",body:JSON.stringify({customer_id:Number($("customerId").value),plan_id:Number($("portalPlan").value)})});$("portalMsg").textContent="Subscription created: #"+d.id+" ("+d.status+")";loadSubs()}
 catch(e){$("portalMsg").textContent=e.message}
}
async function cancelSub(){
 const rows=await api("/api/subscriptions");const mine=rows.find(x=>x.customer_id==Number($("customerId").value));
 if(!mine){$("portalMsg").textContent="No subscription found";return}
 await api("/api/subscriptions/"+mine.id,{method:"PATCH",body:JSON.stringify({status:"canceled"})});
 $("portalMsg").textContent="Subscription canceled.";loadSubs()
}
async function loadSubs(){const rows=await api("/api/subscriptions");$("subscriptions").innerHTML=rows.slice(0,10).map(x=>`
<div class="row"><span><b>#${x.id} ${x.customer_name}</b><br>${x.plan_name} · ₹${x.price}</span><span class="tag">${x.status}</span></div>`).join("")||"No subscriptions yet."}
async function loadAdmin(){
 const d=await api("/api/dashboard");$("stats").innerHTML=[
 ["Active subscriptions",d.active],["Trials",d.trials],["Revenue","₹"+Number(d.revenue).toFixed(2)],["Canceled",d.churn]
 ].map(x=>`<div class="stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
 const plans=await api("/api/plans");$("adminPlans").innerHTML=plans.map(p=>`<div class="row"><span>${p.name}</span><b>₹${p.price}</b></div>`).join("");
 const inv=await api("/api/invoices");$("invoices").innerHTML=inv.map(i=>`<div class="row"><span>#${i.id} ${i.customer_name}<br>${i.plan_name}</span><span>₹${i.amount}<br><small>${i.status}</small></span></div>`).join("")||"No invoices yet.";
}
async function createPlan(){
 try{await api("/api/plans",{method:"POST",body:JSON.stringify({name:$("newName").value,price:Number($("newPrice").value),billing_cycle:$("newCycle").value,features:$("newFeatures").value.split(",").map(x=>x.trim()).filter(Boolean)})});$("newName").value="";$("newPrice").value="";$("newFeatures").value="";loadAdmin();loadPlans()}
 catch(e){alert(e.message)}
}
async function seed(){await api("/api/demo/seed",{method:"POST"});loadAdmin();loadSubs()}
loadPlans();