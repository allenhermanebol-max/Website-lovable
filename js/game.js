import * as THREE from "three";
import { ArenaBuilder } from "./arena.js";
import {
  DIFFICULTIES,
  ENEMY_TYPES,
  LEVELS,
  PLAYER_CONFIG,
  PLAYER_WEAPON,
  QUALITY_SETTINGS,
  STORAGE_KEYS
} from "./config.js";
import { AudioManager } from "./audio.js";
import { Enemy, Player, createSlashArc } from "./entities.js";
import { InputController } from "./input.js";
import { UIController } from "./ui.js";
import { disposeObject3D, lerp, pickCircularPosition, randomBetween } from "./utils.js";
import {
  applyCriticalHit,
  canSpendStamina,
  clamp,
  isTargetInsideAttackArc,
  resolveIncomingDamage,
  scaleEnemyStats,
  spendStamina
} from "./combatMath.js";

const GAME_STATE = {
  menu: "menu",
  playing: "playing",
  paused: "paused",
  levelComplete: "levelComplete",
  gameOver: "gameOver",
  victory: "victory"
};

const TARGET_FRAME_TIME = 1 / 60;
const TARGET_FRAME_MS = 1000 / 60;

export class GameApp {
  constructor() {
    this.mount = document.querySelector("#canvasMount");
    this.state = GAME_STATE.menu;
    this.currentLevelIndex = 0;
    this.difficultyId = "normal";
    this.settings = { volume: 0.65, quality: "low" };
    this.cameraPitch = 0.18;
    this.enemies = [];
    this.particles = [];
    this.targetEnemy = null;
    this.slashTimer = 0;
    this.dashCooldown = 0;
    this.hudUpdateTimer = 0;
    this.fpsTime = 0;
    this.fpsFrames = 0;
    this.lastFps = 0;
    this.lastRenderTimeMs = 0;
    this.particleGeometry = new THREE.SphereGeometry(0.045, 4, 3);

    this.input = new InputController();
    this.audio = new AudioManager(this.settings.volume);
    this.ui = new UIController({
      onStart: () => this.startGame(),
      onNextLevel: () => this.continueAfterLevel(),
      onResume: () => this.resumeGame(),
      onRestart: () => this.restartGame(),
      onMenu: () => this.returnToMenu(),
      onDifficultyChanged: (difficulty) => this.setDifficulty(difficulty),
      onSettingsChanged: (settings) => this.setSettings(settings)
    });

    this.initThree();
    this.ui.loadStoredPreferences();
    this.setDifficulty(this.ui.getDifficulty());
    this.setSettings(this.ui.getSettings());
    this.ui.updateBestLevel(LEVELS.length);

    this.arena = new ArenaBuilder(this.scene);
    this.player = new Player(this.scene);
    this.slashArc = createSlashArc();
    this.scene.add(this.slashArc);
    this.input.setCanvas(this.renderer.domElement);
    this.input.onPauseRequested = () => this.togglePause();

    this.setupLevel(0, { preserveState: true });
    this.clock = new THREE.Clock();
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 260);
    this.camera.position.set(0, 4, -8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(QUALITY_SETTINGS.low.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.mount.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.HemisphereLight(0xc9d6ff, 0x2a1a12, 1.25);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffd59a, 2.6);
    this.keyLight.position.set(-8, 13, -7);
    this.keyLight.castShadow = false;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 60;
    this.keyLight.shadow.camera.left = -26;
    this.keyLight.shadow.camera.right = 26;
    this.keyLight.shadow.camera.top = 26;
    this.keyLight.shadow.camera.bottom = -26;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.PointLight(0xd97935, 1.8, 35);
    this.fillLight.position.set(4, 3, 2);
    this.scene.add(this.fillLight);

    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.applyQuality();
  }

  setDifficulty(difficultyId) {
    this.difficultyId = DIFFICULTIES[difficultyId] ? difficultyId : "normal";
    localStorage.setItem(STORAGE_KEYS.difficulty, this.difficultyId);
  }

