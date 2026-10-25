import * as THREE from 'three';
import { StadiumType, ARENA_BOUNDS, BoostPadData } from './ArenaTypes';

export interface BuiltArena {
  group: THREE.Group;
  boostPads: BoostPadData[];
  blueGoalPos: THREE.Vector3;
  orangeGoalPos: THREE.Vector3;
  update: (dt: number) => void;
}

export class ArenaBuilder {
  /**
   * Generates a procedural pitch texture with crisp regulation football markings
   */
  private static createPitchTexture(type: StadiumType): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    const w = canvas.width;
    const h = canvas.height;

    if (type === 'neon') {
      // Dark cyberpunk floor with subtle honeycomb/grid pattern
      ctx.fillStyle = '#080812';
      ctx.fillRect(0, 0, w, h);

      // Neon grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      const step = 64;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Glowing pitch markings
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 12;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 15;
    } else if (type === 'sunset') {
      // Warm clay / twilight pitch
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, w, h);

      // Alternating subtle turf bands
      const bands = 24;
      const bandHeight = h / bands;
      for (let i = 0; i < bands; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1f1d19' : '#191714';
        ctx.fillRect(0, i * bandHeight, w, bandHeight);
      }

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 8;
    } else {
      // Classic Stadium: Rich grass bands
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, w, h);

      const bands = 24;
      const bandHeight = h / bands;
      for (let i = 0; i < bands; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
        ctx.fillRect(0, i * bandHeight, w, bandHeight);
      }

      // Crisp white lines
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 10;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
    }

    // Outer boundary
    const margin = 40;
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

    // Center halfway line
    ctx.beginPath();
    ctx.moveTo(margin, h / 2);
    ctx.lineTo(w - margin, h / 2);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Center Dot
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 24, 0, Math.PI * 2);
    ctx.fill();

    // Blue Team Goal Area (Top)
    ctx.strokeRect(w / 2 - 220, margin, 440, 260);
    ctx.beginPath();
    ctx.arc(w / 2, margin + 260, 120, 0, Math.PI);
    ctx.stroke();

    // Orange Team Goal Area (Bottom)
    ctx.strokeRect(w / 2 - 220, h - margin - 260, 440, 260);
    ctx.beginPath();
    ctx.arc(w / 2, h - margin - 260, 120, Math.PI, 0);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  public static buildArena(type: StadiumType): BuiltArena {
    const group = new THREE.Group();
    group.name = 'Stadium_' + type;

    const b = ARENA_BOUNDS;
    const halfW = b.width / 2;
    const halfL = b.length / 2;
    const H = b.height;

    // 1. Pitch Floor
    const pitchTexture = this.createPitchTexture(type);
    const floorGeom = new THREE.PlaneGeometry(b.width, b.length);
    floorGeom.rotateX(-Math.PI / 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: pitchTexture,
      roughness: type === 'neon' ? 0.3 : 0.8,
      metalness: type === 'neon' ? 0.4 : 0.1,
    });

    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // 2. Wall Materials
    let wallMat: THREE.Material;
    let frameMat: THREE.Material;
    let netMat: THREE.Material;

    if (type === 'neon') {
      wallMat = new THREE.MeshStandardMaterial({
        color: 0x090914,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.75,
      });
      frameMat = new THREE.MeshStandardMaterial({
        color: 0x00f5ff,
        emissive: 0x00d2ee,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      netMat = new THREE.MeshStandardMaterial({
        color: 0x00f5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
    } else if (type === 'sunset') {
      wallMat = new THREE.MeshStandardMaterial({
        color: 0x292524,
        roughness: 0.7,
        metalness: 0.2,
        transparent: true,
        opacity: 0.8,
      });
      frameMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.4,
        metalness: 0.6,
      });
      netMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
    } else {
      // Classic
      wallMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.8,
      });
      frameMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.3,
        metalness: 0.7,
      });
      netMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
    }

    // 3. Perimeter Enclosure Walls & Curved Corner Chamfers
    // Sidewalls
    const sideWallGeom = new THREE.BoxGeometry(1, H, b.length - b.cornerChamfer * 2);
    const leftWall = new THREE.Mesh(sideWallGeom, wallMat);
    leftWall.position.set(-halfW, H / 2, 0);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeom, wallMat);
    rightWall.position.set(halfW, H / 2, 0);
    group.add(rightWall);

    // End walls flanking the goals
    const endWallWidth = (b.width - b.goalWidth - b.cornerChamfer * 2) / 2;
    const endWallGeom = new THREE.BoxGeometry(endWallWidth, H, 1);

    // Blue side (-Z) end walls
    const blueWallL = new THREE.Mesh(endWallGeom, wallMat);
    blueWallL.position.set(-(halfW - b.cornerChamfer / 2 - endWallWidth / 2), H / 2, -halfL);
    group.add(blueWallL);

    const blueWallR = new THREE.Mesh(endWallGeom, wallMat);
    blueWallR.position.set(halfW - b.cornerChamfer / 2 - endWallWidth / 2, H / 2, -halfL);
    group.add(blueWallR);

    // Blue wall above goal
    const aboveGoalGeom = new THREE.BoxGeometry(b.goalWidth, H - b.goalHeight, 1);
    const blueWallTop = new THREE.Mesh(aboveGoalGeom, wallMat);
    blueWallTop.position.set(0, b.goalHeight + (H - b.goalHeight) / 2, -halfL);
    group.add(blueWallTop);

    // Orange side (+Z) end walls
    const orangeWallL = new THREE.Mesh(endWallGeom, wallMat);
    orangeWallL.position.set(-(halfW - b.cornerChamfer / 2 - endWallWidth / 2), H / 2, halfL);
    group.add(orangeWallL);

    const orangeWallR = new THREE.Mesh(endWallGeom, wallMat);
    orangeWallR.position.set(halfW - b.cornerChamfer / 2 - endWallWidth / 2, H / 2, halfL);
    group.add(orangeWallR);

    // Orange wall above goal
    const orangeWallTop = new THREE.Mesh(aboveGoalGeom, wallMat);
    orangeWallTop.position.set(0, b.goalHeight + (H - b.goalHeight) / 2, halfL);
    group.add(orangeWallTop);

    // 4 Corner Chamfer Walls (45 degree angles for smooth ball bounce)
    const cornerHypot = Math.SQRT2 * b.cornerChamfer;
    const cornerGeom = new THREE.BoxGeometry(cornerHypot, H, 1);

    const c1 = new THREE.Mesh(cornerGeom, wallMat);
    c1.position.set(-(halfW - b.cornerChamfer / 2), H / 2, -(halfL - b.cornerChamfer / 2));
    c1.rotation.y = Math.PI / 4;
    group.add(c1);

    const c2 = new THREE.Mesh(cornerGeom, wallMat);
    c2.position.set(halfW - b.cornerChamfer / 2, H / 2, -(halfL - b.cornerChamfer / 2));
    c2.rotation.y = -Math.PI / 4;
    group.add(c2);

    const c3 = new THREE.Mesh(cornerGeom, wallMat);
    c3.position.set(-(halfW - b.cornerChamfer / 2), H / 2, halfL - b.cornerChamfer / 2);
    c3.rotation.y = -Math.PI / 4;
    group.add(c3);

    const c4 = new THREE.Mesh(cornerGeom, wallMat);
    c4.position.set(halfW - b.cornerChamfer / 2, H / 2, halfL - b.cornerChamfer / 2);
    c4.rotation.y = Math.PI / 4;
    group.add(c4);

    // Arena Ceiling Barrier (transparent ceiling)
    const ceilingGeom = new THREE.PlaneGeometry(b.width, b.length);
    ceilingGeom.rotateX(Math.PI / 2);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.15,
      roughness: 0.5,
    });
    const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.y = H;
    group.add(ceiling);

    // 4. Goals Construction
    // Blue Goal (-Z)
    const blueGoalPos = new THREE.Vector3(0, b.goalHeight / 2, -halfL);
    const blueGoalFrameMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0055ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });

    const createGoalStructure = (isBlue: boolean) => {
      const gGroup = new THREE.Group();
      const zDir = isBlue ? -1 : 1;
      const mat = isBlue ? blueGoalFrameMat : new THREE.MeshStandardMaterial({
        color: 0xff5500,
        emissive: 0xee3300,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8,
      });

      // Posts (Left & Right)
      const postGeom = new THREE.CylinderGeometry(0.35, 0.35, b.goalHeight, 12);
      const postL = new THREE.Mesh(postGeom, mat);
      postL.position.set(-b.goalWidth / 2, b.goalHeight / 2, halfL * zDir);
      gGroup.add(postL);

      const postR = new THREE.Mesh(postGeom, mat);
      postR.position.set(b.goalWidth / 2, b.goalHeight / 2, halfL * zDir);
      gGroup.add(postR);

      // Crossbar
      const barGeom = new THREE.CylinderGeometry(0.35, 0.35, b.goalWidth, 12);
      barGeom.rotateZ(Math.PI / 2);
      const bar = new THREE.Mesh(barGeom, mat);
      bar.position.set(0, b.goalHeight, halfL * zDir);
      gGroup.add(bar);

      // Goal Interior Net Enclosure
      const netBoxGeom = new THREE.BoxGeometry(b.goalWidth, b.goalHeight, b.goalDepth);
      const netMesh = new THREE.Mesh(netBoxGeom, netMat);
      netMesh.position.set(0, b.goalHeight / 2, (halfL + b.goalDepth / 2) * zDir);
      gGroup.add(netMesh);

      // Goal Light Beam / Arch
      const archGeom = new THREE.TorusGeometry(b.goalWidth / 2, 0.2, 8, 24, Math.PI);
      const arch = new THREE.Mesh(archGeom, mat);
      arch.position.set(0, b.goalHeight, halfL * zDir);
      gGroup.add(arch);

      return gGroup;
    };

    group.add(createGoalStructure(true));
    group.add(createGoalStructure(false));
    const orangeGoalPos = new THREE.Vector3(0, b.goalHeight / 2, halfL);

    // 5. Boost Pads Placement
    const boostPads: BoostPadData[] = [];
    const padPositions: Array<{ x: number; z: number; isFull: boolean }> = [
      // 6 Full 100-Boost Pads
      { x: -33, z: -50, isFull: true },
      { x: 33, z: -50, isFull: true },
      { x: -33, z: 50, isFull: true },
      { x: 33, z: 50, isFull: true },
      { x: -36, z: 0, isFull: true },
      { x: 36, z: 0, isFull: true },

      // Mini 12-Boost Pads
      { x: 0, z: -40, isFull: false },
      { x: 0, z: -25, isFull: false },
      { x: 0, z: 25, isFull: false },
      { x: 0, z: 40, isFull: false },
      { x: -16, z: -35, isFull: false },
      { x: 16, z: -35, isFull: false },
      { x: -16, z: 35, isFull: false },
      { x: 16, z: 35, isFull: false },
      { x: -18, z: 0, isFull: false },
      { x: 18, z: 0, isFull: false },
      { x: -10, z: -56, isFull: false },
      { x: 10, z: -56, isFull: false },
      { x: -10, z: 56, isFull: false },
      { x: 10, z: 56, isFull: false },
    ];

    const padBaseGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.15, 16);
    const smallPadBaseGeom = new THREE.CylinderGeometry(0.9, 1.0, 0.1, 12);
    const capsuleGeom = new THREE.CapsuleGeometry(0.4, 0.6, 8, 12);

    padPositions.forEach((pos, idx) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(pos.x, 0.05, pos.z);

      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.4,
        metalness: 0.8,
      });

      const base = new THREE.Mesh(pos.isFull ? padBaseGeom : smallPadBaseGeom, baseMat);
      padGroup.add(base);

      // Glowing floating orb or beacon
      const glowMat = new THREE.MeshStandardMaterial({
        color: pos.isFull ? 0xffaa00 : 0x00e5ff,
        emissive: pos.isFull ? 0xff8800 : 0x00b4d8,
        emissiveIntensity: 0.9,
        roughness: 0.1,
      });

      const beacon = new THREE.Mesh(pos.isFull ? capsuleGeom : new THREE.SphereGeometry(0.35, 12, 12), glowMat);
      beacon.position.y = pos.isFull ? 1.0 : 0.6;
      padGroup.add(beacon);

      group.add(padGroup);

      boostPads.push({
        id: idx,
        x: pos.x,
        z: pos.z,
        isFull: pos.isFull,
        respawnTime: pos.isFull ? 10.0 : 4.0,
        currentCooldown: 0,
        meshGroup: padGroup,
        beaconLight: beacon,
      });
    });

    // 6. Stadium Atmosphere / Background Details
    if (type === 'classic') {
      // Stadium Floodlight Towers in corners
      const towerGeom = new THREE.BoxGeometry(1.2, 36, 1.2);
      const towerHeadGeom = new THREE.BoxGeometry(4, 2, 1.5);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });

      [[-halfW - 5, -halfL - 5], [halfW + 5, -halfL - 5], [-halfW - 5, halfL + 5], [halfW + 5, halfL + 5]].forEach(([tx, tz]) => {
        const tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(tx, 18, tz);
        const lamp = new THREE.Mesh(towerHeadGeom, lampMat);
        lamp.position.set(tx, 35, tz);
        lamp.lookAt(0, 5, 0);
        group.add(tower);
        group.add(lamp);
      });
    } else if (type === 'sunset') {
      // Mountains in background horizon
      const mountainGeom = new THREE.ConeGeometry(45, 60, 5);
      const mountainMat = new THREE.MeshStandardMaterial({ color: 0x271f2b, roughness: 0.9 });
      for (let i = -3; i <= 3; i++) {
        const m1 = new THREE.Mesh(mountainGeom, mountainMat);
        m1.position.set(i * 55, 15, -halfL - 75);
        m1.scale.set(1.2, 0.8 + (Math.sin(i) * 0.4), 1.2);
        group.add(m1);

        const m2 = new THREE.Mesh(mountainGeom, mountainMat);
        m2.position.set(i * 55, 15, halfL + 75);
        m2.scale.set(1.2, 0.8 + (Math.cos(i) * 0.4), 1.2);
        group.add(m2);
      }
    }

    let elapsed = 0;
    const update = (dt: number) => {
      elapsed += dt;
      // Animate boost pad beacons
      for (const pad of boostPads) {
        if (pad.currentCooldown > 0) {
          pad.currentCooldown -= dt;
          if (pad.beaconLight) {
            pad.beaconLight.visible = false;
          }
        } else {
          if (pad.beaconLight) {
            pad.beaconLight.visible = true;
            pad.beaconLight.rotation.y = elapsed * 2.5;
            pad.beaconLight.position.y = (pad.isFull ? 1.0 : 0.6) + Math.sin(elapsed * 4 + pad.id) * 0.12;
          }
        }
      }
    };

    return {
      group,
      boostPads,
      blueGoalPos,
      orangeGoalPos,
      update,
    };
  }
}
