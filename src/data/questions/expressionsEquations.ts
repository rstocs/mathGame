import type { Question } from '../../types/game';

export const expressionsEquationsQuestions: Question[] = [
  {
    id: 'ee-l1-q1',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Simplify by combining like terms: 4x + 7 + 2x − 3',
    choices: ['6x + 4', '6x + 10', '2x + 4', '8x + 4'],
    correctIndex: 0,
    explanation:
      'Group the x-terms and the number terms separately: 4x + 2x = 6x, and 7 − 3 = 4. Putting them together gives 6x + 4.',
  },
  {
    id: 'ee-l1-q2',
    strand: 'expressions-equations',
    type: 'expression',
    prompt: 'Apply the distributive property and write the expanded form of 3(x + 4).',
    correctExpression: '3x + 12',
    rejectSameAs: '3(x + 4)',
    variableLabel: 'x',
    explanation:
      'The distributive property means you multiply the 3 by EACH term inside the parentheses: 3 × x = 3x and 3 × 4 = 12. So 3(x + 4) = 3x + 12. A common mistake is only multiplying the first term and leaving the 4 alone.',
  },
  {
    id: 'ee-l1-q3',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Simplify 5x − 2x + 9, then find the value of the expression when x = 3.',
    correctAnswer: 18,
    explanation:
      'First combine like terms: 5x − 2x = 3x, so the expression simplifies to 3x + 9. Substituting x = 3 gives 3(3) + 9 = 9 + 9 = 18.',
  },
  {
    id: 'ee-l1-q4',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Simplify completely: 2(3x − 5) + 4x',
    choices: ['10x − 10', '6x − 5 + 4x', '10x − 5', '6x − 10'],
    correctIndex: 0,
    explanation:
      'Distribute first: 2(3x − 5) = 6x − 10. The expression becomes 6x − 10 + 4x. Now combine the like terms 6x and 4x to get 10x, giving a fully simplified 10x − 10. Choice "6x − 5 + 4x" only distributed to the first term inside the parentheses and forgot the second, and "10x − 5" combined the x-terms correctly but dropped the −5 instead of −10.',
  },
  {
    id: 'ee-l1-q5',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Simplify: 8x + 3 − 3x − 3. What is the coefficient of x in the simplified expression?',
    correctAnswer: 5,
    explanation:
      'Combine the x-terms: 8x − 3x = 5x. Combine the constants: 3 − 3 = 0. So the simplified expression is 5x, and the coefficient of x is 5.',
  },
  {
    id: 'ee-l1-q6',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'A rectangle has width x and length (x + 6). Which expression represents its perimeter?',
    choices: ['2x + 6', '4x + 12', 'x² + 6x', '4x + 6'],
    correctIndex: 1,
    explanation:
      'Perimeter = 2(width) + 2(length) = 2(x) + 2(x + 6) = 2x + 2x + 12 = 4x + 12. Remember to distribute the 2 across BOTH terms in (x + 6), not just the x.',
  },
  {
    id: 'ee-l1-q7',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Simplify −4(2x − 3) + 5x. What is the coefficient of x in the result?',
    correctAnswer: -3,
    explanation:
      'Distribute −4 across both terms: −4(2x) = −8x and −4(−3) = +12, giving −8x + 12. Then add 5x: −8x + 5x = −3x. The simplified expression is −3x + 12, so the coefficient of x is −3.',
  },
  {
    id: 'ee-l1-q8',
    strand: 'expressions-equations',
    type: 'drag-drop-match',
    prompt: 'Match each expression on the left with its simplified equivalent on the right.',
    pairs: [
      { left: '2(x + 5)', right: '2x + 10' },
      { left: '3x + 4x', right: '7x' },
      { left: '6x − x + 2', right: '5x + 2' },
      { left: '4(2x − 1)', right: '8x − 4' },
    ],
    explanation:
      '2(x + 5) distributes to 2x + 10. 3x + 4x combines to 7x since they are like terms. 6x − x + 2 combines the x-terms (6x − x = 5x) to give 5x + 2. 4(2x − 1) distributes to 8x − 4, since 4 × 2x = 8x and 4 × (−1) = −4.',
  },
  {
    id: 'ee-l1-q9',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Which expression is NOT equivalent to 6x + 9?',
    choices: ['3(2x + 3)', '9 + 6x', '3x + 3x + 9', '3(2x + 9)'],
    correctIndex: 3,
    explanation:
      '3(2x + 9) distributes to 6x + 27, not 6x + 9, so it is NOT equivalent. Check the others: 3(2x + 3) = 6x + 9 ✓, 9 + 6x is just the terms reordered ✓, and 3x + 3x + 9 combines to 6x + 9 ✓.',
  },
  {
    id: 'ee-l2-q1',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 2x + 3 = 11',
    correctAnswer: 4,
    explanation:
      'First undo the addition by subtracting 3 from both sides: 2x = 8. Then undo the multiplication by dividing both sides by 2: x = 4. Check: 2(4) + 3 = 8 + 3 = 11 ✓.',
  },
  {
    id: 'ee-l2-q2',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 5x − 7 = 18',
    correctAnswer: 5,
    explanation:
      'Add 7 to both sides: 5x = 25. Divide both sides by 5: x = 5. Check: 5(5) − 7 = 25 − 7 = 18 ✓.',
  },
  {
    id: 'ee-l2-q3',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve for x: 3x + 4 = 19',
    choices: ['x = 5', 'x = 7.67', 'x = 4', 'x = 6'],
    correctIndex: 0,
    explanation:
      'Subtract 4 from both sides: 3x = 15. Divide both sides by 3: x = 5. The choice x = 7.67 comes from forgetting to subtract first and dividing 19 by 3 + 4 incorrectly — always undo addition/subtraction before multiplication/division.',
  },
  {
    id: 'ee-l2-q4',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: x/4 + 2 = 9',
    correctAnswer: 28,
    explanation:
      'Subtract 2 from both sides: x/4 = 7. Multiply both sides by 4 to undo the division: x = 28. Check: 28/4 + 2 = 7 + 2 = 9 ✓.',
  },
  {
    id: 'ee-l2-q5',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Jamal has $15 and saves $6 each week. Which equation shows how many weeks (w) it takes for him to have $57, and what is w?',
    choices: ['6w + 15 = 57, w = 7', '15w + 6 = 57, w = 3.4', '6w − 15 = 57, w = 12', '6w + 15 = 57, w = 6'],
    correctIndex: 0,
    explanation:
      'His total money is the starting amount plus $6 per week: 6w + 15 = 57. Subtract 15 from both sides: 6w = 42. Divide by 6: w = 7. Check: 6(7) + 15 = 42 + 15 = 57 ✓.',
  },
  {
    id: 'ee-l2-q6',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 4x − 9 = 15',
    correctAnswer: 6,
    explanation:
      'Add 9 to both sides: 4x = 24. Divide both sides by 4: x = 6. Check: 4(6) − 9 = 24 − 9 = 15 ✓.',
  },
  {
    id: 'ee-l2-q7',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve for x: −2x + 5 = 17',
    choices: ['x = 6', 'x = −6', 'x = −11', 'x = 11'],
    correctIndex: 1,
    explanation:
      'Subtract 5 from both sides: −2x = 12. Divide both sides by −2: x = −6. Check: −2(−6) + 5 = 12 + 5 = 17 ✓. A common mistake is dividing 12 by 2 and forgetting the negative sign, giving x = 6 instead.',
  },
  {
    id: 'ee-l2-q8',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'A rectangle has a perimeter of 34 cm and a length of 10 cm. Using 2(l + w) = P, solve for the width w.',
    correctAnswer: 7,
    explanation:
      'Substitute known values into 2(l + w) = P: 2(10 + w) = 34. Distribute: 20 + 2w = 34. Subtract 20 from both sides: 2w = 14. Divide by 2: w = 7 cm. Check: 2(10 + 7) = 2(17) = 34 ✓.',
  },
  {
    id: 'ee-l2-q9',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve for x: x/3 − 4 = 1',
    choices: ['x = 15', 'x = −9', 'x = 5', 'x = 9'],
    correctIndex: 0,
    explanation:
      'Add 4 to both sides: x/3 = 5. Multiply both sides by 3 to undo the division: x = 15. Check: 15/3 − 4 = 5 − 4 = 1 ✓.',
  },
  {
    id: 'ee-l3-q1',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve the inequality: x + 5 < 12',
    choices: ['x < 7', 'x < 17', 'x > 7', 'x < 5'],
    correctIndex: 0,
    explanation:
      'Subtract 5 from both sides: x < 12 − 5, so x < 7. Since we only subtracted (not multiplied or divided by a negative), the inequality symbol stays the same direction.',
  },
  {
    id: 'ee-l3-q2',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve the inequality: −3x > 12',
    choices: ['x > −4', 'x < −4', 'x < 4', 'x > 4'],
    correctIndex: 1,
    explanation:
      'Divide both sides by −3 to isolate x. Because you are dividing by a NEGATIVE number, you must flip the inequality sign: x < −4. Check with a value like x = −5: −3(−5) = 15, and 15 > 12 is true ✓. If you forget to flip the sign, you would incorrectly get x > −4.',
  },
  {
    id: 'ee-l3-q3',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x and find the boundary value: 4x − 7 ≥ 9. What is x (the smallest value that makes it true, i.e., x ≥ ___)?',
    correctAnswer: 4,
    explanation:
      'Add 7 to both sides: 4x ≥ 16. Divide both sides by 4 (a positive number, so the sign does not flip): x ≥ 4. Check: 4(4) − 7 = 16 − 7 = 9, and 9 ≥ 9 is true ✓.',
  },
  {
    id: 'ee-l3-q4',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve the inequality: −2x + 5 ≤ 11',
    choices: ['x ≥ −3', 'x ≤ −3', 'x ≥ 3', 'x ≤ 8'],
    correctIndex: 0,
    explanation:
      'Subtract 5 from both sides: −2x ≤ 6. Now divide both sides by −2, and since it is negative, flip the sign: x ≥ −3. Check with x = 0: −2(0) + 5 = 5, and 5 ≤ 11 is true, and 0 ≥ −3 is also true, confirming the direction ✓.',
  },
  {
    id: 'ee-l3-q5',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 5 − x < 8. What is x (as in x > ___)?',
    correctAnswer: -3,
    explanation:
      'Subtract 5 from both sides: −x < 3. Multiply both sides by −1 to isolate x, and flip the sign because you multiplied by a negative: x > −3. Check with x = 0: 5 − 0 = 5, and 5 < 8 is true, and 0 > −3 is also true ✓.',
  },
  {
    id: 'ee-l3-q6',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'A number line shows a closed dot at −3 with shading to the right. Which inequality does this represent?',
    choices: ['x < −3', 'x ≥ −3', 'x > −3', 'x ≤ −3'],
    correctIndex: 1,
    imageHint: { kind: 'number-line', from: -8, to: 8, markAt: -3 },
    explanation:
      'A CLOSED (filled) dot means the boundary value −3 is included in the solution, which requires ≥ or ≤ rather than a strict inequality. Shading to the RIGHT means all values greater than −3 are included. Combining both facts gives x ≥ −3.',
  },
  {
    id: 'ee-l3-q7',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: −x/2 > 3. What is x (as in x < ___)?',
    correctAnswer: -6,
    explanation:
      'Multiply both sides by −2 to isolate x (undoing division by −2). Since you multiplied by a negative number, flip the inequality sign: x < −6. Check with x = −10: −(−10)/2 = 10/2 = 5, and 5 > 3 is true, and −10 < −6 is also true ✓.',
  },
  {
    id: 'ee-l3-q8',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve the inequality: 3x + 2 < 2x − 5',
    choices: ['x < −7', 'x > −7', 'x < 7', 'x > −3'],
    correctIndex: 0,
    explanation:
      'Subtract 2x from both sides to gather variable terms: x + 2 < −5. Subtract 2 from both sides: x < −7. Since we never multiplied or divided by a negative number, the inequality sign direction never changes. Check with x = −8: 3(−8) + 2 = −22, and 2(−8) − 5 = −21, and −22 < −21 is true ✓.',
  },
  {
    id: 'ee-l3-q9',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Maria needs to spend less than $20 on snacks. Chips cost $3 each and she already has $5 worth of drinks in her cart. Which inequality and solution correctly show how many bags of chips (c) she can buy?',
    choices: ['3c + 5 < 20, c < 5', '3c + 5 > 20, c > 5', '3c − 5 < 20, c < 8.33', '5c + 3 < 20, c < 3.4'],
    correctIndex: 0,
    explanation:
      'Total spending is the cost of chips plus the drinks already in her cart: 3c + 5 < 20. Subtract 5 from both sides: 3c < 15. Divide both sides by 3 (positive, so no flip): c < 5. She can buy fewer than 5 bags of chips.',
  },
  {
    id: 'ee-l4-q1',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 2(x + 3) + 4 = 16',
    correctAnswer: 3,
    explanation:
      'First distribute: 2(x + 3) = 2x + 6, so the equation becomes 2x + 6 + 4 = 16. Combine like terms: 2x + 10 = 16. Subtract 10 from both sides: 2x = 6. Divide by 2: x = 3. Check: 2(3 + 3) + 4 = 2(6) + 4 = 12 + 4 = 16 ✓.',
  },
  {
    id: 'ee-l4-q2',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve for x: 3(2x − 1) = 5x + 4',
    choices: ['x = 7', 'x = 1', 'x = 3', 'x = −7'],
    correctIndex: 0,
    explanation:
      'Distribute the left side: 6x − 3 = 5x + 4. Subtract 5x from both sides: x − 3 = 4. Add 3 to both sides: x = 7. Check: 3(2(7) − 1) = 3(13) = 39, and 5(7) + 4 = 35 + 4 = 39 ✓. A common error is distributing only to the first term, which leads to wrong answers like x = 1.',
  },
  {
    id: 'ee-l4-q3',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 4x + 3 − x = 18',
    correctAnswer: 5,
    explanation:
      'Combine like terms first: 4x − x = 3x, so the equation becomes 3x + 3 = 18. Subtract 3 from both sides: 3x = 15. Divide by 3: x = 5. Check: 4(5) + 3 − 5 = 20 + 3 − 5 = 18 ✓.',
  },
  {
    id: 'ee-l4-q4',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: x/2 + 3 = −1',
    correctAnswer: -8,
    explanation:
      'Subtract 3 from both sides: x/2 = −4. Multiply both sides by 2: x = −8. Check: −8/2 + 3 = −4 + 3 = −1 ✓.',
  },
  {
    id: 'ee-l4-q5',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'Solve the inequality: −4(x − 2) ≤ 24',
    choices: ['x ≥ −4', 'x ≤ −4', 'x ≥ 4', 'x ≤ 4'],
    correctIndex: 0,
    explanation:
      'Distribute first: −4x + 8 ≤ 24. Subtract 8 from both sides: −4x ≤ 16. Divide both sides by −4, flipping the sign since it is negative: x ≥ −4. Check with x = 0: −4(0 − 2) = −4(−2) = 8, and 8 ≤ 24 is true, and 0 ≥ −4 is also true ✓.',
  },
  {
    id: 'ee-l4-q6',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'A phone plan costs $20 per month plus $0.50 per text message. Solve for t (number of texts) if the total bill was $35: 20 + 0.5t = 35',
    correctAnswer: 30,
    explanation:
      'Subtract 20 from both sides: 0.5t = 15. Divide both sides by 0.5 (or equivalently multiply by 2): t = 30. Check: 20 + 0.5(30) = 20 + 15 = 35 ✓.',
  },
  {
    id: 'ee-l4-q7',
    strand: 'expressions-equations',
    type: 'multiple-choice',
    prompt: 'A movie ticket costs $9 and a popcorn combo costs $6. Sam has $48 and wants to bring friends, each needing a ticket, while he buys just one popcorn combo for the group. Which inequality finds the max number of tickets (n), and what is the answer?',
    choices: ['9n + 6 ≤ 48, n ≤ 4', '9n + 6 ≤ 48, n ≤ 4.67', '6n + 9 ≤ 48, n ≤ 6.5', '9n − 6 ≤ 48, n ≤ 6'],
    correctIndex: 0,
    explanation:
      'Total cost is the number of tickets times $9 plus the one-time $6 popcorn combo: 9n + 6 ≤ 48. Subtract 6 from both sides: 9n ≤ 42. Divide both sides by 9: n ≤ 4.67. Since n must be a whole number of tickets, the maximum is n ≤ 4 (he cannot buy part of a ticket).',
  },
  {
    id: 'ee-l4-q8',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 2(3x + 1) − 4x = 10',
    correctAnswer: 4,
    explanation:
      'Distribute first: 2(3x + 1) = 6x + 2, so the equation becomes 6x + 2 − 4x = 10. Combine like terms: 2x + 2 = 10. Subtract 2 from both sides: 2x = 8. Divide by 2: x = 4. Check: 2(3(4) + 1) − 4(4) = 2(13) − 16 = 26 − 16 = 10 ✓.',
  },
  {
    id: 'ee-l4-q9',
    strand: 'expressions-equations',
    type: 'numeric',
    prompt: 'Solve for x: 3x + 5 = x + 2',
    correctAnswer: -1.5,
    tolerance: 0.01,
    explanation:
      'Subtract x from both sides: 2x + 5 = 2. Subtract 5 from both sides: 2x = −3. Divide both sides by 2: x = −1.5 (which is the same as −3/2). Check: 3(−1.5) + 5 = −4.5 + 5 = 0.5, and −1.5 + 2 = 0.5 ✓.',
  },
];
