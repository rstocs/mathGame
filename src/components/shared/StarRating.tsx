import { motion } from 'framer-motion';
import './StarRating.css';

interface StarRatingProps {
  stars: 0 | 1 | 2 | 3;
  size?: number;
}

export function StarRating({ stars, size = 48 }: StarRatingProps) {
  return (
    <div className="star-rating">
      {[1, 2, 3].map((position) => (
        <motion.span
          key={position}
          className={`star ${position <= stars ? 'star--filled' : 'star--empty'}`}
          style={{ fontSize: size }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: position * 0.2, type: 'spring', stiffness: 300, damping: 15 }}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}
