// Three.js Rocket Animation with Smoke Trail
function initRocketAnimation() {
  if (typeof THREE === 'undefined') {
    setTimeout(initRocketAnimation, 100);
    return;
  }

  try {
    const scene = new THREE.Scene();
    const canvas = document.getElementById('cv');
    if (!canvas) return;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 5;
    
    window.addEventListener('resize', () => {
      const w = window.innerWidth,h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    
    // Rocket
    const rocketGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 32), new THREE.MeshStandardMaterial({color: 0xff4444}));
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshStandardMaterial({color: 0xffaa00}));
    nose.position.z = 0.9;
    rocketGroup.add(body, nose);
    
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.05), new THREE.MeshStandardMaterial({color: 0x0088ff}));
      fin.position.set(0, 0.3, -0.4);
      fin.rotation.z = (i * Math.PI * 2) / 3;
      rocketGroup.add(fin);
    }
    
    const rocketWindow = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshStandardMaterial({color: 0x00ffff, emissive: 0x00ccff}));
    rocketWindow.position.z = 0.3;
    rocketGroup.add(rocketWindow);
    scene.add(rocketGroup);
    
    // Smoke
    const particleCount = 1500;
    const smokeGeometry = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(particleCount * 3);
    const smokeColors = new Float32Array(particleCount * 3);
    const smokeVelocities = [];
    const smokeLifetime = [];
    const smokeMaxLifetime = [];
    
    for (let i = 0; i < particleCount; i++) {
      smokeVelocities.push({x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: -Math.random() * 0.03});
      smokeLifetime.push(0);
      smokeMaxLifetime.push(Math.random() * 3 + 2);
      smokeColors[i * 3] = 1;
      smokeColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      smokeColors[i * 3 + 2] = Math.random() * 0.3;
    }
    
    smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeGeometry.setAttribute('color', new THREE.BufferAttribute(smokeColors, 3));
    
    function createSmokeTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.4, 'rgba(255,200,100,0.8)');
      gradient.addColorStop(1, 'rgba(255,50,20,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(canvas);
    }
    
    const smokeMaterial = new THREE.PointsMaterial({size: 0.25, sizeAttenuation: true, transparent: true, map: createSmokeTexture(), vertexColors: true, depthWrite: false});
    const smokeCloud = new THREE.Points(smokeGeometry, smokeMaterial);
    scene.add(smokeCloud);
    
    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    // Glow
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.2}));
    glow.position.copy(rocketWindow.position);
    rocketGroup.add(glow);
    
    // Animation
    let time = 0, particleIndex = 0;
    function emitSmoke(pos) {
      for (let i = 0; i < 5; i++) {
        const idx = (particleIndex % particleCount) * 3;
        smokePositions[idx] = pos.x + (Math.random() - 0.5) * 0.15;
        smokePositions[idx + 1] = pos.y + (Math.random() - 0.5) * 0.15;
        smokePositions[idx + 2] = pos.z + (Math.random() - 0.5) * 0.1;
        const c = (particleIndex % particleCount) * 3;
        smokeColors[c] = 0.8 + Math.random() * 0.2;
        smokeColors[c + 1] = 0.4 + Math.random() * 0.4;
        smokeColors[c + 2] = Math.random() * 0.2;
        smokeLifetime[particleIndex % particleCount] = 0;
        particleIndex++;
      }
    }
    
    function animate() {
      requestAnimationFrame(animate);
      time += 0.02;
      
      const xPos = (time * 2) % 8 - 4;
      const yPos = Math.sin(time * 0.5) * 1.5;
      rocketGroup.position.set(xPos, yPos, 0);
      rocketGroup.rotation.set(0, 0.3, Math.sin(time * 0.3) * 0.2);
      
      emitSmoke(rocketGroup.position);
      
      const pos = smokeGeometry.getAttribute('position').array;
      const col = smokeGeometry.getAttribute('color').array;
      for (let i = 0; i < particleCount; i++) {
        smokeLifetime[i] += 0.016;
        const life = smokeLifetime[i] / smokeMaxLifetime[i];
        if (life < 1) {
          pos[i * 3] += smokeVelocities[i].x;
          pos[i * 3 + 1] += smokeVelocities[i].y;
          pos[i * 3 + 2] += smokeVelocities[i].z;
          smokeVelocities[i].x *= 0.97;
          smokeVelocities[i].y *= 0.97;
          const fade = 1 - (life * life);
          col[i * 3] = 0.9 * fade + 0.1;
          col[i * 3 + 1] = 0.6 * fade + 0.4;
          col[i * 3 + 2] = 0.2 * fade + 0.8;
        } else {
          smokeLifetime[i] = 0;
        }
      }
      smokeGeometry.getAttribute('position').needsUpdate = true;
      smokeGeometry.getAttribute('color').needsUpdate = true;
      glow.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
      renderer.render(scene, camera);
    }
    animate();
    console.log('🚀 Rocket ready!');
  } catch(e) {
    console.error('Rocket error:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRocketAnimation);
} else {
  initRocketAnimation();
}
