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
  private jumpForce = 0.28;
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

    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 })));

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 10, 7);
    this.scene.add(sun);

    this.ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.5, roughness: 0.2, transparent: true })
    );
    this.ball.position.set(0, 8.5, 5.5);
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 800, 32), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    this.tower.add(column);

    this.setupLevel(this.state.level);
    this.setupInputs();
    this.animate();
  }

  public setPaused(val: boolean) {
    this.isPaused = val;
    if (!val) {
        this.autoRotate = false;
        this.ballVelocity = -0.15;
    }
  }

  public setupLevel(level: number) {
    if (!this.tower || !this.ball) return;
    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower?.remove(c));

    const color = [0xbc13fe, 0xff007f, 0x0077ff, 0x00ffcc][level % 4];
    for (let i = 0; i < 20; i++) {
        this.createPlatform(5 - (i * 6), color, i === 19, i === 0);
    }
    this.ball.position.set(0, 8.5, 5.5);
    this.ballVelocity = 0;
  }

  private createPlatform(y: number, color: number, isWin: boolean, isFirst: boolean) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    const segments = 12;
    const gapStart = Math.floor(Math.random() * segments);

    for (let i = 0; i < segments; i++) {
      if (!isWin && (i === gapStart || i === (gapStart + 1) % segments)) continue;

      const isHazard = !isWin && !isFirst && Math.random() > 0.95;
      const arc = (1 / segments) * Math.PI * 2;
      const geo = new THREE.CylinderGeometry(6, 6, 0.8, 32, 1, false, (i / segments) * Math.PI * 2, arc);
      const mat = new THREE.MeshStandardMaterial({ color: isWin ? 0xffaa00 : (isHazard ? 0xff0000 : color) });
      const segment = new THREE.Mesh(geo, mat);
      segment.userData = { isHazard, isWinPlatform: isWin, isPlatform: true };
      platform.add(segment);
    }
    this.tower?.add(platform);
  }

  private setupInputs() {
    const move = (x: number) => {
        if (!this.isRotating || !this.tower) return;
        this.tower.rotation.y += (x - this.previousMouseX) * 0.025;
        this.previousMouseX = x;
    };
    window.addEventListener('mousedown', e => { this.isRotating = true; this.previousMouseX = e.clientX; });
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', () => this.isRotating = false);
    window.addEventListener('touchstart', e => { if(this.isPaused) return; this.isRotating = true; this.previousMouseX = e.touches[0].clientX; }, { passive: false });
    window.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: false });
    window.addEventListener('touchend', () => this.isRotating = false);
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.ball || !this.tower) return;
    this.animationId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    if (this.autoRotate) this.tower.rotation.y += 0.015;

    // Advanced Animations for all Skins
    const skin = this.ball.userData.skin;
    const mat = this.ball.material as THREE.MeshStandardMaterial;

    if (skin === 'fire') { // Viral Spark
        const s = 1 + Math.sin(time * 12) * 0.15;
        this.ball.scale.set(s, s, s);
        mat.emissiveIntensity = 2 + Math.sin(time * 10);
        this.ball.rotation.y += 0.1;
    } else if (skin === 'gold') { // Liquid Gold
        this.ball.rotation.y += 0.02;
        this.ball.rotation.z += 0.02;
        mat.metalness = 0.9 + Math.sin(time * 3) * 0.1;
        const pulse = 1 + Math.sin(time * 2) * 0.05;
        this.ball.scale.set(pulse, pulse, pulse);
    } else if (skin === 'glass') { // Neon Phantom
        this.ball.rotation.y += 0.06;
        mat.color.setHSL((time * 0.15) % 1, 0.9, 0.6);
        mat.opacity = 0.4 + Math.sin(time * 5) * 0.2;
    } else if (skin === 'yellow') { // TomaBox
        const wobble = Math.sin(time * 15) * 0.1;
        this.ball.rotation.x += 0.05 + wobble;
        this.ball.rotation.z += 0.05 + wobble;
        this.ball.position.x = Math.sin(time * 6) * 0.3;
    } else if (skin === 'crown') { // Grand Crown
        mat.emissiveIntensity = 3 + Math.sin(time * 15) * 2;
        this.ball.rotation.y += 0.15;
        const heroBounce = Math.abs(Math.sin(time * 8)) * 0.25;
        this.ball.scale.set(1.1 + heroBounce, 1.1 + heroBounce, 1.1 + heroBounce);
    }

    if (!this.isPaused) {
        this.ballVelocity += this.gravity;
        this.ball.position.y += this.ballVelocity;
        this.camera.position.y = this.ball.position.y + 8;
        this.camera.lookAt(0, this.ball.position.y, 0);
        this.checkCollisions();
    }
    this.renderer.render(this.scene, this.camera);
  }

  private checkCollisions() {
    if (!this.ball || !this.tower || this.ballVelocity > 0) return;
    this.raycaster.set(this.ball.position, new THREE.Vector3(0, -1, 0));
    const hits = this.raycaster.intersectObjects(this.tower.children, true);
    if (hits.length > 0 && hits[0].distance < 0.5) {
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

    if (s === 'gold') {
        mat.color.set(0xffd700);
        mat.metalness = 1.0;
        mat.roughness = 0.05;
    } else if (s === 'glass') {
        mat.color.set(0x00ffff);
        mat.opacity = 0.5;
        mat.metalness = 0.1;
        mat.roughness = 0;
    } else if (s === 'fire') {
        mat.color.set(0xff4500);
        mat.emissive.set(0xff0000);
        mat.emissiveIntensity = 2.5;
    } else if (s === 'yellow') {
        mat.color.set(0xffff00);
        mat.metalness = 0.6;
        mat.roughness = 0.1;
    } else if (s === 'crown') {
        mat.color.set(0xaa00ff);
        mat.emissive.set(0xff00ff);
        mat.emissiveIntensity = 3;
    }
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
