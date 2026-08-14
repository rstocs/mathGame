import { useState } from 'react';
import type { NumericQuestion } from '../../types/game';
import type { UserAnswer } from '../../lib/scoring';
import { Button } from '../shared/Button';
import './NumericAnswer.css';

interface NumericAnswerProps {
  question: NumericQuestion;
  onAnswer: (answer: UserAnswer) => void;
  disabled: boolean;
}

export function NumericAnswer({ question, onAnswer, disabled }: NumericAnswerProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return;
    onAnswer({ type: 'numeric', value: parsed });
  };

  return (
    <div className="numeric-answer">
      <div className="numeric-answer__row">
        <input
          type="number"
          inputMode="decimal"
          className="numeric-answer__input tap-target"
          value={value}
          disabled={disabled}
          placeholder="Your answer"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        {question.unit && <span className="numeric-answer__unit">{question.unit}</span>}
      </div>
      <Button onClick={submit} disabled={disabled || value.trim() === ''}>
        Submit
      </Button>
    </div>
  );
}
