// src/data/sampleExercises.ts

import { Exercise } from '../types';

// Helper function for generating unique IDs (since we use new Date().toISOString() elsewhere)
const generateId = () => Math.random().toString(36).substring(2, 9);

export const sampleExercises: Exercise[] = [
  // ----------------------------------------------------
  // 1. READING EXERCISE (Passage + Matching & MCQ Tasks)
  // ----------------------------------------------------
  {
    id: generateId(),
    exerciseType: 'Reading',
    title: 'Academic Reading: The History of the Compass',
    description: 'Read the passage below and answer the two tasks that follow. Time Limit: 20 minutes.',
    allowedTime: 20,
    passage: `
      Paragraph A: The earliest compasses were originally developed in China during the Han Dynasty (206 BC to 220 AD) and were used for geomancy and fortune-telling, not navigation. They consisted of a carefully polished lodestone, which is a naturally magnetized iron ore, shaped into a spoon or ladle resting on a smooth bronze plate.
      
      Paragraph B: By the 11th century, the compass was adapted for maritime use. Instead of a ladle, a magnetized needle floating in a bowl of water was employed. This reduced friction and improved accuracy, allowing Chinese mariners to reliably navigate vast distances across the Indian Ocean.
      
      Paragraph C: The technology spread to Europe during the 12th century, likely introduced by Arab traders. European compasses quickly evolved to use a dry pivot point, making them more stable on rough seas. This invention was crucial for the Age of Exploration, enabling voyages that fundamentally changed global geography.
    `,
    imageUrl: 'https://picsum.photos/800/400?random=1',
    tasks: [
      // Task 1.1: Matching Headings
      {
        id: generateId(),
        taskType: 'Matching',
        title: 'Task 1: Match Headings to Paragraphs',
        description: 'Match the following headings to the correct paragraphs (A-C) in the passage.',
        allowedTime: 5,
        group1: [
          { id: 'h1', value: 'A' },
          { id: 'h2', value: 'B' },
          { id: 'h3', value: 'C' },
        ],
        group2: [
          { id: 'i1', value: 'The Role in Global Exploration' },
          { id: 'i2', value: 'Early Non-Navigational Use' },
          { id: 'i3', value: 'Maritime Adaptation and Accuracy' },
        ],
        // Note: The actual matching logic (answers) would be stored separately
      },
      // Task 1.2: Multiple Choice
      {
        id: generateId(),
        taskType: 'MCQ',
        title: 'Task 2: Multiple Choice Question',
        description: 'Choose the correct letter, A, B, C or D.',
        allowedTime: 5,
        allowMultipleSelections: false,
        questions: [
          {
            id: generateId(),
            questionText: 'What was the primary use of the earliest compass in China?',
            options: [
              { id: 'o1', value: 'Navigating ships across oceans' },
              { id: 'o2', value: 'Determining favorable locations' },
              { id: 'o3', value: 'Measuring time during long voyages' },
              { id: 'o4', value: 'Mapping coastlines' },
            ],
          },
        ],
      },
    ],
  },
  
  // ----------------------------------------------------
  // 2. WRITING EXERCISE (Report Task)
  // ----------------------------------------------------
  {
    id: generateId(),
    exerciseType: 'Writing',
    title: 'Academic Writing Task 1: Bar Chart Analysis',
    description: 'The chart below shows the employment status of graduates from one UK university in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    allowedTime: 20,
    passage: 'Image URL for the chart would go here. Write a report of at least 150 words.',
    tasks: [
      {
        id: generateId(),
        taskType: 'Writing',
        title: 'Analyze and Report',
        description: 'Write a report describing the main features of the provided bar chart.',
        allowedTime: 20,
        minimumWordCount: 150, // Academic Task 1 minimum word count
      },
    ],
  },

  // ----------------------------------------------------
  // 3. LISTENING EXERCISE (Filling Blanks Task)
  // ----------------------------------------------------
  {
    id: generateId(),
    exerciseType: 'Listening',
    title: 'Listening Section 1: Hotel Reservation',
    description: 'You will hear a conversation between a hotel receptionist and a man booking a room. Complete the form below using NO MORE THAN TWO WORDS and/or a NUMBER for each answer.',
    allowedTime: 10,
    recordingUrl: 'http://example.com/audio/hotel_booking.mp3',
    tasks: [
      {
        id: generateId(),
        taskType: 'Filling Blanks',
        title: 'Hotel Booking Form Completion',
        description: 'Complete the sentences below.',
        allowedTime: 10,
        maxWordsPerBlank: 2,
        blanks: [
          { id: generateId(), value: 'Customer Name: (Mr.) Jeremy _BLANK_' },
          { id: generateId(), value: 'Arrival Date: _BLANK_' },
          { id: generateId(), value: 'Room Type: Double with a _BLANK_' },
          { id: generateId(), value: 'Confirmation Code: _BLANK_' },
        ],
      },
    ],
  },

  // ----------------------------------------------------
  // 4. SPEAKING EXERCISE (QA Task)
  // ----------------------------------------------------
  {
    id: generateId(),
    exerciseType: 'Speaking',
    title: 'Speaking Part 2: Long Turn (Describe a City)',
    description: 'You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say.',
    allowedTime: 5,
    tasks: [
      {
        id: generateId(),
        taskType: 'QA',
        title: 'Cue Card Questions',
        description: 'Describe a city or a town you have enjoyed visiting. You should say where it is, what you did there, and explain why you enjoyed visiting it.',
        allowedTime: 5,
        maxWordsPerAnswer: 200,
        questions: [
          { id: generateId(), value: 'Where is the city or town?' },
          { id: generateId(), value: 'What did you do there?' },
          { id: generateId(), value: 'Explain why you enjoyed visiting it.' },
        ],
      },
    ],
  },
];