/* เพลงแต่งใหม่สำหรับเกม ได้แรงบันดาลใจจากบรรยากาศล้านนา
   ใช้เสียงซึงและขลุ่ยสังเคราะห์ ไม่ได้จำลองหรือคัดลอกเพลงพื้นบ้านเพลงใด */
(function(M){
  if(!M || !M.addSong || !M.setPlaylist) return;
  const add=(key,name,nameEn,bpm,notation,o={})=>M.addSong(key,{name,nameEn,bpm,notation,style:'lanna',root:o.root||55,flute:o.flute!==false,drum:o.drum||'soft',lead:'seung',ching:'none'});

  add('lanna_doi','ลมอ่อนเหนือดอย','Breeze over the Hills',68,`
    ด - ม - ซ - ม -   ร - ด - ลฺ - ด -
    ม - ซ - ล - ซ -   ม - ร - ด - - -
    ด - ร - ม - ซ -   ล - ซ - ม - ร -
    ม - ซ - ร - ม -   ด - - - - - - -
  `,{drum:'none'});
  add('lanna_ping','แสงเช้าริมปิง','Morning by the Ping',72,`
    ด - ร ม - ซ - -   ม - ร - ด - - -
    ร - ม - ซ ล - ซ   ม - ร - ด - - -
    ม - ซ - ล - ซ -   ม ร - ด - ร - -
    ม - ร - ด - ลฺ -  ด - - - - - - -
  `,{drum:'none'});
  add('lanna_path','ทางดินกลิ่นฝน','Rain on the Village Path',74,`
    ด - ม - ซ - ล -   ซ - ม - ร - ด -
    ร ม - ซ - ม - ร   ด - ลฺ - ด - - -
    ม - ซ ล - ซ - ม   ร - ม - ด - ร -
    ม - ร - ด - ลฺ -  ด - - - - - - -
  `);
  add('lanna_market','กาดเช้ายิ้มละไม','Gentle Morning Market',76,`
    ด ร - ม - ซ - ม   ร - ด - ร - ม -
    ซ - ล - ซ ม - ร   ด - - - ร - ม -
    ม ซ - ล - ซ - ม   ร ม - ซ - ร - ม
    ด - ลฺ - ด ร - ด   ด - - - - - - -
  `);
  add('lanna_mist','หมอกเหนือเวียง','Mist above the Old Town',58,`
    ด - - - ม - - -   ซ - - - ม - ร -
    ด - - - ลฺ - - -  ด - ร - ม - - -
    ซ - - - ล - ซ -   ม - - - ร - - -
    ด - ลฺ - ด - - -  ด - - - - - - -
  `,{drum:'none'});
  add('lanna_hurry','ฝนไล่เหนือคันนา','Rain across the Rice Fields',86,`
    ด - ม ซ - ม ร -   ด - ร ม - ซ - -
    ม - ซ ล - ซ ม -   ร - ม ซ - ร - -
    ด ร ม - ซ - ล ซ   ม - ร - ด ร ม -
    ซ - ม - ร - ด -   ด - - - - - - -
  `);
  add('lanna_home','โคมอุ่นคืนบ้าน','Lanterns on the Way Home',78,`
    ด - ร - ม - ซ -   ล - ซ - ม - ร -
    ม - ซ - ล - ซ -   ม - ร - ด - - -
    ซ - ล - ซ - ม -   ร - ม - ด - ลฺ -
    ด ร - ม - ร - ด   ด - - - - - - -
  `,{drum:'none'});

  M.setPlaylist('calm',['lanna_doi','lanna_ping']);
  M.setPlaylist('field',['lanna_path','lanna_market']);
  M.setPlaylist('night',['lanna_mist']);
  M.setPlaylist('tense',['lanna_hurry']);
  M.setPlaylist('ending',['lanna_home']);
})(OD.music);
