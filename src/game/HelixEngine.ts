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
  private ballLight: THREE.PointLight | null = null;
  private tower: THREE.Group | null = null;
  private state: GameState;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  private ballVelocity = 0;
  private readonly jumpForce = 0.32;
  private readonly gravity = -0.018;
  private isRotating = false;
  private previousMouseX = 0;

  public autoRotate = true;
  public isPaused = true;
  private lastHitPlatform: any = null;
  private container: HTMLDivElement;
  private animationId: number | null = null;

  constructor(container: HTMLDivElement, state: GameState) {
    this.container = container;
    this.state = state;
    this.init();
  }

  private init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.015);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 15, 55);

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.renderer.domElement);

    // Dynamic Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 20, 10);
    this.scene.add(mainLight);

    // Ball with Glow
    this.ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xff3300,
            emissive: 0xff0000,
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.8
        })
    );
    this.ball.position.set(0, 10, 6.5);
    this.scene.add(this.ball);

    this.ballLight = new THREE.PointLight(0xff4400, 15, 15);
    this.ball.add(this.ballLight);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const column = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3000, 32),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.5
        })
    );
    this.tower.add(column);

    this.setupLevel(this.state.level);
    this.setupInputs();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
        this.renderer.setSize(width, height);
    }
  };

  public start() {
    this.isPaused = false;
    this.autoRotate = false;
    this.ballVelocity = -0.05;
  }

  public reset() {
    if (!this.ball) return;
    this.ball.position.y = 10;
    this.ballVelocity = 0;
    this.lastHitPlatform = null;
    this.isPaused = false;
    this.autoRotate = false;
  }

  public setPaused(val: boolean) {
    this.isPaused = val;
    this.autoRotate = val;
  }

  public setupLevel(level: number) {
    if (!this.tower || !this.ball) return;
    this.state.level = level;

    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower?.remove(c));

    // Refined color palette
    const levelColors = [
        { c: 0x00ccff, e: 0x0066ff }, // Cyber Blue
        { c: 0xff00ff, e: 0xaa00aa }, // Neon Pink
        { c: 0x00ff88, e: 0x00aa44 }, // Emerald
        { c: 0xffaa00, e: 0xff5500 }  // Solar Gold
    ];
    const theme = levelColors[level % levelColors.length];
    const spacing = 12;

    for (let i = 0; i < 22; i++) {
        this.createPlatform(5 - (i * spacing), theme.c, theme.e, i === 21, i === 0);
    }

    this.ball.position.y = 10;
    this.ballVelocity = 0;
    this.lastHitPlatform = null;
    this.isPaused = true;
    this.autoRotate = true;
  }

  private createPlatform(y: number, color: number, emissive: number, isWin: boolean, isFirst: boolean) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    const segments = 12;
    const gapStart = Math.floor(Math.random() * segments);

    for (let i = 0; i < segments; i++) {
      if (!isWin && (i === gapStart || i === (gapStart + 1) % segments)) continue;

      const isHazard = !isWin && !isFirst && Math.random() > 0.92;
      const arc = (1 / segments) * Math.PI * 2;

      const geo = new THREE.CylinderGeometry(9, 9, 1.2, 40, 1, false, (i / segments) * Math.PI * 2, arc);
      const mat = new THREE.MeshStandardMaterial({
          color: isWin ? 0x00ff00 : (isHazard ? 0xff0000 : color),
          emissive: isWin ? 0x00ff00 : (isHazard ? 0xff0000 : emissive),
          emissiveIntensity: 0.8,
          metalness: 0.4,
          roughness: 0.2
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
        this.tower.rotation.y += (x - this.previousMouseX) * 0.012;
        this.previousMouseX = x;
    };

    this.container.addEventListener('mousedown', e => { this.isRotating = true; this.previousMouseX = e.clientX; });
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', () => this.isRotating = false);

    this.container.addEventListener('touchstart', e => {
        this.isRotating = true;
        this.previousMouseX = e.touches[0].clientX;
    }, { passive: true });
    window.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', () => this.isRotating = false);
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.ball || !this.tower) return;
    this.animationId = requestAnimationFrame(this.animate);

    if (this.autoRotate) {
        this.tower.rotation.y += 0.005;
    }

    if (!this.isPaused) {
        this.ballVelocity += this.gravity;
        if (this.ballVelocity < -0.6) this.ballVelocity = -0.6;
        this.ball.position.y += this.ballVelocity;

        // Dynamic camera damping
        const targetCamY = this.ball.position.y + 12;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;

        this.checkCollisions();
    }

    this.camera.lookAt(0, this.ball.position.y - 2, 0);
    this.renderer.render(this.scene, this.camera);
  }

  private checkCollisions() {
    if (!this.ball || !this.tower || this.ballVelocity > 0) return;
    this.raycaster.set(this.ball.position, new THREE.Vector3(0, -1, 0));
    const hits = this.raycaster.intersectObjects(this.tower.children, true);

    if (hits.length > 0 && hits[0].distance < 0.7) {
        const obj = hits[0].object;
        if (obj.userData.isWinPlatform) {
            this.isPaused = true;
            this.state.onWin();
            return;
        }
        if (obj.userData.isHazard) {
            this.isPaused = true;
            this.state.onLoss();
            return;
        }

        // Better bounce physics
        this.ballVelocity = this.jumpForce;

        if (this.lastHitPlatform !== obj.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = obj.parent;
        }
    }
  }

  public setSkin(s: string) {
    if (!this.ball || !this.ballLight) return;
    const mat = this.ball.material as THREE.MeshStandardMaterial;
    if (s === 'gold') {
        mat.color.set(0xffd700);
        mat.emissive.set(0xaa8800);
        this.ballLight.color.set(0xffd700);
    } else if (s === 'fire') {
        mat.color.set(0xff3300);
        mat.emissive.set(0xff0000);
        this.ballLight.color.set(0xff4400);
    } else if (s === 'glass') {
        mat.color.set(0x00ffff);
        mat.emissive.set(0x00aaaa);
        this.ballLight.color.set(0x00ffff);
    }
    mat.needsUpdate = true;
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
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
