export function lerp(current, target, t) {
  return current + (target - current) * t;
}

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function pickCircularPosition(radius, index, total) {
  const angle = (Math.PI * 2 * index) / Math.max(1, total) + Math.PI * 0.16;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius
  };
}

export function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export function formatHealth(current, max) {
  return `${Math.ceil(Math.max(0, current))} / ${Math.ceil(max)}`;
}
