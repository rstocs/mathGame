/**
 * A deliberately small algebra parser for checking student-typed expressions.
 *
 * Answers are compared by *evaluating* both sides at several sample values of
 * the variable rather than by comparing text, so `2(x+3)`, `2x+6` and `6+2x`
 * all count as the same answer. That is the behaviour we want pedagogically:
 * a kid who factors differently but correctly should not be marked wrong.
 *
 * The grammar is restricted on purpose and parsing is hand-rolled recursive
 * descent -- never `eval`, which would execute whatever a kid typed.
 *
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/' | implicit) unary)*
 *   unary      := ('-' | '+') unary | power
 *   power      := atom ('^' unary)?
 *   atom       := number | variable | '(' expression ')'
 */

export type ParseResult =
  | { ok: true; evaluate: (vars: Record<string, number>) => number; variables: string[] }
  | { ok: false; error: string };

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

const SUPERSCRIPTS: Record<string, string> = { '²': '^2', '³': '^3' };

function normalize(input: string): string {
  let out = '';
  for (const ch of input) {
    if (ch in SUPERSCRIPTS) out += SUPERSCRIPTS[ch];
    else if (ch === '×' || ch === '·' || ch === '∙') out += '*';
    else if (ch === '÷') out += '/';
    else if (ch === '−' || ch === '–' || ch === '—') out += '-';
    else out += ch;
  }
  return out;
}

/**
 * Whitespace- and notation-insensitive text form, for asking "did the kid just
 * write this exact expression back?" — a question that equivalence checking
 * cannot answer, since the unexpanded form is equivalent by definition.
 */
export function normalizeForComparison(input: string): string {
  return normalize(input).replace(/\s+/g, '').toLowerCase();
}

function tokenize(input: string): Token[] | string {
  const tokens: Token[] = [];
  const src = normalize(input);
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === ' ' || ch === '\t') {
      i += 1;
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < src.length && src[j] >= '0' && src[j] <= '9') j += 1;
      if (src[j] === '.') {
        j += 1;
        while (j < src.length && src[j] >= '0' && src[j] <= '9') j += 1;
      }
      tokens.push({ kind: 'number', value: Number.parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }

    // A bare leading decimal, e.g. ".5".
    if (ch === '.') {
      let j = i + 1;
      while (j < src.length && src[j] >= '0' && src[j] <= '9') j += 1;
      if (j === i + 1) return `Unexpected "." at position ${i + 1}`;
      tokens.push({ kind: 'number', value: Number.parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }

    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      // Single-letter variables only; `xy` is x*y, not a variable named "xy".
      tokens.push({ kind: 'name', value: ch.toLowerCase() });
      i += 1;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ kind: 'op', value: ch });
      i += 1;
      continue;
    }

    if (ch === '(' || ch === '[') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }

    if (ch === ')' || ch === ']') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }

    return `Unexpected character "${ch}"`;
  }

  return tokens;
}

type Node = (vars: Record<string, number>) => number;

