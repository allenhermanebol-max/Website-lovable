import * as THREE from "three";
import { QUALITY_SETTINGS } from "./config.js";
import { disposeObject3D, randomBetween } from "./utils.js";

function makeMaterial(color, roughness = 0.74, metalness = 0.04, emissive = 0x000000, emissiveIntensity = 0.12) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class ArenaBuilder {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "Arena";
    this.scene.add(this.group);
  }

  build(level, quality) {
    const profile = QUALITY_SETTINGS[quality] ?? QUALITY_SETTINGS.low;
    this.clear();
    this.scene.background = new THREE.Color(level.sky);
    this.scene.fog = new THREE.FogExp2(level.fog, 0.018);

    const size = level.arenaSize;
    const floorMaterial = makeMaterial(level.floor);
    const floor = shadow(new THREE.Mesh(new THREE.CircleGeometry(size * 0.55, profile.floorSegments), floorMaterial));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    this.createWallRing(size, level, profile.wallSegments);
    this.createLevelDecor(level, profile.decorScale);
  }

  clear() {
    while (this.group.children.length) {
      const child = this.group.children.pop();
      disposeObject3D(child);
    }
  }

  createWallRing(size, level, segments) {
    const wallMaterial = makeMaterial(level.wall);
    const radius = size * 0.55;
    for (let i = 0; i < segments; i += 1) {
      const angle = (Math.PI * 2 * i) / segments;
      const block = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.45, 0.58), wallMaterial));
      block.position.set(Math.cos(angle) * radius, 0.72, Math.sin(angle) * radius);
      block.rotation.y = -angle;
      this.group.add(block);
    }
  }

  createLevelDecor(level, countScale) {
    if (level.id === "training") {
      this.addPillars(level, 8, 0xd8b86b);
      this.addBanners(level, 6, 0x8f2f2f);
    }
    if (level.id === "forest") {
      this.addTrees(level, Math.round(16 * countScale));
      this.addRuins(level, 10, 0x6c7568);
    }
    if (level.id === "courtyard") {
      this.addPillars(level, 12, 0x8fa1b4);
      this.addBanners(level, 8, 0x27384f);
      this.addRuins(level, 8, 0x77808c);
    }
    if (level.id === "lava") {
      this.addLavaCracks(level, Math.round(16 * countScale));
      this.addSpikes(level, Math.round(14 * countScale), 0x5d322a);
    }
    if (level.id === "boss") {
      this.addPillars(level, 10, 0xffa247);
      this.addCrystals(level, Math.round(12 * countScale));
      this.addLavaCracks(level, 10);
    }
  }

  addPillars(level, count, accentColor) {
    const radius = level.arenaSize * 0.43;
    const stone = makeMaterial(level.wall);
    const accent = makeMaterial(accentColor, 0.38, 0.18, accentColor, 0.08);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const pillar = new THREE.Group();
      pillar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      const shaft = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 2.4, 12), stone));
      shaft.position.y = 1.2;
      pillar.add(shaft);

      const cap = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.2, 12), accent));
      cap.position.y = 2.45;
      pillar.add(cap);

      this.group.add(pillar);
    }
  }

  addBanners(level, count, color) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
    const radius = level.arenaSize * 0.49;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * (i + 0.5)) / count;
      const banner = shadow(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.45, 1, 3), material));
      banner.position.set(Math.cos(angle) * radius, 1.65, Math.sin(angle) * radius);
      banner.rotation.y = -angle + Math.PI / 2;
      this.group.add(banner);
    }
  }

  addTrees(level, count) {
    const trunkMat = makeMaterial(0x3a2d22, 0.88);
    const leafMat = makeMaterial(0x244b32, 0.82);
    const radius = level.arenaSize * 0.48;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + randomBetween(-0.14, 0.14);
      const tree = new THREE.Group();
      tree.position.set(Math.cos(angle) * randomBetween(radius * 0.85, radius), 0, Math.sin(angle) * randomBetween(radius * 0.85, radius));

      const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, randomBetween(1.6, 2.3), 7), trunkMat));
      trunk.position.y = 0.9;
      tree.add(trunk);

      const leaves = shadow(new THREE.Mesh(new THREE.ConeGeometry(randomBetween(0.75, 1.1), randomBetween(1.4, 1.9), 8), leafMat));
      leaves.position.y = 2.25;
      tree.add(leaves);
      this.group.add(tree);
    }
  }

  addRuins(level, count, color) {
    const mat = makeMaterial(color);
    const radius = level.arenaSize * 0.38;
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const ruin = shadow(new THREE.Mesh(new THREE.BoxGeometry(randomBetween(0.45, 1.2), randomBetween(0.25, 1.1), randomBetween(0.35, 0.9)), mat));
      ruin.position.set(Math.cos(angle) * randomBetween(radius * 0.45, radius), ruin.geometry.parameters.height / 2, Math.sin(angle) * randomBetween(radius * 0.45, radius));
      ruin.rotation.y = randomBetween(0, Math.PI);
      this.group.add(ruin);
    }
  }

  addLavaCracks(level, count) {
    const lava = new THREE.MeshBasicMaterial({ color: 0xff5b28, transparent: true, opacity: 0.82 });
    const radius = level.arenaSize * 0.36;
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(0, Math.PI * 2);
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(randomBetween(1.4, 3.8), 0.08), lava);
      crack.position.set(Math.cos(angle) * randomBetween(1, radius), 0.025, Math.sin(angle) * randomBetween(1, radius));
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = randomBetween(0, Math.PI);
      this.group.add(crack);
    }
  }

  addSpikes(level, count, color) {
    const mat = makeMaterial(color);
    const radius = level.arenaSize * 0.42;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const spike = shadow(new THREE.Mesh(new THREE.ConeGeometry(randomBetween(0.25, 0.5), randomBetween(0.8, 1.8), 7), mat));
      spike.position.set(Math.cos(angle) * randomBetween(radius * 0.6, radius), 0.45, Math.sin(angle) * randomBetween(radius * 0.6, radius));
      spike.rotation.z = randomBetween(-0.25, 0.25);
      this.group.add(spike);
    }
  }

  addCrystals(level, count) {
    const mat = makeMaterial(0x9ee8ff, 0.25, 0.18, 0x4bd0ff, 0.28);
    const radius = level.arenaSize * 0.42;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const crystal = shadow(new THREE.Mesh(new THREE.ConeGeometry(randomBetween(0.24, 0.5), randomBetween(1.1, 2.4), 5), mat));
      crystal.position.set(Math.cos(angle) * randomBetween(radius * 0.7, radius), 0.65, Math.sin(angle) * randomBetween(radius * 0.7, radius));
      crystal.rotation.z = randomBetween(-0.3, 0.3);
      this.group.add(crystal);
    }
  }
}
