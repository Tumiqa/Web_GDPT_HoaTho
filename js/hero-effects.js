document.addEventListener("DOMContentLoaded", () => {
  // ========================================================
  // UTILITY: CANVAS SETUP & GLOBAL PHYSICS
  // ========================================================
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupCanvas(container) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("hero-effect-canvas");
    container.appendChild(canvas);
    
    const ctx = canvas.getContext("2d", { alpha: true });
    
    let w, h, dpr;
    function resize() {
      w = container.offsetWidth;
      h = container.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    });
    resize();
    
    // Smooth mouse tracking with interpolation
    const mouse = { 
      x: -1000, y: -1000, 
      targetX: -1000, targetY: -1000,
      vx: 0, vy: 0, 
      speed: 0,
      isDown: false, clickEvent: false,
      active: false
    };

    function updateMouseVelocity() {
      // Smooth lerp for buttery mouse following
      const lerpFactor = 0.15;
      const prevX = mouse.x;
      const prevY = mouse.y;
      
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * lerpFactor;
        mouse.y += (mouse.targetY - mouse.y) * lerpFactor;
      }
      
      mouse.vx = mouse.x - prevX;
      mouse.vy = mouse.y - prevY;
      mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
      
      if (mouse.clickEvent) mouse.clickEvent = false;
    }

    function setMousePos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.targetX = clientX - rect.left;
      mouse.targetY = clientY - rect.top;
      mouse.active = true;
    }

    container.addEventListener("mousemove", setMousePos);
    container.addEventListener("touchmove", setMousePos, { passive: true });
    container.addEventListener("mouseenter", (e) => { setMousePos(e); mouse.active = true; });
    container.addEventListener("mouseleave", () => { mouse.active = false; mouse.targetX = -1000; mouse.targetY = -1000; });
    container.addEventListener("touchend", () => { mouse.active = false; mouse.targetX = -1000; mouse.targetY = -1000; mouse.isDown = false; });
    container.addEventListener("mousedown", (e) => { mouse.isDown = true; mouse.clickEvent = true; setMousePos(e); });
    container.addEventListener("touchstart", (e) => { mouse.isDown = true; mouse.clickEvent = true; setMousePos(e); }, { passive: true });
    window.addEventListener("mouseup", () => { mouse.isDown = false; });
    
    // Visibility-based pause
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => { isVisible = entries[0].isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(container);
    
    return { canvas, ctx, width: () => w, height: () => h, mouse, updateMouseVelocity, isVisible: () => isVisible };
  }

  // Easing helpers
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ========================================================
  // 1. SINH HOẠT - CAMPFIRE EMBERS (ENHANCED)
  //    Improvements: Longer trails with bezier smoothing,
  //    realistic thermal physics, bloom glow, mouse creates
  //    wind vortex effect, ember burst on click
  // ========================================================
  const shHero = document.querySelector(".sh-hero");
  if (shHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    shHero.insertBefore(container, shHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity, isVisible } = setupCanvas(container);
    
    let time = 0;
    const TRAIL_LENGTH = isMobile ? 8 : 14;
    const EMBER_COUNT = isMobile ? 60 : 140;
    
    class Ember {
      constructor() {
        this.reset(true);
      }
      reset(randomY = false) {
        this.x = Math.random() * width();
        this.y = randomY ? Math.random() * height() : height() + Math.random() * 40;
        this.size = Math.random() * 2.5 + 0.5;
        this.baseVx = (Math.random() - 0.5) * 0.8;
        this.vx = this.baseVx;
        this.vy = -Math.random() * 2 - 0.8;
        this.life = 1;
        this.maxLife = 1;
        this.decay = Math.random() * 0.004 + 0.0015;
        this.trail = [];
        this.turbulenceOffset = Math.random() * 1000;
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.flickerSpeed = Math.random() * 0.1 + 0.05;
      }
      update() {
        // Smooth thermal turbulence
        const turb = Math.sin(time * 0.8 + this.turbulenceOffset) * 0.3 +
                     Math.sin(time * 1.3 + this.turbulenceOffset * 2) * 0.15;
        this.vx = this.vx * 0.96 + turb * 0.04;
        this.vy -= 0.015; // Gentle upward thermal
        this.vy *= 0.99;
        
        // Mouse wind vortex - smooth radial push
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radius = 180;
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            const force = easeOutCubic(1 - dist / radius) * 0.12;
            // Wind follows mouse velocity + pushes away
            this.vx += (mouse.vx * 0.15 + dx / dist * 2) * force;
            this.vy += (mouse.vy * 0.15 + dy / dist * 1.5) * force;
          }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.flickerPhase += this.flickerSpeed;
        this.life -= this.decay;

        // Smooth trail recording
        this.trail.push({ x: this.x, y: this.y, life: this.life });
        if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

        if (this.life <= 0 || this.y < -60 || this.x < -80 || this.x > width() + 80) {
          this.reset();
        }
      }
      draw() {
        if (this.trail.length < 2) return;
        
        const flicker = 0.7 + Math.sin(this.flickerPhase) * 0.3;
        
        // Draw trail with gradient along path
        for (let i = 1; i < this.trail.length; i++) {
          const t0 = this.trail[i - 1];
          const t1 = this.trail[i];
          const progress = i / this.trail.length;
          const alpha = progress * this.life * flicker;
          
          // Color transition: White -> Gold -> Orange -> Deep Red -> Dim
          let r, g, b;
          const lifePhase = this.life;
          if (lifePhase > 0.7) {
            r = 255; g = lerp(255, 220, (0.95 - lifePhase) / 0.25); b = lerp(200, 60, (0.95 - lifePhase) / 0.25);
          } else if (lifePhase > 0.4) {
            r = 255; g = lerp(180, 80, (0.7 - lifePhase) / 0.3); b = lerp(40, 0, (0.7 - lifePhase) / 0.3);
          } else {
            r = lerp(200, 60, (0.4 - lifePhase) / 0.4);
            g = lerp(40, 5, (0.4 - lifePhase) / 0.4);
            b = 0;
          }
          
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.strokeStyle = `rgba(${r|0}, ${g|0}, ${b|0}, ${alpha * 0.9})`;
          ctx.lineWidth = this.size * progress;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        
        // Bright head glow
        if (this.life > 0.2) {
          const headX = this.trail[this.trail.length - 1].x;
          const headY = this.trail[this.trail.length - 1].y;
          const glowRadius = this.size * 3 * this.life * flicker;
          
          const glow = ctx.createRadialGradient(headX, headY, 0, headX, headY, glowRadius);
          glow.addColorStop(0, `rgba(255, 200, 80, ${this.life * 0.6 * flicker})`);
          glow.addColorStop(0.5, `rgba(255, 120, 20, ${this.life * 0.2 * flicker})`);
          glow.addColorStop(1, `rgba(255, 60, 0, 0)`);
          
          ctx.beginPath();
          ctx.arc(headX, headY, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }
    }

    // Ambient heat haze at bottom
    class HeatHaze {
      constructor() {
        this.points = [];
        for (let i = 0; i < 20; i++) {
          this.points.push({
            x: (i / 19) * width(),
            baseY: height() * 0.85,
            phase: Math.random() * Math.PI * 2,
            amp: Math.random() * 8 + 4,
            speed: Math.random() * 0.02 + 0.01
          });
        }
      }
      draw() {
        ctx.beginPath();
        const p = this.points;
        for (let i = 0; i < p.length; i++) {
          p[i].phase += p[i].speed;
          const y = p[i].baseY + Math.sin(p[i].phase) * p[i].amp;
          if (i === 0) ctx.moveTo(p[i].x, y);
          else {
            const cpx = (p[i - 1].x + p[i].x) / 2;
            const cpy = (p[i - 1].baseY + Math.sin(p[i - 1].phase) * p[i - 1].amp + y) / 2;
            ctx.quadraticCurveTo(p[i - 1].x, p[i - 1].baseY + Math.sin(p[i - 1].phase) * p[i - 1].amp, cpx, cpy);
          }
        }
        ctx.lineTo(width(), height());
        ctx.lineTo(0, height());
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(0, height() * 0.8, 0, height());
        grad.addColorStop(0, "rgba(255, 80, 0, 0)");
        grad.addColorStop(0.5, "rgba(255, 60, 0, 0.03)");
        grad.addColorStop(1, "rgba(255, 40, 0, 0.06)");
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    const embers = Array.from({ length: EMBER_COUNT }, () => new Ember());
    const heatHaze = new HeatHaze();

    function render() {
      if (!isVisible()) { requestAnimationFrame(render); return; }
      updateMouseVelocity();
      time += 0.016;
      
      ctx.clearRect(0, 0, width(), height());
      
      // Bottom heat haze
      ctx.globalCompositeOperation = "screen";
      heatHaze.draw();
      
      // Embers with additive blending
      ctx.globalCompositeOperation = "screen";
      embers.forEach(e => { e.update(); e.draw(); });
      
      // Click burst: spawn extra embers at mouse position
      if (mouse.clickEvent && mouse.active) {
        for (let i = 0; i < 12; i++) {
          const burst = new Ember();
          burst.x = mouse.x;
          burst.y = mouse.y;
          burst.vx = (Math.random() - 0.5) * 6;
          burst.vy = -Math.random() * 5 - 2;
          burst.life = 0.9;
          burst.size = Math.random() * 3 + 1;
          embers.push(burst);
        }
        // Keep total count managed
        while (embers.length > EMBER_COUNT + 50) embers.shift();
      }
      
      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 2. NHẠC GĐPT - FLUID AUDIO RIBBONS (ENHANCED)
  //    Improvements: Catmull-Rom spline curves for silky
  //    smoothness, flowing gradient ribbons with thickness,
  //    particle sparkles instead of emoji, real-time waveform
  //    deformation from mouse, pulse on click
  // ========================================================
  const musicHero = document.querySelector(".music-hero");
  if (musicHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    musicHero.insertBefore(container, musicHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity, isVisible } = setupCanvas(container);
    
    let time = 0;
    let pulseIntensity = 0;
    
    class FluidRibbon {
      constructor(yOffset, colors, speed, amp, phase, thickness) {
        this.yOffset = yOffset;
        this.colors = colors; // [start, end] gradient
        this.speed = speed;
        this.amp = amp;
        this.phase = phase;
        this.thickness = thickness;
        this.points = [];
      }
      
      computePoints() {
        this.points = [];
        const segments = Math.ceil(width() / 8); // Denser sampling
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width();
          const nx = x / width();
          
          // Multi-frequency wave
          let y = height() / 2 + this.yOffset;
          y += Math.sin(nx * Math.PI * 2 + time * this.speed + this.phase) * this.amp;
          y += Math.sin(nx * Math.PI * 4 - time * this.speed * 1.3 + this.phase * 0.5) * (this.amp * 0.4);
          y += Math.sin(nx * Math.PI * 6 + time * this.speed * 0.7) * (this.amp * 0.15);
          
          // Pulse effect on click
          y += Math.sin(nx * Math.PI * 2 + time * 8) * pulseIntensity * 15;
          
          // Smooth mouse interaction - push/pull wave
          if (mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 250) {
              const influence = easeOutCubic(1 - dist / 250) * 50;
              y += (mouse.y < height() / 2 ? -1 : 1) * influence;
              y += mouse.vy * easeOutCubic(1 - dist / 250) * 0.8;
            }
          }
          
          this.points.push({ x, y });
        }
      }
      
      draw() {
        this.computePoints();
        if (this.points.length < 2) return;
        
        // Draw filled ribbon with thickness
        const half = this.thickness / 2;
        
        // Top edge
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y - half);
        for (let i = 1; i < this.points.length - 1; i++) {
          const p0 = this.points[i - 1];
          const p1 = this.points[i];
          const p2 = this.points[i + 1];
          const cpx = p1.x;
          const cpy = p1.y - half;
          const ex = (p1.x + p2.x) / 2;
          const ey = (p1.y + p2.y) / 2 - half;
          ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        }
        const lastTop = this.points[this.points.length - 1];
        ctx.lineTo(lastTop.x, lastTop.y - half);
        
        // Bottom edge (reverse)
        for (let i = this.points.length - 1; i > 0; i--) {
          const p0 = this.points[i];
          const p1 = this.points[i - 1];
          const p2 = i > 1 ? this.points[i - 2] : this.points[0];
          const cpx = p1.x;
          const cpy = p1.y + half;
          const ex = i > 1 ? (p1.x + p2.x) / 2 : p2.x;
          const ey = i > 1 ? (p1.y + p2.y) / 2 + half : p2.y + half;
          ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        }
        ctx.closePath();
        
        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, width(), 0);
        grad.addColorStop(0, this.colors[0]);
        grad.addColorStop(0.5, this.colors[1]);
        grad.addColorStop(1, this.colors[0]);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Bright center line
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length - 1; i++) {
          const p1 = this.points[i];
          const p2 = this.points[i + 1];
          ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        }
        ctx.strokeStyle = this.colors[2] || this.colors[1];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    
    // Sparkle particles instead of emoji
    const SPARKLE_COUNT = isMobile ? 20 : 40;
    class Sparkle {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * width();
        this.y = init ? Math.random() * height() : height() + 20;
        this.size = Math.random() * 2 + 0.5;
        this.vy = -Math.random() * 1.2 - 0.3;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.06 + 0.02;
        this.hue = Math.random() * 60 + 120; // green-blue range
        this.maxAlpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx + Math.sin(this.y * 0.015 + time) * 0.3;
        this.y += this.vy;
        this.phase += this.pulseSpeed;
        
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 12000) {
            const dist = Math.sqrt(distSq);
            this.x += dx / dist * 1.5;
            this.y += dy / dist * 1.5;
          }
        }
        
        if (this.y < -20 || this.x < -20 || this.x > width() + 20) this.reset();
      }
      draw() {
        const alpha = (Math.sin(this.phase) * 0.5 + 0.5) * this.maxAlpha;
        const glowSize = this.size * 4;
        
        // Outer glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glow.addColorStop(0, `hsla(${this.hue}, 70%, 70%, ${alpha})`);
        glow.addColorStop(1, `hsla(${this.hue}, 70%, 70%, 0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // Bright core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 90%, ${alpha * 1.5})`;
        ctx.fill();
      }
    }

    const ribbons = [
      new FluidRibbon(-40, ["rgba(46, 204, 113, 0.08)", "rgba(46, 204, 113, 0.2)", "rgba(46, 204, 113, 0.4)"], 1.0, 45, 0, 20),
      new FluidRibbon(0, ["rgba(52, 152, 219, 0.06)", "rgba(52, 152, 219, 0.15)", "rgba(52, 152, 219, 0.3)"], 0.7, 65, Math.PI, 28),
      new FluidRibbon(35, ["rgba(155, 89, 182, 0.06)", "rgba(155, 89, 182, 0.18)", "rgba(155, 89, 182, 0.35)"], 1.3, 35, Math.PI / 2, 16),
      new FluidRibbon(-15, ["rgba(241, 196, 15, 0.04)", "rgba(241, 196, 15, 0.1)", "rgba(241, 196, 15, 0.25)"], 0.9, 25, Math.PI * 1.5, 12),
    ];
    
    const sparkles = Array.from({ length: SPARKLE_COUNT }, () => new Sparkle());

    // Floating music note icons (enhanced with smooth physics)
    const noteChars = ["🎵", "🎶", "🎼", "♪"];
    const NOTE_COUNT = isMobile ? 10 : 18;
    class FloatingNote {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * width();
        this.y = init ? Math.random() * height() : height() + 40;
        this.renderX = this.x;
        this.renderY = this.y;
        this.char = noteChars[Math.floor(Math.random() * noteChars.length)];
        this.size = Math.random() * 14 + 12;
        this.vy = -Math.random() * 1.2 - 0.4;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.angle = 0;
        this.targetAngle = 0;
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = Math.random() * 0.015 + 0.008;
        this.swayAmp = Math.random() * 15 + 8;
        this.opacity = 0;
        this.targetOpacity = Math.random() * 0.35 + 0.15;
        this.glowHue = Math.random() * 60 + 120; // green-blue glow
      }
      update() {
        this.swayPhase += this.swaySpeed;
        
        // Gentle horizontal sway
        this.x += this.vx + Math.sin(this.swayPhase) * 0.4;
        this.y += this.vy;
        
        // Smooth rotation following sway direction
        this.targetAngle = Math.cos(this.swayPhase) * 0.25;
        this.angle += (this.targetAngle - this.angle) * 0.05;
        
        // Smooth lerp for render position (buttery movement)
        this.renderX += (this.x - this.renderX) * 0.08;
        this.renderY += (this.y - this.renderY) * 0.08;
        
        // Fade in smoothly
        this.opacity += (this.targetOpacity - this.opacity) * 0.03;
        
        // Mouse repulsion (smooth push away)
        if (mouse.active) {
          const dx = this.renderX - mouse.x;
          const dy = this.renderY - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 15000) {
            const dist = Math.sqrt(distSq);
            const push = easeOutCubic(1 - dist / 122) * 2.5;
            this.x += (dx / dist) * push;
            this.y += (dy / dist) * push;
          }
        }
        
        if (this.renderY < -50 || this.renderX < -50 || this.renderX > width() + 50) {
          this.reset();
          this.opacity = 0;
        }
      }
      draw() {
        if (this.opacity < 0.01) return;
        
        ctx.save();
        ctx.translate(this.renderX, this.renderY);
        ctx.rotate(this.angle);
        
        // Soft glow behind the note
        const glowR = this.size * 1.2;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        glow.addColorStop(0, `hsla(${this.glowHue}, 60%, 65%, ${this.opacity * 0.3})`);
        glow.addColorStop(1, `hsla(${this.glowHue}, 60%, 65%, 0)`);
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // The note emoji
        ctx.font = `${this.size}px Arial`;
        ctx.fillStyle = `rgba(200, 230, 210, ${this.opacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.char, 0, 0);
        
        ctx.restore();
      }
    }
    
    const floatingNotes = Array.from({ length: NOTE_COUNT }, () => new FloatingNote());

    function render() {
      if (!isVisible()) { requestAnimationFrame(render); return; }
      updateMouseVelocity();
      time += 0.018;
      
      // Decay pulse
      pulseIntensity *= 0.92;
      if (mouse.clickEvent && mouse.active) pulseIntensity = 1;
      
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width(), height());

      // Ribbons with screen blending
      ctx.globalCompositeOperation = "screen";
      ribbons.forEach(r => r.draw());
      
      // Sparkles
      ctx.globalCompositeOperation = "screen";
      sparkles.forEach(s => { s.update(); s.draw(); });
      
      // Floating music notes
      ctx.globalCompositeOperation = "source-over";
      floatingNotes.forEach(n => { n.update(); n.draw(); });

      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 3. TÀI LIỆU - 3D LEAVES & MAGIC DUST (ENHANCED)
  //    Improvements: Realistic leaf shapes with veins,
  //    depth-of-field blur, golden particle constellation,
  //    mouse creates gathering vortex, click scatters
  // ========================================================
  const taiLieuHero = document.querySelector(".tailieu-hero");
  if (taiLieuHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    taiLieuHero.insertBefore(container, taiLieuHero.firstChild);

    const rays = document.createElement("div");
    rays.classList.add("tailieu-rays");
    container.appendChild(rays);
    
    const { ctx, width, height, mouse, updateMouseVelocity, isVisible } = setupCanvas(container);
    
    let time = 0;
    const LEAF_COUNT = isMobile ? 18 : 35;
    const DUST_COUNT = isMobile ? 40 : 80;
    
    class Leaf {
      constructor() { this.reset(true); }
      reset(randomY = false) {
        this.x = Math.random() * width();
        this.y = randomY ? Math.random() * height() : -60;
        this.z = Math.random() * 100 + 30; // Depth: 30-130
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = Math.random() * 1.2 + 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.03;
        this.flapPhase = Math.random() * Math.PI * 2;
        this.flapSpeed = Math.random() * 0.04 + 0.015;
        this.sway = Math.random() * Math.PI * 2;
        this.swaySpeed = Math.random() * 0.01 + 0.005;
        this.leafType = Math.floor(Math.random() * 3); // Different leaf shapes
        this.hue = Math.random() * 30 + 35; // 35-65: gold range
        this.saturation = Math.random() * 30 + 60;
      }
      update() {
        // Smooth sway
        this.sway += this.swaySpeed;
        const swayForce = Math.sin(this.sway) * 0.4;
        
        this.vx = this.vx * 0.97 + swayForce * 0.03;
        this.vy = this.vy * 0.98 + 0.02; // Gravity
        
        // Mouse interaction - gentle wind push
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radius = 200;
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            const force = easeOutCubic(1 - dist / radius) * 0.08;
            this.vx += (mouse.vx * 0.2 + dx / dist * 1.5) * force;
            this.vy += (mouse.vy * 0.2 + dy / dist * 1) * force;
          }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.spinSpeed;
        this.flapPhase += this.flapSpeed;

        if (this.y > height() + 60 || this.x < -80 || this.x > width() + 80) this.reset();
      }
      draw() {
        const scale = this.z / 80;
        const flap = Math.abs(Math.sin(this.flapPhase));
        // Depth-of-field: faraway leaves are more transparent
        const depthAlpha = Math.min(1, this.z / 80);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(scale, scale * (0.3 + flap * 0.7)); // Flapping effect
        ctx.globalAlpha = depthAlpha * 0.85;
        
        const lSize = 14;
        
        // Leaf body
        ctx.beginPath();
        if (this.leafType === 0) {
          // Bodhi leaf shape
          ctx.moveTo(0, -lSize);
          ctx.bezierCurveTo(lSize * 1.2, -lSize * 0.4, lSize * 0.8, lSize * 0.6, 0, lSize * 1.2);
          ctx.bezierCurveTo(-lSize * 0.8, lSize * 0.6, -lSize * 1.2, -lSize * 0.4, 0, -lSize);
        } else if (this.leafType === 1) {
          // Round leaf
          ctx.moveTo(0, -lSize * 0.8);
          ctx.bezierCurveTo(lSize, -lSize * 0.5, lSize, lSize * 0.5, 0, lSize * 0.8);
          ctx.bezierCurveTo(-lSize, lSize * 0.5, -lSize, -lSize * 0.5, 0, -lSize * 0.8);
        } else {
          // Elongated leaf
          ctx.moveTo(0, -lSize * 1.3);
          ctx.bezierCurveTo(lSize * 0.6, -lSize * 0.3, lSize * 0.5, lSize * 0.5, 0, lSize);
          ctx.bezierCurveTo(-lSize * 0.5, lSize * 0.5, -lSize * 0.6, -lSize * 0.3, 0, -lSize * 1.3);
        }
        
        const grad = ctx.createLinearGradient(-lSize, -lSize, lSize, lSize);
        grad.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, 55%, 0.9)`);
        grad.addColorStop(0.5, `hsla(${this.hue - 5}, ${this.saturation + 10}%, 45%, 0.7)`);
        grad.addColorStop(1, `hsla(${this.hue + 10}, ${this.saturation - 10}%, 35%, 0.5)`);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Central vein
        ctx.beginPath();
        ctx.moveTo(0, -lSize * 0.7);
        ctx.lineTo(0, lSize * 0.7);
        ctx.strokeStyle = `hsla(${this.hue + 10}, 40%, 40%, 0.3)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    class GoldenDust {
      constructor() {
        this.x = Math.random() * width();
        this.y = Math.random() * height();
        this.size = Math.random() * 1.8 + 0.3;
        this.baseVx = (Math.random() - 0.5) * 0.3;
        this.baseVy = (Math.random() - 0.5) * 0.3;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.04 + 0.015;
      }
      update() {
        this.phase += this.pulseSpeed;
        this.vx = this.vx * 0.95 + this.baseVx * 0.05;
        this.vy = this.vy * 0.95 + this.baseVy * 0.05;
        
        // Mouse attraction (gentle gather)
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 40000 && distSq > 400) {
            const dist = Math.sqrt(distSq);
            const pull = 0.3 / dist;
            this.vx += dx * pull;
            this.vy += dy * pull;
          }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -10) this.x = width() + 10;
        if (this.x > width() + 10) this.x = -10;
        if (this.y < -10) this.y = height() + 10;
        if (this.y > height() + 10) this.y = -10;
      }
      draw() {
        const alpha = (Math.sin(this.phase) * 0.5 + 0.5) * 0.7 + 0.1;
        
        // Glow
        const glowR = this.size * 5;
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
        glow.addColorStop(0, `rgba(255, 230, 120, ${alpha * 0.5})`);
        glow.addColorStop(1, `rgba(255, 200, 50, 0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 240, 150, ${alpha})`;
        ctx.fill();
      }
    }

    const leaves = Array.from({ length: LEAF_COUNT }, () => new Leaf());
    const dusts = Array.from({ length: DUST_COUNT }, () => new GoldenDust());

    // Connect nearby dusts with faint golden threads
    function drawDustConnections() {
      const threshold = 80;
      const thresholdSq = threshold * threshold;
      for (let i = 0; i < dusts.length; i++) {
        for (let j = i + 1; j < dusts.length; j++) {
          const dx = dusts[i].x - dusts[j].x;
          const dy = dusts[i].y - dusts[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < thresholdSq) {
            const alpha = (1 - Math.sqrt(distSq) / threshold) * 0.12;
            ctx.beginPath();
            ctx.moveTo(dusts[i].x, dusts[i].y);
            ctx.lineTo(dusts[j].x, dusts[j].y);
            ctx.strokeStyle = `rgba(255, 215, 100, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function render() {
      if (!isVisible()) { requestAnimationFrame(render); return; }
      updateMouseVelocity();
      time += 0.016;
      ctx.clearRect(0, 0, width(), height());
      
      // Dust connections
      ctx.globalCompositeOperation = "screen";
      if (!isMobile) drawDustConnections();
      
      // Dust particles
      ctx.globalCompositeOperation = "lighter";
      dusts.forEach(d => { d.update(); d.draw(); });
      
      // Leaves on top
      ctx.globalCompositeOperation = "source-over";
      leaves.forEach(l => { l.update(); l.draw(); });

      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 4. KỸ NĂNG - NEURAL NETWORK NEXUS (ENHANCED)
  //    Improvements: Spatial grid for O(n) connections,
  //    data flow animation along edges, pulsing nodes,
  //    smooth attraction, beautiful shockwave with afterglow,
  //    node clustering near mouse
  // ========================================================
  const kyNangHero = document.querySelector(".kynang-hero");
  if (kyNangHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    kyNangHero.insertBefore(container, kyNangHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity, isVisible } = setupCanvas(container);
    
    let time = 0;
    const NODE_COUNT = isMobile ? 60 : 110;
    const CONNECTION_DIST = 130;
    const CELL_SIZE = CONNECTION_DIST;
    
    class NeuralNode {
      constructor() {
        this.x = Math.random() * width();
        this.y = Math.random() * height();
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.baseR = Math.random() * 2 + 1.2;
        this.r = this.baseR;
        this.glow = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.03 + 0.015;
        this.hue = Math.random() * 40 + 130; // 130-170: green-teal range
      }
      update(shockwave) {
        this.pulsePhase += this.pulseSpeed;
        this.r = this.baseR + Math.sin(this.pulsePhase) * 0.3;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Soft boundary bounce
        const margin = 20;
        if (this.x < margin) { this.vx += 0.05; }
        if (this.x > width() - margin) { this.vx -= 0.05; }
        if (this.y < margin) { this.vy += 0.05; }
        if (this.y > height() - margin) { this.vy -= 0.05; }
        
        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2) {
          this.vx = (this.vx / speed) * 2;
          this.vy = (this.vy / speed) * 2;
        }
        
        // Friction
        this.vx *= 0.995;
        this.vy *= 0.995;

        // Shockwave push
        if (shockwave.active) {
          const sDx = this.x - shockwave.x;
          const sDy = this.y - shockwave.y;
          const sDist = Math.sqrt(sDx * sDx + sDy * sDy);
          const ringDist = Math.abs(sDist - shockwave.radius);
          if (ringDist < 40) {
            const pushForce = easeOutCubic(1 - ringDist / 40) * shockwave.intensity * 4;
            const angle = Math.atan2(sDy, sDx);
            this.vx += Math.cos(angle) * pushForce;
            this.vy += Math.sin(angle) * pushForce;
            this.glow = Math.min(1, this.glow + pushForce * 0.5);
          }
        }
        
        // Mouse attraction (smooth)
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radius = 180;
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            const attraction = easeOutCubic(1 - dist / radius) * 0.015;
            this.vx -= dx * attraction;
            this.vy -= dy * attraction;
            this.glow = Math.max(this.glow, easeOutCubic(1 - dist / radius) * 0.8);
          }
        }
        
        // Glow decay
        this.glow *= 0.94;
      }
      draw() {
        const pulseAlpha = 0.5 + Math.sin(this.pulsePhase) * 0.15;
        
        // Outer glow when active
        if (this.glow > 0.05) {
          const glowR = this.r * 6 * this.glow;
          const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
          glow.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${this.glow * 0.4})`);
          glow.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
          ctx.beginPath();
          ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
        
        // Core node
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        const brightness = 50 + this.glow * 30;
        ctx.fillStyle = `hsla(${this.hue}, 70%, ${brightness}%, ${pulseAlpha + this.glow * 0.5})`;
        ctx.fill();
      }
    }
    
    // Spatial hash grid for efficient neighbor lookup
    function buildGrid(nodes) {
      const grid = {};
      for (let i = 0; i < nodes.length; i++) {
        const cx = Math.floor(nodes[i].x / CELL_SIZE);
        const cy = Math.floor(nodes[i].y / CELL_SIZE);
        const key = `${cx},${cy}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(i);
      }
      return grid;
    }
    
    function getNeighborCells(cx, cy) {
      const cells = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          cells.push(`${cx + dx},${cy + dy}`);
        }
      }
      return cells;
    }

    const nodes = Array.from({ length: NODE_COUNT }, () => new NeuralNode());
    const shockwave = { x: 0, y: 0, radius: 0, active: false, intensity: 1 };
    
    // Data flow particles along connections
    const DATA_FLOWS = isMobile ? 15 : 30;
    class DataFlow {
      constructor() { this.reset(); }
      reset() {
        this.nodeA = Math.floor(Math.random() * nodes.length);
        this.nodeB = Math.floor(Math.random() * nodes.length);
        this.progress = 0;
        this.speed = Math.random() * 0.02 + 0.008;
        this.active = false;
      }
      update() {
        if (!this.active) {
          // Check if nodes are close enough
          const a = nodes[this.nodeA];
          const b = nodes[this.nodeB];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (dx * dx + dy * dy < CONNECTION_DIST * CONNECTION_DIST) {
            this.active = true;
          } else {
            this.reset();
          }
          return;
        }
        this.progress += this.speed;
        if (this.progress > 1) this.reset();
      }
      draw() {
        if (!this.active) return;
        const a = nodes[this.nodeA];
        const b = nodes[this.nodeB];
        const x = lerp(a.x, b.x, this.progress);
        const y = lerp(a.y, b.y, this.progress);
        
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 4);
        glow.addColorStop(0, `rgba(46, 230, 130, 0.8)`);
        glow.addColorStop(1, `rgba(46, 230, 130, 0)`);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 255, 220, 0.9)`;
        ctx.fill();
      }
    }
    
    const dataFlows = Array.from({ length: DATA_FLOWS }, () => new DataFlow());

    function render() {
      if (!isVisible()) { requestAnimationFrame(render); return; }
      updateMouseVelocity();
      time += 0.016;
      
      if (mouse.clickEvent && mouse.active) {
        shockwave.x = mouse.x;
        shockwave.y = mouse.y;
        shockwave.radius = 0;
        shockwave.intensity = 1;
        shockwave.active = true;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width(), height());
      ctx.globalCompositeOperation = "screen";

      // Shockwave ring
      if (shockwave.active) {
        shockwave.radius += 8;
        shockwave.intensity *= 0.97;
        if (shockwave.intensity < 0.01) shockwave.active = false;
        
        // Double ring effect
        const alpha1 = shockwave.intensity * 0.6;
        const alpha2 = shockwave.intensity * 0.3;
        
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(46, 220, 120, ${alpha1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (shockwave.radius > 15) {
          ctx.beginPath();
          ctx.arc(shockwave.x, shockwave.y, shockwave.radius - 15, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100, 255, 180, ${alpha2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Update all nodes
      nodes.forEach(n => n.update(shockwave));
      
      // Build spatial grid
      const grid = buildGrid(nodes);
      const drawnEdges = new Set();
      
      // Draw connections using spatial hash
      for (let i = 0; i < nodes.length; i++) {
        const cx = Math.floor(nodes[i].x / CELL_SIZE);
        const cy = Math.floor(nodes[i].y / CELL_SIZE);
        const neighborKeys = getNeighborCells(cx, cy);
        
        for (const key of neighborKeys) {
          if (!grid[key]) continue;
          for (const j of grid[key]) {
            if (j <= i) continue;
            const edgeKey = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (drawnEdges.has(edgeKey)) continue;
            
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < CONNECTION_DIST * CONNECTION_DIST) {
              drawnEdges.add(edgeKey);
              const dist = Math.sqrt(distSq);
              const alpha = (1 - dist / CONNECTION_DIST);
              const mixGlow = Math.max(nodes[i].glow, nodes[j].glow);
              
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              
              if (mixGlow > 0.1) {
                const hue = (nodes[i].hue + nodes[j].hue) / 2;
                ctx.strokeStyle = `hsla(${hue}, 80%, 55%, ${alpha * 0.5 + mixGlow * 0.4})`;
                ctx.lineWidth = 0.8 + mixGlow * 1.5;
              } else {
                ctx.strokeStyle = `rgba(138, 176, 151, ${alpha * 0.2})`;
                ctx.lineWidth = 0.6;
              }
              ctx.stroke();
            }
          }
        }
      }
      
      // Data flows
      dataFlows.forEach(df => { df.update(); df.draw(); });

      // Draw nodes on top
      nodes.forEach(n => n.draw());
      
      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 5. LIÊN HỆ - INTERACTIVE LIQUID RADAR (ENHANCED)
  //    Improvements: Smooth ripple with eased decay,
  //    concentric glow rings, distortion field rendered
  //    via displacement, mouse trail ripples, ambient pulse,
  //    connection dots on grid intersections
  // ========================================================
  const lienHeHero = document.querySelector(".lienhe-hero");
  if (lienHeHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    lienHeHero.insertBefore(container, lienHeHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity, isVisible } = setupCanvas(container);
    
    let time = 0;
    const GRID_SPACING = isMobile ? 50 : 38;
    
    class Ripple {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.r = 0;
        this.type = type; // 'sonar', 'mouse', 'click'
        this.maxOpacity = type === 'click' ? 0.8 : type === 'mouse' ? 0.5 : 0.35;
        this.opacity = this.maxOpacity;
        this.speed = type === 'click' ? 5 : type === 'mouse' ? 3.5 : 1.8;
        this.lineWidth = type === 'click' ? 2.5 : type === 'mouse' ? 1.5 : 2;
      }
      update() {
        this.r += this.speed;
        // Eased decay for smoother fade
        const maxR = this.type === 'click' ? 400 : 300;
        this.opacity = this.maxOpacity * easeOutCubic(Math.max(0, 1 - this.r / maxR));
      }
      get dead() { return this.opacity <= 0.005; }
      draw() {
        if (this.dead) return;
        
        // Main ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        
        if (this.type === 'click') {
          // Bright white ring with glow
          ctx.strokeStyle = `rgba(220, 255, 240, ${this.opacity})`;
          ctx.lineWidth = this.lineWidth;
          ctx.stroke();
          // Inner glow ring
          if (this.r > 8) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r - 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(138, 220, 180, ${this.opacity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else if (this.type === 'mouse') {
          ctx.strokeStyle = `rgba(200, 240, 220, ${this.opacity})`;
          ctx.lineWidth = this.lineWidth;
          ctx.stroke();
        } else {
          // Sonar: gradient ring
          ctx.strokeStyle = `rgba(138, 176, 151, ${this.opacity})`;
          ctx.lineWidth = this.lineWidth + this.opacity * 2;
          ctx.stroke();
        }
      }
    }

    // Grid dot class for intersection points
    class GridDot {
      constructor(gx, gy) {
        this.gx = gx; // Grid index
        this.gy = gy;
        this.baseX = gx * GRID_SPACING;
        this.baseY = gy * GRID_SPACING;
        this.x = this.baseX;
        this.y = this.baseY;
        this.displacement = 0;
        this.brightness = 0;
      }
    }
    
    let ripples = [];
    let sonarTimer = 0;
    let mouseTrailTimer = 0;
    let gridDots = [];
    
    function rebuildGrid() {
      gridDots = [];
      const cols = Math.ceil(width() / GRID_SPACING) + 1;
      const rows = Math.ceil(height() / GRID_SPACING) + 1;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          gridDots.push(new GridDot(gx, gy));
        }
      }
    }
    rebuildGrid();
    
    // Rebuild on resize
    const origResize = window.onresize;
    window.addEventListener("resize", () => {
      setTimeout(rebuildGrid, 150);
    });

    function render() {
      if (!isVisible()) { requestAnimationFrame(render); return; }
      updateMouseVelocity();
      time += 0.016;
      
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width(), height());
      ctx.globalCompositeOperation = "screen";

      // Auto sonar pulse from center
      sonarTimer += 0.016;
      if (sonarTimer > 2.5) {
        ripples.push(new Ripple(width() / 2, height() / 2, 'sonar'));
        sonarTimer = 0;
      }

      // Mouse trail ripples (speed-based)
      if (mouse.active && mouse.speed > 3) {
        mouseTrailTimer += 0.016;
        if (mouseTrailTimer > 0.1) {
          ripples.push(new Ripple(mouse.x, mouse.y, 'mouse'));
          mouseTrailTimer = 0;
        }
      }

      // Click ripple
      if (mouse.clickEvent && mouse.active) {
        ripples.push(new Ripple(mouse.x, mouse.y, 'click'));
      }

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.speed;
        // Eased decay
        const maxR = rp.type === 'click' ? 500 : 350;
        rp.opacity = rp.maxOpacity * easeOutCubic(Math.max(0, 1 - rp.r / maxR));
        if (rp.opacity <= 0.005) {
          ripples.splice(i, 1);
        }
      }
      
      // Draw ripple rings
      ripples.forEach(rp => rp.draw());
      
      // --- Grid distortion ---
      const cols = Math.ceil(width() / GRID_SPACING) + 1;
      const rows = Math.ceil(height() / GRID_SPACING) + 1;
      
      // Compute displaced positions for all grid points
      // Using a single pass with all ripples
      for (let idx = 0; idx < gridDots.length; idx++) {
        const dot = gridDots[idx];
        if (!dot) continue;
        let px = dot.baseX;
        let py = dot.baseY;
        let totalForce = 0;
        
        for (let r = 0; r < ripples.length; r++) {
          const rp = ripples[r];
          const dx = px - rp.x;
          const dy = py - rp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ringDist = Math.abs(dist - rp.r);
          
          if (ringDist < 25) {
            const force = (25 - ringDist) / 25 * rp.opacity * 12;
            const angle = Math.atan2(dy, dx);
            px += Math.cos(angle) * force;
            py += Math.sin(angle) * force;
            totalForce += force;
          }
        }
        
        // Mouse proximity glow
        if (mouse.active) {
          const mdx = dot.baseX - mouse.x;
          const mdy = dot.baseY - mouse.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 120) {
            totalForce += (120 - mDist) / 120 * 0.5;
          }
        }
        
        dot.x = px;
        dot.y = py;
        dot.displacement = Math.min(totalForce, 10);
        dot.brightness = Math.min(1, totalForce * 0.15);
      }
      
      // Draw grid lines (vertical)
      ctx.lineWidth = 0.6;
      for (let gx = 0; gx < cols; gx++) {
        ctx.beginPath();
        for (let gy = 0; gy < rows; gy++) {
          const idx = gy * cols + gx;
          if (idx >= gridDots.length) continue;
          const dot = gridDots[idx];
          if (gy === 0) ctx.moveTo(dot.x, dot.y);
          else ctx.lineTo(dot.x, dot.y);
        }
        ctx.strokeStyle = `rgba(138, 176, 151, 0.06)`;
        ctx.stroke();
      }
      
      // Draw grid lines (horizontal)
      for (let gy = 0; gy < rows; gy++) {
        ctx.beginPath();
        for (let gx = 0; gx < cols; gx++) {
          const idx = gy * cols + gx;
          if (idx >= gridDots.length) continue;
          const dot = gridDots[idx];
          if (gx === 0) ctx.moveTo(dot.x, dot.y);
          else ctx.lineTo(dot.x, dot.y);
        }
        ctx.strokeStyle = `rgba(138, 176, 151, 0.06)`;
        ctx.stroke();
      }
      
      // Draw bright intersection dots where distortion is happening
      for (let idx = 0; idx < gridDots.length; idx++) {
        const dot = gridDots[idx];
        if (dot.brightness > 0.05) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 1.5 + dot.brightness * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(138, 220, 180, ${dot.brightness * 0.6})`;
          ctx.fill();
        }
      }

      requestAnimationFrame(render);
    }
    render();
  }
});
