import { DIFFICULTIES } from "./config.js";

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getDifficultyProfile(difficultyId) {
  return DIFFICULTIES[difficultyId] ?? DIFFICULTIES.normal;
}

export function scaleEnemyStats(baseStats, levelIndex, difficultyId) {
  const profile = getDifficultyProfile(difficultyId);
  const levelFactor = 1 + levelIndex * 0.18;

  return {
    health: Math.round(baseStats.health * levelFactor * profile.enemyHealth),
    damage: Math.round(baseStats.damage * (1 + levelIndex * 0.14) * profile.enemyDamage),
    speed: baseStats.speed * profile.enemySpeed * (1 + levelIndex * 0.035),
    attackCooldown: Math.max(0.48, baseStats.attackCooldown * profile.enemyCooldown - levelIndex * 0.03),
    attackRange: baseStats.attackRange,
    windup: Math.max(0.24, baseStats.windup - levelIndex * 0.015),
    reach: baseStats.reach
  };
}

export function canSpendStamina(stamina, cost) {
  return stamina >= cost;
}

export function spendStamina(stamina, cost) {
  return clamp(stamina - cost, 0, 100);
}

export function recoverStamina(stamina, maxStamina, regenPerSecond, deltaSeconds, multiplier = 1) {
  return clamp(stamina + regenPerSecond * multiplier * deltaSeconds, 0, maxStamina);
}

export function resolveIncomingDamage({ rawDamage, isBlocking, stamina, blockReduction }) {
  if (!isBlocking || stamina <= 0) {
    return { healthDamage: rawDamage, staminaDamage: 0, blocked: false };
  }

  const healthDamage = Math.max(1, Math.round(rawDamage * (1 - blockReduction)));
  const staminaDamage = Math.round(rawDamage * 1.35);
  return { healthDamage, staminaDamage, blocked: true };
}

export function applyCriticalHit(damage, chance, multiplier, randomValue = Math.random()) {
  if (randomValue <= chance) {
    return { damage: Math.round(damage * multiplier), critical: true };
  }

  return { damage, critical: false };
}

export function isTargetInsideAttackArc(attackerForward, toTarget, range, arcRadians) {
  const distance = toTarget.length();
  if (distance > range || distance <= 0.001) {
    return false;
  }

  const normalized = toTarget.clone().normalize();
  const angle = attackerForward.angleTo(normalized);
  return angle <= arcRadians * 0.5;
}
