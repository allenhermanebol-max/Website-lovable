import * as THREE from "three";
import { PLAYER_CONFIG, PLAYER_WEAPON } from "./config.js";
import { clamp } from "./combatMath.js";

const shared = {
  body: new THREE.CylinderGeometry(0.38, 0.48, 1.15, 12),
  head: new THREE.SphereGeometry(0.28, 16, 12),
  arm: new THREE.CapsuleGeometry(0.11, 0.66, 4, 8),
  leg: new THREE.CapsuleGeometry(0.13, 0.7, 4, 8),
  swordBlade: new THREE.BoxGeometry(0.08, 0.08, 1.35),
  swordGuard: new THREE.BoxGeometry(0.64, 0.08, 0.08),
  swordGrip: new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8),
  enemyBody: new THREE.CylinderGeometry(0.44, 0.55, 1.2, 10),
  enemyHead: new THREE.SphereGeometry(0.29, 12, 10),
  enemyShoulder: new THREE.BoxGeometry(1.05, 0.18, 0.32),
  enemyWeapon: new THREE.BoxGeometry(0.1, 0.1, 1.25)
};

function makeMaterial(color, roughness = 0.7, metalness = 0.08, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 0.18 : 0 });
}

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Player {
  constructor(scene) {
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.maxStamina = PLAYER_CONFIG.maxStamina;
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.radius = PLAYER_CONFIG.radius;
    this.yaw = 0;
    this.attackCooldown = 0;
    this.comboIndex = 0;
    this.comboResetTimer = 0;
    this.dashTimer = 0;
    this.staminaRegenWait = 0;
    this.isBlocking = false;
    this.alive = true;
    this.moveAmount = 0;

    this.group = this.createModel();
    scene.add(this.group);
  }

  createModel() {
    const group = new THREE.Group();
    group.name = "Player";

    const cloak = makeMaterial(0x25303a, 0.88);
    const armor = makeMaterial(0x71777f, 0.42, 0.45);
    const leather = makeMaterial(0x3a2a22, 0.85);
    const blade = makeMaterial(0xcbd6e8, 0.22, 0.72);
    const gold = makeMaterial(0xd8b86b, 0.38, 0.35, 0x6f4d18);

    const body = shadow(new THREE.Mesh(shared.body, cloak));
    body.position.y = 1.1;
    group.add(body);

    const chest = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.34, 0.34), armor));
    chest.position.y = 1.42;
    group.add(chest);

    const head = shadow(new THREE.Mesh(shared.head, makeMaterial(0xd2b391, 0.72)));
    head.position.y = 1.91;
    group.add(head);

    const hood = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.34, 16), cloak));
    hood.position.y = 2.07;
    group.add(hood);

    this.leftArm = shadow(new THREE.Mesh(shared.arm, leather));
    this.leftArm.position.set(-0.55, 1.22, 0.06);
    this.leftArm.rotation.z = -0.28;
    group.add(this.leftArm);

    this.rightArm = shadow(new THREE.Mesh(shared.arm, leather));
    this.rightArm.position.set(0.55, 1.22, 0.08);
    this.rightArm.rotation.z = 0.36;
    group.add(this.rightArm);

    const leftLeg = shadow(new THREE.Mesh(shared.leg, leather));
    leftLeg.position.set(-0.21, 0.42, 0);
    group.add(leftLeg);

    const rightLeg = shadow(new THREE.Mesh(shared.leg, leather));
    rightLeg.position.set(0.21, 0.42, 0);
    group.add(rightLeg);

    this.sword = new THREE.Group();
    this.sword.position.set(0.72, 1.15, 0.55);
    this.sword.rotation.set(-0.24, 0.1, -0.05);

    const swordBlade = shadow(new THREE.Mesh(shared.swordBlade, blade));
    swordBlade.position.z = 0.72;
    this.sword.add(swordBlade);

    const tip = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), blade));
    tip.position.z = 1.47;
    tip.rotation.x = Math.PI / 2;
    this.sword.add(tip);

    const guard = shadow(new THREE.Mesh(shared.swordGuard, gold));
    guard.position.z = 0.04;
    this.sword.add(guard);

    const grip = shadow(new THREE.Mesh(shared.swordGrip, leather));
    grip.rotation.x = Math.PI / 2;
    grip.position.z = -0.22;
    this.sword.add(grip);
    group.add(this.sword);

    this.blockDisc = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 24), armor));
    this.blockDisc.position.set(-0.55, 1.18, 0.52);
    this.blockDisc.rotation.x = Math.PI / 2;
    this.blockDisc.visible = false;
    group.add(this.blockDisc);

    return group;
  }

  reset(position = new THREE.Vector3(0, 0, 0)) {
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.attackCooldown = 0;
    this.comboIndex = 0;
    this.comboResetTimer = 0;
    this.dashTimer = 0;
    this.staminaRegenWait = 0;
    this.isBlocking = false;
    this.alive = true;
    this.group.position.copy(position);
    this.group.rotation.set(0, 0, 0);
    this.yaw = 0;
  }

  get forward() {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
  }

  spendStamina(cost) {
    if (this.stamina < cost) {
      return false;
    }
    this.stamina = clamp(this.stamina - cost, 0, this.maxStamina);
    this.staminaRegenWait = PLAYER_CONFIG.staminaRegenDelay;
    return true;
  }

  takeDamage(amount) {
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  beginAttack(comboIndex) {
    this.comboIndex = comboIndex;
    this.attackPoseTimer = 0.22;
  }

  update(delta, staminaRegenMultiplier) {
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.comboResetTimer = Math.max(0, this.comboResetTimer - delta);
    this.staminaRegenWait = Math.max(0, this.staminaRegenWait - delta);
    this.dashTimer = Math.max(0, this.dashTimer - delta);
    this.attackPoseTimer = Math.max(0, (this.attackPoseTimer ?? 0) - delta);

    if (this.comboResetTimer <= 0) {
      this.comboIndex = 0;
    }

    if (this.isBlocking) {
      this.stamina = clamp(this.stamina - PLAYER_CONFIG.blockDrainPerSecond * delta, 0, this.maxStamina);
      if (this.stamina <= 1) {
        this.isBlocking = false;
      }
    } else if (this.staminaRegenWait <= 0) {
      this.stamina = clamp(
        this.stamina + PLAYER_CONFIG.staminaRegenPerSecond * staminaRegenMultiplier * delta,
        0,
        this.maxStamina
      );
    }

    this.group.rotation.y = this.yaw;
    this.animate(delta);
  }

  animate(delta) {
    const walk = Math.sin(performance.now() * 0.012) * this.moveAmount;
    this.leftArm.rotation.x = 0.18 + walk * 0.45;
    this.rightArm.rotation.x = -0.16 - walk * 0.4;
    this.blockDisc.visible = this.isBlocking;

    if (this.attackPoseTimer > 0) {
      const swing = Math.sin((1 - this.attackPoseTimer / 0.22) * Math.PI);
      this.sword.rotation.set(-0.42 + swing * 1.25, 0.15 - swing * 0.62, -0.2 - swing * 0.82);
      this.rightArm.rotation.x = -0.8 - swing * 0.8;
    } else if (this.isBlocking) {
      this.sword.rotation.set(-0.1, 0.42, -0.78);
    } else {
      this.sword.rotation.x += (-0.24 - this.sword.rotation.x) * Math.min(1, delta * 8);
      this.sword.rotation.y += (0.1 - this.sword.rotation.y) * Math.min(1, delta * 8);
      this.sword.rotation.z += (-0.05 - this.sword.rotation.z) * Math.min(1, delta * 8);
    }
  }
}

