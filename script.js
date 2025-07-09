const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// 시뮬레이션 변수
let time = 0;
let animationSpeed = 1.0;
let isPlaying = true;
let currentTab = 'venus';
let currentView = 'top-down'; // 'top-down' or 'from-earth'

const marsConfig = {
  planetOrbitRadius: 193,  // Scaled down from 225
  earthOrbitRadius: 146,   // Scaled down from 170
  planetAngularSpeed: 0.532,
  earthAngularSpeed: 1.0,
  planetColor: '#FF4444',
  planetName: '화성'
};

const venusConfig = {
  planetOrbitRadius: 86,   // Scaled down from 100
  earthOrbitRadius: 146,   // Scaled down from 170
  planetAngularSpeed: 1.625,
  earthAngularSpeed: 1.0,
  planetColor: '#FF6600',
  planetName: '금성'
};

// 화면 중심
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// 천구면 반지름
const celestialSphereRadius = 300; // Scaled down from 350

// 궤적 저장
const trails = {
  venus: {
    planet: [], earth: [], apparent: [], geoPlanet: [], geoSun: []
  },
  mars: {
    planet: [], earth: [], apparent: [], geoPlanet: [], geoSun: []
  }
};
const maxTrailLength = 500;

function getCurrentConfig() {
  return currentTab === 'venus' ? venusConfig : marsConfig;
}

