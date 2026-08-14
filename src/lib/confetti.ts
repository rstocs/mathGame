import confetti from 'canvas-confetti';

export function burstSmall(origin?: { x: number; y: number }) {
  confetti({
    particleCount: 40,
    spread: 55,
    startVelocity: 30,
    origin: origin ?? { x: 0.5, y: 0.6 },
    colors: ['#2ecc71', '#ffc94a', '#1e88e5', '#e8752c'],
  });
}

export function burstBig() {
  confetti({
    particleCount: 150,
    spread: 100,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#2ecc71', '#ffc94a', '#1e88e5', '#e8752c', '#8e5ce8'],
  });
}
