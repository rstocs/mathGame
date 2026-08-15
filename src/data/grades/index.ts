import type { GradeId, World } from '../../types/game';
import { grade5Worlds } from './grade5';
import { grade6Worlds } from './grade6';
import { grade7Worlds } from './grade7';
import { grade8Worlds } from './grade8';
import { grade9Worlds } from './grade9';
import { grade10Worlds } from './grade10';
import { grade11Worlds } from './grade11';

/**
 * Everything the app needs to know about one grade, in one place.
 *
 * Before this existed, adding a grade meant editing the grade union, the world
 * aggregator, two lookup maps in the grade-select screen, and a colour rule in
 * its stylesheet — and forgetting the stylesheet failed silently, giving the
 * new grade a default colour with no error anywhere. Now the screen renders
 * whatever this list says, so a grade is described once.
 */
export interface GradeDefinition {
  id: GradeId;
  /** Shown on the card, e.g. "Grade 9". */
  label: string;
  /** The high-school years are courses, not just year numbers. */
  courseName?: string;
  /** One line describing what the grade covers. */
  blurb: string;
  /** Card accent, applied as a CSS custom property rather than a class. */
  accentColor: string;
  worlds: World[];
}

/**
 * The single source of truth for which grades exist and in what order.
 *
 * To add a grade: create `gradeN.ts` beside this file, add its id to `GradeId`
 * in `src/types/game.ts`, and append one entry here. Nothing else needs
 * touching — the map, the grade picker, unlocking and review all read this.
 * Append rather than insert, and give new worlds and levels new ids; the
 * content contract will stop you if a change would cost students progress.
 */
export const GRADES: GradeDefinition[] = [
  {
    id: 5,
    label: 'Grade 5',
    blurb: 'Decimals, fractions, order of operations, volume, and plotting points.',
    accentColor: '#1e88e5',
    worlds: grade5Worlds,
  },
  {
    id: 6,
    label: 'Grade 6',
    blurb: 'Dividing fractions, factors, negative numbers, variables, and data.',
    accentColor: '#3d4d8c',
    worlds: grade6Worlds,
  },
  {
    id: 7,
    label: 'Grade 7',
    blurb: 'Ratios, negative numbers, expressions, geometry, and probability.',
    accentColor: '#e8752c',
    worlds: grade7Worlds,
  },
  {
    id: 8,
    label: 'Grade 8',
    blurb: 'Exponents, scientific notation, slope, Pythagoras, and scatter plots.',
    accentColor: '#8e5ce8',
    worlds: grade8Worlds,
  },
  {
    id: 9,
    label: 'Grade 9',
    courseName: 'Algebra I',
    blurb: 'Algebra I: systems, functions, sequences, and quadratics.',
    accentColor: '#2ecc71',
    worlds: grade9Worlds,
  },
  {
    id: 10,
    label: 'Grade 10',
    courseName: 'Geometry',
    blurb: 'Geometry: distance, trigonometry, circles, and transformations.',
    accentColor: '#c94f8f',
    worlds: grade10Worlds,
  },
  {
    id: 11,
    label: 'Grade 11',
    courseName: 'Algebra II',
    blurb: 'Algebra II: the quadratic formula, logarithms, and complex numbers.',
    accentColor: '#0f9b8e',
    worlds: grade11Worlds,
  },
];

export function gradeDefinition(grade: GradeId): GradeDefinition | undefined {
  return GRADES.find((g) => g.id === grade);
}
