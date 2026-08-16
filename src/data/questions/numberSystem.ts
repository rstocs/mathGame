import type { Question } from '../../types/game';

export const numberSystemQuestions: Question[] = [
  {
    id: 'ns-l1-q1',
    topics: ['ns-fraction-add'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -3/4 + 1/2',
    correctAnswer: -0.25,
    tolerance: 0.01,
    explanation:
      'Rewrite 1/2 with a common denominator of 4: 1/2 = 2/4. Then -3/4 + 2/4 = -1/4, which equals -0.25. Adding a positive fraction to a negative fraction moves you to the right on the number line, but not far enough to reach zero.',
  },
  {
    id: 'ns-l1-q2',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -2.5 - (-4.1)',
    correctAnswer: 1.6,
    tolerance: 0.01,
    explanation:
      'Subtracting a negative is the same as adding its opposite: -2.5 - (-4.1) = -2.5 + 4.1 = 1.6. Think of it as "keep, change, change": keep -2.5, change subtraction to addition, change -4.1 to +4.1.',
  },
  {
    id: 'ns-l1-q3',
    topics: ['ns-fraction-add'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: 5/6 - 7/8. Round your answer to the nearest hundredth.',
    correctAnswer: -0.04,
    tolerance: 0.01,
    imageHint: { kind: 'fraction-bars', numerator: 5, denominator: 6 },
    explanation:
      'The common denominator of 6 and 8 is 24. So 5/6 = 20/24 and 7/8 = 21/24. Then 20/24 - 21/24 = -1/24, which is about -0.0417, or -0.04 rounded to the nearest hundredth. Since 7/8 is slightly larger than 5/6, the result is a small negative number.',
  },
  {
    id: 'ns-l1-q4',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -7.2 + 3.9',
    choices: ['-3.3', '3.3', '-11.1', '11.1'],
    correctIndex: 0,
    explanation:
      'Since -7.2 has the larger absolute value, the sum is negative. Subtract the smaller absolute value from the larger: 7.2 - 3.9 = 3.3, so the answer is -3.3. Choice "3.3" forgets to keep the sign of the number with the larger absolute value, and "-11.1"/"11.1" mistakenly add the absolute values instead of subtracting.',
  },
  {
    id: 'ns-l1-q5',
    topics: ['ns-fraction-add'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: 1/3 - (-5/6). Round your answer to the nearest hundredth.',
    correctAnswer: 1.17,
    tolerance: 0.01,
    explanation:
      'Subtracting a negative fraction means adding its opposite: 1/3 - (-5/6) = 1/3 + 5/6. Using a common denominator of 6: 1/3 = 2/6, so 2/6 + 5/6 = 7/6, which is about 1.1667, or 1.17 rounded to the nearest hundredth.',
  },
  {
    id: 'ns-l1-q6',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'The temperature was -12°F at dawn. Overnight it dropped another 8 degrees. What was the new temperature, in degrees Fahrenheit?',
    correctAnswer: -20,
    unit: '°F',
    imageHint: { kind: 'number-line', from: -25, to: 5, markAt: -20 },
    explanation:
      'Dropping 8 degrees means adding -8 to the starting temperature: -12 + (-8) = -20°F. Combining two negative changes always moves you further from zero in the negative direction.',
  },
  {
    id: 'ns-l1-q7',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: 4.75 - 6.3',
    correctAnswer: -1.55,
    tolerance: 0.01,
    explanation:
      'Since 6.3 is larger than 4.75, the result is negative. Subtract the smaller value from the larger: 6.3 - 4.75 = 1.55, so 4.75 - 6.3 = -1.55. You can also think of it as starting at 4.75 and moving 6.3 units left on the number line.',
  },
  {
    id: 'ns-l1-q8',
    topics: ['ns-fraction-add'],
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -2/5 + (-1/4)',
    choices: ['-13/20', '-3/9', '13/20', '-9/20'],
    correctIndex: 0,
    explanation:
      'Adding two negative fractions gives a negative result. Using a common denominator of 20: -2/5 = -8/20 and -1/4 = -5/20. Adding: -8/20 + (-5/20) = -13/20, which is -0.65. The distractor "-3/9" comes from wrongly adding numerators and denominators separately instead of finding a common denominator.',
  },
  {
    id: 'ns-l1-q9',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'A submarine is at an elevation of -45 meters (45 meters below sea level). It rises to an elevation of -12 meters. By how many meters did its elevation change? (Enter a positive number for the amount of rise.)',
    correctAnswer: 33,
    unit: 'meters',
    explanation:
      'The change in elevation is found by subtracting the starting value from the ending value: -12 - (-45) = -12 + 45 = 33. The submarine rose 33 meters, since -12 is 33 units higher than -45 on the number line.',
  },
  {
    id: 'ns-l2-q1',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: (-5) x (-3)',
    correctAnswer: 15,
    explanation:
      'A negative number times a negative number gives a positive product. Multiply the absolute values, 5 x 3 = 15, and since both factors are negative, the answer stays positive: 15.',
  },
  {
    id: 'ns-l2-q2',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: (-5) x (-3) / 5',
    correctAnswer: 3,
    explanation:
      'Work left to right. First, (-5) x (-3) = 15 because a negative times a negative is positive. Then divide: 15 / 5 = 3.',
  },
  {
    id: 'ns-l2-q3',
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -8 x 3',
    choices: ['-24', '24', '-11', '5'],
    correctIndex: 0,
    explanation:
      'A negative number times a positive number gives a negative product. Multiply the absolute values, 8 x 3 = 24, and keep the negative sign because the signs of the factors are different: -24. The distractor "24" incorrectly drops the negative sign, and "-11"/"5" mistakenly add or subtract instead of multiplying.',
  },
  {
    id: 'ns-l2-q4',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -36 / (-4)',
    correctAnswer: 9,
    explanation:
      'A negative number divided by a negative number gives a positive quotient. Divide the absolute values, 36 / 4 = 9, and since both numbers share the same sign, the answer is positive: 9.',
  },
  {
    id: 'ns-l2-q5',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -2/3 x 3/4',
    correctAnswer: -0.5,
    tolerance: 0.01,
    explanation:
      'Multiply numerators and denominators: (-2 x 3) / (3 x 4) = -6/12, which simplifies to -1/2, or -0.5. A negative times a positive gives a negative product, so the sign stays negative.',
  },
  {
    id: 'ns-l2-q6',
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -4.5 x (-2)',
    choices: ['9', '-9', '2.25', '-2.25'],
    correctIndex: 0,
    explanation:
      'A negative decimal times a negative number produces a positive product. Multiply the absolute values, 4.5 x 2 = 9, and since both factors are negative, the result is positive: 9. The distractor "-9" wrongly keeps a negative sign despite two negative factors.',
  },
  {
    id: 'ns-l2-q7',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -5/6 / (-2/3). Round your answer to the nearest hundredth.',
    correctAnswer: 1.25,
    tolerance: 0.01,
    explanation:
      'To divide fractions, multiply by the reciprocal: -5/6 / (-2/3) = -5/6 x (-3/2) = 15/12 = 5/4 = 1.25. Dividing a negative by a negative gives a positive result.',
  },
  {
    id: 'ns-l2-q8',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -18 / 6',
    correctAnswer: -3,
    explanation:
      'A negative number divided by a positive number gives a negative quotient. Divide the absolute values, 18 / 6 = 3, and keep the negative sign because the signs are different: -3.',
  },
  {
    id: 'ns-l2-q9',
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -3.2 x 4',
    correctAnswer: -12.8,
    tolerance: 0.01,
    explanation:
      'A negative decimal times a positive whole number gives a negative product. Multiply the absolute values, 3.2 x 4 = 12.8, and since the signs differ, the answer is negative: -12.8.',
  },
  {
    id: 'ns-l3-q1',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -4 + 6 x (-2)',
    correctAnswer: -16,
    explanation:
      'Follow order of operations: multiply before adding. First, 6 x (-2) = -12. Then -4 + (-12) = -16. Doing the addition first would incorrectly give a different result, which is why multiplication must happen before addition.',
  },
  {
    id: 'ns-l3-q2',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: (-10 + 4) / (-3)',
    correctAnswer: 2,
    explanation:
      'Work inside the parentheses first: -10 + 4 = -6. Then divide: -6 / (-3) = 2, since a negative divided by a negative is positive.',
  },
  {
    id: 'ns-l3-q3',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -2.5 x 4 - (-3)',
    choices: ['-7', '-13', '7', '-10'],
    correctIndex: 0,
    explanation:
      'Multiply first: -2.5 x 4 = -10. Then subtract a negative, which means adding its opposite: -10 - (-3) = -10 + 3 = -7. The distractor "-13" comes from adding -10 + (-3) instead of correctly flipping the subtraction of a negative.',
  },
  {
    id: 'ns-l3-q4',
    topics: ['ns-signed-mul-div', 'ns-fraction-add'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: 3/4 - 1/3 x 3/5. Round your answer to the nearest hundredth.',
    correctAnswer: 0.55,
    tolerance: 0.01,
    explanation:
      'Multiply before subtracting: 1/3 x 3/5 = 3/15 = 1/5. Then 3/4 - 1/5. Using a common denominator of 20: 3/4 = 15/20 and 1/5 = 4/20, so 15/20 - 4/20 = 11/20 = 0.55.',
  },
  {
    id: 'ns-l3-q5',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'At 6 a.m., the temperature was 5°F. By noon it had dropped 12 degrees, and by evening it had risen 4 degrees from the noon temperature. What was the evening temperature, in degrees Fahrenheit?',
    correctAnswer: -3,
    unit: '°F',
    explanation:
      'Start at 5°F, apply the drop of 12 degrees (subtract, or add -12), then apply the rise of 4 degrees (add 4): 5 + (-12) + 4 = -3°F. Combining several signed changes in order gives the final temperature.',
  },
  {
    id: 'ns-l3-q6',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'A diver descends to an elevation of -18 meters (18 meters below the surface), then rises 7 meters. What is the diver\'s new elevation, in meters?',
    correctAnswer: -11,
    unit: 'meters',
    explanation:
      'Start at -18 meters and add the rise of 7 meters: -18 + 7 = -11. The diver is still below the surface, but 7 meters closer to it than before.',
  },
  {
    id: 'ns-l3-q7',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      "Maria's account balance was -$45 (she owed $45). She then deposited $20. What is her new balance, in dollars? (Enter a negative number if she still owes money.)",
    correctAnswer: -25,
    unit: 'dollars',
    explanation:
      'Add the deposit to the existing balance: -45 + 20 = -25. Since the result is still negative, Maria owes $25 after her deposit — the deposit reduced her debt but did not pay it off completely.',
  },
  {
    id: 'ns-l3-q8',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -6 + (-3) x (-2)',
    choices: ['0', '-12', '18', '-18'],
    correctIndex: 0,
    explanation:
      'Multiply first: (-3) x (-2) = 6, because a negative times a negative is positive. Then add: -6 + 6 = 0. The distractor "-12" incorrectly adds -6 + (-3) + (-2) instead of following order of operations.',
  },
  {
    id: 'ns-l3-q9',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'A football team loses 8 yards on one play, loses 3 more yards on the next play, then gains 12 yards on the third play. What is the team\'s total yardage change over the three plays?',
    correctAnswer: 1,
    unit: 'yards',
    explanation:
      'Losses are negative and gains are positive: -8 + (-3) + 12 = 1. Even though the team lost yardage on two plays, the 12-yard gain was enough to result in a net gain of 1 yard overall.',
  },
  {
    id: 'ns-l4-q1',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: (-3) x (-4) + (-15) / 3',
    correctAnswer: 7,
    explanation:
      'Follow order of operations: do the multiplication and division before the addition. (-3) x (-4) = 12, and (-15) / 3 = -5. Then add: 12 + (-5) = 7.',
  },
  {
    id: 'ns-l4-q2',
    topics: ['ns-fraction-add', 'ns-signed-mul-div'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: -1/2 + 3/4 x (-2/3)',
    correctAnswer: -1,
    tolerance: 0.01,
    explanation:
      'Multiply before adding: 3/4 x (-2/3) = -6/12 = -1/2. Then add: -1/2 + (-1/2) = -1. Two negative one-halves combine to make a whole negative unit.',
  },
  {
    id: 'ns-l4-q3',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -6.5 - (-2.2) x 3',
    choices: ['0.1', '-13.1', '-19.1', '-8.7'],
    correctIndex: 0,
    explanation:
      'Multiply first: (-2.2) x 3 = -6.6. Then subtract that result: -6.5 - (-6.6) = -6.5 + 6.6 = 0.1. The distractor "-13.1" comes from adding -6.5 + (-6.6) instead of correctly flipping the sign when subtracting a negative.',
  },
  {
    id: 'ns-l4-q4',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'The temperature started at -8°F. It then dropped 3 degrees each hour for 2 hours, and finally rose 10 degrees. What was the final temperature, in degrees Fahrenheit?',
    correctAnswer: -4,
    unit: '°F',
    imageHint: { kind: 'number-line', from: -20, to: 10, markAt: -4 },
    explanation:
      'The two hourly drops give a total change of (-3) x 2 = -6. Starting temperature plus all changes: -8 + (-6) + 10 = -4°F. Multiplying the repeated hourly change first mirrors how order of operations applies to real situations.',
  },
  {
    id: 'ns-l4-q5',
    topics: ['ns-order-rationals'],
    strand: 'number-system',
    type: 'drag-drop-order',
    prompt: 'Order these values from least to greatest: -0.6, 1/4, -7/8, 0.3, -1/2',
    items: ['-0.6', '1/4', '-7/8', '0.3', '-1/2'],
    correctOrder: ['-7/8', '-0.6', '-1/2', '1/4', '0.3'],
    imageHint: { kind: 'number-line', from: -1, to: 1 },
    explanation:
      'Converting each value to a decimal makes comparison easy: -7/8 = -0.875, -0.6 = -0.6, -1/2 = -0.5, 1/4 = 0.25, and 0.3 = 0.3. On a number line, more negative values sit farther left, so the order from least to greatest is -7/8, -0.6, -1/2, 1/4, 0.3.',
  },
  {
    id: 'ns-l4-q6',
    topics: ['ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      'A hiking trail begins at an elevation of -120 feet (below sea level). The trail rises 45 feet, then drops 60 feet. What is the elevation at the end of the trail, in feet?',
    correctAnswer: -135,
    unit: 'feet',
    explanation:
      'Apply each change in order: -120 + 45 - 60. First, -120 + 45 = -75. Then -75 - 60 = -135 feet. Even though the trail rose partway through, the final drop of 60 feet left the hiker lower than the starting point.',
  },
  {
    id: 'ns-l4-q7',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'multiple-choice',
    prompt: 'Calculate: -9 + (-2) x (-6) - 4',
    choices: ['-1', '-25', '11', '-17'],
    correctIndex: 0,
    explanation:
      'Multiply first: (-2) x (-6) = 12, since two negatives make a positive. Then work left to right: -9 + 12 = 3, and 3 - 4 = -1. The distractor "-25" incorrectly adds all three numbers before multiplying.',
  },
  {
    id: 'ns-l4-q8',
    topics: ['ns-fraction-add', 'ns-signed-mul-div'],
    strand: 'number-system',
    type: 'numeric',
    prompt: 'Calculate: 2/3 x (-3/5) - 1/10',
    correctAnswer: -0.5,
    tolerance: 0.01,
    explanation:
      'Multiply first: 2/3 x (-3/5) = -6/15 = -2/5. Then subtract: -2/5 - 1/10. Using a common denominator of 10: -2/5 = -4/10, so -4/10 - 1/10 = -5/10 = -1/2, or -0.5.',
  },
  {
    id: 'ns-l4-q9',
    topics: ['ns-signed-mul-div', 'ns-signed-add-sub'],
    strand: 'number-system',
    type: 'numeric',
    prompt:
      "Jamal owes $120 on his account. He makes 3 equal payments of $25 each, but is then charged a $15 fee. What is Jamal's final balance, in dollars? (Enter a negative number if he still owes money.)",
    correctAnswer: -60,
    unit: 'dollars',
    explanation:
      "Start with the debt of -120. The three payments total 25 x 3 = 75, which reduce the debt: -120 + 75 = -45. Then the fee subtracts another 15: -45 - 15 = -60. Jamal still owes $60 after his payments and the fee.",
  },
];
