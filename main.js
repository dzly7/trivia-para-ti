/**
 * 🌻 Galaxia de Flores Amarillas 🌻
 * Motor Canvas 2.5D de partículas y flores en órbita espiral
 */

(function () {
  'use strict';

  // --- CONFIGURACIÓN PRINCIPAL ---
  const CONFIG = {
    flowerCount: 160,       // Cantidad de flores amarillas principales en la galaxia
    starCount: 220,         // Estrellas en el fondo cósmico
    dustCount: 180,         // Polvo estelar dorado en los brazos
    spiralArms: 3,          // Número de brazos espirales
    rotationSpeed: 0.0018,  // Velocidad de giro de la galaxia
    tiltX: 0.85,            // Inclinación vertical (perspectiva 3D elíptica)
    tiltY: 0.15,            // Inclinación lateral
  };

  const canvas = document.getElementById('galaxyCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let dpr = 1;

  // Interacción del cursor
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isDown: false };
  let lastUserActivity = Date.now();

  // --- PRE-RENDERIZADO DE SPRITES (ALTO RENDIMIENTO A 60 FPS) ---
  const sprites = {
    flower1: null, // Flor amarilla completa clásica (tipo girasol/margarita)
    flower2: null, // Flor amarilla dorada brillante (pétalos redondeados)
    petal: null,   // Pétalo suelto para explosiones
    glow: null     // Resplandor dorado para el núcleo galáctico
  };

  function createFlowerSprite1(size) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = size;
    sCanvas.height = size;
    const sCtx = sCanvas.getContext('2d');
    const c = size / 2;
    const petalCount = 12;
    const petalLen = size * 0.42;
    const petalWidth = size * 0.13;

    sCtx.save();
    sCtx.translate(c, c);

    // Resplandor exterior suave
    const radial = sCtx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * 0.5);
    radial.addColorStop(0, 'rgba(255, 220, 50, 0.45)');
    radial.addColorStop(0.7, 'rgba(255, 180, 0, 0.1)');
    radial.addColorStop(1, 'rgba(255, 180, 0, 0)');
    sCtx.fillStyle = radial;
    sCtx.beginPath();
    sCtx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    sCtx.fill();

    // Dibujar pétalos amarillos
    for (let i = 0; i < petalCount; i++) {
      sCtx.save();
      sCtx.rotate((i * Math.PI * 2) / petalCount);

      // Gradiente de pétalo: base naranja cálido a punta amarillo limón brillante
      const pGrad = sCtx.createLinearGradient(0, 0, 0, -petalLen);
      pGrad.addColorStop(0, '#f59e0b');
      pGrad.addColorStop(0.4, '#ffcf33');
      pGrad.addColorStop(1, '#fffae0');

      sCtx.fillStyle = pGrad;
      sCtx.beginPath();
      sCtx.moveTo(0, 0);
      sCtx.bezierCurveTo(-petalWidth, -petalLen * 0.35, -petalWidth * 0.8, -petalLen * 0.85, 0, -petalLen);
      sCtx.bezierCurveTo(petalWidth * 0.8, -petalLen * 0.85, petalWidth, -petalLen * 0.35, 0, 0);
      sCtx.fill();

      // Línea central sutil de textura
      sCtx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      sCtx.lineWidth = 1;
      sCtx.beginPath();
      sCtx.moveTo(0, -size * 0.1);
      sCtx.lineTo(0, -petalLen * 0.85);
      sCtx.stroke();

      sCtx.restore();
    }

    // Centro / Botón de la flor (ámbar profundo)
    const centerGrad = sCtx.createRadialGradient(0, 0, 0, 0, 0, size * 0.15);
    centerGrad.addColorStop(0, '#78350f');
    centerGrad.addColorStop(0.5, '#b45309');
    centerGrad.addColorStop(0.85, '#f59e0b');
    centerGrad.addColorStop(1, '#ffcf33');
    sCtx.fillStyle = centerGrad;
    sCtx.beginPath();
    sCtx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    sCtx.fill();

    // Puntos centrales de polen
    sCtx.fillStyle = '#fffbeb';
    for (let p = 0; p < 7; p++) {
      const angle = (p * Math.PI * 2) / 7;
      sCtx.beginPath();
      sCtx.arc(Math.cos(angle) * (size * 0.07), Math.sin(angle) * (size * 0.07), size * 0.015, 0, Math.PI * 2);
      sCtx.fill();
    }

    sCtx.restore();
    return sCanvas;
  }

  function createFlowerSprite2(size) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = size;
    sCanvas.height = size;
    const sCtx = sCanvas.getContext('2d');
    const c = size / 2;
    const petalCount = 8;
    const petalRadius = size * 0.35;

    sCtx.save();
    sCtx.translate(c, c);

    // Resplandor
    const glow = sCtx.createRadialGradient(0, 0, 0, 0, 0, c);
    glow.addColorStop(0, 'rgba(255, 235, 100, 0.4)');
    glow.addColorStop(0.8, 'rgba(255, 190, 30, 0.05)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = glow;
    sCtx.beginPath();
    sCtx.arc(0, 0, c, 0, Math.PI * 2);
    sCtx.fill();

    // Pétalos redondeados dorados
    for (let i = 0; i < petalCount; i++) {
      sCtx.save();
      sCtx.rotate((i * Math.PI * 2) / petalCount);
      sCtx.fillStyle = '#ffcf33';
      sCtx.beginPath();
      sCtx.ellipse(0, -petalRadius * 0.55, size * 0.12, petalRadius * 0.5, 0, 0, Math.PI * 2);
      sCtx.fill();

      // Brillo interior
      sCtx.fillStyle = '#fff4a3';
      sCtx.beginPath();
      sCtx.ellipse(0, -petalRadius * 0.65, size * 0.06, petalRadius * 0.3, 0, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.restore();
    }

    // Centro
    const cGrad = sCtx.createRadialGradient(0, 0, 0, 0, 0, size * 0.13);
    cGrad.addColorStop(0, '#92400e');
    cGrad.addColorStop(1, '#f59e0b');
    sCtx.fillStyle = cGrad;
    sCtx.beginPath();
    sCtx.arc(0, 0, size * 0.13, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.restore();
    return sCanvas;
  }

  function createPetalSprite(size) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = size;
    sCanvas.height = size;
    const sCtx = sCanvas.getContext('2d');
    const c = size / 2;

    sCtx.save();
    sCtx.translate(c, c);
    const grad = sCtx.createLinearGradient(0, size * 0.3, 0, -size * 0.3);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.6, '#ffcf33');
    grad.addColorStop(1, '#fffde7');
    sCtx.fillStyle = grad;

    sCtx.beginPath();
    sCtx.moveTo(0, -size * 0.4);
    sCtx.bezierCurveTo(size * 0.25, -size * 0.2, size * 0.2, size * 0.3, 0, size * 0.4);
    sCtx.bezierCurveTo(-size * 0.2, size * 0.3, -size * 0.25, -size * 0.2, 0, -size * 0.4);
    sCtx.fill();
    sCtx.restore();

    return sCanvas;
  }

  function createCoreGlow(size) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = size;
    sCanvas.height = size;
    const sCtx = sCanvas.getContext('2d');
    const c = size / 2;

    const g = sCtx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255, 235, 120, 0.85)');
    g.addColorStop(0.2, 'rgba(255, 195, 30, 0.45)');
    g.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    g.addColorStop(0.8, 'rgba(217, 119, 6, 0.05)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');

    sCtx.fillStyle = g;
    sCtx.fillRect(0, 0, size, size);
    return sCanvas;
  }

  function initSprites() {
    sprites.flower1 = createFlowerSprite1(96);
    sprites.flower2 = createFlowerSprite2(84);
    sprites.petal = createPetalSprite(48);
    sprites.glow = createCoreGlow(400);
  }

  // --- CLASE: ESTRELLAS DE FONDO ---
  class CosmicStar {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = (Math.random() - 0.5) * width * 1.5;
      this.y = (Math.random() - 0.5) * height * 1.5;
      this.z = Math.random() * 0.8 + 0.2;
      this.size = (Math.random() * 1.8 + 0.5) * this.z;
      this.alpha = Math.random() * 0.8 + 0.2;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
      this.pulseVal = Math.random() * Math.PI * 2;
      this.color = Math.random() > 0.4 ? '#fff9db' : '#fef08a';
    }
    update() {
      this.pulseVal += this.pulseSpeed;
      this.currentAlpha = this.alpha * (0.6 + 0.4 * Math.sin(this.pulseVal));
    }
    draw(targetCtx) {
      targetCtx.save();
      targetCtx.globalAlpha = this.currentAlpha;
      targetCtx.fillStyle = this.color;
      targetCtx.beginPath();
      targetCtx.arc(centerX + this.x, centerY + this.y, this.size, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
  }

  // --- CLASE: FLOR EN ÓRBITA GALÁCTICA ---
  class GalaxyFlower {
    constructor(index, total) {
      this.index = index;
      this.total = total;
      this.init();
    }

    init() {
      // Distribución en brazos espirales
      this.arm = this.index % CONFIG.spiralArms;
      const armOffset = (this.arm * (Math.PI * 2)) / CONFIG.spiralArms;

      // Radio exponencial para densidad central y dispersión elegante
      const maxRadius = Math.min(width, height) * 0.72;
      const minRadius = 40;
      const progress = Math.pow(this.index / this.total, 0.75); // Más flores hacia el centro
      this.radius = minRadius + progress * (maxRadius - minRadius);

      // Desfase angular con curvatura espiral logarítmica
      this.spiralAngle = armOffset + Math.log(this.radius) * 1.7;
      // Añadir dispersión gaussiana natural a lo ancho del brazo
      this.angleOffset = (Math.random() - 0.5) * (0.4 + progress * 0.4);
      this.currentAngle = this.spiralAngle + this.angleOffset;

      // Movimiento vertical en el disco galáctico (grosor de la galaxia)
      this.diskThickness = (1 - progress * 0.5) * 35;
      this.verticalZ = (Math.random() - 0.5) * this.diskThickness;

      // Tipo de flor y escala
      this.spriteType = Math.random() > 0.35 ? 1 : 2;
      this.baseScale = Math.random() * 0.35 + 0.3; // Escala entre 0.3 y 0.65
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.015;

      // Velocidad orbital diferencial: más cerca del centro gira más rápido
      this.orbitalSpeed = CONFIG.rotationSpeed * (1.1 - progress * 0.4);

      // Parpadeo suave
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
    }

    update() {
      this.currentAngle += this.orbitalSpeed;
      this.rotation += this.rotSpeed;
      this.pulse += this.pulseSpeed;
    }

    draw(targetCtx, tiltFactorX, tiltFactorY, parallaxX, parallaxY) {
      // Posición orbital en coordenadas polares
      const cosA = Math.cos(this.currentAngle);
      const sinA = Math.sin(this.currentAngle);

      // Proyección 2.5D con inclinación elíptica y profundidad
      const rawX = cosA * this.radius;
      const rawY = sinA * this.radius;

      // Aplicar inclinación perspectiva
      const screenX = rawX + parallaxX * (this.radius * 0.0008);
      const screenY = (rawY * tiltFactorX) + (this.verticalZ * 0.5) + parallaxY * (this.radius * 0.0008);

      // Profundidad para simular flores que pasan por delante o detrás del núcleo
      const depth = (sinA + 1.2) / 2.2; // 0 = fondo, 1 = frente
      const finalScale = this.baseScale * (0.65 + depth * 0.6) * (1 + 0.06 * Math.sin(this.pulse));
      const finalAlpha = Math.min(1, 0.4 + depth * 0.6);

      const sprite = this.spriteType === 1 ? sprites.flower1 : sprites.flower2;
      if (!sprite) return;

      const drawSize = sprite.width * finalScale;

      targetCtx.save();
      targetCtx.translate(centerX + screenX, centerY + screenY);
      targetCtx.rotate(this.rotation);
      targetCtx.globalAlpha = finalAlpha;
      targetCtx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      targetCtx.restore();
    }
  }

  // --- CLASE: POLVO ESTELAR / BRILLOS EN LOS BRAZOS ---
  class Stardust {
    constructor(index, total) {
      this.index = index;
      this.total = total;
      this.init();
    }
    init() {
      this.arm = this.index % CONFIG.spiralArms;
      const armOffset = (this.arm * (Math.PI * 2)) / CONFIG.spiralArms;
      const maxRadius = Math.min(width, height) * 0.8;
      const progress = Math.random();
      this.radius = 20 + progress * maxRadius;
      this.currentAngle = armOffset + Math.log(this.radius) * 1.7 + (Math.random() - 0.5) * 0.6;
      this.orbitalSpeed = CONFIG.rotationSpeed * (1.15 - progress * 0.35);
      this.size = Math.random() * 2.2 + 0.8;
      this.alpha = Math.random() * 0.7 + 0.2;
      this.color = Math.random() > 0.3 ? '#ffcf33' : '#fff59d';
    }
    update() {
      this.currentAngle += this.orbitalSpeed;
    }
    draw(targetCtx, tiltFactorX, parallaxX, parallaxY) {
      const cosA = Math.cos(this.currentAngle);
      const sinA = Math.sin(this.currentAngle);
      const screenX = cosA * this.radius + parallaxX * (this.radius * 0.0006);
      const screenY = (sinA * this.radius * tiltFactorX) + parallaxY * (this.radius * 0.0006);

      targetCtx.save();
      targetCtx.globalAlpha = this.alpha;
      targetCtx.fillStyle = this.color;
      targetCtx.beginPath();
      targetCtx.arc(centerX + screenX, centerY + screenY, this.size, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
  }

  // --- CLASE: EXPLOSIÓN DE FLORES AL HACER CLIC/TOUCH ---
  class FlowerBurstParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1.5; // Ligero impulso hacia arriba
      this.gravity = 0.04;
      this.drag = 0.975;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.12;
      this.scale = Math.random() * 0.3 + 0.25;
      this.alpha = 1;
      this.decay = Math.random() * 0.008 + 0.006;
      this.type = Math.random() > 0.4 ? 'flower' : 'petal';
    }
    update() {
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.alpha -= this.decay;
    }
    draw(targetCtx) {
      if (this.alpha <= 0) return;
      targetCtx.save();
      targetCtx.translate(this.x, this.y);
      targetCtx.rotate(this.rotation);
      targetCtx.globalAlpha = Math.max(0, this.alpha);

      const sprite = this.type === 'flower' ? sprites.flower1 : sprites.petal;
      if (sprite) {
        const drawSize = sprite.width * this.scale;
        targetCtx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      }
      targetCtx.restore();
    }
  }

  // --- MOTOR PRINCIPAL ---
  let stars = [];
  let flowers = [];
  let stardust = [];
  let bursts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    centerX = width / 2;
    centerY = height / 2;

    initGalaxy();
  }

  function initGalaxy() {
    stars = [];
    flowers = [];
    stardust = [];

    // Ajustar conteo de flores para móviles para mantener 60fps estables
    const isMobile = width < 768;
    const currentFlowerCount = isMobile ? Math.floor(CONFIG.flowerCount * 0.65) : CONFIG.flowerCount;

    for (let i = 0; i < CONFIG.starCount; i++) {
      stars.push(new CosmicStar());
    }

    for (let i = 0; i < currentFlowerCount; i++) {
      flowers.push(new GalaxyFlower(i, currentFlowerCount));
    }

    for (let i = 0; i < CONFIG.dustCount; i++) {
      stardust.push(new Stardust(i, CONFIG.dustCount));
    }
  }

  function spawnBurst(x, y) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      bursts.push(new FlowerBurstParticle(x, y));
    }
  }

  // --- BUCLE DE ANIMACIÓN ---
  function animate() {
    requestAnimationFrame(animate);

    // Suavizado del mouse / perspectiva
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Limpieza con gradiente suave
    ctx.clearRect(0, 0, width, height);

    // 1. Dibujar Estrellas Cósmicas
    for (let i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].draw(ctx);
    }

    // 2. Núcleo Radiante de la Galaxia
    if (sprites.glow) {
      ctx.save();
      const glowSize = Math.min(width, height) * 0.75;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(sprites.glow, centerX - glowSize / 2, centerY - (glowSize * CONFIG.tiltX) / 2, glowSize, glowSize * CONFIG.tiltX);
      ctx.restore();
    }

    // 3. Dibujar Polvo Estelar
    for (let i = 0; i < stardust.length; i++) {
      stardust[i].update();
      stardust[i].draw(ctx, CONFIG.tiltX, mouse.x, mouse.y);
    }

    // 4. Dibujar Flores en Órbita
    for (let i = 0; i < flowers.length; i++) {
      flowers[i].update();
      flowers[i].draw(ctx, CONFIG.tiltX, CONFIG.tiltY, mouse.x, mouse.y);
    }

    // 5. Dibujar Partículas de Explosión de Clic
    for (let i = bursts.length - 1; i >= 0; i--) {
      bursts[i].update();
      bursts[i].draw(ctx);
      if (bursts[i].alpha <= 0) {
        bursts.splice(i, 1);
      }
    }

    // Auto-ocultar UI tras 3.5 segundos de inactividad
    checkUIFade();
  }

  // --- GESTIÓN DE INTERACCIÓN Y CURSOR ---
  function handlePointerMove(clientX, clientY) {
    lastUserActivity = Date.now();
    wakeUI();

    // Parallax suave centrado
    mouse.targetX = (clientX - centerX) * 0.5;
    mouse.targetY = (clientY - centerY) * 0.5;
  }

  window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('click', (e) => {
    // Si el clic es en un botón o modal, no disparar flores
    if (e.target.closest('.ui-panel') || e.target.closest('.modal')) return;
    spawnBurst(e.clientX, e.clientY);
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (touch.target.closest('.ui-panel') || touch.target.closest('.modal')) return;
      spawnBurst(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  // --- SISTEMA DE AUDIO AMBIENTAL (WEB AUDIO API - SIN ARCHIVOS EXTERNOS) ---
  class AmbientAudio {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.timer = null;
      // Escala pentatónica dorada cálida (Frecuencias celestiales estilo caja de música)
      this.notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // C4, D4, E4, G4, A4, C5...
    }

    init() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }

    playChime(freq, time, duration = 2.5) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Envolvente de volumen suave y etérea
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    start() {
      if (!this.ctx) this.init();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isPlaying = true;

      // Secuencia arpegiada infinita relajante
      const scheduleNotes = () => {
        if (!this.isPlaying) return;
        const now = this.ctx.currentTime;
        const note = this.notes[Math.floor(Math.random() * this.notes.length)];
        this.playChime(note, now);

        // A veces tocar una segunda nota armoniosa
        if (Math.random() > 0.4) {
          const harmonNote = this.notes[Math.floor(Math.random() * this.notes.length)];
          this.playChime(harmonNote, now + 0.25, 3.0);
        }

        const nextDelay = (Math.random() * 1.5 + 1.2) * 1000;
        this.timer = setTimeout(scheduleNotes, nextDelay);
      };

      scheduleNotes();
    }

    stop() {
      this.isPlaying = false;
      if (this.timer) clearTimeout(this.timer);
    }

    toggle() {
      if (this.isPlaying) {
        this.stop();
        return false;
      } else {
        this.start();
        return true;
      }
    }
  }

  const audio = new AmbientAudio();

  // --- UI CONTROLES ---
  const uiPanel = document.getElementById('uiPanel');
  const btnAudio = document.getElementById('btnAudio');
  const iconAudioOff = document.getElementById('iconAudioOff');
  const iconAudioOn = document.getElementById('iconAudioOn');

  const btnEditMsg = document.getElementById('btnEditMsg');
  const btnSnapshot = document.getElementById('btnSnapshot');
  const btnFullscreen = document.getElementById('btnFullscreen');

  const msgModal = document.getElementById('msgModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnSaveMsg = document.getElementById('btnSaveMsg');
  const btnClearMsg = document.getElementById('btnClearMsg');

  const inputTitle = document.getElementById('inputTitle');
  const inputSubtitle = document.getElementById('inputSubtitle');
  const displayTitle = document.getElementById('displayTitle');
  const displaySubtitle = document.getElementById('displaySubtitle');

  function wakeUI() {
    uiPanel.classList.remove('faded');
  }

  function checkUIFade() {
    if (Date.now() - lastUserActivity > 3500 && !msgModal.open) {
      uiPanel.classList.add('faded');
    }
  }

  // Audio Toggle
  btnAudio.addEventListener('click', (e) => {
    e.stopPropagation();
    const active = audio.toggle();
    if (active) {
      iconAudioOff.classList.add('hidden');
      iconAudioOn.classList.remove('hidden');
      btnAudio.style.boxShadow = '0 0 15px var(--color-gold)';
    } else {
      iconAudioOff.classList.remove('hidden');
      iconAudioOn.classList.add('hidden');
      btnAudio.style.boxShadow = 'none';
    }
  });

  // Modal Mensaje
  btnEditMsg.addEventListener('click', (e) => {
    e.stopPropagation();
    msgModal.showModal();
  });

  btnCloseModal.addEventListener('click', () => {
    msgModal.close();
  });

  btnSaveMsg.addEventListener('click', () => {
    const title = inputTitle.value.trim();
    const subtitle = inputSubtitle.value.trim();

    displayTitle.textContent = title;
    displaySubtitle.textContent = subtitle;

    // Guardar en localStorage para que persista
    localStorage.setItem('galaxia_title', title);
    localStorage.setItem('galaxia_subtitle', subtitle);

    msgModal.close();
  });

  btnClearMsg.addEventListener('click', () => {
    inputTitle.value = '';
    inputSubtitle.value = '';
    displayTitle.textContent = '';
    displaySubtitle.textContent = '';
    localStorage.removeItem('galaxia_title');
    localStorage.removeItem('galaxia_subtitle');
    msgModal.close();
  });

  // Cargar mensaje previo si existe (por defecto vacío como solicitó el usuario)
  const savedTitle = localStorage.getItem('galaxia_title');
  const savedSubtitle = localStorage.getItem('galaxia_subtitle');
  if (savedTitle) {
    inputTitle.value = savedTitle;
    displayTitle.textContent = savedTitle;
  }
  if (savedSubtitle) {
    inputSubtitle.value = savedSubtitle;
    displaySubtitle.textContent = savedSubtitle;
  }

  // Captura / Descargar Imagen Postal
  btnSnapshot.addEventListener('click', (e) => {
    e.stopPropagation();

    // Crear un canvas temporal para combinar fondo, galaxia y dedicatoria
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = canvas.width;
    snapCanvas.height = canvas.height;
    const snapCtx = snapCanvas.getContext('2d');

    // 1. Dibujar el canvas actual
    snapCtx.drawImage(canvas, 0, 0);

    // 2. Si hay texto, dibujarlo con estilos dorados en la imagen final
    const title = displayTitle.textContent;
    const sub = displaySubtitle.textContent;

    if (title || sub) {
      snapCtx.save();
      snapCtx.scale(dpr, dpr);
      snapCtx.textAlign = 'center';

      if (title) {
        snapCtx.font = 'bold 48px "Dancing Script", cursive, sans-serif';
        snapCtx.fillStyle = '#fff9db';
        snapCtx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        snapCtx.shadowBlur = 20;
        snapCtx.fillText(title, centerX, centerY - (sub ? 25 : 0));
      }

      if (sub) {
        snapCtx.font = 'italic 22px "Playfair Display", serif';
        snapCtx.fillStyle = '#ffeedb';
        snapCtx.shadowColor = 'rgba(255, 190, 50, 0.5)';
        snapCtx.shadowBlur = 12;
        snapCtx.fillText(sub, centerX, centerY + (title ? 30 : 0));
      }

      snapCtx.restore();
    }

    // Descargar como archivo PNG
    const link = document.createElement('a');
    link.download = 'galaxia-flores-amarillas.png';
    link.href = snapCanvas.toDataURL('image/png');
    link.click();
  });

  // Pantalla Completa
  btnFullscreen.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // --- INICIALIZACIÓN ---
  window.addEventListener('resize', resize);

  initSprites();
  resize();
  animate();

})();
