import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCriticalHit,
  canSpendStamina,
  recoverStamina,
  resolveIncomingDamage,
  scaleEnemyStats,
  spendStamina
} from "../js/combatMath.js";
import { ENEMY_TYPES, QUALITY_SETTINGS } from "../js/config.js";

test("difficulty and level scaling make nightmare enemies tougher than easy enemies", () => {
  const easy = scaleEnemyStats(ENEMY_TYPES.ashling, 3, "easy");
  const nightmare = scaleEnemyStats(ENEMY_TYPES.ashling, 3, "nightmare");

  assert.ok(nightmare.health > easy.health);
  assert.ok(nightmare.damage > easy.damage);
  assert.ok(nightmare.speed > easy.speed);
  assert.ok(nightmare.attackCooldown < easy.attackCooldown);
});

test("blocking reduces health damage and spends stamina", () => {
  const result = resolveIncomingDamage({
    rawDamage: 30,
    isBlocking: true,
    stamina: 50,
    blockReduction: 0.7
  });

  assert.equal(result.blocked, true);
  assert.equal(result.healthDamage, 9);
  assert.equal(result.staminaDamage, 41);
});

test("unblocked hits apply full damage", () => {
  const result = resolveIncomingDamage({
    rawDamage: 18,
    isBlocking: false,
    stamina: 50,
    blockReduction: 0.7
  });

  assert.deepEqual(result, { healthDamage: 18, staminaDamage: 0, blocked: false });
});

test("stamina spending and recovery stay inside bounds", () => {
  assert.equal(canSpendStamina(20, 19), true);
  assert.equal(canSpendStamina(20, 21), false);
  assert.equal(spendStamina(10, 40), 0);
  assert.equal(recoverStamina(92, 100, 30, 1), 100);
});

test("critical hits use deterministic roll for testability", () => {
  assert.deepEqual(applyCriticalHit(20, 0.15, 1.5, 0.1), { damage: 30, critical: true });
  assert.deepEqual(applyCriticalHit(20, 0.15, 1.5, 0.9), { damage: 20, critical: false });
});

test("60 fps quality profile keeps expensive rendering features disabled", () => {
  assert.equal(QUALITY_SETTINGS.low.label, "60 FPS");
  assert.equal(QUALITY_SETTINGS.low.shadowMap, false);
  assert.ok(QUALITY_SETTINGS.low.pixelRatio <= 1);
  assert.ok(QUALITY_SETTINGS.low.particles < QUALITY_SETTINGS.high.particles);
  assert.ok(QUALITY_SETTINGS.low.wallSegments < QUALITY_SETTINGS.high.wallSegments);
});
