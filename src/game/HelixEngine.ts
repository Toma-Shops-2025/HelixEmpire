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
  private readonly jumpForce = 0.35;
  private readonly gravity = -0.02;
  private isRotating = false;
  private previousMouseX = 0;
  private inputCleanup: (() => void) | null = null;

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
    this.scene.background = new THREE.Color(0x000000);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    this.camera.position.set(0, 15, 45);

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);

    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);

    this.ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    this.ball.position.set(0, 10, 5);
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const column = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3000, 32),
        new THREE.MeshStandardMaterial({ color: 0x080808 })
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

    // High-contrast neon colors from screenshots
    const colors = [0xff007f, 0x00f0ff, 0xff00ff, 0x00ffcc];
    const levelColor = colors[level % colors.length];
    const spacing = 12;

    for (let i = 0; i < 20; i++) {
        this.createPlatform(5 - (i * spacing), levelColor, i === 19, i === 0);
    }

    this.ball.position.y = 10;
    this.ballVelocity = 0;
    this.lastHitPlatform = null;
    this.isPaused = true;
    this.autoRotate = true;
  }

  private createPlatform(y: number, color: number, isWin: boolean, isFirst: boolean) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    const segments = 12;
    const gapStart = Math.floor(Math.random() * segments);

    for (let i = 0; i < segments; i++) {
      if (!isWin && (i === gapStart || i === (gapStart + 1) % segments)) continue;

      const isHazard = !isWin && !isFirst && Math.random() > 0.9;
      const arc = (1 / segments) * Math.PI * 2;

      const geo = new THREE.CylinderGeometry(9, 9, 1.2, 40, 1, false, (i / segments) * Math.PI * 2, arc);
      const mat = new THREE.MeshStandardMaterial({
          color: isWin ? 0xffcc00 : (isHazard ? 0xff0000 : color),
          roughness: 0.1,
          metalness: 0.2
      });
      const segment = new THREE.Mesh(geo, mat);
      segment.userData = { isHazard, isWinPlatform: isWin, isPlatform: true };
      platform.add(segment);
    }
    this.tower?.add(platform);
  }

  private setupInputs() {
    if (!this.renderer) return;
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';

    const move = (x: number) => {
        if (!this.tower || this.isPaused) return;
        this.tower.rotation.y += (x - this.previousMouseX) * 0.015;
        this.previousMouseX = x;
    };

    const begin = (x: number) => {
        if (this.isPaused) return;
        this.isRotating = true;
        this.previousMouseX = x;
    };

    const end = () => {
        this.isRotating = false;
    };

    const onMouseDown = (e: MouseEvent) => begin(e.clientX);
    const onMouseMove = (e: MouseEvent) => {
        if (!this.isRotating) return;
        move(e.clientX);
    };
    const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) begin(e.touches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
        if (!this.isRotating || e.touches.length === 0) return;
        move(e.touches[0].clientX);
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', end);

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });

    this.inputCleanup = () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', end);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.ball || !this.tower) return;
    this.animationId = requestAnimationFrame(this.animate);

    if (this.autoRotate) {
        this.tower.rotation.y += 0.005;
    }

    if (!this.isPaused) {
        this.ballVelocity += this.gravity;
        if (this.ballVelocity < -0.5) this.ballVelocity = -0.5;
        this.ball.position.y += this.ballVelocity;

        // Fixed camera tracking
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

        this.ballVelocity = this.jumpForce;

        if (this.lastHitPlatform !== obj.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = obj.parent;
        }
    }
  }

  public setSkin(s: string) {
    if (!this.ball) return;
    const mat = this.ball.material as THREE.MeshBasicMaterial;
    if (s === 'gold') { mat.color.set(0xffd700); }
    else if (s === 'fire') { mat.color.set(0xff3300); }
    else if (s === 'glass' || s === 'ice') { mat.color.set(0x00ffff); }
    else if (s === 'toxic') { mat.color.set(0x84cc16); }
    mat.needsUpdate = true;
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    this.inputCleanup?.();
    this.inputCleanup = null;
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
