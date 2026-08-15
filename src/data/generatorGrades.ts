import type { GradeId } from '../types/game';
import { worlds } from './worlds';

/**
 * The lowest grade whose levels use each generator — the grade where a kid
 * legitimately first meets that skill.
 *
 * Many generators appear in several grades: `rp-unit-rate` is drilled in grade
 * 6 and revisited in grade 7, `g8-pythagorean` in grade 8 and again in grade 10
 * trigonometry. Taking the LOWEST is what makes "is this above my grade?"
 * meaningful — a grade 7 kid meeting a unit-rate question is on home ground,
 * even though grade 6 owns it.
 */
const homeGrades: Map<string, GradeId> = (() => {
  const map = new Map<string, GradeId>();
  for (const world of worlds) {
    for (const level of world.levels) {
      for (const slot of level.generated ?? []) {
        const current = map.get(slot.generatorId);
        if (current === undefined || world.grade < current) {
          map.set(slot.generatorId, world.grade);
        }
      }
    }
  }
  return map;
})();

/** Undefined for a generator no level references yet. */
export function homeGradeOf(generatorId: string): GradeId | undefined {
  return homeGrades.get(generatorId);
}
