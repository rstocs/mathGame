import { describe, it, expect } from 'vitest';
import { parseExpression, areExpressionsEquivalent } from './expression';

function evalAt(src: string, vars: Record<string, number>): number {
  const parsed = parseExpression(src);
  if (!parsed.ok) throw new Error(`failed to parse ${src}: ${parsed.error}`);
  return parsed.evaluate(vars);
}

describe('parseExpression — arithmetic', () => {
  it('evaluates the four operations with correct precedence', () => {
    expect(evalAt('2+3*4', {})).toBe(14);
    expect(evalAt('(2+3)*4', {})).toBe(20);
    expect(evalAt('10-4-3', {})).toBe(3); // left-associative
    expect(evalAt('12/4/3', {})).toBe(1);
  });

  it('handles decimals, including a bare leading dot', () => {
    expect(evalAt('1.5*2', {})).toBe(3);
    expect(evalAt('.5+.25', {})).toBe(0.75);
  });

  it('handles unary and repeated signs', () => {
    expect(evalAt('-5', {})).toBe(-5);
    expect(evalAt('-(3+2)', {})).toBe(-5);
    expect(evalAt('3 - -2', {})).toBe(5);
    expect(evalAt('--4', {})).toBe(4);
  });

  it('treats ^ as right-associative and allows signed exponents', () => {
    expect(evalAt('2^3', {})).toBe(8);
    expect(evalAt('2^3^2', {})).toBe(512); // 2^(3^2), not (2^3)^2
    expect(evalAt('2^-2', {})).toBe(0.25);
  });

  it('binds unary minus outside the exponent, as maths does', () => {
    expect(evalAt('-3^2', {})).toBe(-9);
  });
});

describe('parseExpression — variables and implicit multiplication', () => {
  it('substitutes variable values', () => {
    expect(evalAt('x+1', { x: 4 })).toBe(5);
    expect(evalAt('2x', { x: 4 })).toBe(8);
  });

  it('reads juxtaposition as multiplication', () => {
    expect(evalAt('3(x+1)', { x: 2 })).toBe(9);
    expect(evalAt('(x+1)(x-1)', { x: 3 })).toBe(8);
    expect(evalAt('2x y', { x: 3, y: 5 })).toBe(30);
  });

  it('accepts the superscripts and operators a kid may paste in', () => {
    expect(evalAt('x²', { x: 5 })).toBe(25);
    expect(evalAt('3×4', {})).toBe(12);
    expect(evalAt('8÷2', {})).toBe(4);
    expect(evalAt('5−2', {})).toBe(3); // unicode minus
  });

  it('is case-insensitive about variable names', () => {
    expect(evalAt('X+x', { x: 3 })).toBe(6);
  });

  it('reports which variables an expression uses', () => {
    const parsed = parseExpression('3x + 2y');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.variables.sort()).toEqual(['x', 'y']);
  });
});

describe('parseExpression — malformed input', () => {
  it.each([
    ['', 'empty'],
    ['   ', 'blank'],
    ['2+', 'trailing operator'],
    ['(2+3', 'unclosed paren'],
    ['2+3)', 'extra close paren'],
    ['*5', 'leading binary operator'],
    ['2 $ 3', 'unknown character'],
    ['.', 'lone dot'],
  ])('rejects %j (%s) without throwing', (input) => {
    const parsed = parseExpression(input);
    expect(parsed.ok).toBe(false);
  });

  it('never executes input as code', () => {
    // Anything with JS syntax outside the grammar is a parse error...
    expect(parseExpression('1;console.log(2)').ok).toBe(false);
    expect(parseExpression('x=1').ok).toBe(false);

    // ...and a bare word is read as a product of single-letter variables, so
    // `alert(1)` is a*l*e*r*t*1. It parses, but it is arithmetic, not a call:
    // with nothing bound it is NaN, and NaN never matches a correct answer.
    const parsed = parseExpression('alert(1)');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.variables.sort()).toEqual(['a', 'e', 'l', 'r', 't']);
      expect(Number.isNaN(parsed.evaluate({}))).toBe(true);
    }
    expect(areExpressionsEquivalent('alert(1)', '1')).toBe(false);
  });

  it('yields NaN for an unbound variable rather than guessing zero', () => {
    expect(Number.isNaN(evalAt('x+1', {}))).toBe(true);
  });
});

describe('areExpressionsEquivalent', () => {
  it('accepts equivalent forms a kid might legitimately write', () => {
    expect(areExpressionsEquivalent('2(x+3)', '2x+6')).toBe(true);
    expect(areExpressionsEquivalent('2x+6', '6+2x')).toBe(true);
    expect(areExpressionsEquivalent('(x+2)(x-3)', 'x^2-x-6')).toBe(true);
    expect(areExpressionsEquivalent('x+x', '2x')).toBe(true);
    expect(areExpressionsEquivalent('3x-x', '2x')).toBe(true);
    expect(areExpressionsEquivalent('0.5x', 'x/2')).toBe(true);
  });

  it('ignores whitespace and notation differences', () => {
    expect(areExpressionsEquivalent('2 x + 6', '2*x+6')).toBe(true);
    expect(areExpressionsEquivalent('x²+1', 'x^2+1')).toBe(true);
  });

  it('rejects near misses', () => {
    expect(areExpressionsEquivalent('2x+3', '2x+6')).toBe(false);
    expect(areExpressionsEquivalent('2x', 'x^2')).toBe(false);
    expect(areExpressionsEquivalent('x+1', 'x-1')).toBe(false);
    expect(areExpressionsEquivalent('3x', '2x')).toBe(false);
    expect(areExpressionsEquivalent('(x+2)(x-3)', 'x^2+x-6')).toBe(false);
  });

  it('does not treat a single coincidental crossing as equivalence', () => {
    // x² and 2x agree at x=0 and x=2 but differ everywhere else.
    expect(areExpressionsEquivalent('x^2', '2x')).toBe(false);
  });

  it('handles two-variable expressions', () => {
    expect(areExpressionsEquivalent('x+y', 'y+x')).toBe(true);
    expect(areExpressionsEquivalent('2(x+y)', '2x+2y')).toBe(true);
    expect(areExpressionsEquivalent('x+y', 'x-y')).toBe(false);
    // Would pass if both variables were sampled with the same value.
    expect(areExpressionsEquivalent('x', 'y')).toBe(false);
  });

  it('compares constants', () => {
    expect(areExpressionsEquivalent('6', '2*3')).toBe(true);
    expect(areExpressionsEquivalent('6', '7')).toBe(false);
  });

  it('returns false when either side is unparseable', () => {
    expect(areExpressionsEquivalent('2x+', '2x')).toBe(false);
    expect(areExpressionsEquivalent('2x', '')).toBe(false);
  });

  it('survives expressions undefined at some sample points', () => {
    expect(areExpressionsEquivalent('1/x', '1/x')).toBe(true);
    expect(areExpressionsEquivalent('1/x', '2/x')).toBe(false);
  });
});
