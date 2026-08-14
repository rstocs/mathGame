import { motion } from 'framer-motion';
import type { MultipleChoiceQuestion } from '../../types/game';
import type { UserAnswer } from '../../lib/scoring';
import './MultipleChoiceAnswer.css';

interface MultipleChoiceAnswerProps {
  question: MultipleChoiceQuestion;
  onAnswer: (answer: UserAnswer) => void;
  disabled: boolean;
}

export function MultipleChoiceAnswer({ question, onAnswer, disabled }: MultipleChoiceAnswerProps) {
  return (
    <div className="mc-grid">
      {question.choices.map((choice, index) => (
        <motion.button
          key={index}
          type="button"
          className="mc-choice tap-target"
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.02 }}
          whileTap={disabled ? undefined : { scale: 0.97 }}
          onClick={() => onAnswer({ type: 'multiple-choice', choiceIndex: index })}
        >
          {choice}
        </motion.button>
      ))}
    </div>
  );
}
