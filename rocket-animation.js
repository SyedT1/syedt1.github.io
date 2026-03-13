// Solar System Animation with Three.js
let solarSystemScene = null;
let solarSystemRenderer = null;
let solarSystemCamera = null;
let solarSystemAnimating = false;
let animationId = null;
let planets = [];
let sunGlow = null;

function initSolarSystem() {
  if (solarSystemScene) return;

  const canvas = document.getElementById('cv');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  console.log('Initializing solar system...');

  solarSystemScene = new THREE.Scene();
  solarSystemCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  solarSystemCamera.position.set(0, 50, 50);
  solarSystemCamera.lookAt(0, 0, 0);

  solarSystemRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  solarSystemRenderer.setSize(window.innerWidth, window.innerHeight);
  solarSystemRenderer.setClearColor(0x000000, 0);

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    solarSystemRenderer.setSize(w, h);
    solarSystemCamera.aspect = w / h;
    solarSystemCamera.updateProjectionMatrix();
  });

  // Stars
  const starsGeometry = new THREE.BufferGeometry();
  const starsVertices = [];
  for (let i = 0; i < 2000; i++) {
    starsVertices.push((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starsVertices), 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({color: 0xffffff, size: 0.7}));
  solarSystemScene.add(stars);

  // Lighting
  solarSystemScene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Sun
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunMaterial = new THREE.MeshStandardMaterial({color: 0xfdb813, emissive: 0xfdb813, emissiveIntensity: 0.8});
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  solarSystemScene.add(sun);

  // Sun glow
  const glowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({color: 0xfdb813, transparent: true, opacity: 0.2});
  sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
  solarSystemScene.add(sunGlow);

  // Planets data
  const planetsData = [
    {name: 'Mercury', size: 1.8, distance: 15, speed: 0.04, color: 0x8c7853},
    {name: 'Venus', size: 3.5, distance: 25, speed: 0.015, color: 0xffc649},
    {name: 'Earth', size: 3.7, distance: 38, speed: 0.01, color: 0x2e7d32},
    {name: 'Mars', size: 2.8, distance: 50, speed: 0.008, color: 0xff6b35},
    {name: 'Jupiter', size: 8.5, distance: 70, speed: 0.002, color: 0xc88b3a},
    {name: 'Saturn', size: 7.5, distance: 90, speed: 0.0009, color: 0xfad5a5, hasRing: true},
    {name: 'Uranus', size: 5, distance: 110, speed: 0.0004, color: 0x4fd0e7},
    {name: 'Neptune', size: 5, distance: 130, speed: 0.0001, color: 0x4166f5}
  ];

  planets = [];

  planetsData.forEach(data => {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({color: data.color, metalness: 0.3, roughness: 0.7});
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = {distance: data.distance, speed: data.speed, angle: Math.random() * Math.PI * 2};

    solarSystemScene.add(planet);
    planets.push({mesh: planet, data});

    // Saturn rings
    if (data.hasRing) {
      const ringGeometry = new THREE.RingGeometry(data.size * 1.5, data.size * 2.5, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({color: 0xd4a574, side: THREE.DoubleSide, transparent: true, opacity: 0.7});
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI * 0.4;
      planet.add(ring);
    }

    // Earth moon
    if (data.name === 'Earth') {
      const moonGeometry = new THREE.SphereGeometry(1, 16, 16);
      const moonMaterial = new THREE.MeshStandardMaterial({color: 0xcccccc, metalness: 0.2, roughness: 0.8});
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);
      moon.position.x = data.size + 4;
      moon.userData = {moonOrbit: true, distance: data.size + 4};
      planet.add(moon);
    }
  });

  // Orbital lines
  planets.forEach(p => {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitVertices = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      orbitVertices.push(Math.cos(angle) * p.mesh.userData.distance, 0, Math.sin(angle) * p.mesh.userData.distance);
    }
    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(orbitVertices), 3));
    const orbitMaterial = new THREE.LineBasicMaterial({color: 0x444444, transparent: true, opacity: 0.3});
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    solarSystemScene.add(orbit);
  });

  console.log('Solar system scene initialized successfully');
}

function animateSolarSystem() {
  if (!solarSystemAnimating) return;

  animationId = requestAnimationFrame(animateSolarSystem);

  // Update planets
  planets.forEach(p => {
    p.mesh.userData.angle += p.mesh.userData.speed;
    p.mesh.position.x = Math.cos(p.mesh.userData.angle) * p.mesh.userData.distance;
    p.mesh.position.z = Math.sin(p.mesh.userData.angle) * p.mesh.userData.distance;
    p.mesh.rotation.y += 0.005;

    // Moon update
    if (p.mesh.children.length > 0) {
      p.mesh.children.forEach(child => {
        if (child.userData.moonOrbit) {
          const moonAngle = Date.now() * 0.01;
          child.position.x = Math.cos(moonAngle) * child.userData.distance;
          child.position.z = Math.sin(moonAngle) * child.userData.distance;
        }
      });
    }
  });

  // Sun glow pulse
  if (sunGlow) sunGlow.material.opacity = 0.2 + Math.sin(Date.now() * 0.0005) * 0.1;

  solarSystemRenderer.render(solarSystemScene, solarSystemCamera);
}

function toggleSolarSystem() {
  console.log('Toggle solar system clicked');
  if (typeof THREE === 'undefined') {
    console.warn('THREE.js not loaded');
    return;
  }

  if (!solarSystemAnimating) {
    console.log('Starting solar system animation');
    if (!solarSystemScene) {
      console.log('Initializing scene...');
      initSolarSystem();
    }
    solarSystemAnimating = true;
    animateSolarSystem();
  } else {
    console.log('Stopping solar system animation');
    solarSystemAnimating = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (solarSystemRenderer) {
      solarSystemRenderer.render(solarSystemScene, solarSystemCamera);
    }
  }

  const btn = document.getElementById('solar-system-btn');
  if (btn) {
    btn.classList.toggle('active', solarSystemAnimating);
    btn.textContent = solarSystemAnimating ? '⏸' : '▶';
  }
}

function waitForTHREE() {
  if (typeof THREE === 'undefined') {
    console.log('Waiting for THREE.js...');
    setTimeout(waitForTHREE, 50);
    return;
  }
  console.log('THREE.js loaded, setting up button listener');
  const btn = document.getElementById('solar-system-btn');
  if (btn) {
    console.log('Button found, adding click listener');
    btn.addEventListener('click', toggleSolarSystem);
  } else {
    console.error('Solar system button not found');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForTHREE);
} else {
  waitForTHREE();
}
