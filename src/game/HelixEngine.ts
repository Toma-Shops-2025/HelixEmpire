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

  public autoRotate = true;
  public isPaused = true;
  private lastHitPlatform: THREE.Object3D | null = null;
  private fallStreak = 0;
  private lastGapStart = 0;

  constructor(container: HTMLDivElement, state: GameState) {
    this.state = state;
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();

    this.updateBackground();

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
    this.ball.position.set(0, 8.5, 5.5);
    this.scene.add(this.ball);

    this.tower = new THREE.Group();
    this.scene.add(this.tower);

    const cylinderGeo = new THREE.CylinderGeometry(1.5, 1.5, 800, 32);
    const cylinderMat = new THREE.MeshStandardMaterial({ color: 0x443300, metalness: 0.9, roughness: 0.1 });
    const column = new THREE.Mesh(cylinderGeo, cylinderMat);
    column.userData.isPillar = true;
    this.tower.add(column);

    this.setupLevel(state.level);
    this.setupInputs();
    this.animate();
  }

  public updateBackground() {
    const colors = [0x1a0033, 0x001a33, 0x33001a, 0x00331a];
    this.scene.background = new THREE.Color(colors[this.state.level % colors.length]);

    const oldStars = this.scene.getObjectByName('stars');
    if (oldStars) this.scene.remove(oldStars);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const posArray = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        posArray[i] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.9 });
    const stars = new THREE.Points(starGeo, starMat);
    stars.name = 'stars';
    this.scene.add(stars);
  }

  public setSkin(skin: BallSkin) {
    this.ball.material = this.getSkinMaterial(skin);
  }

  private getSkinMaterial(skin: BallSkin): THREE.Material {
    switch (skin) {
      case 'gold': return new THREE.MeshPhysicalMaterial({
          color: 0xffd700, metalness: 1, roughness: 0.1,
          emissive: 0xffaa00, emissiveIntensity: 0.8,
          clearcoat: 1.0, clearcoatRoughness: 0.1
      });
      case 'glass': return new THREE.MeshPhysicalMaterial({
          color: 0xffffff, transparent: true, opacity: 0.2,
          transmission: 1.0, thickness: 2.0, roughness: 0,
          ior: 1.5, reflectivity: 1.0
      });
      case 'fire': return new THREE.MeshStandardMaterial({
          color: 0xff4500, emissive: 0xff1100, emissiveIntensity: 2.0
      });
      case 'yellow': return new THREE.MeshStandardMaterial({
          color: 0xffeb3b, roughness: 0, metalness: 0.5,
          flatShading: true
      });
      case 'crown': return new THREE.MeshPhysicalMaterial({
          color: 0xffffff, metalness: 1.0, roughness: 0.2,
          emissive: 0x999999, emissiveIntensity: 0.5,
          sheen: 1.0, sheenColor: 0x00ffff
      });
      default: return new THREE.MeshStandardMaterial({ color: 0xff4500 });
    }
  }

  public setupLevel(level: number) {
    this.state.level = level;
    this.updateBackground();
    const toRemove = this.tower.children.filter(c => c.userData.isLevelObject);
    toRemove.forEach(c => this.tower.remove(c));

    const colors = [0xbc13fe, 0xff007f, 0x0077ff, 0x00ffcc];
    const color = colors[level % colors.length];
    const platformCount = 12 + Math.min(level * 2, 40);

    this.lastGapStart = 0;
    for (let i = 0; i < platformCount; i++) {
        this.createPlatform(5 - (i * 6), color, i === platformCount - 1, i === 0, level);
    }
    this.lastHitPlatform = null;
    this.fallStreak = 0;
  }

  private createPlatform(y: number, color: number, isWin: boolean, isFirst: boolean, level: number) {
    const platform = new THREE.Group();
    platform.position.y = y;
    platform.userData.isLevelObject = true;

    // EVOLVING DIFFICULTY: More segments = harder to time
    let segments = 12;
    let detail = 32; // Smooth
    let gapSize = 2;

    if (level >= 25) { segments = 3; detail = 3; gapSize = 1; } // Triangle
    else if (level >= 20) { segments = 4; detail = 4; gapSize = 1; } // Square
    else if (level >= 15) { segments = 5; detail = 5; gapSize = 1; } // Pentagon
    else if (level >= 10) { segments = 6; detail = 6; gapSize = 2; } // Hexagon
    else if (level >= 5)  { segments = 8; detail = 8; gapSize = 2; } // Octagon

    if (isWin) gapSize = 0;

    const hazardCount = (isWin || isFirst) ? 0 : Math.min(Math.floor(segments/2), 1 + Math.floor(level / 5));

    // ANTI-ALIGNMENT: Force gaps to be at least 1/3 turn away from the previous floor
    let gapStart = Math.floor(Math.random() * segments);
    const minGapDiff = Math.floor(segments / 3);
    if (Math.abs(gapStart - this.lastGapStart) < minGapDiff) {
        gapStart = (this.lastGapStart + Math.floor(segments/2)) % segments;
    }
    this.lastGapStart = gapStart;

    for (let i = 0; i < segments; i++) {
      if (!isWin) {
        const isGap = (i >= gapStart && i < gapStart + gapSize) || (i + segments >= gapStart && i + segments < gapStart + gapSize);
        if (isGap) continue;
      }

      // Calculate hazards to be away from the gap
      const isHazard = !isWin && !isFirst && (i >= (gapStart + Math.floor(segments/2)) % segments && i < (gapStart + Math.floor(segments/2) + hazardCount) % segments);

      const arc = (1 / segments) * Math.PI * 2;
      const thickness = isWin ? 3.5 : 0.8;

      const matColor = isWin ? 0xffaa00 : (isHazard ? 0xff0000 : color);

      // We use detail=1 for flat edges on polygons
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
        this.tower.rotation.y += deltaX * 0.015;
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

    if (this.ballVelocity < -0.2) {
      const currentFloorY = Math.floor(this.ball.position.y / 6);
      const lastFloorY = Math.floor((this.ball.position.y - this.ballVelocity) / 6);
      if (currentFloorY < lastFloorY) {
          this.fallStreak++;
          if (this.fallStreak >= 3) {
              this.state.onScoreUpdate(50);
          }
      }
    }

    const targetCamY = this.ball.position.y + 5;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;
    this.checkCollisions();
    this.renderer.render(this.scene, this.camera);
  }

  private checkCollisions() {
    if (this.ballVelocity > 0) return;
    const ballPos = this.ball.position.clone();
    this.raycaster.set(ballPos, new THREE.Vector3(0, -1, 0));
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
        this.fallStreak = 0;
        if (this.lastHitPlatform !== hit.object.parent) {
            this.state.onScoreUpdate(10);
            this.lastHitPlatform = hit.object.parent;
        }
      }
    }
  }

  public revive() {
    this.ballVelocity = this.jumpForce;
    this.lastHitPlatform = null;
    this.isPaused = false;
    this.autoRotate = false;
    this.fallStreak = 0;
  }

  public resetToStart() {
    this.ball.position.set(0, 8.5, 5.5);
    this.ballVelocity = 0;
    this.tower.rotation.y = 0;
    this.lastHitPlatform = null;
    this.isPaused = false;
    this.autoRotate = false;
    this.fallStreak = 0;
  }

  public setPaused(value: boolean) { this.isPaused = value; }
  public setAutoRotate(value: boolean) { this.autoRotate = value; }
  public dispose() { this.renderer.dispose(); }
}
