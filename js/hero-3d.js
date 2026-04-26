(function () {
  var canvas = document.getElementById('hero-3d');
  if (!canvas || typeof THREE === 'undefined') return;
  var hero = canvas.parentElement;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
  var root = new THREE.Group();
  scene.add(root);

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  var accent, muted, t = 0, mx = 0, my = 0, active = true, rafId = null;

  function lm(col, op) {
    return new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op });
  }
  function pm(op) { return lm(accent, op); }
  function sm(op) { return lm(muted,  op); }

  function push2(arr, a, b) {
    arr.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
  function addLines(positions, mat) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    root.add(new THREE.LineSegments(geo, mat));
  }

  function rebuild() {
    while (root.children.length) {
      var c = root.children[0]; c.geometry.dispose(); c.material.dispose(); root.remove(c);
    }
    var dk = isDark();
    // Palette: steel blue frame / warm amber glass / terracotta balconies / sky-blue canopy / gold glazing
    var cFrame  = dk ? 0x6688ee : 0x1a3fcc;  // structural frame
    var cFloor  = dk ? 0x4466cc : 0x1133aa;  // floor plate spans
    var cGlass  = dk ? 0xffb347 : 0xd47820;  // upper windows — amber
    var cGlaz   = dk ? 0xffd060 : 0xffaa00;  // ground-floor storefront — gold
    var cBal    = dk ? 0xff8866 : 0xcc5533;  // balconies + railings — terracotta
    var cCanopy = dk ? 0x99ccff : 0x3366cc;  // roof canopy slab — sky blue
    var cCol    = dk ? 0xddeeff : 0x5577cc;  // colonnade columns — pale blue
    var cGround = dk ? 0x334466 : 0x8899bb;  // ground — slate

    // geometry arrays
    var S=[], FL=[], W=[], GW=[], B=[], CN=[], CC=[], G=[];

    function pushBox(arr,x0,y0,z0,x1,y1,z1) {
      push2(arr,[x0,y0,z0],[x1,y0,z0]); push2(arr,[x1,y0,z0],[x1,y0,z1]);
      push2(arr,[x1,y0,z1],[x0,y0,z1]); push2(arr,[x0,y0,z1],[x0,y0,z0]);
      push2(arr,[x0,y1,z0],[x1,y1,z0]); push2(arr,[x1,y1,z0],[x1,y1,z1]);
      push2(arr,[x1,y1,z1],[x0,y1,z1]); push2(arr,[x0,y1,z1],[x0,y1,z0]);
      push2(arr,[x0,y0,z0],[x0,y1,z0]); push2(arr,[x1,y0,z0],[x1,y1,z0]);
      push2(arr,[x1,y0,z1],[x1,y1,z1]); push2(arr,[x0,y0,z1],[x0,y1,z1]);
    }

    var FH = 0.88;   // floor height
    var NF = 5;      // floors
    var TH = NF*FH;  // total building height = 4.4

    // Main building body
    var BX0=-4.5, BX1=4.5, FZ=-0.9, BZ=0.9;
    // Structural bay columns on facade (6 bays → 7 lines)
    var VCOLS = [BX0, -2.7, -0.9, 0.9, 2.7, BX1];

    // Colonnade: 4 tall square columns projecting forward of facade
    var CL_XS = [-3.3, -1.1, 1.1, 3.3];
    var CLZ   = -1.65;  // column Z position (forward of FZ)
    var CLW   = 0.13;   // column half-width

    // Canopy slab (overhangs beyond colonnade)
    var CANY = TH+0.16, CANT = TH+0.35;
    var CAX0 =-5.0, CAX1=5.0, CAZ0=-2.4, CAZ1=BZ;

    // Side wing (L-shape extending back-right)
    var WX0=2.5, WX1=4.5, WZ0=BZ, WZ1=2.9, WH=3*FH;

    // Balcony projection
    var BALZ = FZ-0.52;

    // ── MAIN BLOCK FRAME ──
    // Front face outline
    push2(S,[BX0,0,FZ],[BX1,0,FZ]); push2(S,[BX1,0,FZ],[BX1,TH,FZ]);
    push2(S,[BX1,TH,FZ],[BX0,TH,FZ]); push2(S,[BX0,TH,FZ],[BX0,0,FZ]);
    // Back face outline
    push2(S,[BX0,0,BZ],[BX1,0,BZ]); push2(S,[BX1,0,BZ],[BX1,TH,BZ]);
    push2(S,[BX1,TH,BZ],[BX0,TH,BZ]); push2(S,[BX0,TH,BZ],[BX0,0,BZ]);
    // Corner depth spans
    push2(S,[BX0,0,FZ],[BX0,0,BZ]); push2(S,[BX1,0,FZ],[BX1,0,BZ]);
    push2(S,[BX0,TH,FZ],[BX0,TH,BZ]); push2(S,[BX1,TH,FZ],[BX1,TH,BZ]);
    // Vertical bay columns (front + back)
    for (var ci=0; ci<VCOLS.length; ci++) {
      push2(S,[VCOLS[ci],0,FZ],[VCOLS[ci],TH,FZ]);
      push2(S,[VCOLS[ci],0,BZ],[VCOLS[ci],TH,BZ]);
    }
    // Floor slabs (front + back edges)
    for (var fi=1; fi<NF; fi++) {
      push2(FL,[BX0,fi*FH,FZ],[BX1,fi*FH,FZ]);
      push2(FL,[BX0,fi*FH,BZ],[BX1,fi*FH,BZ]);
    }
    push2(FL,[BX0,TH,FZ],[BX1,TH,FZ]); push2(FL,[BX0,TH,BZ],[BX1,TH,BZ]);
    // Depth spans at each bay column
    for (var ci=0; ci<VCOLS.length; ci++) {
      for (var fi=0; fi<=NF; fi++) push2(FL,[VCOLS[ci],fi*FH,FZ],[VCOLS[ci],fi*FH,BZ]);
    }

    // ── SIDE WING ──
    push2(S,[WX0,0,WZ0],[WX0,WH,WZ0]); push2(S,[WX1,0,WZ0],[WX1,WH,WZ0]);
    push2(S,[WX0,0,WZ1],[WX0,WH,WZ1]); push2(S,[WX1,0,WZ1],[WX1,WH,WZ1]);
    push2(S,[WX0,0,WZ0],[WX1,0,WZ0]); push2(S,[WX0,WH,WZ0],[WX1,WH,WZ0]);
    push2(S,[WX0,0,WZ1],[WX1,0,WZ1]); push2(S,[WX0,WH,WZ1],[WX1,WH,WZ1]);
    push2(S,[WX0,0,WZ0],[WX0,0,WZ1]); push2(S,[WX1,0,WZ0],[WX1,0,WZ1]);
    push2(S,[WX0,WH,WZ0],[WX0,WH,WZ1]); push2(S,[WX1,WH,WZ0],[WX1,WH,WZ1]);
    for (var fi=1; fi<=3; fi++) {
      push2(FL,[WX0,fi*FH,WZ0],[WX1,fi*FH,WZ0]); push2(FL,[WX0,fi*FH,WZ1],[WX1,fi*FH,WZ1]);
      push2(FL,[WX0,fi*FH,WZ0],[WX0,fi*FH,WZ1]); push2(FL,[WX1,fi*FH,WZ0],[WX1,fi*FH,WZ1]);
    }
    // Wing windows (back face)
    var wStep=(WX1-WX0)/2;
    for (var fi=0; fi<3; fi++) {
      for (var wi=0; wi<2; wi++) {
        var wwx0=WX0+wi*wStep+0.12, wwx1=WX0+(wi+1)*wStep-0.12;
        var wwy0=fi*FH+0.18, wwy1=(fi+1)*FH-0.18;
        push2(W,[wwx0,wwy0,WZ1],[wwx1,wwy0,WZ1]); push2(W,[wwx1,wwy0,WZ1],[wwx1,wwy1,WZ1]);
        push2(W,[wwx1,wwy1,WZ1],[wwx0,wwy1,WZ1]); push2(W,[wwx0,wwy1,WZ1],[wwx0,wwy0,WZ1]);
      }
    }

    // ── GROUND-FLOOR STOREFRONT GLAZING (large gold panels) ──
    for (var ci=0; ci<VCOLS.length-1; ci++) {
      var gx0=VCOLS[ci]+0.06, gx1=VCOLS[ci+1]-0.06;
      var nP=3, pw=(gx1-gx0)/nP;
      for (var pi=0; pi<nP; pi++) {
        var px0=gx0+pi*pw+0.025, px1=gx0+(pi+1)*pw-0.025;
        push2(GW,[px0,0.06,FZ],[px1,0.06,FZ]); push2(GW,[px1,0.06,FZ],[px1,FH-0.10,FZ]);
        push2(GW,[px1,FH-0.10,FZ],[px0,FH-0.10,FZ]); push2(GW,[px0,FH-0.10,FZ],[px0,0.06,FZ]);
        // center mullion
        var pmid=(px0+px1)*0.5;
        push2(GW,[pmid,0.06,FZ],[pmid,FH-0.10,FZ]);
      }
    }

    // ── UPPER WINDOWS (floors 1–4, two per bay) ──
    for (var fi=1; fi<NF; fi++) {
      for (var ci=0; ci<VCOLS.length-1; ci++) {
        var bx0=VCOLS[ci]+0.12, bx1=VCOLS[ci+1]-0.12, bm=(bx0+bx1)*0.5;
        var wy0=fi*FH+0.18, wy1=(fi+1)*FH-0.18;
        push2(W,[bx0,wy0,FZ],[bm-0.05,wy0,FZ]); push2(W,[bm-0.05,wy0,FZ],[bm-0.05,wy1,FZ]);
        push2(W,[bm-0.05,wy1,FZ],[bx0,wy1,FZ]); push2(W,[bx0,wy1,FZ],[bx0,wy0,FZ]);
        push2(W,[bm+0.05,wy0,FZ],[bx1,wy0,FZ]); push2(W,[bx1,wy0,FZ],[bx1,wy1,FZ]);
        push2(W,[bx1,wy1,FZ],[bm+0.05,wy1,FZ]); push2(W,[bm+0.05,wy1,FZ],[bm+0.05,wy0,FZ]);
      }
    }

    // ── BALCONIES with railings (floors 1–4) ──
    for (var fi=1; fi<=4; fi++) {
      var by=fi*FH;
      push2(B,[BX0,by,BALZ],[BX1,by,BALZ]);
      push2(B,[BX0,by,FZ],[BX0,by,BALZ]); push2(B,[BX1,by,FZ],[BX1,by,BALZ]);
      var ry=by+0.34;
      push2(B,[BX0+0.1,ry,BALZ],[BX1-0.1,ry,BALZ]);
      var nPosts=Math.round((BX1-BX0)/0.85);
      for (var pi=1; pi<nPosts; pi++) {
        var px=BX0+pi*(BX1-BX0)/nPosts;
        push2(B,[px,by,BALZ],[px,ry,BALZ]);
      }
    }

    // ── COLONNADE COLUMNS (ground → canopy top) ──
    for (var ci=0; ci<CL_XS.length; ci++) {
      var cx=CL_XS[ci];
      pushBox(CC, cx-CLW, 0, CLZ-CLW, cx+CLW, CANT, CLZ+CLW);
    }
    // Connecting ties at each floor level
    for (var fi=1; fi<=NF; fi++) {
      push2(CC,[CL_XS[0],fi*FH,CLZ],[CL_XS[CL_XS.length-1],fi*FH,CLZ]);
    }

    // ── CANOPY SLAB ──
    // Bottom plate
    push2(CN,[CAX0,CANY,CAZ0],[CAX1,CANY,CAZ0]); push2(CN,[CAX1,CANY,CAZ0],[CAX1,CANY,CAZ1]);
    push2(CN,[CAX1,CANY,CAZ1],[CAX0,CANY,CAZ1]); push2(CN,[CAX0,CANY,CAZ1],[CAX0,CANY,CAZ0]);
    // Top plate
    push2(CN,[CAX0,CANT,CAZ0],[CAX1,CANT,CAZ0]); push2(CN,[CAX1,CANT,CAZ0],[CAX1,CANT,CAZ1]);
    push2(CN,[CAX1,CANT,CAZ1],[CAX0,CANT,CAZ1]); push2(CN,[CAX0,CANT,CAZ1],[CAX0,CANT,CAZ0]);
    // Vertical edges
    push2(CN,[CAX0,CANY,CAZ0],[CAX0,CANT,CAZ0]); push2(CN,[CAX1,CANY,CAZ0],[CAX1,CANT,CAZ0]);
    push2(CN,[CAX0,CANY,CAZ1],[CAX0,CANT,CAZ1]); push2(CN,[CAX1,CANY,CAZ1],[CAX1,CANT,CAZ1]);
    // Structural ribs underneath canopy (aligned with colonnade columns)
    for (var ci=0; ci<CL_XS.length; ci++) {
      push2(CN,[CL_XS[ci],CANY,CAZ0],[CL_XS[ci],CANY,CAZ1]);
    }
    // Transverse canopy ribs
    for (var ri=1; ri<5; ri++) {
      var rz=CAZ0+ri*(CAZ1-CAZ0)/5;
      push2(CN,[CAX0,CANY,rz],[CAX1,CANY,rz]);
    }

    // ── GROUND PLANE ──
    push2(G,[-5.8,0,-3.2],[5.8,0,-3.2]); push2(G,[-5.8,0,3.8],[5.8,0,3.8]);
    push2(G,[-5.8,0,-3.2],[-5.8,0,3.8]); push2(G,[5.8,0,-3.2],[5.8,0,3.8]);
    push2(G,[-5.8,0,-3.2],[5.8,0,3.8]); push2(G,[5.8,0,-3.2],[-5.8,0,3.8]);

    addLines(S,  lm(cFrame,  0.90));
    addLines(FL, lm(cFloor,  0.42));
    addLines(GW, lm(cGlaz,   0.92));
    addLines(W,  lm(cGlass,  0.80));
    addLines(B,  lm(cBal,    0.75));
    addLines(CN, lm(cCanopy, 0.88));
    addLines(CC, lm(cCol,    0.88));
    addLines(G,  lm(cGround, 0.22));
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('mousemove', function (e) {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });
  var ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  var io = new IntersectionObserver(function (es) {
    active = es[0].isIntersecting;
    if (active && !rafId) tick();
  }, { threshold: 0 });
  io.observe(hero);

  function tick() {
    if (!active) { rafId = null; return; }
    rafId = requestAnimationFrame(tick);
    t += 0.005;
    var heroH = hero.offsetHeight || window.innerHeight;
    var sp = Math.min(scrollY / heroH, 1);
    root.rotation.y = t * 0.09 + sp * 0.36;
    root.position.y = -1.2 + Math.sin(t * 0.28) * 0.04;
    camera.position.x = 2.5 + mx * 1.4;
    camera.position.y = 2.6 - sp * 0.7 - my * 0.4;
    camera.position.z = 11.5 - sp * 0.6;
    camera.lookAt(0, 1.8 + sp * 0.5, 0);
    renderer.render(scene, camera);
  }

  var prevTheme = isDark();
  setInterval(function () {
    var d = isDark();
    if (d !== prevTheme) { prevTheme = d; rebuild(); }
  }, 500);

  rebuild();
  tick();
})();