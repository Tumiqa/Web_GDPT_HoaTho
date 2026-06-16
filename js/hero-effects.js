document.addEventListener("DOMContentLoaded", () => {
  // ========================================================
  // UTILITY: CANVAS SETUP & GLOBAL PHYSICS
  // ========================================================
  function setupCanvas(container) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("hero-effect-canvas");
    container.appendChild(canvas);
    
    const ctx = canvas.getContext("2d", { alpha: true });
    
    let w, h;
    function resize() {
      w = container.offsetWidth;
      h = container.offsetHeight;
      // Handle high DPI displays for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }
    window.addEventListener("resize", resize);
    resize();
    
    // Mouse/Touch tracking with Velocity
    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, isDown: false, clickEvent: false };
    let lastMouse = { x: -1000, y: -1000 };

    function updateMouseVelocity() {
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      // Reset click event automatically after 1 frame
      if(mouse.clickEvent) mouse.clickEvent = false;
    }

    function setMousePos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
    }

    container.addEventListener("mousemove", setMousePos);
    container.addEventListener("touchmove", setMousePos, {passive: true});

    container.addEventListener("mouseleave", () => { mouse.x = -1000; mouse.y = -1000; });
    container.addEventListener("touchend", () => { mouse.x = -1000; mouse.y = -1000; mouse.isDown = false; });
    
    container.addEventListener("mousedown", (e) => { mouse.isDown = true; mouse.clickEvent = true; setMousePos(e); });
    container.addEventListener("touchstart", (e) => { mouse.isDown = true; mouse.clickEvent = true; setMousePos(e); }, {passive: true});
    window.addEventListener("mouseup", () => { mouse.isDown = false; });
    
    return { canvas, ctx, width: () => w, height: () => h, mouse, updateMouseVelocity };
  }

  // ========================================================
  // 1. SINH HOẠT - CAMPFIRE EMBERS (WIND PHYSICS)
  // ========================================================
  const shHero = document.querySelector(".sh-hero");
  if (shHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    container.style.pointerEvents = "auto";
    shHero.insertBefore(container, shHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity } = setupCanvas(container);
    
    class Ember {
      constructor() {
        this.reset(true);
      }
      reset(randomY = false) {
        this.x = Math.random() * width();
        this.y = randomY ? Math.random() * height() : height() + 20;
        this.size = Math.random() * 2.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -Math.random() * 2 - 1;
        this.life = Math.random() * 0.8 + 0.2; // 1 is new, 0 is ash
        this.decay = Math.random() * 0.005 + 0.002;
        this.history = [];
      }
      update() {
        // Friction and wind
        this.vx *= 0.98; 
        this.vy -= 0.02; // Upward thermal drift
        
        // Mouse interaction (wind blast)
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          this.vx += mouse.vx * force * 0.05;
          this.vy += mouse.vy * force * 0.05;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.x += Math.sin(this.y * 0.05) * 0.5; // Natural swirl
        this.life -= this.decay;

        this.history.push({x: this.x, y: this.y});
        if(this.history.length > 5) this.history.shift();

        if (this.life <= 0 || this.y < -50 || this.x < -50 || this.x > width() + 50) {
          this.reset();
        }
      }
      draw() {
        if(this.history.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(this.history[0].x, this.history[0].y);
        for(let i=1; i<this.history.length; i++) {
          ctx.lineTo(this.history[i].x, this.history[i].y);
        }
        
        // Color transition: White -> Yellow -> Orange -> Red -> Black (ash)
        let r=255, g=255, b=255;
        if(this.life < 0.8) { g=200; b=50; }
        if(this.life < 0.5) { g=100; b=0; }
        if(this.life < 0.2) { r=100; g=20; b=0; } // Dying ember
        
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.life})`;
        ctx.lineWidth = this.size;
        ctx.lineCap = "round";
        ctx.stroke();

        if (this.life > 0.4) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(255, 100, 0, ${this.life})`;
        } else {
          ctx.shadowBlur = 0;
        }
      }
    }

    const embers = Array.from({length: 120}, () => new Ember());

    function render() {
      updateMouseVelocity();
      
      ctx.clearRect(0, 0, width(), height());
      
      ctx.globalCompositeOperation = "screen";
      embers.forEach(e => { e.update(); e.draw(); });
      
      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 2. NHẠC GĐPT - FLUID AUDIO RIBBONS
  // ========================================================
  const musicHero = document.querySelector(".music-hero");
  if (musicHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    container.style.pointerEvents = "auto";
    musicHero.insertBefore(container, musicHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity } = setupCanvas(container);
    
    let time = 0;
    class Ribbon {
      constructor(yOffset, color, speed, amp, phase) {
        this.yOffset = yOffset;
        this.color = color;
        this.speed = speed;
        this.amp = amp;
        this.phase = phase;
      }
      draw() {
        ctx.beginPath();
        let first = true;
        for (let x = 0; x <= width(); x += 10) {
          const nx = x / width();
          const dx = x - mouse.x;
          const dy = (height() / 2 + this.yOffset) - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          let interaction = 0;
          if (dist < 300) {
            interaction = Math.sin((300 - dist) / 300 * Math.PI) * 40 * (mouse.y < height()/2 ? 1 : -1);
          }
          
          const y = height() / 2 + this.yOffset + 
                    Math.sin(nx * Math.PI * 2 + time * this.speed + this.phase) * this.amp +
                    Math.cos(nx * Math.PI * 4 - time * this.speed * 1.5) * (this.amp * 0.5) +
                    interaction;
                    
          if (first) { ctx.moveTo(x, y); first = false; }
          else { ctx.lineTo(x, y); }
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    const ribbons = [
      new Ribbon(-20, "rgba(46, 204, 113, 0.6)", 1.2, 40, 0),
      new Ribbon(0, "rgba(52, 152, 219, 0.4)", 0.8, 60, Math.PI),
      new Ribbon(20, "rgba(155, 89, 182, 0.5)", 1.5, 30, Math.PI/2)
    ];

    const notes = ["🎵", "🎶", "🎼", "♪"];
    const floatingNotes = Array.from({length: 15}, () => ({
      char: notes[Math.floor(Math.random() * notes.length)],
      x: Math.random() * width(),
      y: Math.random() * height(),
      size: Math.random() * 15 + 10,
      dy: -Math.random() * 1.5 - 0.5,
      angle: Math.random() * Math.PI * 2,
      dAngle: (Math.random() - 0.5) * 0.05,
      opacity: Math.random() * 0.5 + 0.1
    }));

    function render() {
      updateMouseVelocity();
      time += 0.02;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width(), height());

      ctx.globalCompositeOperation = "screen";
      ribbons.forEach(r => r.draw());

      ctx.globalCompositeOperation = "source-over";
      floatingNotes.forEach(n => {
        n.y += n.dy;
        n.x += Math.sin(n.y * 0.02) * 1;
        n.angle += n.dAngle;
        
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        if(dx*dx + dy*dy < 10000) {
          n.x += dx * 0.02;
          n.y += dy * 0.02;
        }

        if (n.y < -30 || n.x < -30 || n.x > width()+30) {
          n.y = height() + 30;
          n.x = Math.random() * width();
        }

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.angle);
        ctx.font = `${n.size}px Arial`;
        ctx.fillStyle = `rgba(138, 176, 151, ${n.opacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.char, 0, 0);
        ctx.restore();
      });

      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 3. TÀI LIỆU - 3D LEAVES & MAGIC DUST
  // ========================================================
  const taiLieuHero = document.querySelector(".tailieu-hero");
  if (taiLieuHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    container.style.pointerEvents = "auto";
    taiLieuHero.insertBefore(container, taiLieuHero.firstChild);

    const rays = document.createElement("div");
    rays.classList.add("tailieu-rays");
    container.appendChild(rays);
    
    const { ctx, width, height, mouse, updateMouseVelocity } = setupCanvas(container);
    
    class Leaf {
      constructor() { this.reset(true); }
      reset(randomY=false) {
        this.x = Math.random() * width();
        this.y = randomY ? Math.random() * height() : -50;
        this.z = Math.random() * 100 + 50; 
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = Math.random() * 1.5 + 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.05;
        this.flapPhase = Math.random() * Math.PI * 2;
        this.flapSpeed = Math.random() * 0.05 + 0.02;
      }
      update() {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          this.vx += mouse.vx * force * 0.02;
          this.vy += mouse.vy * force * 0.02;
        }

        this.vx *= 0.95;
        this.vy = this.vy * 0.95 + 0.05; 
        
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.5; 
        this.y += this.vy;
        this.rotation += this.spinSpeed;
        this.flapPhase += this.flapSpeed;

        if (this.y > height() + 50) this.reset();
      }
      draw() {
        const scale = this.z / 100;
        const flap = Math.abs(Math.sin(this.flapPhase)); 

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(scale, scale * flap); 

        const lSize = 12;
        ctx.beginPath();
        ctx.moveTo(0, -lSize);
        ctx.bezierCurveTo(lSize, -lSize/2, lSize, lSize/2, 0, lSize);
        ctx.bezierCurveTo(-lSize, lSize/2, -lSize, -lSize/2, 0, -lSize);
        
        const grad = ctx.createLinearGradient(0, -lSize, 0, lSize);
        grad.addColorStop(0, "rgba(255, 215, 0, 0.8)");
        grad.addColorStop(1, "rgba(218, 165, 32, 0.4)");
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    class Dust {
      constructor() {
        this.x = Math.random() * width();
        this.y = Math.random() * height();
        this.size = Math.random() * 2;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.phase = Math.random() * Math.PI * 2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.05;
        if(this.x < 0 || this.x > width()) this.vx *= -1;
        if(this.y < 0 || this.y > height()) this.vy *= -1;
      }
      draw() {
        const alpha = (Math.sin(this.phase) + 1) / 2 * 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255, 240, 150, ${alpha})`;
        ctx.fill();
      }
    }

    const leaves = Array.from({length: 30}, () => new Leaf());
    const dusts = Array.from({length: 60}, () => new Dust());

    function render() {
      updateMouseVelocity();
      ctx.clearRect(0, 0, width(), height());
      
      ctx.globalCompositeOperation = "lighter";
      dusts.forEach(d => { d.update(); d.draw(); });
      
      ctx.globalCompositeOperation = "source-over";
      leaves.forEach(l => { l.update(); l.draw(); });

      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 4. KỸ NĂNG - NEURAL NETWORK NEXUS
  // ========================================================
  const kyNangHero = document.querySelector(".kynang-hero");
  if (kyNangHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    container.style.pointerEvents = "auto";
    kyNangHero.insertBefore(container, kyNangHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity } = setupCanvas(container);
    
    class Node {
      constructor() {
        this.x = Math.random() * width();
        this.y = Math.random() * height();
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.r = Math.random() * 2 + 1.5;
        this.glow = 0;
      }
      update(shockwave) {
        this.x += this.vx;
        this.y += this.vy;
        
        if(this.x < 0 || this.x > width()) this.vx *= -1;
        if(this.y < 0 || this.y > height()) this.vy *= -1;

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (shockwave.active) {
          const sDist = Math.sqrt(Math.pow(this.x - shockwave.x, 2) + Math.pow(this.y - shockwave.y, 2));
          if (Math.abs(sDist - shockwave.radius) < 30) {
            const angle = Math.atan2(this.y - shockwave.y, this.x - shockwave.x);
            this.x += Math.cos(angle) * 5;
            this.y += Math.sin(angle) * 5;
            this.glow = 1;
          }
        } else if (dist < 150) {
          this.x -= dx * 0.01;
          this.y -= dy * 0.01;
          this.glow = (150 - dist) / 150;
        } else {
          this.glow *= 0.9; 
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        const r = 46, g = 204, b = 113; 
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + this.glow*0.5})`;
        ctx.fill();
        
        if (this.glow > 0.1) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${this.glow})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    const nodes = Array.from({length: 100}, () => new Node());
    const shockwave = { x: 0, y: 0, radius: 0, active: false };

    function render() {
      updateMouseVelocity();
      
      if (mouse.clickEvent) {
        shockwave.x = mouse.x;
        shockwave.y = mouse.y;
        shockwave.radius = 0;
        shockwave.active = true;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width(), height());
      
      ctx.globalCompositeOperation = "screen";

      if (shockwave.active) {
        shockwave.radius += 15;
        if (shockwave.radius > Math.max(width(), height()) * 1.5) shockwave.active = false;
        
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(46, 204, 113, ${Math.max(0, 1 - shockwave.radius/500)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      nodes.forEach(n => { n.update(shockwave); });
      
      for(let i=0; i<nodes.length; i++) {
        for(let j=i+1; j<nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx*dx + dy*dy;
          
          if(distSq < 15000) { 
            const alpha = 1 - Math.sqrt(distSq)/122;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            
            const mixGlow = Math.max(nodes[i].glow, nodes[j].glow);
            if (mixGlow > 0.1) {
              ctx.strokeStyle = `rgba(46, 204, 113, ${alpha + mixGlow*0.5})`;
              ctx.lineWidth = 1 + mixGlow * 1.5;
            } else {
              ctx.strokeStyle = `rgba(138, 176, 151, ${alpha * 0.4})`;
              ctx.lineWidth = 1;
            }
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => n.draw());
      requestAnimationFrame(render);
    }
    render();
  }

  // ========================================================
  // 5. LIÊN HỆ - INTERACTIVE LIQUID RADAR
  // ========================================================
  const lienHeHero = document.querySelector(".lienhe-hero");
  if (lienHeHero) {
    const container = document.createElement("div");
    container.classList.add("hero-effect-container");
    container.style.pointerEvents = "auto";
    lienHeHero.insertBefore(container, lienHeHero.firstChild);
    
    const { ctx, width, height, mouse, updateMouseVelocity } = setupCanvas(container);
    
    class Ripple {
      constructor(x, y, isMouse = false) {
        this.x = x;
        this.y = y;
        this.r = 0;
        this.opacity = isMouse ? 0.6 : 0.4;
        this.speed = isMouse ? 3 : 1.5;
        this.isMouse = isMouse;
      }
      update() {
        this.r += this.speed;
        this.opacity -= this.isMouse ? 0.015 : 0.003;
      }
      draw() {
        if(this.opacity <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        
        if (this.isMouse) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = `rgba(138, 176, 151, ${this.opacity})`;
          ctx.lineWidth = 2 + this.opacity * 2;
        }
        ctx.stroke();
      }
    }

    let ripples = [];
    let sonarTimer = 0;
    const gridSpacing = 40;
    
    function render() {
      updateMouseVelocity();
      
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width(), height());
      
      ctx.globalCompositeOperation = "screen";

      sonarTimer++;
      if (sonarTimer > 120) {
        ripples.push(new Ripple(width()/2, height()/2, false));
        sonarTimer = 0;
      }

      if (mouse.x > 0 && Math.abs(mouse.vx) + Math.abs(mouse.vy) > 5) {
        if (Math.random() > 0.7) { 
          ripples.push(new Ripple(mouse.x, mouse.y, true));
        }
      }

      if (mouse.clickEvent) {
        ripples.push(new Ripple(mouse.x, mouse.y, true));
        ripples[ripples.length-1].speed = 5;
        ripples[ripples.length-1].opacity = 1;
      }

      for(let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw();
        if (ripples[i].opacity <= 0) {
          ripples.splice(i, 1);
        }
      }

      ctx.strokeStyle = "rgba(138, 176, 151, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x = 0; x < width(); x += gridSpacing) {
        for(let y = 0; y < height(); y += gridSpacing) {
          let px = x, py = y;
          ripples.forEach(r => {
            const dx = px - r.x;
            const dy = py - r.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (Math.abs(dist - r.r) < 20) {
              const force = (20 - Math.abs(dist - r.r)) / 20 * r.opacity * 10;
              const angle = Math.atan2(dy, dx);
              px += Math.cos(angle) * force;
              py += Math.sin(angle) * force;
            }
          });
          
          if (y === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      for(let y = 0; y < height(); y += gridSpacing) {
        for(let x = 0; x < width(); x += gridSpacing) {
          let px = x, py = y;
          ripples.forEach(r => {
            const dx = px - r.x;
            const dy = py - r.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (Math.abs(dist - r.r) < 20) {
              const force = (20 - Math.abs(dist - r.r)) / 20 * r.opacity * 10;
              const angle = Math.atan2(dy, dx);
              px += Math.cos(angle) * force;
              py += Math.sin(angle) * force;
            }
          });
          
          if (x === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      requestAnimationFrame(render);
    }
    render();
  }
});
