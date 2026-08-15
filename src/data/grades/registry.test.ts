import { describe, it, expect } from 'vitest';
import { GRADES, gradeDefinition } from './index';
import { worlds, worldsForGrade } from '../worlds';
import { allGenerators } from '../generators';
import { GRADE_IDS } from '../../types/game';

/**
 * Guard rails for the grade registry.
 *
 * The contract test (`contentContract.test.ts`) stops a change from destroying
 * a student's saved progress. These stop a different failure: content that is
 * added but never wired up, so nobody ever sees it and nothing complains.
 */

describe('grade registry', () => {
  it('describes every grade exactly once, in order', () => {
    expect(GRADES.map((g) => g.id)).toEqual(GRADE_IDS);
    expect(new Set(GRADES.map((g) => g.id)).size).toBe(GRADES.length);
  });

  it('gives every grade the pieces the picker renders', () => {
    for (const grade of GRADES) {
      expect(grade.label.length, `grade ${grade.id} has no label`).toBeGreaterThan(0);
      expect(grade.blurb.length, `grade ${grade.id} has no blurb`).toBeGreaterThan(20);
      // Missing colour used to be silent — the card just fell back to a default.
      expect(grade.accentColor, `grade ${grade.id} has no accent colour`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(grade.worlds.length, `grade ${grade.id} has no worlds`).toBeGreaterThan(0);
    }
  });

  it('puts every world under the grade it claims', () => {
    for (const grade of GRADES) {
      for (const world of grade.worlds) {
        expect(world.grade, `${world.id} is listed under grade ${grade.id}`).toBe(grade.id);
      }
    }
  });

  it('is the single source of truth for the world list', () => {
    // If these ever disagree, something is registering worlds outside the
    // registry and the picker and the map would show different things.
    expect(worlds.length).toBe(GRADES.reduce((n, g) => n + g.worlds.length, 0));
    for (const grade of GRADES) {
      expect(worldsForGrade(grade.id).map((w) => w.id)).toEqual(grade.worlds.map((w) => w.id));
    }
  });

  it('resolves a definition for every grade', () => {
    for (const id of GRADE_IDS) expect(gradeDefinition(id)?.id).toBe(id);
  });
});

describe('content is actually reachable', () => {
  it('uses every generator in at least one level', () => {
    // A generator nobody references is invisible: it ships, it is tested, and
    // no student ever sees a question from it. That is almost always a
    // forgotten wiring step rather than a decision.
    const used = new Set(
      worlds.flatMap((w) => w.levels.flatMap((l) => (l.generated ?? []).map((s) => s.generatorId))),
    );
    const orphaned = allGenerators.map((g) => g.id).filter((id) => !used.has(id));
    expect(
      orphaned,
      `These generators are not referenced by any level, so no student will ever see them. ` +
        `Add them to a level in src/data/grades/, or delete them.`,
    ).toEqual([]);
  });

  it('gives every world at least one level, and every level questions', () => {
    for (const world of worlds) {
      expect(world.levels.length, `${world.id} has no levels`).toBeGreaterThan(0);
      for (const level of world.levels) {
        const count = level.questionIds.length + (level.generated?.length ?? 0);
        expect(count, `${level.id} would show an empty screen`).toBeGreaterThan(0);
      }
    }
  });
});