export function parseExpression(input: string): ParseResult {
  if (input.trim() === '') return { ok: false, error: 'Empty expression' };

  const tokens = tokenize(input);
  if (typeof tokens === 'string') return { ok: false, error: tokens };
  if (tokens.length === 0) return { ok: false, error: 'Empty expression' };

  const variables = new Set<string>();
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function parseExpr(): Node | string {
    let left = parseTerm();
    if (typeof left === 'string') return left;

    for (;;) {
      const t = peek();
      if (t?.kind === 'op' && (t.value === '+' || t.value === '-')) {
        pos += 1;
        const right = parseTerm();
        if (typeof right === 'string') return right;
        const l = left as Node;
        left = t.value === '+' ? (v) => l(v) + right(v) : (v) => l(v) - right(v);
      } else {
        return left;
      }
    }
  }

  function parseTerm(): Node | string {
    let left = parseUnary();
    if (typeof left === 'string') return left;

    for (;;) {
      const t = peek();

      if (t?.kind === 'op' && (t.value === '*' || t.value === '/')) {
        pos += 1;
        const right = parseUnary();
        if (typeof right === 'string') return right;
        const l = left as Node;
        left = t.value === '*' ? (v) => l(v) * right(v) : (v) => l(v) / right(v);
        continue;
      }

      // Implicit multiplication: 2x, 3(x+1), (x+1)(x-1), 2 3 is not allowed.
      if (t?.kind === 'name' || t?.kind === 'lparen') {
        const right = parseUnary();
        if (typeof right === 'string') return right;
        const l = left as Node;
        left = (v) => l(v) * right(v);
        continue;
      }

      return left;
    }
  }

  function parseUnary(): Node | string {
    const t = peek();
    if (t?.kind === 'op' && (t.value === '-' || t.value === '+')) {
      pos += 1;
      const operand = parseUnary();
      if (typeof operand === 'string') return operand;
      return t.value === '-' ? (v) => -operand(v) : operand;
    }
    return parsePower();
  }

  function parsePower(): Node | string {
    const base = parseAtom();
    if (typeof base === 'string') return base;

    const t = peek();
    if (t?.kind === 'op' && t.value === '^') {
      pos += 1;
      // Right-associative, and the exponent may itself be signed: x^-2.
      const exponent = parseUnary();
      if (typeof exponent === 'string') return exponent;
      return (v) => Math.pow(base(v), exponent(v));
    }
    return base;
  }

  function parseAtom(): Node | string {
    const t = peek();

    if (t === undefined) return 'Unexpected end of expression';

    if (t.kind === 'number') {
      pos += 1;
      const value = t.value;
      return () => value;
    }

    if (t.kind === 'name') {
      pos += 1;
      const name = t.value;
      variables.add(name);
      return (v) => {
        const value = v[name];
        return value === undefined ? Number.NaN : value;
      };
    }

    if (t.kind === 'lparen') {
      pos += 1;
      const inner = parseExpr();
      if (typeof inner === 'string') return inner;
      if (peek()?.kind !== 'rparen') return 'Missing closing parenthesis';
      pos += 1;
      return inner;
    }

    if (t.kind === 'rparen') return 'Unexpected closing parenthesis';

    return `Unexpected operator "${t.kind === 'op' ? t.value : ''}"`;
  }

  const root = parseExpr();
  if (typeof root === 'string') return { ok: false, error: root };
  if (pos !== tokens.length) return { ok: false, error: 'Unexpected trailing input' };

  return { ok: true, evaluate: root, variables: [...variables] };
}

const SAMPLE_POINTS = [-3.7, -1.25, -0.5, 0, 0.5, 1.3, 2, 4.75, 7.1];
const RELATIVE_TOLERANCE = 1e-6;

/**
 * True when two expressions agree at every sample point. Sample values are
 * deliberately non-integer and mixed-sign so that near misses (x vs x², 2x vs
 * 2x+0.0001) separate, and so a lucky agreement at a single point can't pass.
 */
export function areExpressionsEquivalent(a: string, b: string): boolean {
  const left = parseExpression(a);
  const right = parseExpression(b);
  if (!left.ok || !right.ok) return false;

  const names = [...new Set([...left.variables, ...right.variables])];
  if (names.length > 2) return false;

  let compared = 0;

  for (const sample of SAMPLE_POINTS) {
    // With two variables, walk the second one out of step with the first so the
    // pair traces distinct points rather than the y = x diagonal.
    const vars: Record<string, number> = {};
    names.forEach((name, index) => {
      vars[name] = index === 0 ? sample : sample * 1.7 + 0.9;
    });

    const lv = left.evaluate(vars);
    const rv = right.evaluate(vars);

    // Skip points where either side is undefined (division by zero, roots of
    // negatives); a mismatch there says nothing about equivalence.
    if (!Number.isFinite(lv) || !Number.isFinite(rv)) continue;

    const scale = Math.max(Math.abs(lv), Math.abs(rv), 1);
    if (Math.abs(lv - rv) > RELATIVE_TOLERANCE * scale) return false;
    compared += 1;
  }

  // If every sample was undefined on both sides we learned nothing.
  return compared >= 3;
}
