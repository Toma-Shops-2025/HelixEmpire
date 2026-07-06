import * as THREE from 'three';

export type BallSkin = 'fire' | 'gold' | 'glass' | 'yellow' | 'crown';

export interface GameState {
  score: number;
  level: number;
  isGameOver: boolean;
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
  private jumpForce = 0.28;
  private gravity = -0.012;

  private isRotating = false;
  private previousMouseX = 0;
  private rotationSpeed = 0.012;

  public autoRotate = true;
  public isPaused = true;
  private lastHitPlatform: THREE.Object3D | null = null;

  constructor(container: HTMLDivElement, state: GameState) {
    this.state = state;
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020202);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 10, 16);
    this.camera.lookAt(0, 5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(5, 20, 10);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    const ballGeo = new THREE.SphereGeometry(0.45, 32, 32);
    this.ball = new THREE.Mesh(ballGeo, this.getSkinMaterial('fire'));
    this.ball.position.set(0, 12, 5.5); // Start slightly higher for better drop
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    // PILLAR: Metallic Dark Gold
    const cylinderGeo = new THREE.CylinderGeometry(1.5, 1.5, 600, 32);
    const cylinderMat = new THREE.MeshStandardMaterial({
        color: 0x443300,
        metalness: 0.9,
        roughness: 0.1
    });
    const column = new THREE.Mesh(cylinderGeo, cylinderMat);
    column.userData.isPillar = true;
    this.tower.add(column);

    this.setupLevel(state.level);
    this.setupInputs();
    this.animate();
  }

  public setSkin(skin: BallSkin) {
    this.ball.material = this.getSkinMaterial(skin);
  }

  private getSkinMaterial(skin: BallSkin): THREE.Material {
    switch (skin) {
      case 'gold': return new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0, emissive: 0xffaa00, emissiveIntensity: 0.5 });
      case 'glass': return new THREE.MeshPhysicalMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4, transmission: 1, thickness: 1 });
      case 'yellow': return new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.2 });
      case 'crown': return new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, emissive: 0xcccccc, emissiveIntensity: 0.5 });
      default: return new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff1100, emissiveIntensity: 1.0 });
    }
  }

  public setupLevel(level: number) {
    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower.remove(c));

    // PURPLE NEON FIRST (0xbc13fe)
    const colors = [0xbc13fe, 0xff007f, 0x0077ff, 0x00ffcc];
    const color = colors[level % colors.length];
    const platformCount = 12 + (level * 2);

    for (let i = 0; i < platformCount; i++) {
        this.createPlatform(5 - (i * 6), color, i === platformCount - 1, level);
    }
    this.lastHitPlatform = null;
  }

  private createPlatform(y: number, color: number, isWin: boolean, level: number) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    const segments = 12;
    const gapSize = isWin ? 0 : 2;
    const hazardCount = isWin ? 0 : Math.min(5, 1 + Math.floor(level / 4));
    const gapStart = Math.floor(Math.random() * segments);

    let detail = 32;
    if (level >= 10) detail = 6;
    else if (level >= 5) detail = 12;

    for (let i = 0; i < segments; i++) {
      if (!isWin) {
        const isGap = (i >= gapStart && i < gapStart + gapSize) || (i + segments >= gapStart && i + segments < gapStart + gapSize);
        if (isGap) continue;
      }
      const isHazard = !isWin && (i >= (gapStart + 6) % segments && i < (gapStart + 6 + hazardCount) % segments);
      const arc = (1 / segments) * Math.PI * 2;
      const thickness = isWin ? 3.5 : 0.8;

      const matColor = isWin ? 0xffd700 : (isHazard ? 0xff0000 : color);
      const segmentGeo = new THREE.CylinderGeometry(6, 6, thickness, detail, 1, false, (i / segments) * Math.PI * 2, arc);
      const segmentMat = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: 0.1,
        metalness: isWin ? 1.0 : 0.4,
        emissive: matColor,
        emissiveIntensity: 0.4
      });
      const segment = new THREE.Mesh(segmentGeo, segmentMat);
      segment.userData = { isHazard, isWinPlatform: isWin, isPlatform: true };
      platform.add(segment);
    }
    this.tower.add(platform);
  }

  private setupInputs() {
    const handleMove = (clientX: number) => {
        if (!this.isRotating) return;
        const deltaX = clientX - this.previousMouseX;
        this.tower.rotation.y += deltaX * this.rotationSpeed;
        this.previousMouseX = clientX;
    };
    window.addEventListener('mousedown', (e) => { this.isRotating = true; this.previousMouseX = e.clientX; });
    window.addEventListener('mousemove', (e) => handleMove(e.clientX));
    window.addEventListener('mouseup', () => this.isRotating = false);
    window.addEventListener('touchstart', (e) => { this.isRotating = true; this.previousMouseX = e.touches[0].clientX; });
    window.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX));
    window.addEventListener('touchend', () => this.isRotating = false);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    if (this.autoRotate && !this.isRotating) this.tower.rotation.y += 0.006;
    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.ballVelocity += this.gravity;
    this.ball.position.y += this.ballVelocity;
    const targetCamY = this.ball.position.y + 5;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;
    this.checkCollisions();
    this.renderer.render(this.scene, this.camera);
  }

  private checkCollisions() {
    if (this.ballVelocity > 0) return;
    const ballPos = this.ball.position.clone();
    this.raycaster.set(ballPos, new THREE.Vector3(0, -1, 0));

    // CRITICAL: We only check for platforms, NOT the pillar
    const intersects = this.raycaster.intersectObjects(this.tower.children, true).filter(i => i.object.userData.isPlatform || i.object.userData.isWinPlatform);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.distance < 0.5) {
        if (hit.object.userData.isWinPlatform) {
            this.state.onWin();
            this.isPaused = true;
            return;
        }
        if (hit.object.userData.isHazard) {
          this.state.onLoss();
          this.isPaused = true;
          return;
        }
        this.ballVelocity = this.jumpForce;

        // Only score if this is a NEW platform
        if (this.lastHitPlatform !== hit.object.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = hit.object.parent;
        }
      }
    }
  }

  public revive() {
    this.ball.position.y += 1.5;
    this.ballVelocity = this.jumpForce;
    this.lastHitPlatform = null;
    this.isPaused = false;
    this.autoRotate = false;
  }

  public resetToStart() {
    this.ball.position.y = 8;
    this.ballVelocity = 0;
    this.tower.rotation.y = 0;
    this.lastHitPlatform = null;
  }

  public setPaused(value: boolean) { this.isPaused = value; }
  public setAutoRotate(value: boolean) { this.autoRotate = value; }
  public dispose() { this.renderer.dispose(); }
}