export class Enemy {
  constructor({ typeId, base, stats, position, levelIndex }) {
    this.typeId = typeId;
    this.name = base.name;
    this.base = base;
    this.stats = stats;
    this.maxHealth = stats.health;
    this.health = stats.health;
    this.radius = 0.48 * base.size;
    this.dead = false;
    this.removed = false;
    this.attackCooldown = 0.5 + Math.random() * 0.7;
    this.windupTimer = 0;
    this.hasStruck = false;
    this.staggerTimer = 0;
    this.levelIndex = levelIndex;

    this.group = this.createModel(base);
    this.group.position.set(position.x, 0, position.z);
  }

  createModel(base) {
    const group = new THREE.Group();
    group.name = base.name;
    group.scale.setScalar(base.size);

    const bodyMaterial = makeMaterial(base.color, 0.68, 0.15);
    const accent = makeMaterial(base.accent, 0.42, base.boss ? 0.5 : 0.2, base.accent);
    const dark = makeMaterial(0x19161a, 0.86);
    const metal = makeMaterial(0x9da7ad, 0.34, 0.55);

    const body = shadow(new THREE.Mesh(shared.enemyBody, bodyMaterial));
    body.position.y = 1.05;
    group.add(body);

    const shoulder = shadow(new THREE.Mesh(shared.enemyShoulder, accent));
    shoulder.position.y = 1.58;
    group.add(shoulder);

    const head = shadow(new THREE.Mesh(shared.enemyHead, dark));
    head.position.y = 1.9;
    group.add(head);

    const crest = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 5), accent));
    crest.position.y = 2.2;
    group.add(crest);

    this.weapon = new THREE.Group();
    this.weapon.position.set(0.55, 1.1, 0.5);
    this.weapon.rotation.x = -0.32;
    const blade = shadow(new THREE.Mesh(shared.enemyWeapon, metal));
    blade.position.z = 0.48;
    this.weapon.add(blade);
    const edge = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 4), metal));
    edge.position.z = 1.18;
    edge.rotation.x = Math.PI / 2;
    this.weapon.add(edge);
    group.add(this.weapon);

    if (base.boss) {
      const crown = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 8, 18), accent));
      crown.position.y = 2.32;
      crown.rotation.x = Math.PI / 2;
      group.add(crown);
    }

    return group;
  }

  addTo(scene) {
    scene.add(this.group);
  }

  updateAI(delta, player, arenaSize, onStrike) {
    if (this.dead) {
      this.group.rotation.x += (Math.PI * 0.5 - this.group.rotation.x) * Math.min(1, delta * 4);
      this.group.position.y = Math.max(-0.35, this.group.position.y - delta * 0.45);
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.staggerTimer = Math.max(0, this.staggerTimer - delta);

    const toPlayer = player.group.position.clone().sub(this.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.001) {
      const direction = toPlayer.clone().normalize();
      this.group.rotation.y = Math.atan2(direction.x, direction.z);
    }

    if (this.windupTimer > 0) {
      const previous = this.windupTimer;
      this.windupTimer = Math.max(0, this.windupTimer - delta);
      const swing = 1 - this.windupTimer / this.stats.windup;
      this.weapon.rotation.x = -0.5 + Math.sin(swing * Math.PI) * 1.3;
      if (!this.hasStruck && previous > this.stats.windup * 0.45 && this.windupTimer <= this.stats.windup * 0.45) {
        this.hasStruck = true;
        if (distance <= this.stats.reach) {
          onStrike(this);
        }
      }
      return;
    }

    this.weapon.rotation.x += (-0.32 - this.weapon.rotation.x) * Math.min(1, delta * 7);

    if (this.staggerTimer > 0) {
      return;
    }

    if (distance > this.stats.attackRange) {
      const step = toPlayer.normalize().multiplyScalar(this.stats.speed * delta);
      this.group.position.add(step);
      this.group.position.x = clamp(this.group.position.x, -arenaSize * 0.46, arenaSize * 0.46);
      this.group.position.z = clamp(this.group.position.z, -arenaSize * 0.46, arenaSize * 0.46);
      this.group.position.y = Math.sin(performance.now() * 0.012 + this.levelIndex) * 0.025;
      return;
    }

    if (this.attackCooldown <= 0) {
      this.windupTimer = this.stats.windup;
      this.hasStruck = false;
      this.attackCooldown = this.stats.attackCooldown;
    }
  }

  takeDamage(amount) {
    if (this.dead) {
      return;
    }
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.staggerTimer = 0.18;
    this.group.position.y = 0.08;
    if (this.health <= 0) {
      this.dead = true;
    }
  }
}

export function createSlashArc() {
  const material = new THREE.MeshBasicMaterial({
    color: 0xf5d98f,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const geometry = new THREE.RingGeometry(1.6, PLAYER_WEAPON.range, 32, 1, -Math.PI * 0.35, Math.PI * 0.7);
  const slash = new THREE.Mesh(geometry, material);
  slash.rotation.x = -Math.PI / 2;
  slash.position.y = 0.08;
  slash.visible = false;
  return slash;
}
