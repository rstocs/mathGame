import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DragDropMatchQuestion, DragDropOrderQuestion } from '../../types/game';
import type { UserAnswer } from '../../lib/scoring';
import { Button } from '../shared/Button';
import './DragDropAnswer.css';

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface DragDropOrderAnswerProps {
  question: DragDropOrderQuestion;
  onAnswer: (answer: UserAnswer) => void;
  disabled: boolean;
}

export function DragDropOrderAnswer({ question, onAnswer, disabled }: DragDropOrderAnswerProps) {
  const shuffled = useMemo(() => shuffle(question.items), [question.id]);
  const [order, setOrder] = useState<string[]>([]);

  const pool = shuffled.filter((item) => !order.includes(item));

  return (
    <div className="dnd-answer">
      <p className="dnd-answer__hint">Tap the items in order.</p>
      <div className="dnd-answer__slots">
        {order.map((item, i) => (
          <motion.button
            key={item}
            type="button"
            className="dnd-chip dnd-chip--placed"
            layout
            disabled={disabled}
            onClick={() => setOrder(order.filter((_, idx) => idx !== i))}
          >
            {i + 1}. {item}
          </motion.button>
        ))}
      </div>
      <div className="dnd-answer__pool">
        <AnimatePresence>
          {pool.map((item) => (
            <motion.button
              key={item}
              type="button"
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="dnd-chip"
              disabled={disabled}
              onClick={() => setOrder([...order, item])}
            >
              {item}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <Button
        disabled={disabled || order.length !== question.items.length}
        onClick={() => onAnswer({ type: 'drag-drop-order', order })}
      >
        Submit
      </Button>
    </div>
  );
}

interface DragDropMatchAnswerProps {
  question: DragDropMatchQuestion;
  onAnswer: (answer: UserAnswer) => void;
  disabled: boolean;
}

export function DragDropMatchAnswer({ question, onAnswer, disabled }: DragDropMatchAnswerProps) {
  const shuffledRight = useMemo(
    () => shuffle(question.pairs.map((p) => p.right)),
    [question.id],
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const matchedRightValues = new Set(Object.values(matches));

  return (
    <div className="dnd-answer">
      <p className="dnd-answer__hint">Tap a left item, then tap its match on the right.</p>
      <div className="match-columns">
        <div className="match-column">
          {question.pairs.map((pair) => (
            <button
              key={pair.left}
              type="button"
              disabled={disabled || Boolean(matches[pair.left])}
              className={`dnd-chip match-chip ${selectedLeft === pair.left ? 'match-chip--selected' : ''} ${matches[pair.left] ? 'dnd-chip--placed' : ''}`}
              onClick={() => setSelectedLeft(pair.left)}
            >
              {pair.left}
              {matches[pair.left] ? ` → ${matches[pair.left]}` : ''}
            </button>
          ))}
        </div>
        <div className="match-column">
          {shuffledRight.map((right) => (
            <button
              key={right}
              type="button"
              disabled={disabled || matchedRightValues.has(right) || !selectedLeft}
              className={`dnd-chip match-chip ${matchedRightValues.has(right) ? 'dnd-chip--placed' : ''}`}
              onClick={() => {
                if (!selectedLeft) return;
                setMatches({ ...matches, [selectedLeft]: right });
                setSelectedLeft(null);
              }}
            >
              {right}
            </button>
          ))}
        </div>
      </div>
      <Button
        disabled={disabled || Object.keys(matches).length !== question.pairs.length}
        onClick={() =>
          onAnswer({
            type: 'drag-drop-match',
            pairs: Object.entries(matches).map(([left, right]) => ({ left, right })),
          })
        }
      >
        Submit
      </Button>
    </div>
  );
}
