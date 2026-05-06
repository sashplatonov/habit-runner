export type CelebrationParticle = {
  id: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  rotation: number;
  radius: string;
  delay: number;
  duration: number;
};

export function buildCelebrationParticles({
  startId,
  colors,
  count = 12,
  spread = 28,
  lift = 16
}: {
  startId: number;
  colors: string[];
  count?: number;
  spread?: number;
  lift?: number;
}): { particles: CelebrationParticle[]; nextId: number } {
  const particles = Array.from({ length: count }, (_, index) => {
    const angle = (-Math.PI * 0.92) + (index / Math.max(1, count - 1)) * Math.PI * 1.84;
    const distance = spread + Math.random() * 18;
    const isSpark = index % 3 === 0;
    const size = isSpark ? 4 + Math.random() * 5 : 6 + Math.random() * 4;
    return {
      id: startId + index + 1,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - lift - Math.random() * 14,
      color: colors[index % colors.length] ?? colors[0] ?? '#ffffff',
      size,
      rotation: -120 + Math.random() * 240,
      radius: isSpark ? '999px' : `${1 + Math.random() * 5}px`,
      delay: Math.round(Math.random() * 110),
      duration: 560 + Math.round(Math.random() * 260)
    };
  });

  return {
    particles,
    nextId: startId + particles.length
  };
}

export function getCelebrationLabel(nextCount: number, target: number): string {
  const safeTarget = Math.max(1, target);
  const clampedCount = Math.min(Math.max(0, nextCount), safeTarget);
  if (clampedCount >= safeTarget) {
    return 'Done';
  }
  return `${clampedCount}/${safeTarget}`;
}