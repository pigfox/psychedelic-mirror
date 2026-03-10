(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d", { alpha: true });

  const offscreen = document.createElement("canvas");
  const off = offscreen.getContext("2d", { alpha: true });

  const maskImg = new Image();
  maskImg.decoding = "async"
  let maskReady = false;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let blobs = [];

  const colors = [
    [255, 70, 120],
    [70, 170, 255],
    [255, 210, 70],
    [110, 255, 170],
    [190, 120, 255]
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    offscreen.width = Math.round(w * dpr);
    offscreen.height = Math.round(h * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    off.setTransform(dpr, 0, 0, dpr, 0, 0);

    seed();
  }

  function seed() {
    blobs = [];
    for (let i = 0; i < 28; i += 1) {
      const c = colors[i % colors.length];
      blobs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        r: 16 + Math.random() * 30,
        color: c,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawBackground(t) {
    const g = off.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(10,14,30,1)");
    g.addColorStop(0.55, "rgba(16,8,35,1)");
    g.addColorStop(1, "rgba(2,2,6,1)");
    off.fillStyle = g;
    off.fillRect(0, 0, w, h);

    const x = w * 0.5 + Math.sin(t * 0.0011) * w * 0.18;
    const y = h * 0.48 + Math.cos(t * 0.0008) * h * 0.15;
    const rg = off.createRadialGradient(x, y, 0, x, y, Math.min(w, h) * 0.42);
    rg.addColorStop(0, "rgba(255,255,255,0.18)");
    rg.addColorStop(0.45, "rgba(120,120,255,0.10)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    off.fillStyle = rg;
    off.fillRect(0, 0, w, h);
  }

  function drawBlobs(t) {
    off.globalCompositeOperation = "screen";

    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;

      const rr = b.r * (0.85 + 0.25 * Math.sin(t * 0.003 + b.phase));

      const grad = off.createRadialGradient(b.x, b.y, 0, b.x, b.y, rr);
      grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.95)`);
      grad.addColorStop(0.35, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.45)`);
      grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
      off.fillStyle = grad;
      off.beginPath();
      off.arc(b.x, b.y, rr, 0, Math.PI * 2);
      off.fill();
    }

    off.globalCompositeOperation = "source-over";
  }

  function drawLines() {
    for (let i = 0; i < blobs.length; i += 1) {
      for (let j = i + 1; j < blobs.length; j += 1) {
        const a = blobs[i];
        const b = blobs[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          off.strokeStyle = `rgba(255,255,255,${(1 - dist / 100) * 0.18})`;
          off.lineWidth = 1;
          off.beginPath();
          off.moveTo(a.x, a.y);
          off.lineTo(b.x, b.y);
          off.stroke();
        }
      }
    }
  }

  function compositeMask() {
    if (!maskReady) return;
    off.globalCompositeOperation = "destination-in";
    off.drawImage(maskImg, 0, 0, w, h);
    off.globalCompositeOperation = "source-over";
  }

  function tick(ts) {
    off.clearRect(0, 0, w, h);
    drawBackground(ts);
    drawBlobs(ts);
    drawLines();
    compositeMask();

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(offscreen, 0, 0, w, h);

    requestAnimationFrame(tick);
  }

  maskImg.onload = function () {
    maskReady = true;
  };

  maskImg.src = "mask.webp";
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(tick);
})();
