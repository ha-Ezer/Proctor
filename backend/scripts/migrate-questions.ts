/**
 * Migration Script: Extract questions from index.html and populate database
 * Run with: npm run db:seed
 */

import { pool } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

// Default exam ID (matches database seed)
const EXAM_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Authorized student emails from current system
const AUTHORIZED_EMAILS = [
  { email: 'san1di.bel@gmail.com', name: 'Student 1' },
  { email: 'pamlart22@gmail.com', name: 'Student 2' },
  { email: 'jy4090290@gmail.com', name: 'Student 3' },
  { email: 'Emmansarko01@gmail.com', name: 'Student 4' },
  { email: 'selasieosabutey@gmail.com', name: 'Student 5' },
  { email: 'Victoriaquaicoe289@gmail.com', name: 'Student 6' },
  { email: 'mimiayensu27@gmail.com', name: 'Student 7' },
  { email: 'Laarfaith777@gmail.com', name: 'Student 8' },
  { email: 'trialOne@test.edu', name: 'Trial Student' },
  { email: 'demo@test.edu', name: 'Demo Student' },
];

// EXAM QUESTIONS - Extracted from index.html (lines 158-694)
const EXAM_QUESTIONS = [
  // MULTIPLE-CHOICE QUESTIONS (30 questions)
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'The below are all types of cells except........',
    required: false,
    options: ['Macrophages', 'Mast cells', 'Osteoblasts', 'Collagen'],
    correctAnswer: 3,
  },
  {
    id: 'q2',
    type: 'multiple-choice',
    question: 'Tissues with similar structure and function group together to form.........',
    required: false,
    options: ['Organs', 'Systems', 'Cells', 'Organisms'],
    correctAnswer: 0,
  },
  {
    id: 'q3',
    type: 'multiple-choice',
    question: 'There is/are ____________ layer(s) of the skin.',
    required: false,
    options: ['2', '3', '4', '5'],
    correctAnswer: 1,
  },
  {
    id: 'q4',
    type: 'multiple-choice',
    question: 'The Dermis is NOT the layer of the skin we can easily see and touch',
    required: false,
    options: ['True', 'False'],
    correctAnswer: 0,
  },
  {
    id: 'q5',
    type: 'multiple-choice',
    question:
      'The skin cells in the epidermis move up the layers from bottom to top every four weeks. The production of new cells takes place in the...........',
    required: false,
    options: ['Stratum Corneum', 'Stratum Lucidum', 'Stratum Granulosum', 'Stratum Germinativum'],
    correctAnswer: 3,
  },
  {
    id: 'q6',
    type: 'multiple-choice',
    question: 'Antiperspirants.........',
    required: false,
    options: [
      'Kill the germs that cause body odour',
      'Block the sweat pores',
      'Deactivate the Sebaceous glands',
      'Deactivate the sweat glands',
    ],
    correctAnswer: 1,
  },
  {
    id: 'q7',
    type: 'multiple-choice',
    question: 'Deodorants.........',
    required: false,
    options: [
      'Kill the germs that cause body odour',
      'Block the sweat pores',
      'Deactivate the Sebaceous glands',
      'Deactivate the sweat glands',
    ],
    correctAnswer: 0,
  },
  {
    id: 'q8',
    type: 'multiple-choice',
    question: 'The acidic substance that protects the skin from germs is produced by',
    required: false,
    options: [
      'Shiny mantle',
      'Sebum Cysts and Sweat Glands',
      'Blood Capillaries and Sebaceous glands',
      'Sebaceous Glands and Sweat Glands',
    ],
    correctAnswer: 3,
  },
  {
    id: 'q9',
    type: 'multiple-choice',
    question: 'One function of the hypodermis/Subcutaneous Layer is to..........',
    required: false,
    options: ['Make the skin oily', 'Store fat', 'Produce sweat', 'Produce melanin'],
    correctAnswer: 1,
  },
  {
    id: 'q10',
    type: 'multiple-choice',
    question: 'Which of these is a non-infectious skin disorder?',
    required: false,
    options: ["Athlete's Foot", 'Cold Sore', 'Boils', 'Vitiligo'],
    correctAnswer: 3,
  },
  {
    id: 'q11',
    type: 'multiple-choice',
    question: "Athlete's foot is a ................. disease.",
    required: false,
    options: ['Fungal disease', 'Viral Disease', 'Bacterial Disease', 'Sebaceous Gland'],
    correctAnswer: 0,
  },
  {
    id: 'q12',
    type: 'multiple-choice',
    question: 'All the following are bacterial diseases except......',
    required: false,
    options: ['Carbuncles', 'Styes', 'Impetigo', 'Nail Ringworm'],
    correctAnswer: 3,
  },
  {
    id: 'q13',
    type: 'multiple-choice',
    question: 'One of the following best describes allergic reactions.....',
    required: false,
    options: [
      'The body negatively responds to germs',
      'The body negatively responds to the sun',
      'The body negatively responds to normally harmless substances',
      'The body negatively responds to Melanocytes',
    ],
    correctAnswer: 2,
  },
  {
    id: 'q14',
    type: 'multiple-choice',
    question: 'Vasodilation can be caused by...............',
    required: false,
    options: ['Sebaceous Glands', 'Sweat Glands', 'Histamine', 'Moisture'],
    correctAnswer: 2,
  },
  {
    id: 'q15',
    type: 'multiple-choice',
    question: 'Which of these parts of the ear would you NOT pierce due to the risk of complications?',
    required: false,
    options: ['Pinna', 'Lobule', 'Helix', 'Outer Ear'],
    correctAnswer: 2,
  },
  {
    id: 'q16',
    type: 'multiple-choice',
    question: 'The hairs found on newborn babies are called',
    required: false,
    options: ['Terminal hair', 'Vellus Hairs', 'Lanugo Hairs', 'Cussons Hairs'],
    correctAnswer: 2,
  },
  {
    id: 'q17',
    type: 'multiple-choice',
    question: 'In this stage, the hair grows fastest.',
    required: false,
    options: ['Hairlogen Stage', 'Catagen Stage', 'Anagen Stage', 'Telogen Stage'],
    correctAnswer: 2,
  },
  {
    id: 'q18',
    type: 'multiple-choice',
    question:
      "After waxing a client's armpit, they report that the hair started growing after three days. You probably waxed while the armpit hair was in the _____________ stage.",
    required: false,
    options: ['Anagen', 'Catagen', 'Telogen', 'Hairlogen'],
    correctAnswer: 0,
  },
  {
    id: 'q19',
    type: 'multiple-choice',
    question: 'The protein Keratin makes up the hair, nails and skin',
    required: false,
    options: ['True', 'False'],
    correctAnswer: 0,
  },
  {
    id: 'q20',
    type: 'multiple-choice',
    question: 'All the following are true about Nails except',
    required: false,
    options: [
      'Nails are made of the same protein as hair',
      'Nails are made up of the same protein as skin',
      'Nails are made up of the same protein as bones',
      'The Nails grow from Stratum Germinativum',
    ],
    correctAnswer: 3,
  },
  {
    id: 'q21',
    type: 'multiple-choice',
    question: 'The main parts of the central nervous system are the brain and the.......',
    required: false,
    options: ['Spinal cord', 'Backbone', 'Stratum Germinativum', 'Peripheral nerves'],
    correctAnswer: 0,
  },
  {
    id: 'q22',
    type: 'multiple-choice',
    question: 'The cranial nerves responsible for facial expressions and chewing are the............',
    required: false,
    options: ['5th and 6th Nerves', '5th and 7th Nerves', '7th and 11th Nerves', '5th and 11th Nerves'],
    correctAnswer: 1,
  },
  {
    id: 'q23',
    type: 'multiple-choice',
    question: 'When we say a muscle is responsive, it means that........',
    required: false,
    options: [
      'The muscle reacts based on impulses from the hormones',
      'The muscle reacts based on impulses from the nerves',
      'The muscle reacts based on impulses from the blood',
      'The muscle reacts based on impulses from the skin',
    ],
    correctAnswer: 1,
  },
  {
    id: 'q24',
    type: 'multiple-choice',
    question: 'The lines (A) running through the image below are called.......',
    required: false,
    image: 'attachments/Suture.png',
    options: ['Capillaries', 'Sinuses', 'Arterioles', 'Sutures'],
    correctAnswer: 3,
  },
  {
    id: 'q25',
    type: 'multiple-choice',
    question: 'Which of these is NOT true about the circulatory system?',
    required: false,
    options: [
      'The Arteries carry blood away from the heart',
      'The Veins carry blood to the heart',
      'The Arteries carry blood toward the heart',
      'The Veins carry blood toward the heart',
    ],
    correctAnswer: 2,
  },
  {
    id: 'q26',
    type: 'multiple-choice',
    question: 'All the following are differences between the veins and arteries except',
    required: false,
    options: [
      'One has valves and the other doesn't',
      'One carries blood away from the heart while the other carries towards the heart',
      'One has a hole through which the blood goes through and the other doesn't',
      'One has the blood pushed through by the heart and the other has just muscles',
    ],
    correctAnswer: 2,
  },
  {
    id: 'q27',
    type: 'multiple-choice',
    question:
      'Acne Vulgaris, Pimples and oily skin are usually pertinent with adolescents. They are mostly caused by..............',
    required: false,
    options: ['Emotional Imbalance', 'Hormonal Imbalance', 'Spiritual Imbalance', 'Histamine Imbalance'],
    correctAnswer: 1,
  },
  {
    id: 'q28',
    type: 'multiple-choice',
    question: 'Stretch marks are caused by.....',
    required: false,
    options: [
      'Broken fibrin in the skin',
      'Broken Collagen in the skin',
      'Overproduction of Histamine',
      'Overdose of Vitamin C',
    ],
    correctAnswer: 1,
  },
  {
    id: 'q29',
    type: 'multiple-choice',
    question: 'The following disadvantages can result from over-exposure to sunlight except',
    required: false,
    options: ['Darkening of the skin', 'Skin Cancers', 'Disinfection of the skin', 'Sunburn'],
    correctAnswer: 2,
  },
  {
    id: 'q30',
    type: 'multiple-choice',
    question: 'The following cells help with defense and protection of the skin except',
    required: false,
    options: ['Langerhans Cells', 'Macrophages', 'Mast Cells', 'Sweat Glands'],
    correctAnswer: 3,
  },

  // TEXT/SHORT ANSWER QUESTIONS (20 questions)
  {
    id: 'q31',
    type: 'text',
    question:
      'Your client is an Albino, the trait that makes them an albino is found in one of the labelled structures below. Which is it?',
    required: false,
    image: 'attachments/animal cell.webp',
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q32',
    type: 'text',
    question: 'In your own words, describe briefly how an inflammation occurs in the body.',
    required: false,
    placeholder: 'Type your brief explanation here...',
  },
  {
    id: 'q33',
    type: 'textarea',
    question: 'How do massages help maintain healthy skin? (Copy and paste answers will be flagged)',
    required: false,
    placeholder: 'Share your detailed explanation...',
  },
  {
    id: 'q34',
    type: 'text',
    question: 'Name three structures in the section labelled B (Dermis)',
    required: false,
    image: 'attachments/skin cross section.webp',
    placeholder: 'List three structures here...',
  },
  {
    id: 'q35',
    type: 'text',
    question: 'List two functions of the section labelled C (Hypodermis/Subcutaneous layer)',
    required: false,
    image: 'attachments/skin cross section.webp',
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q36',
    type: 'text',
    question: 'List two examples of skin disorders caused by Viruses',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q37',
    type: 'text',
    question: 'List two examples of skin disorders caused by Bacteria',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q38',
    type: 'text',
    question: 'List two examples of skin disorders caused by Fungi',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q39',
    type: 'text',
    question: 'Briefly describe what makes a skin disorder infectious.',
    required: false,
    placeholder: 'Type your brief explanation here...',
  },
  {
    id: 'q40',
    type: 'text',
    question: 'Briefly describe the cause of this growth on the ear',
    required: false,
    image: 'attachments/keloid.jpeg',
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q41',
    type: 'text',
    question: 'Name three functions of the hair',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q42',
    type: 'text',
    question: 'List two factors that positively or negatively affect hair growth',
    required: false,
    placeholder: 'Type your answers here...',
  },
  {
    id: 'q43',
    type: 'text',
    question: 'What are the two main divisions of the Nervous system?',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q44',
    type: 'text',
    question: 'In the image below, which is a Flexor and which is an Extensor muscle?',
    required: false,
    image: 'attachments/Extensor.png',
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q45',
    type: 'text',
    question: 'What is a Tendon?',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q46',
    type: 'text',
    question:
      'You are a massage therapist. How will you convince a client that your work can positively impact their muscular system? (Copy and paste answers will be flagged)',
    required: false,
    placeholder: 'Share your explanation...',
  },
  {
    id: 'q47',
    type: 'text',
    question: 'Provide three shapes of bones',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q48',
    type: 'text',
    question: 'What is the effect of massages on the circulatory system?',
    required: false,
    placeholder: 'Type your answer here...',
  },
  {
    id: 'q49',
    type: 'text',
    question:
      'You are a massage therapist. How will you convince a client that your work can positively impact their Lymphatic system? (Copy and paste answers will be flagged)',
    required: false,
    placeholder: 'Share your explanation...',
  },
  {
    id: 'q50',
    type: 'text',
    question: 'In your own words, define circulation with respect to the human body',
    required: false,
    placeholder: 'Type your answer here...',
  },
];

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('');
    console.log('========================================');
    console.log('📊 STARTING DATA MIGRATION');
    console.log('========================================');
    console.log('');

    await client.query('BEGIN');

    // 1. Migrate authorized students
    console.log('1️⃣  Migrating authorized students...');
    for (const student of AUTHORIZED_EMAILS) {
      await client.query(
        `INSERT INTO students (email, full_name, is_authorized)
         VALUES ($1, $2, true)
         ON CONFLICT (email) DO UPDATE SET
           is_authorized = true,
           full_name = EXCLUDED.full_name`,
        [student.email, student.name]
      );
    }
    console.log(`✅ Migrated ${AUTHORIZED_EMAILS.length} students`);
    console.log('');

    // 2. Migrate questions
    console.log('2️⃣  Migrating exam questions...');
    let questionCount = 0;
    let optionCount = 0;

    for (const q of EXAM_QUESTIONS) {
      const questionNumber = parseInt(q.id.substring(1)); // q1 -> 1

      const result = await client.query(
        `INSERT INTO questions (
          exam_id, question_number, question_text,
          question_type, required, placeholder, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          EXAM_ID,
          questionNumber,
          q.question,
          q.type,
          q.required,
          (q as any).placeholder || null,
          (q as any).image || null,
        ]
      );

      const questionId = result.rows[0].id;
      questionCount++;

      // Add options for multiple-choice questions
      if (q.type === 'multiple-choice' && (q as any).options) {
        const options = (q as any).options;
        const correctAnswer = (q as any).correctAnswer;

        for (let i = 0; i < options.length; i++) {
          await client.query(
            `INSERT INTO question_options (
              question_id, option_index, option_text, is_correct
            ) VALUES ($1, $2, $3, $4)`,
            [questionId, i, options[i], i === correctAnswer]
          );
          optionCount++;
        }
      }
    }

    console.log(`✅ Migrated ${questionCount} questions`);
    console.log(`✅ Migrated ${optionCount} multiple-choice options`);
    console.log('');

    await client.query('COMMIT');

    console.log('========================================');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log('');
    console.log('Summary:');
    console.log(`  - Students: ${AUTHORIZED_EMAILS.length}`);
    console.log(`  - Questions: ${questionCount}`);
    console.log(`  - Options: ${optionCount}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Copy attachments/ folder to public hosting');
    console.log('  2. Update image_url in questions table');
    console.log('  3. Start the backend server: npm run dev');
    console.log('');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
