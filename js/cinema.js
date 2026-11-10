/* Layered scenery. Only compositor transforms and opacity animate. */
window.OD=window.OD||{};
OD.cinema=(()=>{
  const labels={village:['บ้านสุขใจ · ริมคลอง','Ban Sukjai · Canal'],temple:['วัดบ้านสุขใจ','Ban Sukjai Temple'],school:['โรงเรียนบ้านสุขใจ','Ban Sukjai School'],hall:['ศาลาประชาคม','Community Hall'],office:['ห้องทำงานทีม HDS','HDS Field Office'],office_night:['ห้องทำงาน · ยามค่ำ','Field Office · Night'],clinic:['สถานีอนามัย','Health Centre'],lab:['ห้องปฏิบัติการ','Laboratory'],market:['ตลาดชุมชน','Village Market'],farm:['สวนผัก','Vegetable Farm'],ice_factory:['โรงงานน้ำแข็ง','Ice Factory']};
  let enabled=true;try{enabled=localStorage.getItem('od-cinema-motion')!=='off';}catch(e){}
  function paint(){document.documentElement.dataset.motion=enabled?'on':'off';document.querySelectorAll('[data-vn="motion"]').forEach(b=>{b.setAttribute('aria-pressed',String(enabled));b.textContent=(OD.i18n?.lang()==='en'?'◉ Motion: ':'◉ ภาพเคลื่อนไหว: ')+(OD.i18n?.lang()==='en'?(enabled?'On':'Off'):(enabled?'เปิด':'ปิด'));});}
  function attach(root){
    if(root.querySelector('.cinema-depth'))return;
    const layer=document.createElement('div');layer.className='cinema-depth';layer.setAttribute('aria-hidden','true');layer.innerHTML='<div class="cinema-water"></div><div class="cinema-cloud"></div><div class="cinema-foliage foliage-left"></div><div class="cinema-foliage foliage-right"></div><img class="cinema-lantern" src="img/cinema-lantern-v1.png" alt=""><div class="cinema-lantern-light"></div><div class="cinema-fireflies">'+Array.from({length:10},(_,i)=>'<i style="--p:'+i+'"></i>').join('')+'</div>';
    root.querySelector('.vn-bg').after(layer);
    const caption=document.createElement('div');caption.className='cinema-location';caption.setAttribute('data-no-translate','');root.append(caption);
    const button=document.createElement('button');button.className='btn btn-sm';button.dataset.vn='motion';button.onclick=e=>{e.stopPropagation();enabled=!enabled;try{localStorage.setItem('od-cinema-motion',enabled?'on':'off');}catch(e){}paint();};root.querySelector('.vn-tools').prepend(button);paint();
  }
  function set(scene,time,root){
    attach(root);const key=String(scene).split(':')[0],outdoor=!/office|clinic|lab|ice_factory|hall/.test(key),water=/village|well_canal|farm/.test(key);
    root.dataset.cinemaScene=key;root.dataset.outdoor=String(outdoor);root.dataset.water=String(water);root.dataset.lantern=String(/village|temple|hall|market|mookata|noodle/.test(key));root.dataset.night=String(time==='night'||time==='dusk');
    const image=root.querySelector('.vn-bg image'),surface=root.querySelector('.cinema-water');surface.style.backgroundImage=image?'url("'+image.getAttribute('href')+'")':'';
    const caption=root.querySelector('.cinema-location'),pair=labels[key];caption.textContent=pair?pair[OD.i18n?.lang()==='en'?1:0]:'';caption.classList.remove('reveal');void caption.offsetWidth;caption.classList.add('reveal');
  }
  paint();return {attach,set};
})();
