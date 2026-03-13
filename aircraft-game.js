/* =====================================================================
   ACE VECTOR — 3D Aircraft Combat
   Embedded modal version for portfolio (aircraft-game.js)
   ===================================================================== */

(function initAceVector() {
  // Wait for THREE.js and DOM to both be ready
  if (typeof THREE === 'undefined') {
    setTimeout(initAceVector, 50);
    return;
  }

  const gameModal   = document.getElementById('game-modal');
  const gameBtn     = document.getElementById('game-btn');
  const gameClose   = document.getElementById('game-close');
  const gameToggle  = document.getElementById('game-toggle');

  // ── Renderer ──────────────────────────────────────────────────────────
  const canvas = document.getElementById('game-canvas');
  if (!canvas) { console.error('[AceVector] #game-canvas not found'); return; }

  const overlay      = document.getElementById('av-overlay');
  const startScreen  = document.getElementById('av-start-screen');
  const gameoverScreen = document.getElementById('av-gameover-screen');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor(0x020810);

  function resizeRenderer() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ── Scene ─────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x061828, 0.0028);

  // ── Camera ────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 3000);
  camera.position.set(0, 8, 28);

  // ── Lights ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x102040, 1.2));
  const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
  sunLight.position.set(100, 200, 100);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 600;
  sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -200;
  sunLight.shadow.camera.right = sunLight.shadow.camera.top = 200;
  scene.add(sunLight);
  const rimLight = new THREE.DirectionalLight(0x00ccff, 0.8);
  rimLight.position.set(-50, 20, -100);
  scene.add(rimLight);

  // ── Sky ───────────────────────────────────────────────────────────────
  {
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x000d1a) },
        bottomColor: { value: new THREE.Color(0x0a2040) }
      },
      vertexShader:   `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vPos; uniform vec3 topColor,bottomColor; void main(){ float t=clamp((vPos.y+100.0)/600.0,0.0,1.0); gl_FragColor=vec4(mix(bottomColor,topColor,t),1.0); }`
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat));
  }

  // ── Clouds ────────────────────────────────────────────────────────────
  const clouds = [];
  {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xaaccee, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 40; i++) {
      const g = new THREE.Group();
      for (let c = 0; c < 4 + Math.floor(Math.random() * 4); c++) {
        const s = 8 + Math.random() * 20;
        const m = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 5), cloudMat);
        m.position.set((Math.random()-0.5)*30, (Math.random()-0.5)*8, (Math.random()-0.5)*20);
        g.add(m);
      }
      g.position.set((Math.random()-0.5)*1800, 60 + Math.random()*120, (Math.random()-0.5)*1800);
      scene.add(g);
      clouds.push({ group: g, speed: 0.05 + Math.random()*0.08 });
    }
  }

  // ── Stars ─────────────────────────────────────────────────────────────
  {
    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 2000; i++) sp.push((Math.random()-0.5)*3000, Math.random()*1000, (Math.random()-0.5)*3000);
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.6 })));
  }

  // ── Ocean ─────────────────────────────────────────────────────────────
  const oceanMat = new THREE.ShaderMaterial({
    uniforms: {
      time:         { value: 0 },
      deepColor:    { value: new THREE.Color(0x001830) },
      shallowColor: { value: new THREE.Color(0x003860) }
    },
    vertexShader: `
      uniform float time; varying vec2 vUV; varying float vWave;
      void main(){
        vUV = uv; vec3 pos = position;
        float w = sin(pos.x*0.05+time)*2.0 + sin(pos.y*0.07+time*1.3)*1.5;
        pos.z += w; vWave = w;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
      }`,
    fragmentShader: `
      uniform vec3 deepColor, shallowColor; varying float vWave;
      void main(){
        float t = clamp((vWave+3.0)/6.0, 0.0, 1.0);
        gl_FragColor = vec4(mix(deepColor, shallowColor, t), 1.0);
      }`,
    side: THREE.DoubleSide
  });
  {
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 80, 80), oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -80;
    scene.add(ocean);
  }

  // ── Islands ───────────────────────────────────────────────────────────
  for (let i = 0; i < 12; i++) {
    const base = new THREE.Mesh(new THREE.ConeGeometry(30, 20, 8), new THREE.MeshLambertMaterial({ color: 0x2d5a1e }));
    base.position.y = -70;
    const ig = new THREE.Group();
    ig.add(base);
    ig.position.set((Math.random()-0.5)*1600, 0, (Math.random()-0.5)*1600);
    scene.add(ig);
  }

  // ── Aircraft builder ──────────────────────────────────────────────────
  function buildAircraft(color, scale, isPlayer) {
    const g   = new THREE.Group();
    const mat = (c) => new THREE.MeshPhongMaterial({ color: c, shininess: 80 });
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 5, 8), mat(color));
    fus.rotation.x = Math.PI / 2;
    g.add(fus);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2, 8), mat(color));
    nose.rotation.x = Math.PI / 2; nose.position.z = -3.2;
    g.add(nose);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 1.5), mat(color));
    wingL.position.set(-2.5, 0, 0.5); wingL.rotation.z = 0.08; g.add(wingL);
    const wingR = wingL.clone(); wingR.position.x = 2.5; wingR.rotation.z = -0.08; g.add(wingR);
    const tailH = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.8), mat(color));
    tailH.position.set(0, 0, 2.4); g.add(tailH);
    const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.9), mat(color));
    tailV.position.set(0, 0.5, 2.4); g.add(tailV);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat(isPlayer ? 0x88ddff : 0x334455));
    cockpit.position.set(0, 0.45, -1); cockpit.scale.set(1, 0.7, 1.5); g.add(cockpit);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 8),
      new THREE.MeshBasicMaterial({ color: isPlayer ? 0x00aaff : 0xff4400, transparent: true, opacity: 0.9 }));
    eng.rotation.x = Math.PI / 2; eng.position.z = 2.6; g.add(eng);
    if (isPlayer) {
      const glow = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.15 }));
      g.add(glow);
    }
    g.scale.setScalar(scale); g.castShadow = true;
    return g;
  }

  // ── Bullet geometry ───────────────────────────────────────────────────
  const BULLET_GEO        = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4);
  const PLAYER_BULLET_MAT = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const ENEMY_BULLET_MAT  = new THREE.MeshBasicMaterial({ color: 0xff2200 });

  // ── Audio Engine ──────────────────────────────────────────────────────
  const Audio = (() => {
    let ctx = null, masterGain = null, engineNode = null, engineGain = null, engineLfo = null, initialized = false;

    function init() {
      if (initialized) return; initialized = true;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain(); masterGain.gain.value = 0.7; masterGain.connect(ctx.destination);
    }

    function playTone({ freq=440, freq2=freq, type='sine', duration=0.2, volume=0.3,
                        attack=0.005, decay=0.05, sustain=0.3, release=0.15,
                        filterFreq=null, filterType='lowpass', distortion=false }={}) {
      if (!ctx) return;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + duration);
      if (distortion) {
        const ws = ctx.createWaveShaper(); const curve = new Float32Array(256);
        for (let i=0;i<256;i++){const x=(i*2)/256-1;curve[i]=(Math.PI+300)*x/(Math.PI+300*Math.abs(x));}
        ws.curve = curve; osc.connect(ws); ws.connect(gain);
      } else { osc.connect(gain); }
      if (filterFreq) {
        const filt = ctx.createBiquadFilter(); filt.type = filterType; filt.frequency.value = filterFreq;
        gain.disconnect(); osc.connect(filt); filt.connect(gain);
      }
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
      gain.gain.linearRampToValueAtTime(volume * sustain, ctx.currentTime + attack + decay);
      gain.gain.setValueAtTime(volume * sustain, ctx.currentTime + duration - release);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      gain.connect(masterGain); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration + 0.05);
    }

    function playNoise({ duration=0.3, volume=0.4, filterFreq=800, filterType='bandpass', filterQ=1 }={}) {
      if (!ctx) return;
      const bufSize = ctx.sampleRate * duration;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0); for (let i=0;i<bufSize;i++) data[i]=Math.random()*2-1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = filterType; filt.frequency.value = filterFreq; filt.Q.value = filterQ;
      const gain = ctx.createGain(); gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      src.connect(filt); filt.connect(gain); gain.connect(masterGain); src.start(ctx.currentTime);
    }

    function startEngine() {
      if (!ctx || engineNode) return;
      engineGain = ctx.createGain(); engineGain.gain.value = 0.12;
      engineNode = ctx.createOscillator(); engineNode.type = 'sawtooth'; engineNode.frequency.value = 55;
      engineLfo = ctx.createOscillator(); engineLfo.type = 'sine'; engineLfo.frequency.value = 6;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 4;
      engineLfo.connect(lfoGain); lfoGain.connect(engineNode.frequency);
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
      engineNode.connect(filt); filt.connect(engineGain); engineGain.connect(masterGain);
      engineNode.start(); engineLfo.start();
    }

    function updateEngine(throttle, speed) {
      if (!engineNode || !ctx) return;
      engineNode.frequency.setTargetAtTime(45 + throttle * 40 + speed * 0.3, ctx.currentTime, 0.1);
      engineGain.gain.setTargetAtTime(0.08 + throttle * 0.06, ctx.currentTime, 0.1);
    }

    function stopEngine() {
      if (engineNode) { try { engineNode.stop(); engineLfo.stop(); } catch(e){} engineNode = null; }
    }

    const shoot        = () => { playTone({ freq:800, freq2:200, type:'square', duration:0.08, volume:0.18, attack:0.001, decay:0.02, sustain:0.1, release:0.06, filterFreq:2000 }); playNoise({ duration:0.06, volume:0.15, filterFreq:3000, filterType:'highpass' }); };
    const smallExplosion = () => { playNoise({ duration:0.35, volume:0.5, filterFreq:600, filterType:'bandpass', filterQ:0.8 }); playTone({ freq:120, freq2:40, type:'sawtooth', duration:0.3, volume:0.2, attack:0.001, release:0.25 }); };
    const bigExplosion   = () => { playNoise({ duration:0.7, volume:0.8, filterFreq:300, filterType:'lowpass', filterQ:0.5 }); playTone({ freq:80, freq2:20, type:'sawtooth', duration:0.6, volume:0.35, attack:0.002, release:0.5 }); playNoise({ duration:0.4, volume:0.4, filterFreq:1200, filterType:'bandpass', filterQ:1.2 }); };
    const playerHit      = () => { playNoise({ duration:0.25, volume:0.55, filterFreq:900, filterType:'bandpass', filterQ:1.5 }); playTone({ freq:160, freq2:80, type:'square', duration:0.2, volume:0.25, distortion:true }); };
    const kill           = () => { [880,1100,1320].forEach((f,i)=>setTimeout(()=>playTone({ freq:f, freq2:f*1.05, type:'square', duration:0.1, volume:0.15, attack:0.005, release:0.08 }),i*50)); };
    const gameOver       = () => { stopEngine(); playTone({ freq:220, freq2:55, type:'sawtooth', duration:2.5, volume:0.3, attack:0.1, release:1.5 }); playNoise({ duration:1.5, volume:0.3, filterFreq:200, filterType:'lowpass' }); };
    const waveUp         = () => { [440,550,660,880].forEach((f,i)=>setTimeout(()=>playTone({ freq:f, type:'triangle', duration:0.18, volume:0.12, attack:0.01, release:0.12 }),i*60)); };

    return { init, startEngine, stopEngine, updateEngine, shoot, smallExplosion, bigExplosion, playerHit, kill, gameOver, waveUp };
  })();

  // ── Game State ────────────────────────────────────────────────────────
  let state = { running:false, paused:false, health:100, shield:100, score:0, kills:0, wave:1, startTime:0, duration:5*60*1000, throttle:1.0, maxSpeed:40 };

  // ── Player ────────────────────────────────────────────────────────────
  const playerMesh  = buildAircraft(0x00aaff, 1.0, true);
  playerMesh.position.set(0, 20, 0);
  scene.add(playerMesh);
  const playerState = { velocity: new THREE.Vector3(0, 0, -20) };

  // ── Enemies / bullets / explosions ───────────────────────────────────
  const enemies = [], bullets = [], explosionPool = [];
  const enemyTypes = [
    { color: 0xff3300, scale: 0.9, hp: 1, speed: 18, score: 10, label: 'FIGHTER' },
    { color: 0xff8800, scale: 1.2, hp: 3, speed: 12, score: 30, label: 'BOMBER' },
    { color: 0xff0055, scale: 0.8, hp: 1, speed: 28, score: 20, label: 'INTERCEPTOR' },
  ];

  function spawnEnemy() {
    const type  = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const mesh  = buildAircraft(type.color, type.scale, false);
    const angle = Math.random() * Math.PI * 2;
    const dist  = 200 + Math.random() * 200;
    mesh.position.set(
      playerMesh.position.x + Math.cos(angle) * dist,
      playerMesh.position.y + (Math.random() - 0.5) * 80,
      playerMesh.position.z + Math.sin(angle) * dist
    );
    scene.add(mesh);
    enemies.push({ mesh, type, hp: type.hp, vel: new THREE.Vector3(), shootTimer: Math.random() * 120, wobble: Math.random() * Math.PI * 2 });
  }

  function fireBullet(from, direction, isPlayer) {
    const mesh = new THREE.Mesh(BULLET_GEO, isPlayer ? PLAYER_BULLET_MAT : ENEMY_BULLET_MAT);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(from);
    const vel = direction.clone().multiplyScalar(isPlayer ? 120 : 60);
    scene.add(mesh);
    bullets.push({ mesh, vel, isPlayer, life: isPlayer ? 2.5 : 4 });
  }

  function createExplosion(pos, big) {
    if (big) Audio.bigExplosion(); else Audio.smallExplosion();
    for (let i = 0; i < (big ? 30 : 15); i++) {
      const size = 0.3 + Math.random() * (big ? 1.5 : 0.8);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 4, 4),
        new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.07 + Math.random()*0.1, 1, 0.5 + Math.random()*0.3), transparent: true, opacity: 1 })
      );
      mesh.position.copy(pos);
      const vel = new THREE.Vector3((Math.random()-0.5),(Math.random()-0.5),(Math.random()-0.5)).normalize().multiplyScalar(3 + Math.random()*(big?15:8));
      scene.add(mesh);
      explosionPool.push({ mesh, vel, life: 1.0 + Math.random()*0.5 });
    }
  }

  // ── Input ─────────────────────────────────────────────────────────────
  const keys = {};
  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space' && state.running) { e.preventDefault(); playerFire(); }
  }
  function onKeyUp(e) { keys[e.code] = false; }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  let autoFireTimer = 0;
  function playerFire() {
    const dir   = new THREE.Vector3(0, 0, -1).applyQuaternion(playerMesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerMesh.quaternion).multiplyScalar(1.5);
    fireBullet(playerMesh.position.clone().add(right), dir, true);
    fireBullet(playerMesh.position.clone().sub(right), dir, true);
    Audio.shoot();
  }

  // ── Kill feed ─────────────────────────────────────────────────────────
  function addKillFeed(label) {
    const kf = document.getElementById('av-killfeed');
    if (!kf) return;
    const el = document.createElement('div');
    el.className = 'av-kill-entry';
    el.textContent = `▸ ${label} DESTROYED`;
    kf.insertBefore(el, kf.firstChild);
    setTimeout(() => el.remove(), 2000);
  }

  // ── Radar ─────────────────────────────────────────────────────────────
  const radarCanvas = document.getElementById('av-radar');
  const rCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

  function drawRadar() {
    if (!rCtx) return;
    rCtx.clearRect(0, 0, 100, 100);
    rCtx.fillStyle = 'rgba(0,20,40,0.85)';
    rCtx.beginPath(); rCtx.arc(50,50,49,0,Math.PI*2); rCtx.fill();
    [15,30,45].forEach(r => { rCtx.beginPath(); rCtx.arc(50,50,r,0,Math.PI*2); rCtx.strokeStyle='rgba(0,245,255,0.15)'; rCtx.lineWidth=0.5; rCtx.stroke(); });
    const sweep = (Date.now()/1000)%(Math.PI*2);
    rCtx.beginPath(); rCtx.moveTo(50,50); rCtx.lineTo(50+Math.cos(sweep)*49,50+Math.sin(sweep)*49);
    rCtx.strokeStyle='rgba(0,245,255,0.4)'; rCtx.lineWidth=1; rCtx.stroke();
    const range = 600;
    enemies.forEach(e => {
      const dx = e.mesh.position.x - playerMesh.position.x;
      const dz = e.mesh.position.z - playerMesh.position.z;
      if (Math.sqrt(dx*dx+dz*dz) < range) {
        rCtx.beginPath(); rCtx.arc(50+(dx/range)*45, 50+(dz/range)*45, 2, 0, Math.PI*2);
        rCtx.fillStyle = '#ff4400'; rCtx.fill();
      }
    });
    rCtx.beginPath(); rCtx.arc(50,50,3,0,Math.PI*2); rCtx.fillStyle='#00f5ff'; rCtx.fill();
  }

  // ── HUD update ────────────────────────────────────────────────────────
  function updateHUD() {
    const $  = (id) => document.getElementById(id);
    const hp = Math.max(0, state.health);
    const sh = Math.max(0, state.shield);
    const elapsed = Date.now() - state.startTime;
    const rem = Math.max(0, state.duration - elapsed);
    const min = Math.floor(rem/60000), sec = Math.floor((rem%60000)/1000);

    if ($('av-score'))  $('av-score').textContent  = String(state.score).padStart(6,'0');
    if ($('av-wave'))   $('av-wave').textContent   = String(state.wave).padStart(2,'0');
    if ($('av-kills'))  $('av-kills').textContent  = String(state.kills).padStart(3,'0');
    if ($('av-time'))   $('av-time').textContent   = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    if ($('av-hfill'))  { $('av-hfill').style.width = hp+'%'; $('av-hfill').style.background = hp<30 ? 'linear-gradient(90deg,#ff0040,#ff4444)' : 'linear-gradient(90deg,#00ff88,#00f5ff)'; }
    if ($('av-sfill'))  $('av-sfill').style.width  = sh+'%';
    if ($('av-hpct'))   $('av-hpct').textContent   = Math.round(hp)+'%';
    if ($('av-spct'))   $('av-spct').textContent   = Math.round(sh)+'%';
    const spd = Math.round(playerState.velocity.length());
    const alt = Math.round(playerMesh.position.y);
    if ($('av-spd'))    $('av-spd').textContent    = spd;
    if ($('av-alt'))    $('av-alt').textContent    = alt;
    if ($('av-spdfill')) $('av-spdfill').style.height = Math.min(100, (spd/state.maxSpeed)*100)+'%';
    if ($('av-altfill')) $('av-altfill').style.height = Math.min(100,Math.max(0,(alt+100)/300*100))+'%';
  }

  // ── Damage ────────────────────────────────────────────────────────────
  function takeDamage(amount) {
    if (state.shield > 0) { const a = Math.min(state.shield, amount); state.shield -= a; amount -= a; }
    state.health -= amount;
    if (amount > 0) Audio.playerHit();
    const flash = document.getElementById('av-flash');
    if (flash) { flash.style.opacity = '1'; setTimeout(()=>flash.style.opacity='0', 150); }
  }

  // ── Main loop ─────────────────────────────────────────────────────────
  let lastTime = 0, spawnTimer = 0;
  const camOffset = new THREE.Vector3(0, 5, 18);

  function gameLoop(time) {
    if (!state.running) return;
    requestAnimationFrame(gameLoop);

    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    oceanMat.uniforms.time.value += dt * 0.5;
    clouds.forEach(c => { c.group.position.x += c.speed; if (c.group.position.x > 900) c.group.position.x = -900; });

    // Controls
    const pitchRate = 1.2, yawRate = 0.9, rollRate = 1.5;
    let pitchInput=0, yawInput=0, rollInput=0, throttleInput=0;
    if (keys['KeyW']||keys['ArrowUp'])    pitchInput=-1;
    if (keys['KeyS']||keys['ArrowDown'])  pitchInput=1;
    if (keys['KeyA'])                     yawInput=1;
    if (keys['KeyD'])                     yawInput=-1;
    if (keys['ArrowLeft']||keys['KeyQ'])  rollInput=1;
    if (keys['ArrowRight']||keys['KeyE']) rollInput=-1;
    if (keys['ShiftLeft'])                throttleInput=0.5;
    if (keys['ControlLeft'])              throttleInput=-0.5;

    state.throttle = Math.max(0.3, Math.min(1.5, state.throttle + throttleInput * dt));

    const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), pitchInput*pitchRate*dt);
    const yawQ   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yawInput*yawRate*dt);
    const rollQ  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), rollInput*rollRate*dt);
    playerMesh.quaternion.multiply(yawQ).multiply(pitchQ).multiply(rollQ);

    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(playerMesh.quaternion);
    playerState.velocity.lerp(forward.multiplyScalar(state.maxSpeed * state.throttle), 0.05);
    playerMesh.position.addScaledVector(playerState.velocity, dt);

    if (playerMesh.position.y < -60) { playerMesh.position.y = -60; takeDamage(10); }
    if (playerMesh.position.y > 400)   playerMesh.position.y = 400;

    autoFireTimer -= dt;
    if (autoFireTimer <= 0 && keys['Space']) { playerFire(); autoFireTimer = 0.12; }

    // Camera
    const desiredCamPos = playerMesh.position.clone().add(camOffset.clone().applyQuaternion(playerMesh.quaternion));
    camera.position.lerp(desiredCamPos, 0.08);
    camera.lookAt(playerMesh.position.clone().add(new THREE.Vector3(0,0,-40).applyQuaternion(playerMesh.quaternion)));

    // Spawn
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const needed = 3 + state.wave * 2;
      while (enemies.length < needed) spawnEnemy();
      spawnTimer = Math.max(1.5, 3.5 - state.wave * 0.2);
    }

    // Enemy AI
    enemies.forEach(e => {
      e.wobble += dt * 1.5;
      const toPlayer = playerMesh.position.clone().sub(e.mesh.position);
      const dist = toPlayer.length();
      e.vel.lerp(toPlayer.clone().normalize().multiplyScalar(e.type.speed), 0.03);
      e.mesh.position.addScaledVector(e.vel, dt);
      e.mesh.position.y += Math.sin(e.wobble) * 0.05;
      if (e.vel.lengthSq() > 0.01) { const t2 = e.mesh.position.clone().add(e.vel); e.mesh.lookAt(t2); e.mesh.rotateX(Math.PI/2); }
      e.shootTimer -= dt * 60;
      if (e.shootTimer <= 0 && dist < 250) { fireBullet(e.mesh.position.clone(), toPlayer.clone().normalize(), false); e.shootTimer = 90 + Math.random()*60; }
    });

    // Bullets
    for (let i = bullets.length-1; i >= 0; i--) {
      const b = bullets[i];
      b.mesh.position.addScaledVector(b.vel, dt);
      b.life -= dt;
      if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i,1); continue; }
      if (b.isPlayer) {
        for (let j = enemies.length-1; j >= 0; j--) {
          const e = enemies[j];
          if (b.mesh.position.distanceTo(e.mesh.position) < 4 * e.type.scale) {
            e.hp--;
            createExplosion(b.mesh.position.clone(), false);
            scene.remove(b.mesh); bullets.splice(i,1);
            if (e.hp <= 0) {
              createExplosion(e.mesh.position.clone(), true);
              addKillFeed(e.type.label); Audio.kill();
              state.score += e.type.score * state.wave; state.kills++;
              scene.remove(e.mesh); enemies.splice(j,1);
            }
            break;
          }
        }
      } else {
        if (b.mesh.position.distanceTo(playerMesh.position) < 5) {
          takeDamage(8); createExplosion(b.mesh.position.clone(), false);
          scene.remove(b.mesh); bullets.splice(i,1);
        }
      }
    }

    // Explosions
    for (let i = explosionPool.length-1; i >= 0; i--) {
      const p = explosionPool[i];
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y += 4*dt; p.life -= dt*1.2;
      p.mesh.material.opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(1 + (1-p.life)*2);
      if (p.life <= 0) { scene.remove(p.mesh); explosionPool.splice(i,1); }
    }

    // Wave / shield
    const elapsed = Date.now() - state.startTime;
    const newWave = 1 + Math.floor(elapsed / 60000);
    if (newWave > state.wave) { state.wave = newWave; Audio.waveUp(); }
    if (state.shield < 100) state.shield = Math.min(100, state.shield + 3*dt);
    Audio.updateEngine(state.throttle, playerState.velocity.length());

    if (state.health <= 0 || elapsed > state.duration) { endGame(); return; }

    drawRadar();
    updateHUD();
    renderer.render(scene, camera);
  }

  // ── Start / End ───────────────────────────────────────────────────────
  function startGame() {
    state.running=true; state.health=100; state.shield=100; state.score=0;
    state.kills=0; state.wave=1; state.throttle=1.0; state.startTime=Date.now();
    playerMesh.position.set(0,30,0); playerMesh.quaternion.identity();
    playerState.velocity.set(0,0,-20);
    enemies.forEach(e=>scene.remove(e.mesh)); enemies.length=0;
    bullets.forEach(b=>scene.remove(b.mesh)); bullets.length=0;
    explosionPool.forEach(p=>scene.remove(p.mesh)); explosionPool.length=0;
    for (let i=0;i<5;i++) spawnEnemy();
    spawnTimer=4;
    if (overlay) overlay.classList.add('av-hidden');
    Audio.init(); Audio.startEngine();
    resizeRenderer();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    state.running = false;
    Audio.stopEngine();
  }

  function resumeGame() {
    if (state.running) return;
    state.running = true;
    Audio.init(); Audio.startEngine();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function endGame() {
    state.running = false;
    Audio.gameOver();
    if (startScreen)  startScreen.style.display   = 'none';
    if (gameoverScreen) {
      gameoverScreen.style.display = 'block';
      const gs = document.getElementById('av-go-score');
      const gk = document.getElementById('av-go-kills');
      if (gs) gs.textContent = state.score.toLocaleString();
      if (gk) gk.textContent = `${state.kills} ENEMIES DESTROYED`;
    }
    if (overlay) overlay.classList.remove('av-hidden');
    renderer.render(scene, camera);
  }

  // ── Wire up in-game overlay buttons ──────────────────────────────────
  const startBtn   = document.getElementById('av-start-btn');
  const restartBtn = document.getElementById('av-restart-btn');
  if (startBtn)   startBtn.addEventListener('click', startGame);
  if (restartBtn) restartBtn.addEventListener('click', () => {
    if (gameoverScreen) gameoverScreen.style.display = 'none';
    if (startScreen)    startScreen.style.display    = 'block';
    startGame();
  });

  // ── Wire up modal open / close / toggle ──────────────────────────────
  if (gameBtn) {
    gameBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (gameModal) gameModal.classList.remove('hidden');
      resizeRenderer();
      renderer.render(scene, camera);
    });
  }

  if (gameClose) {
    gameClose.addEventListener('click', () => {
      if (gameModal) gameModal.classList.add('hidden');
      pauseGame();
    });
  }

  if (gameModal) {
    gameModal.addEventListener('click', (e) => {
      if (e.target === gameModal) {
        gameModal.classList.add('hidden');
        pauseGame();
      }
    });
  }

  if (gameToggle) {
    gameToggle.addEventListener('click', () => {
      if (state.running) {
        pauseGame();
        gameToggle.textContent = 'RESUME';
      } else {
        // If never started, show overlay; otherwise resume
        if (state.startTime === 0) {
          // Let the overlay start button handle it
        } else {
          resumeGame();
          gameToggle.textContent = 'PAUSE';
        }
      }
    });
  }

  // ── Initial render ────────────────────────────────────────────────────
  resizeRenderer();
  renderer.render(scene, camera);
  window.addEventListener('resize', resizeRenderer);

  console.log('[AceVector] 3D game ready.');
})();