import { useRef, useState } from 'react';
import type { ExpressionQuestion } from '../../types/game';
import type { UserAnswer } from '../../lib/scoring';
import { parseExpression } from '../../lib/expression';
import { Button } from '../shared/Button';
import './ExpressionAnswer.css';

interface ExpressionAnswerProps {
  question: ExpressionQuestion;
  onAnswer: (answer: UserAnswer) => void;
  disabled: boolean;
}

/**
 * Keys a phone keyboard makes awkward. Digits are left to the device keyboard;
 * these are the symbols a kid actually reaches for when writing algebra.
 */
const KEYPAD = ['x', '(', ')', '+', '−', '×', '÷', '^'] as const;

// What each key inserts, where the label differs from the character we want.
const INSERTS: Partial<Record<(typeof KEYPAD)[number], string>> = {
  '−': '-',
  '×': '*',
  '÷': '/',
};

export function ExpressionAnswer({ question, onAnswer, disabled }: ExpressionAnswerProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = text.trim();
  // Only complain once there is something to complain about — showing "invalid"
  // while a kid is mid-way through typing "2(" would be noise.
  const parsed = trimmed === '' ? null : parseExpression(trimmed);
  const isValid = parsed?.ok ?? false;

  const insert = (key: (typeof KEYPAD)[number]) => {
    const char = INSERTS[key] ?? key;
    const input = inputRef.current;

    // Insert at the caret rather than appending, so a kid can fix the middle
    // of an expression without retyping it.
    if (input && input.selectionStart !== null) {
      const start = input.selectionStart;
      const end = input.selectionEnd ?? start;
      setText(text.slice(0, start) + char + text.slice(end));
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start + char.length, start + char.length);
      });
      return;
    }

    setText(text + char);
  };

  const submit = () => {
    if (!isValid) return;
    onAnswer({ type: 'expression', text: trimmed });
  };

  return (
    <div className="expression-answer">
      <input
        ref={inputRef}
        type="text"
        className="expression-answer__input tap-target"
        value={text}
        disabled={disabled}
        placeholder={question.variableLabel ? `e.g. 3${question.variableLabel} + 2` : 'Your answer'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Your answer"
        aria-invalid={parsed !== null && !isValid}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />

      <div className="expression-answer__keypad">
        {KEYPAD.map((key) => (
          <button
            key={key}
            type="button"
            className="expression-answer__key tap-target"
            disabled={disabled}
            // Keep focus (and the caret) in the input when a key is tapped.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(key)}
            aria-label={`Insert ${key}`}
          >
            {key}
          </button>
        ))}
      </div>

      <p className="expression-answer__status" role="status">
        {parsed !== null && !isValid ? "That isn't a complete expression yet." : ' '}
      </p>

      <Button onClick={submit} disabled={disabled || !isValid}>
        Submit
      </Button>
    </div>
  );
}
