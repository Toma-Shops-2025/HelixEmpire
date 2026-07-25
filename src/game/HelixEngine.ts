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
  private gravity = -0.015;
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
    this.scene.background = new THREE.Color(0x02020a);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    this.camera.position.set(0, 12, 40);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(5, 10, 7);
    this.scene.add(sun);

    this.ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xff4500,
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        })
    );
    this.ball.position.set(0, 8.5, 3.5);
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const column = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 3000, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    this.tower.add(column);

    this.setupLevel(this.state.level);
    this.setupInputs();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

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
        this.createPlatform(5 - (i * 8), color, i === 19, i === 0);
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
    const gapSize = isFirst ? 0 : 2;

    for (let i = 0; i < segments; i++) {
      if (!isWin && (i === gapStart || i === (gapStart + 1) % segments)) continue;

      const isHazard = !isWin && !isFirst && Math.random() > 0.94;
      const arc = (1 / segments) * Math.PI * 2;

      const geo = new THREE.CylinderGeometry(6, 6, 0.6, 32, 1, false, (i / segments) * Math.PI * 2, arc);
      const mat = new THREE.MeshStandardMaterial({
          color: isWin ? 0xffaa00 : (isHazard ? 0xff0000 : color),
          emissive: isWin ? 0xffaa00 : (isHazard ? 0xff0000 : color),
          emissiveIntensity: 0.4
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
        this.tower.rotation.y += (x - this.previousMouseX) * 0.015;
        this.previousMouseX = x;
    };

    this.container.addEventListener('mousedown', e => { this.isRotating = true; this.previousMouseX = e.clientX; });
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', () => this.isRotating = false);

    this.container.addEventListener('touchstart', e => {
        this.isRotating = true;
        this.previousMouseX = e.touches[0].clientX;
    });
    window.addEventListener('touchmove', e => move(e.touches[0].clientX));
    window.addEventListener('touchend', () => this.isRotating = false);
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.ball || !this.tower) return;
    this.animationId = requestAnimationFrame(this.animate);

    if (this.autoRotate) this.tower.rotation.y += 0.01;

    if (!this.isPaused) {
        this.ballVelocity += this.gravity;
        if (this.ballVelocity < -0.4) this.ballVelocity = -0.4;
        this.ball.position.y += this.ballVelocity;
        this.camera.position.y = this.ball.position.y + 12;
        this.checkCollisions();
    }

    this.camera.lookAt(0, this.ball.position.y, 0);
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
    const mat = this.ball.material as THREE.MeshStandardMaterial;
    if (s === 'gold') { mat.color.set(0xffd700); mat.metalness = 1.0; mat.roughness = 0.05; }
    else if (s === 'fire') { mat.color.set(0xff4500); mat.emissive.set(0xff0000); }
    else if (s === 'glass') { mat.color.set(0x00ffff); mat.opacity = 0.5; mat.transparent = true; }
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
