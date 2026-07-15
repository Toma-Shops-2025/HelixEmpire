import * as THREE from 'three';

export interface GameState {
  score: number;
  level: number;
  onWin: () => void;
  onLoss: () => void;
  onScoreUpdate: (points: number) => void;
}

export class HelixEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ball: THREE.Mesh;
  private tower: THREE.Group;
  private state: GameState;
  private raycaster: THREE.Raycaster;

  private ballVelocity = 0;
  private jumpForce = 0.26;
  private gravity = -0.012;
  private isRotating = false;
  private previousMouseX = 0;

  public autoRotate = true;
  public isPaused = true;
  private lastHitPlatform: any = null;

  constructor(container: HTMLDivElement, state: GameState) {
    this.state = state;
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();

    // Create Background / Stars
    this.scene.background = new THREE.Color(0x050510);
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    this.scene.add(new THREE.Points(starGeo, starMat));

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 10, 7);
    this.scene.add(sun);

    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), new THREE.MeshStandardMaterial({ color: 0xff4500 }));
    this.ball.position.set(0, 8.5, 5.5);
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 800, 32), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    this.tower.add(column);

    this.setupLevel(state.level);
    this.setupInputs();
    this.animate();
  }

  public setPaused(val: boolean) {
    this.isPaused = val;
    if (!val) {
        this.autoRotate = false;
        this.ballVelocity = -0.1; // Force start
    }
  }

  public setupLevel(level: number) {
    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower.remove(c));

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
    this.tower.add(platform);
  }

  private setupInputs() {
    const move = (x: number) => {
        if (!this.isRotating) return;
        this.tower.rotation.y += (x - this.previousMouseX) * 0.025;
        this.previousMouseX = x;
    };
    window.addEventListener('mousedown', e => { this.isRotating = true; this.previousMouseX = e.clientX; });
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', () => this.isRotating = false);
    window.addEventListener('touchstart', e => { this.isRotating = true; this.previousMouseX = e.touches[0].clientX; }, { passive: false });
    window.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: false });
    window.addEventListener('touchend', () => this.isRotating = false);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    if (this.autoRotate) this.tower.rotation.y += 0.01;
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
    if (this.ballVelocity > 0) return;
    this.raycaster.set(this.ball.position, new THREE.Vector3(0, -1, 0));
    const hits = this.raycaster.intersectObjects(this.tower.children, true);
    if (hits.length > 0 && hits[0].distance < 0.5) {
        const obj = hits[0].object;
        if (obj.userData.isWinPlatform) return this.state.onWin();
        if (obj.userData.isHazard) return this.state.onLoss();
        this.ballVelocity = this.jumpForce;
        if (this.lastHitPlatform !== obj.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = obj.parent;
        }
    }
  }

  public resetToStart() {
    this.ball.position.set(0, 8.5, 5.5);
    this.ballVelocity = 0;
    this.isPaused = true;
    this.autoRotate = true;
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 5, 0);
  }

  public setSkin(s: string) {}
  public dispose() { this.renderer.dispose(); }
}
