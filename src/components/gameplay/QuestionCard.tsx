import { motion } from 'framer-motion';
import type { Question } from '../../types/game';
import type { UserAnswer } from '../../lib/scoring';
import { MultipleChoiceAnswer } from './MultipleChoiceAnswer';
import { NumericAnswer } from './NumericAnswer';
import { DragDropOrderAnswer, DragDropMatchAnswer } from './DragDropAnswer';
import { VisualHint } from './VisualHint';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
  feedback: { isCorrect: boolean } | null;
}

export function QuestionCard({ question, onAnswer, feedback }: QuestionCardProps) {
  const disabled = feedback !== null;

  return (
    <motion.div
      className={`question-card ${feedback ? (feedback.isCorrect ? 'anim-pulse-success' : 'anim-flash-danger') : ''}`}
      animate={feedback && !feedback.isCorrect ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="question-card__prompt">{question.prompt}</p>
      {question.imageHint && <VisualHint hint={question.imageHint} />}
      {renderAnswer(question, onAnswer, disabled)}
    </motion.div>
  );
}

function renderAnswer(question: Question, onAnswer: (answer: UserAnswer) => void, disabled: boolean) {
  switch (question.type) {
    case 'multiple-choice':
      return <MultipleChoiceAnswer question={question} onAnswer={onAnswer} disabled={disabled} />;
    case 'numeric':
      return <NumericAnswer question={question} onAnswer={onAnswer} disabled={disabled} />;
    case 'drag-drop-order':
      return <DragDropOrderAnswer question={question} onAnswer={onAnswer} disabled={disabled} />;
    case 'drag-drop-match':
      return <DragDropMatchAnswer question={question} onAnswer={onAnswer} disabled={disabled} />;
  }
}
