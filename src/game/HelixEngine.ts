import * as THREE from 'three';

export interface GameState {
  score: number;
  level: number;
  onWin: () => void;
  onLoss: () => void;
  onScoreUpdate: (points: number) => void;
}

export class HelixEngine {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  public ball: THREE.Mesh | null = null;
  private tower: THREE.Group | null = null;
  private state: GameState;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  private ballVelocity = 0;
  private jumpForce = 0.26;
  private gravity = -0.012;
  private isRotating = false;
  private previousMouseX = 0;

  public autoRotate = true;
  public isPaused = true;
  private lastHitPlatform: any = null;
  private container: HTMLDivElement;
  private animationId: number | null = null;
  private clock = new THREE.Clock();

  constructor(container: HTMLDivElement, state: GameState) {
    this.container = container;
    this.state = state;
    this.init();
  }

  private init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);

    // Stars Background
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 })));

    // CAMERA - Moved back for better view
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 15, 35); // Moved back from 20 to 35

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);

    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 10, 7);
    this.scene.add(sun);

    // Ball - Moved closer to column
    this.ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.5, roughness: 0.2, transparent: true })
    );
    this.ball.position.set(0, 8.5, 3.2); // Moved from 5.5 to 3.2
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    // Central Column
    const column = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 800, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    this.tower.add(column);

    this.setupLevel(this.state.level);
    this.setupInputs();

    if (this.camera && this.ball) {
        this.camera.lookAt(0, this.ball.position.y, 0);
    }

    this.animate();
  }

  public setPaused(val: boolean) {
    this.isPaused = val;
    if (!val) {
        this.autoRotate = false;
        this.ballVelocity = -0.1;
    }
  }

  public setupLevel(level: number) {
    if (!this.tower || !this.ball) return;
    this.state.level = level;

    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower?.remove(c));

    const color = [0xbc13fe, 0xff007f, 0x0077ff, 0x00ffcc][level % 4];
    for (let i = 0; i < 20; i++) {
        this.createPlatform(5 - (i * 7), color, i === 19, i === 0);
    }
    this.ball.position.y = 8.5;
    this.ballVelocity = 0;
  }

  private createPlatform(y: number, color: number, isWin: boolean, isFirst: boolean) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    const segments = 12;
    const gapStart = Math.floor(Math.random() * segments);

    let radialSegments = 32;
    if (this.state.level >= 15) radialSegments = 4;
    else if (this.state.level >= 10) radialSegments = 6;
    else if (this.state.level >= 5) radialSegments = 8;
    else if (this.state.level >= 3) radialSegments = 12;

    for (let i = 0; i < segments; i++) {
      if (!isWin && (i === gapStart || i === (gapStart + 1) % segments)) continue;

      const isHazard = !isWin && !isFirst && Math.random() > 0.94;
      const arc = (1 / segments) * Math.PI * 2;

      // Radius reduced from 6 to 5 for better fit
      const geo = new THREE.CylinderGeometry(5, 5, 0.6, radialSegments, 1, false, (i / segments) * Math.PI * 2, arc);
      const mat = new THREE.MeshStandardMaterial({
          color: isWin ? 0xffaa00 : (isHazard ? 0xff0000 : color),
          flatShading: true
      });
      const segment = new THREE.Mesh(geo, mat);
      segment.userData = { isHazard, isWinPlatform: isWin, isPlatform: true };
      platform.add(segment);
    }
    this.tower?.add(platform);
  }

  private setupInputs() {
    const move = (x: number) => {
        if (!this.isRotating || !this.tower) return;
        this.tower.rotation.y += (x - this.previousMouseX) * 0.015; // Smoother rotation
        this.previousMouseX = x;
    };

    this.container.addEventListener('mousedown', e => { this.isRotating = true; this.previousMouseX = e.clientX; });
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', () => this.isRotating = false);

    this.container.addEventListener('touchstart', e => {
        this.isRotating = true;
        this.previousMouseX = e.touches[0].clientX;
    }, { passive: false });
    window.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: false });
    window.addEventListener('touchend', () => this.isRotating = false);
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.ball || !this.tower) return;
    this.animationId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    if (this.autoRotate) this.tower.rotation.y += 0.01;

    const skin = this.ball.userData.skin;
    const mat = this.ball.material as THREE.MeshStandardMaterial;

    if (skin === 'fire') {
        const s = 1 + Math.sin(time * 12) * 0.1;
        this.ball.scale.set(s, s, s);
        mat.emissiveIntensity = 2 + Math.sin(time * 10);
    } else if (skin === 'gold') {
        mat.metalness = 0.9 + Math.sin(time * 3) * 0.1;
    }

    if (!this.isPaused) {
        this.ballVelocity += this.gravity;
        if (this.ballVelocity < -0.35) this.ballVelocity = -0.35;
        this.ball.position.y += this.ballVelocity;
        this.camera.position.y = this.ball.position.y + 10;
        this.checkCollisions();
    }

    this.camera.lookAt(0, this.ball.position.y - 2, 0);
    this.renderer.render(this.scene, this.camera);
  }

  private checkCollisions() {
    if (!this.ball || !this.tower || this.ballVelocity > 0) return;
    this.raycaster.set(this.ball.position, new THREE.Vector3(0, -1, 0));
    const hits = this.raycaster.intersectObjects(this.tower.children, true);
    if (hits.length > 0 && hits[0].distance < 0.4) {
        const obj = hits[0].object;
        if (obj.userData.isWinPlatform) { this.isPaused = true; this.state.onWin(); return; }
        if (obj.userData.isHazard) { this.isPaused = true; this.state.onLoss(); return; }
        this.ballVelocity = this.jumpForce;
        if (this.lastHitPlatform !== obj.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = obj.parent;
        }
    }
  }

  public setSkin(s: string) {
    if (!this.ball) return;
    this.ball.userData.skin = s;
    const mat = this.ball.material as THREE.MeshStandardMaterial;
    mat.opacity = 1.0;
    mat.emissive.set(0x000000);

    if (s === 'gold') { mat.color.set(0xffd700); mat.metalness = 1.0; mat.roughness = 0.05; }
    else if (s === 'glass') { mat.color.set(0x00ffff); mat.opacity = 0.5; mat.metalness = 0.1; mat.roughness = 0; }
    else if (s === 'fire') { mat.color.set(0xff4500); mat.emissive.set(0xff0000); mat.emissiveIntensity = 2.5; }
    else if (s === 'yellow') { mat.color.set(0xffff00); mat.metalness = 0.6; mat.roughness = 0.1; }
    else if (s === 'crown') { mat.color.set(0xaa00ff); mat.emissive.set(0xff00ff); mat.emissiveIntensity = 3; }
    mat.needsUpdate = true;
  }

  public dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ball = null;
    this.tower = null;
  }
}