function getCurrentTrails() {
  return trails[currentTab];
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Info`).classList.add('active');

  currentTab = tabName;
}

function switchView(viewName) {
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
  currentView = viewName;
}

function setup() {
  time = 0;
  Object.keys(trails).forEach(planet => {
    Object.keys(trails[planet]).forEach(key => {
      trails[planet][key].length = 0;
    });
  });
}

function calculatePositions() {
  const config = getCurrentConfig();
  const planetAngle = time * config.planetAngularSpeed;
  const earthAngle = time * config.earthAngularSpeed;

  const planetX = centerX + Math.cos(planetAngle) * config.planetOrbitRadius;
  const planetY = centerY + Math.sin(planetAngle) * config.planetOrbitRadius;

  const earthX = centerX + Math.cos(earthAngle) * config.earthOrbitRadius;
  const earthY = centerY + Math.sin(earthAngle) * config.earthOrbitRadius;

  const relativeX = planetX - earthX;
  const relativeY = planetY - earthY;

  const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
  const apparentX = earthX + (relativeX / distance) * celestialSphereRadius;
  const apparentY = earthY + (relativeY / distance) * celestialSphereRadius;

  return {
    planet: { x: planetX, y: planetY },
    earth: { x: earthX, y: earthY },
    apparent: { x: apparentX, y: apparentY }
  };
}

function updateTrails(positions) {
  const currentTrails = getCurrentTrails();

  currentTrails.planet.push({ ...positions.planet });
  currentTrails.earth.push({ ...positions.earth });
  currentTrails.apparent.push({ ...positions.apparent });

  if (currentTrails.planet.length > maxTrailLength) currentTrails.planet.shift();
  if (currentTrails.earth.length > maxTrailLength) currentTrails.earth.shift();
  if (currentTrails.apparent.length > maxTrailLength) currentTrails.apparent.shift();

  // Geocentric trails
  const sunGeoX = centerX - (positions.earth.x - centerX);
  const sunGeoY = centerY - (positions.earth.y - centerY);
  const planetGeoX = centerX + (positions.planet.x - positions.earth.x);
  const planetGeoY = centerY + (positions.planet.y - positions.earth.y);

  currentTrails.geoSun.push({ x: sunGeoX, y: sunGeoY });
  currentTrails.geoPlanet.push({ x: planetGeoX, y: planetGeoY });

  if (currentTrails.geoSun.length > maxTrailLength) currentTrails.geoSun.shift();
  if (currentTrails.geoPlanet.length > maxTrailLength) currentTrails.geoPlanet.shift();
}

function drawTrail(trail, color, width = 1) {
  if (trail.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);

  for (let i = 1; i < trail.length; i++) {
    const alpha = i / trail.length;
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineTo(trail[i].x, trail[i].y);
  }

  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

function drawApparentTrailWithGradient(trail) {
  if (trail.length < 2) return;

  for (let i = 1; i < trail.length; i++) {
    const alpha = (i / trail.length) * 0.8;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trail[i-1].x, trail[i-1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
}

function drawTopDownView(positions) {
  const config = getCurrentConfig();
  const currentTrails = getCurrentTrails();

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.arc(centerX, centerY, config.planetOrbitRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, config.earthOrbitRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);

  drawTrail(currentTrails.planet, config.planetColor, 2);
  drawTrail(currentTrails.earth, '#0066FF', 2);
  drawApparentTrailWithGradient(currentTrails.apparent);

  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(positions.earth.x, positions.earth.y);
  ctx.lineTo(positions.planet.x, positions.planet.y);
  ctx.stroke();

  ctx.strokeStyle = '#ffe600';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(positions.earth.x, positions.earth.y);
  ctx.lineTo(positions.apparent.x, positions.apparent.y);
  ctx.stroke();

  ctx.fillStyle = config.planetColor;
  ctx.beginPath();
  ctx.arc(positions.planet.x, positions.planet.y, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0066FF';
  ctx.beginPath();
  ctx.arc(positions.earth.x, positions.earth.y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(positions.apparent.x, positions.apparent.y, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFF';
  ctx.font = '14px sans-serif';
  ctx.fillText('태양', centerX + 20, centerY);
  ctx.fillText(config.planetName, positions.planet.x + 15, positions.planet.y);
  ctx.fillText('지구', positions.earth.x + 15, positions.earth.y);
  ctx.fillText('겉보기 위치', positions.apparent.x + 10, positions.apparent.y - 10);
}

function drawFromEarthView(positions) {
  const config = getCurrentConfig();
  const currentTrails = getCurrentTrails();

  const sunGeoX = centerX - (positions.earth.x - centerX);
  const sunGeoY = centerY - (positions.earth.y - centerY);
  const planetGeoX = centerX + (positions.planet.x - positions.earth.x);
  const planetGeoY = centerY + (positions.planet.y - positions.earth.y);

  drawTrail(currentTrails.geoSun, '#FFD700', 2);
  drawTrail(currentTrails.geoPlanet, config.planetColor, 2);

  ctx.fillStyle = '#0066FF';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(sunGeoX, sunGeoY, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = config.planetColor;
  ctx.beginPath();
  ctx.arc(planetGeoX, planetGeoY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(planetGeoX, planetGeoY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#FFF';
  ctx.font = '14px sans-serif';
  ctx.fillText('지구 (중심)', centerX + 15, centerY);
  ctx.fillText('태양', sunGeoX + 20, sunGeoY);
  ctx.fillText(config.planetName, planetGeoX + 15, planetGeoY);
}

function animate() {
  if (isPlaying) {
    time += 0.02 * animationSpeed;
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const positions = calculatePositions();

  if (isPlaying) {
    updateTrails(positions);
  }

  if (currentView === 'top-down') {
    drawTopDownView(positions);
  } else {
    drawFromEarthView(positions);
  }

  requestAnimationFrame(animate);
}

document.getElementById('speedSlider').addEventListener('input', (e) => {
  animationSpeed = parseFloat(e.target.value);
  document.getElementById('speedValue').textContent = animationSpeed.toFixed(1);
});

document.getElementById('toggleBtn').addEventListener('click', () => {
  isPlaying = !isPlaying;
  document.getElementById('toggleBtn').textContent = isPlaying ? '일시정지' : '재생';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  setup();
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.target.getAttribute('data-tab');
    if (currentTab !== tabName) {
      switchTab(tabName);
    }
  });
});

document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const viewName = e.target.getAttribute('data-view');
    if (currentView !== viewName) {
      switchView(viewName);
    }
  });
});

setup();
animate();