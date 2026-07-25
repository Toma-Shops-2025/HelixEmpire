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
  private jumpForce = 0.22;
  private gravity = -0.01;
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

    // Do not set scene.background to allow CSS background/"H" to show through.

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 15, 35); // Pulled back for better view

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "default"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);

    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.renderer.domElement);

    // Add Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 1000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);

    // Ball
    this.ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xff4500,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        })
    );
    this.ball.position.set(0, 10, 4); // Positioned slightly forward
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    // Core Column
    const column = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.2, 2000, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 })
    );
    this.tower.add(column);

    this.setupLevel(this.state.level);
    this.setupInputs();

    window.addEventListener('resize', this.onResize);

    // Force a resize calculation after a frame to ensure container is ready
    setTimeout(this.onResize, 100);

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
        this.ballVelocity = -0.05;
    }
  }

  public setupLevel(level: number) {
    if (!this.tower || !this.ball) return;
    this.state.level = level;

    // Clear old level
    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower?.remove(c));

    const levelColor = [0xbc13fe, 0xff007f, 0x0077ff, 0x00ffcc, 0xffd700][level % 5];
    const spacing = 8;

    for (let i = 0; i < 25; i++) {
        this.createPlatform(5 - (i * spacing), levelColor, i === 24, i === 0);
    }

    this.ball.position.y = 10;
    this.ballVelocity = 0;
    this.lastHitPlatform = null;
  }

  private createPlatform(y: number, color: number, isWin: boolean, isFirst: boolean) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    const segments = 12;
    const gapStart = Math.floor(Math.random() * segments);
    const gapSize = isFirst ? 0 : (isWin ? 0 : 2); // No gap for win/start platforms or specific size

    for (let i = 0; i < segments; i++) {
      let skip = false;
      for(let j=0; j<gapSize; j++) {
          if (i === (gapStart + j) % segments) skip = true;
      }
      if (skip) continue;

      const isHazard = !isWin && !isFirst && Math.random() > 0.92;
      const arc = (1 / segments) * Math.PI * 2;

      const geo = new THREE.CylinderGeometry(6, 6, 0.8, 32, 1, false, (i / segments) * Math.PI * 2, arc);
      const mat = new THREE.MeshStandardMaterial({
          color: isWin ? 0x00ff00 : (isHazard ? 0xff0000 : color),
          emissive: isWin ? 0x00ff00 : (isHazard ? 0xff0000 : color),
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.9
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
        const delta = (x - this.previousMouseX) * 0.01;
        this.tower.rotation.y += delta;
        this.previousMouseX = x;
    };

    const onStart = (x: number) => {
        this.isRotating = true;
        this.previousMouseX = x;
    };

    const onEnd = () => {
        this.isRotating = false;
    };

    this.container.addEventListener('mousedown', e => onStart(e.clientX));
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', onEnd);

    this.container.addEventListener('touchstart', e => onStart(e.touches[0].clientX));
    window.addEventListener('touchmove', e => move(e.touches[0].clientX));
    window.addEventListener('touchend', onEnd);
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.ball || !this.tower) return;
    this.animationId = requestAnimationFrame(this.animate);

    if (this.autoRotate) {
        this.tower.rotation.y += 0.005;
    }

    if (!this.isPaused) {
        this.ballVelocity += this.gravity;
        // Cap terminal velocity
        if (this.ballVelocity < -0.4) this.ballVelocity = -0.4;

        this.ball.position.y += this.ballVelocity;

        // Smooth camera follow
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

    if (hits.length > 0 && hits[0].distance < 0.6) {
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

        // Jump
        this.ballVelocity = this.jumpForce;

        // Score only once per platform level
        if (this.lastHitPlatform !== obj.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = obj.parent;
        }
    }
  }

  public setSkin(s: string) {
    if (!this.ball) return;
    const mat = this.ball.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5;

    switch(s) {
        case 'gold':
            mat.color.set(0xffd700);
            mat.metalness = 0.8;
            mat.roughness = 0.2;
            break;
        case 'fire':
            mat.color.set(0xff4500);
            mat.emissive.set(0xff0000);
            mat.emissiveIntensity = 1.0;
            break;
        case 'glass':
            mat.color.set(0x88ffff);
            mat.opacity = 0.6;
            mat.transparent = true;
            break;
        default:
            mat.color.set(0xffffff);
    }
    mat.needsUpdate = true;
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ball = null;
    this.tower = null;
  }
}
