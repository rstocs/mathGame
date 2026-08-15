import type { GradeId, World } from '../types/game';
import { GRADES } from './grades';

/**
 * Lookups over the grade registry. This file holds NO content — every world
 * and level lives in `src/data/grades/gradeN.ts`, so adding or editing content
 * never means touching the code that reads it.
 */

export const worlds: World[] = GRADES.flatMap((grade) => grade.worlds);

/** The worlds shown on one grade's map, in map order. */
export function worldsForGrade(grade: GradeId): World[] {
  return worlds.filter((w) => w.grade === grade);
}

export function getWorld(worldId: string): World | undefined {
  return worlds.find((w) => w.id === worldId);
}

/** The world a level belongs to. Levels are unique across worlds. */
export function getWorldForLevel(levelId: string): World | undefined {
  return worlds.find((w) => w.levels.some((l) => l.id === levelId));
}

export function getLevel(levelId: string) {
  for (const world of worlds) {
    const level = world.levels.find((l) => l.id === levelId);
    if (level) return level;
  }
  return undefined;
}
