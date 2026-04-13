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
var calDate=new Date(2026,3,1),selDay=null,selTime=null;
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
function changeMonth(d){calDate.setMonth(calDate.getMonth()+d);selDay=null;selTime=null;document.getElementById('time-section').style.display='none';renderCal();}
function confirmBooking(){if(selDay&&selTime)alert('Reunião agendada para '+selDay+'/04/2026 às '+selTime+'!\nVocê receberá uma confirmação por WhatsApp.');}
renderCal();