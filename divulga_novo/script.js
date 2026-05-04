function showPage(p){
  document.querySelectorAll('.page').forEach(function(x){x.style.display='none';x.classList.remove('active');});
  var el = document.getElementById('page-'+p);
  if(el){el.style.display='block';el.classList.add('active');}
  document.querySelectorAll('.nav-tab').forEach(function(t,i){
    t.classList.toggle('active',
      (p==='site'&&i===0)||
      ((p==='cardapio-landing'||p==='cardapio-onboarding')&&i===1)||
      (p==='dash'&&i===2)
    );
  });
  window.scrollTo(0,0);
}
function showDash(s,el){
  document.querySelectorAll('.dash-section').forEach(function(x){x.classList.remove('active')});
  document.getElementById('dash-'+s).classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(function(x){x.classList.remove('active')});
  el.classList.add('active');
}
var _todayInit=new Date();var calDate=new Date(_todayInit.getFullYear(),_todayInit.getMonth(),1),selDay=null,selTime=null;
var unavailTimes=['10:30','12:00','14:00'];
function renderCal(){
  var months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('cal-title').textContent=months[calDate.getMonth()]+' '+calDate.getFullYear();
  var grid=document.getElementById('cal-grid');grid.innerHTML='';
  ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(function(d){var el=document.createElement('div');el.className='cal-day-name';el.textContent=d;grid.appendChild(el);});
  var first=new Date(calDate.getFullYear(),calDate.getMonth(),1).getDay();
  var days=new Date(calDate.getFullYear(),calDate.getMonth()+1,0).getDate();
  var today=new Date();
  for(var i=0;i<first;i++){var el=document.createElement('div');el.className='cal-day empty';grid.appendChild(el);}
  for(var d=1;d<=days;d++){
    var el=document.createElement('div');
    var dt=new Date(calDate.getFullYear(),calDate.getMonth(),d);
    var isPast=dt<new Date(today.getFullYear(),today.getMonth(),today.getDate());
    var isWeekend=dt.getDay()===0||dt.getDay()===6;
    el.textContent=d;
    if(isPast||isWeekend){el.className='cal-day past';}
    else{el.className='cal-day available';if(selDay===d)el.classList.add('selected');(function(day){el.onclick=function(){selDay=day;selTime=null;renderCal();showTimes(day);};})(d);}
    grid.appendChild(el);
  }
}
function showTimes(day){
  document.getElementById('time-section').style.display='block';
  var months=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  document.getElementById('sel-date').textContent=day+' de '+months[calDate.getMonth()];
  var times=['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
  var sl=document.getElementById('time-slots');sl.innerHTML='';
  times.forEach(function(t){
    var el=document.createElement('div');
    var ua=unavailTimes.includes(t);
    el.className='time-slot'+(ua?' unavail':'');el.textContent=t;
    if(!ua){el.onclick=function(){selTime=t;document.querySelectorAll('.time-slot').forEach(function(x){x.classList.remove('selected');});el.classList.add('selected');document.getElementById('confirm-btn-wrap').style.display='block';};}
    sl.appendChild(el);
  });
  document.getElementById('confirm-btn-wrap').style.display='none';
}
function changeMonth(d){
  var today=new Date();
  var newDate=new Date(calDate.getFullYear(),calDate.getMonth()+d,1);
  if(newDate<new Date(today.getFullYear(),today.getMonth(),1))return;
  calDate.setMonth(calDate.getMonth()+d);selDay=null;selTime=null;document.getElementById('time-section').style.display='none';renderCal();
}
function confirmBooking(){
  if(!selDay||!selTime)return;
  var months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var msg='Olá! Gostaria de agendar uma reunião com a MAIND para o dia '+selDay+' de '+months[calDate.getMonth()]+' de '+calDate.getFullYear()+' às '+selTime+'.';
  var wa=(window.MAIND_WHATSAPP||'5582999999999').replace(/\D/g,'');
  window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
}
function submitLeadForm(){
  var nome     =(document.getElementById('lead-nome')||{value:''}).value.trim();
  var waRaw    =(document.getElementById('lead-wa')||{value:''}).value.trim();
  var negocio  =(document.getElementById('lead-negocio')||{value:''}).value.trim();
  var tipo     =(document.getElementById('lead-tipo')||{value:''}).value;
  var fat      =(document.getElementById('lead-faturamento')||{value:''}).value;
  var mensagem =(document.getElementById('lead-mensagem')||{value:''}).value.trim();
  var waDigits =waRaw.replace(/\D/g,'');
  var nomeEl=document.getElementById('lead-nome');
  var waEl  =document.getElementById('lead-wa');
  if(!nome){
    if(nomeEl){nomeEl.focus();nomeEl.style.borderColor='#DC2626';}
    return;
  }
  if(!waDigits||waDigits.length<10||waDigits.length>11){
    alert('Informe um WhatsApp válido com DDD.');
    if(waEl){waEl.focus();waEl.style.borderColor='#DC2626';}
    return;
  }
  if(nomeEl)nomeEl.style.borderColor='';
  if(waEl)waEl.style.borderColor='';
  var btn=document.getElementById('lead-submit-btn');
  if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  var apiBase=(typeof window.API_BASE_URL==='string'&&window.API_BASE_URL)
    ?window.API_BASE_URL
    :location.protocol+'//'+location.hostname+':3001';
  fetch(apiBase+'/api/leads',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({nome:nome,whatsapp:waDigits,negocio:negocio,tipo:tipo,faturamento:fat,mensagem:mensagem})
  }).then(function(r){return r.json();}).then(function(){
    if(btn){btn.disabled=false;btn.textContent='Quero meu diagnóstico gratuito →';}
    var wrap=document.querySelector('.form-wrap');
    if(wrap)wrap.innerHTML='<div style="text-align:center;padding:2rem 0"><div style="font-size:2.5rem;margin-bottom:1rem">✅</div><h3 style="font-size:1.2rem;font-weight:700;margin-bottom:.5rem;color:#fff">Mensagem enviada!</h3><p style="color:rgba(255,255,255,0.6)">Entraremos em contato em breve pelo WhatsApp.</p></div>';
    if(typeof fbq==='function'){fbq('track','Lead');}
  }).catch(function(err){
    console.error('[LEAD]',err);
    if(btn){btn.disabled=false;btn.textContent='Quero meu diagnóstico gratuito →';}
    alert('Erro de conexão. Tente novamente ou nos chame pelo WhatsApp.');
  });
}
renderCal();