  setSettings(settings) {
    this.settings = {
      volume: Number.isFinite(settings.volume) ? settings.volume : 0.65,
      quality: QUALITY_SETTINGS[settings.quality] ? settings.quality : "low"
    };
    this.audio.setVolume(this.settings.volume);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.settings));
    this.applyQuality();
  }

  applyQuality() {
    const quality = QUALITY_SETTINGS[this.settings.quality] ?? QUALITY_SETTINGS.low;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    this.renderer.shadowMap.enabled = quality.shadowMap;
    this.renderer.shadowMap.autoUpdate = quality.shadowMap;
    this.keyLight.castShadow = quality.shadowMap;
    if (quality.shadowSize > 0) {
      this.keyLight.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
      this.keyLight.shadow.needsUpdate = true;
    }
  }

  startGame() {
    this.audio.play("click");
    this.setDifficulty(this.ui.getDifficulty());
    this.setSettings(this.ui.getSettings());
    this.ui.showGame();
    this.currentLevelIndex = 0;
    this.setupLevel(0);
    this.state = GAME_STATE.playing;
    this.clock.getDelta();
    this.input.requestPointerLock();
    this.ui.toast("Eidklinge gezogen. Halte RMB oder Shift zum Blocken.");
  }

  restartGame() {
    this.audio.play("click");
    this.ui.hideAllOverlays();
    this.ui.showGame();
    this.currentLevelIndex = 0;
    this.setupLevel(0);
    this.state = GAME_STATE.playing;
    this.clock.getDelta();
    this.input.requestPointerLock();
  }

  returnToMenu() {
    this.audio.play("click");
    this.state = GAME_STATE.menu;
    this.input.releasePointerLock();
    this.ui.showStart();
    this.ui.updateBestLevel(LEVELS.length);
  }

  togglePause() {
    if (this.state === GAME_STATE.playing) {
      this.pauseGame();
    } else if (this.state === GAME_STATE.paused) {
      this.resumeGame();
    }
  }

  pauseGame() {
    this.state = GAME_STATE.paused;
    this.input.releasePointerLock();
    this.ui.showPause();
  }

  resumeGame() {
    this.audio.play("click");
    this.ui.hideAllOverlays();
    this.state = GAME_STATE.playing;
    this.clock.getDelta();
    this.input.requestPointerLock();
  }

  continueAfterLevel() {
    this.audio.play("click");
    this.ui.hideAllOverlays();
    if (this.currentLevelIndex >= LEVELS.length - 1) {
      this.state = GAME_STATE.victory;
      this.input.releasePointerLock();
      this.audio.play("win");
      this.ui.showVictory();
      return;
    }

    this.currentLevelIndex += 1;
    this.setupLevel(this.currentLevelIndex);
    this.state = GAME_STATE.playing;
    this.clock.getDelta();
    this.input.requestPointerLock();
  }

  setupLevel(index, options = {}) {
    const level = LEVELS[index];
    this.currentLevelIndex = index;
    this.clearEnemies();
    this.clearParticles();

    const quality = this.settings.quality ?? "medium";
    this.arena?.build(level, quality);
    this.applyLevelLighting(level);

    this.player?.reset(new THREE.Vector3(0, 0, -level.arenaSize * 0.12));
    if (this.player) {
      this.player.yaw = 0;
    }

    this.spawnEnemies(level, index);
    this.hudUpdateTimer = 999;
    if (!options.preserveState) {
      this.saveBestLevel(index + 1);
    }
    if (!options.preserveState) {
      this.ui.toast(`${level.name}: ${level.story}`, 4200);
    }
  }

  applyLevelLighting(level) {
    this.ambientLight.color.set(level.light);
    this.ambientLight.groundColor.set(level.wall);
    this.ambientLight.intensity = level.id === "lava" || level.id === "boss" ? 1.0 : 1.25;
    this.keyLight.color.set(level.light);
    this.keyLight.intensity = level.id === "forest" ? 2.0 : 2.7;
    this.fillLight.color.set(level.light);
    this.fillLight.intensity = level.id === "boss" ? 2.7 : 1.8;
  }

  saveBestLevel(levelNumber) {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.bestLevel) ?? 0);
    if (levelNumber > stored) {
      localStorage.setItem(STORAGE_KEYS.bestLevel, String(levelNumber));
      this.ui.updateBestLevel(LEVELS.length);
    }
  }

  clearEnemies() {
    this.enemies.forEach((enemy) => {
      this.scene.remove(enemy.group);
      disposeObject3D(enemy.group);
    });
    this.enemies = [];
  }

  clearParticles() {
    this.particles.forEach((particle) => {
      this.scene.remove(particle.mesh);
      particle.mesh.material.dispose();
    });
    this.particles = [];
  }

  spawnEnemies(level, levelIndex) {
    const expanded = [];
    level.enemies.forEach((entry) => {
      for (let i = 0; i < entry.count; i += 1) {
        expanded.push(entry.type);
      }
    });

    expanded.forEach((typeId, index) => {
      const base = ENEMY_TYPES[typeId];
      const stats = scaleEnemyStats(base, levelIndex, this.difficultyId);
      const radius = base.boss ? level.arenaSize * 0.11 : level.arenaSize * randomBetween(0.18, 0.34);
      const position = base.boss ? { x: 0, z: level.arenaSize * 0.21 } : pickCircularPosition(radius, index, expanded.length);
      const enemy = new Enemy({ typeId, base, stats, position, levelIndex });
      enemy.addTo(this.scene);
      this.enemies.push(enemy);
    });
  }

  loop(timestamp = 0) {
    requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
    const rawDelta = this.clock.getDelta();

    if (this.lastRenderTimeMs === 0) {
      this.lastRenderTimeMs = timestamp;
    }

    const elapsedMs = timestamp - this.lastRenderTimeMs;
    if (elapsedMs < TARGET_FRAME_MS) {
      this.trackFPS(rawDelta, false);
      return;
    }

    this.lastRenderTimeMs = timestamp - (elapsedMs % TARGET_FRAME_MS);
    const delta = Math.min(0.05, Math.max(TARGET_FRAME_TIME, elapsedMs / 1000));
    this.trackFPS(rawDelta, true);

    if (this.state === GAME_STATE.playing) {
      this.update(delta);
    }

    this.updateCamera(delta);
    this.updateParticles(delta);
    this.updateSlash(delta);
    this.renderer.render(this.scene, this.camera);
  }

  trackFPS(delta, renderedFrame) {
    this.fpsTime += delta;
    if (renderedFrame) {
      this.fpsFrames += 1;
    }
    if (this.fpsTime >= 1) {
      this.lastFps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsTime = 0;
      this.fpsFrames = 0;
      this.ui.updateFPS(this.lastFps);
    }
  }

  update(delta) {
    const level = LEVELS[this.currentLevelIndex];
    this.handleMouseLook();
    this.updatePlayerMovement(delta, level);
    this.handleCombatInput();

    const profile = DIFFICULTIES[this.difficultyId];
    this.player.update(delta, profile.staminaRegen);

    this.enemies.forEach((enemy) => {
      enemy.updateAI(delta, this.player, level.arenaSize, (attacker) => this.handleEnemyStrike(attacker));
    });
    this.resolveEnemySeparation();

    this.targetEnemy = this.findNearestEnemy();
    this.updateHUDWhenNeeded(delta, level);

    if (!this.player.alive) {
      this.triggerGameOver();
      return;
    }

    if (this.enemies.length > 0 && this.enemies.every((enemy) => enemy.dead)) {
      this.finishLevel();
    }
  }

  updateHUDWhenNeeded(delta, level) {
    const quality = QUALITY_SETTINGS[this.settings.quality] ?? QUALITY_SETTINGS.low;
    this.hudUpdateTimer += delta;
    if (this.hudUpdateTimer < 1 / quality.hudHz) {
      return;
    }

    this.hudUpdateTimer = 0;
    this.ui.updateHUD({
      player: this.player,
      level,
      levelIndex: this.currentLevelIndex,
      difficultyId: this.difficultyId,
      targetEnemy: this.targetEnemy,
      enemiesAlive: this.enemies.filter((enemy) => !enemy.dead).length,
      weaponName: PLAYER_WEAPON.name,
      comboText: this.getComboText()
    });
  }

  handleMouseLook() {
    const delta = this.input.consumeMouseDelta();
    this.player.yaw -= delta.x * 0.0026;
    this.cameraPitch = clamp(this.cameraPitch - delta.y * 0.0016, -0.36, 0.58);
  }

  updatePlayerMovement(delta, level) {
    const move = this.input.getMoveVector();
    const direction = new THREE.Vector3();
    const forward = this.player.forward;
    const right = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));

    direction.addScaledVector(forward, move.forward);
    direction.addScaledVector(right, move.strafe);

    const hasInput = direction.lengthSq() > 0.01;
    if (hasInput) {
      direction.normalize();
    }

    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    if ((this.input.isDown(" ") || this.input.isDown("space")) && hasInput && this.dashCooldown <= 0) {
      if (this.player.spendStamina(PLAYER_CONFIG.dashCost)) {
        this.player.dashTimer = PLAYER_CONFIG.dashDuration;
        this.dashCooldown = 0.62;
        this.audio.play("dash");
        this.createHitEffect(this.player.group.position, 0x5bc7b2, 8, 1.6);
      }
    }

    const speed = this.player.dashTimer > 0 ? PLAYER_CONFIG.dashSpeed : PLAYER_CONFIG.speed;
    const next = this.player.group.position.clone().addScaledVector(direction, speed * delta);
    const bound = level.arenaSize * 0.49;
    next.x = clamp(next.x, -bound, bound);
    next.z = clamp(next.z, -bound, bound);
    this.player.group.position.copy(next);
    this.player.moveAmount = lerp(this.player.moveAmount, hasInput ? 1 : 0, Math.min(1, delta * 9));

    const wantsBlock = this.input.isBlocking() && this.player.stamina > 5 && this.player.attackCooldown <= 0.18;
    this.player.isBlocking = wantsBlock;
  }

  handleCombatInput() {
    if (!this.input.consumeAttack()) {
      return;
    }

    if (this.player.isBlocking) {
      this.ui.toast("Beim Blocken kannst du nicht gleichzeitig zuschlagen.", 1200);
      return;
    }

    const combo = PLAYER_WEAPON.combo[this.player.comboIndex] ?? PLAYER_WEAPON.combo[0];
    if (this.player.attackCooldown > 0) {
      return;
    }
    if (!canSpendStamina(this.player.stamina, combo.cost)) {
      this.ui.toast("Nicht genug Ausdauer fuer den Angriff.", 1200);
      return;
    }

    this.player.spendStamina(combo.cost);
    this.player.attackCooldown = combo.cooldown;
    this.player.comboResetTimer = 1.05;
    this.player.beginAttack(this.player.comboIndex);
    this.performPlayerAttack(this.player.comboIndex);
    this.player.comboIndex = (this.player.comboIndex + 1) % PLAYER_WEAPON.combo.length;
  }

  performPlayerAttack(comboIndex) {
    const combo = PLAYER_WEAPON.combo[comboIndex];
    const profile = DIFFICULTIES[this.difficultyId];
    const baseDamage = Math.round(combo.damage * profile.playerDamage);
    let hitSomething = false;

    this.audio.play("swing");
    this.showSlash();

    this.enemies.forEach((enemy) => {
      if (enemy.dead) {
        return;
      }

      const toEnemy = enemy.group.position.clone().sub(this.player.group.position);
      toEnemy.y = 0;
      const inArc = isTargetInsideAttackArc(this.player.forward, toEnemy, PLAYER_WEAPON.range + enemy.radius * 0.5, PLAYER_WEAPON.arc);
      if (!inArc) {
        return;
      }

      const criticalResult = applyCriticalHit(
        baseDamage,
        PLAYER_WEAPON.critChance,
        PLAYER_WEAPON.critMultiplier
      );
      enemy.takeDamage(criticalResult.damage);
      const knockback = toEnemy.normalize().multiplyScalar(0.45);
      enemy.group.position.add(knockback);
      this.createHitEffect(enemy.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), enemy.base.accent, 14);
      hitSomething = true;
      if (criticalResult.critical) {
        this.ui.toast(`Kritischer ${combo.label}: ${criticalResult.damage} Schaden`, 900);
      }
    });

    if (hitSomething) {
      this.audio.play("hit");
    }
  }

  handleEnemyStrike(enemy) {
    if (this.state !== GAME_STATE.playing || enemy.dead || !this.player.alive) {
      return;
    }

    const result = resolveIncomingDamage({
      rawDamage: enemy.stats.damage,
      isBlocking: this.player.isBlocking,
      stamina: this.player.stamina,
      blockReduction: PLAYER_CONFIG.blockReduction
    });

    this.player.takeDamage(result.healthDamage);
    if (result.blocked) {
      this.player.stamina = spendStamina(this.player.stamina, result.staminaDamage);
      this.createHitEffect(this.player.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x5bc7b2, 10);
      this.audio.play("block");
      if (this.player.stamina <= 1) {
        this.ui.toast("Block gebrochen!", 1000);
      }
    } else {
      this.createHitEffect(this.player.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xd84f4b, 12);
      this.audio.play("hit");
    }
  }

  resolveEnemySeparation() {
    for (let i = 0; i < this.enemies.length; i += 1) {
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const a = this.enemies[i];
        const b = this.enemies[j];
        if (a.dead || b.dead) {
          continue;
        }
        const delta = a.group.position.clone().sub(b.group.position);
        delta.y = 0;
        const distance = delta.length();
        const minimum = a.radius + b.radius + 0.12;
        if (distance > 0.001 && distance < minimum) {
          const push = delta.normalize().multiplyScalar((minimum - distance) * 0.5);
          a.group.position.add(push);
          b.group.position.sub(push);
        }
      }
    }
  }

  findNearestEnemy() {
    let best = null;
    let bestDistance = Infinity;
    this.enemies.forEach((enemy) => {
      if (enemy.dead) {
        return;
      }
      const distance = enemy.group.position.distanceTo(this.player.group.position);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    });
    return best;
  }

  getComboText() {
    if (this.player.attackCooldown > 0) {
      return "Klinge erholt sich";
    }
    const combo = PLAYER_WEAPON.combo[this.player.comboIndex] ?? PLAYER_WEAPON.combo[0];
    return `${combo.label} bereit`;
  }

  showSlash() {
    this.slashTimer = 0.18;
    this.slashArc.visible = true;
    this.slashArc.material.opacity = 0.48;
    this.slashArc.position.copy(this.player.group.position);
    this.slashArc.rotation.z = -this.player.yaw + Math.PI * 0.15;
  }

  updateSlash(delta) {
    if (this.slashTimer <= 0) {
      this.slashArc.visible = false;
      return;
    }
    this.slashTimer = Math.max(0, this.slashTimer - delta);
    this.slashArc.position.copy(this.player.group.position);
    this.slashArc.rotation.z = -this.player.yaw + Math.PI * 0.15;
    this.slashArc.material.opacity = (this.slashTimer / 0.18) * 0.48;
  }

  createHitEffect(position, color, count = 12, speed = 2.8) {
    const quality = QUALITY_SETTINGS[this.settings.quality] ?? QUALITY_SETTINGS.low;
    const particleCount = Math.max(2, Math.round(count * quality.particles));
    for (let i = 0; i < particleCount; i += 1) {
      const mesh = new THREE.Mesh(
        this.particleGeometry,
        new THREE.MeshBasicMaterial({ color, transparent: true })
      );
      mesh.scale.setScalar(randomBetween(0.55, 1.25));
      mesh.position.copy(position);
      const velocity = new THREE.Vector3(
        randomBetween(-1, 1),
        randomBetween(0.25, 1.2),
        randomBetween(-1, 1)
      )
        .normalize()
        .multiplyScalar(randomBetween(0.8, speed));
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: randomBetween(0.34, 0.72) });
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= delta;
      particle.velocity.y -= 3.8 * delta;
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.material.opacity = Math.max(0, particle.life);
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  updateCamera(delta) {
    if (!this.player) {
      return;
    }

    const playerPosition = this.player.group.position;
    const forward = this.player.forward;
    const target = playerPosition.clone().add(new THREE.Vector3(0, 1.28 + this.cameraPitch * 0.8, 0));
    const desired = playerPosition
      .clone()
      .addScaledVector(forward, -6.1)
      .add(new THREE.Vector3(0, 3.2 + this.cameraPitch * 1.8, 0));

    this.camera.position.lerp(desired, Math.min(1, delta * 8));
    this.camera.lookAt(target.addScaledVector(forward, 2.2));

    const time = performance.now() * 0.001;
    this.fillLight.position.set(Math.sin(time * 0.7) * 5, 3.8, Math.cos(time * 0.55) * 5);
  }

  finishLevel() {
    this.state = GAME_STATE.levelComplete;
    this.input.releasePointerLock();
    const level = LEVELS[this.currentLevelIndex];
    const isFinalLevel = this.currentLevelIndex >= LEVELS.length - 1;
    this.audio.play("win");
    this.ui.showLevelComplete(level, isFinalLevel);
  }

  triggerGameOver() {
    this.state = GAME_STATE.gameOver;
    this.input.releasePointerLock();
    this.audio.play("lose");
    this.ui.showGameOver(LEVELS[this.currentLevelIndex].name);
  }
}
