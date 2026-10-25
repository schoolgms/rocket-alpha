import * as THREE from 'three';
import { CarCustomization } from './GarageTypes';

export interface CarMeshes {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: THREE.Group[];
  frontWheels: THREE.Group[];
  exhaustNozzles: THREE.Object3D[];
  primaryMaterial: THREE.MeshStandardMaterial;
  decalMaterial: THREE.MeshStandardMaterial;
}

export class CarBuilder {
  /**
   * Builds a multi-part procedural 3D car following the threejs design skill
   */
  public static buildCar(custom: CarCustomization): CarMeshes {
    const root = new THREE.Group();
    root.name = 'Car_' + custom.playerName;

    // Determine color & finish
    const primaryColorHex = custom.team === 'orange' ? '#ff5500' : (custom.team === 'blue' ? '#0066ff' : custom.primaryColor);
    
    let roughness = 0.25;
    let metalness = 0.5;
    if (custom.finish === 'matte') {
      roughness = 0.75;
      metalness = 0.05;
    } else if (custom.finish === 'metallic') {
      roughness = 0.18;
      metalness = 0.88;
    } else if (custom.finish === 'glossy') {
      roughness = 0.12;
      metalness = 0.15;
    }

    const primaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColorHex),
      roughness,
      metalness,
    });

    const decalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.decalColor),
      roughness: Math.min(1.0, roughness + 0.2),
      metalness: 0.2,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.6,
      metalness: 0.3,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x111e2e,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xccffff,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff1122,
      emissive: 0xff0022,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });

    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.9,
      roughness: 0.3,
    });

    const exhaustGlowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.boostColor),
      emissive: new THREE.Color(custom.boostColor),
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });

    // 1. PRIMARY SILHOUETTE: Main Chassis
    // Dimensions: Length ~4.2, Width ~2.0, Height ~1.3 (Car centered so bottom touches ground)
    let mainBody: THREE.Mesh;
    const bodyGroup = new THREE.Group();

    if (custom.body === 'viper') {
      // Long sleek muscle car
      const bodyGeom = new THREE.BoxGeometry(1.8, 0.45, 4.2);
      mainBody = new THREE.Mesh(bodyGeom, primaryMat);
      mainBody.position.y = 0.45;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      bodyGroup.add(mainBody);

      // Cabin
      const cabinGeom = new THREE.BoxGeometry(1.4, 0.4, 1.8);
      const cabin = new THREE.Mesh(cabinGeom, glassMat);
      cabin.position.set(0, 0.75, -0.2);
      cabin.castShadow = true;
      bodyGroup.add(cabin);

      // Racing Stripes Decal
      const stripeGeom = new THREE.BoxGeometry(0.35, 0.04, 4.22);
      const stripe = new THREE.Mesh(stripeGeom, decalMat);
      stripe.position.set(0, 0.68, 0);
      bodyGroup.add(stripe);

      // Front Splitter
      const splitterGeom = new THREE.BoxGeometry(1.9, 0.08, 0.6);
      const splitter = new THREE.Mesh(splitterGeom, darkTrimMat);
      splitter.position.set(0, 0.25, 2.05);
      bodyGroup.add(splitter);

      // Rear Ducktail Spoiler
      const spoilerGeom = new THREE.BoxGeometry(1.6, 0.15, 0.3);
      const spoiler = new THREE.Mesh(spoilerGeom, primaryMat);
      spoiler.position.set(0, 0.75, -2.0);
      spoiler.rotation.x = -0.2;
      bodyGroup.add(spoiler);

    } else if (custom.body === 'titan') {
      // Angular cyber truck wedge
      const bodyGeom = new THREE.BoxGeometry(1.9, 0.6, 4.0);
      mainBody = new THREE.Mesh(bodyGeom, primaryMat);
      mainBody.position.y = 0.55;
      mainBody.castShadow = true;
      bodyGroup.add(mainBody);

      // Angular Top Canopy
      const topGeom = new THREE.BoxGeometry(1.5, 0.5, 2.2);
      const top = new THREE.Mesh(topGeom, glassMat);
      top.position.set(0, 0.95, -0.3);
      bodyGroup.add(top);

      // Heavy Bullbar Bumper
      const bumperGeom = new THREE.BoxGeometry(2.0, 0.35, 0.4);
      const bumper = new THREE.Mesh(bumperGeom, darkTrimMat);
      bumper.position.set(0, 0.4, 2.0);
      bodyGroup.add(bumper);

      // Roof Accent Light Bar
      const lightBarGeom = new THREE.BoxGeometry(1.2, 0.08, 0.15);
      const lightBar = new THREE.Mesh(lightBarGeom, headlightMat);
      lightBar.position.set(0, 1.25, 0.6);
      bodyGroup.add(lightBar);

    } else {
      // Default: "Apex" (Octane style hatchback with elevated rear wing)
      const bodyGeom = new THREE.BoxGeometry(1.8, 0.55, 3.8);
      mainBody = new THREE.Mesh(bodyGeom, primaryMat);
      mainBody.position.y = 0.5;
      mainBody.castShadow = true;
      bodyGroup.add(mainBody);

      // Cockpit Dome
      const cabinGeom = new THREE.BoxGeometry(1.35, 0.45, 1.7);
      const cabin = new THREE.Mesh(cabinGeom, glassMat);
      cabin.position.set(0, 0.88, -0.3);
      cabin.castShadow = true;
      bodyGroup.add(cabin);

      // Angled Decal Hood Shield
      const hoodDecalGeom = new THREE.BoxGeometry(1.2, 0.05, 1.2);
      const hoodDecal = new THREE.Mesh(hoodDecalGeom, decalMat);
      hoodDecal.position.set(0, 0.8, 1.1);
      hoodDecal.rotation.x = 0.15;
      bodyGroup.add(hoodDecal);

      // Rear Spoiler Wing with Struts
      const wingGeom = new THREE.BoxGeometry(1.7, 0.08, 0.45);
      const wing = new THREE.Mesh(wingGeom, primaryMat);
      wing.position.set(0, 1.2, -1.8);
      bodyGroup.add(wing);

      const strutLGeom = new THREE.BoxGeometry(0.06, 0.4, 0.1);
      const strutL = new THREE.Mesh(strutLGeom, darkTrimMat);
      strutL.position.set(-0.6, 0.95, -1.8);
      bodyGroup.add(strutL);

      const strutR = strutL.clone();
      strutR.position.x = 0.6;
      bodyGroup.add(strutR);
    }

    // 2. Headlights & Taillights
    const hlGeom = new THREE.BoxGeometry(0.35, 0.15, 0.1);
    const hlLeft = new THREE.Mesh(hlGeom, headlightMat);
    hlLeft.position.set(-0.65, 0.48, 2.05);
    bodyGroup.add(hlLeft);

    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    bodyGroup.add(hlRight);

    const tlGeom = new THREE.BoxGeometry(0.4, 0.12, 0.1);
    const tlLeft = new THREE.Mesh(tlGeom, taillightMat);
    tlLeft.position.set(-0.65, 0.52, -2.05);
    bodyGroup.add(tlLeft);

    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    bodyGroup.add(tlRight);

    // 3. Rocket Thruster Exhaust Nozzles
    const exhaustNozzles: THREE.Object3D[] = [];
    const nozzleGeom = new THREE.CylinderGeometry(0.14, 0.2, 0.35, 12);
    nozzleGeom.rotateX(Math.PI / 2);

    const glowGeom = new THREE.CircleGeometry(0.13, 12);

    const exhaustL = new THREE.Mesh(nozzleGeom, exhaustMat);
    exhaustL.position.set(-0.35, 0.45, -2.05);
    bodyGroup.add(exhaustL);

    const glowL = new THREE.Mesh(glowGeom, exhaustGlowMat);
    glowL.position.set(-0.35, 0.45, -2.23);
    glowL.rotation.y = Math.PI;
    bodyGroup.add(glowL);

    const exhaustR = new THREE.Mesh(nozzleGeom, exhaustMat);
    exhaustR.position.set(0.35, 0.45, -2.05);
    bodyGroup.add(exhaustR);

    const glowR = glowL.clone();
    glowR.position.x = 0.35;
    bodyGroup.add(glowR);

    exhaustNozzles.push(glowL, glowR);

    root.add(bodyGroup);

    // 4. Wheels Construction (4 wheels)
    const wheels: THREE.Group[] = [];
    const frontWheels: THREE.Group[] = [];

    const tireRadius = 0.38;
    const tireWidth = 0.32;
    const tireGeom = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 16);
    tireGeom.rotateZ(Math.PI / 2);

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.85,
      metalness: 0.1,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.wheelColor || '#444444'),
      roughness: 0.3,
      metalness: 0.8,
    });

    const rimRadius = 0.26;
    const rimGeom = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.02, 12);
    rimGeom.rotateZ(Math.PI / 2);

    const wheelOffsets = [
      { x: -0.98, y: tireRadius, z: 1.25, isFront: true },  // Front Left
      { x: 0.98, y: tireRadius, z: 1.25, isFront: true },   // Front Right
      { x: -1.0, y: tireRadius, z: -1.35, isFront: false }, // Rear Left
      { x: 1.0, y: tireRadius, z: -1.35, isFront: false },  // Rear Right
    ];

    wheelOffsets.forEach(pos => {
      const wheelMount = new THREE.Group();
      wheelMount.position.set(pos.x, pos.y, pos.z);

      const wheelRot = new THREE.Group();
      
      const tire = new THREE.Mesh(tireGeom, tireMat);
      tire.castShadow = true;
      wheelRot.add(tire);

      const rim = new THREE.Mesh(rimGeom, rimMat);
      wheelRot.add(rim);

      // Hubcap detail
      const hubGeom = new THREE.CylinderGeometry(0.08, 0.08, tireWidth + 0.04, 8);
      hubGeom.rotateZ(Math.PI / 2);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
      const hub = new THREE.Mesh(hubGeom, hubMat);
      wheelRot.add(hub);

      wheelMount.add(wheelRot);
      root.add(wheelMount);

      wheels.push(wheelRot);
      if (pos.isFront) {
        frontWheels.push(wheelMount);
      }
    });

    return {
      root,
      bodyMesh: mainBody,
      wheels,
      frontWheels,
      exhaustNozzles,
      primaryMaterial: primaryMat,
      decalMaterial: decalMat,
    };
  }
}
