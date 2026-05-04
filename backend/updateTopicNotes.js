require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/course');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

const topicNotes = {
  "Yoga and Meditation": [
    "Welcome to Yoga and Meditation!\n\nKey takeaways:\n- Focus on your breathing (Pranayama).\n- The goal is alignment of mind and body.\n- Ensure you practice on an empty stomach.",
    "Core Asanas Explained:\n1. Tadasana (Mountain Pose)\n2. Adho Mukha Svanasana (Downward Dog)\n3. Shavasana (Corpse Pose)\nFocus on holding the posture rather than forcing it.",
    "Advanced Meditation Techniques:\n- Trataka (Candle Gazing)\n- Vipassana (Insight Meditation)\n- Always end your session with 5 minutes of silence."
  ],
  "Ayurveda": [
    "Introduction to Ayurveda:\n\nKey takeaways:\n- Ayurveda means 'The Science of Life'.\n- It is based on the balance of three Doshas: Vata, Pitta, Kapha.",
    "Understanding the Doshas:\n1. Vata (Space and Air)\n2. Pitta (Fire and Water)\n3. Kapha (Earth and Water)\nYour unique constitution is called Prakriti.",
    "Dietary Guidelines:\n- Eat warm, freshly cooked meals.\n- Avoid ice-cold drinks during meals.\n- Incorporate herbs like Ashwagandha and Turmeric."
  ],
  "Hindustani Classical Music": [
    "Introduction to Hindustani Music:\n\nKey takeaways:\n- Originated in North India.\n- Based on the Raga (melodic framework) and Tala (rhythm).",
    "The Swaras (Notes):\n1. Sa, Re, Ga, Ma, Pa, Dha, Ni\n2. Practice 'Alankar' daily to improve vocal control.",
    "Exploring Ragas:\n- Raga Yaman (Evening)\n- Raga Bhairav (Morning)\n- Focus on the 'Vadi' (dominant) and 'Samvadi' (sub-dominant) notes."
  ],
  "Carnatic Music": [
    "Introduction to Carnatic Music:\n\nKey takeaways:\n- The classical music system of South India.\n- Highly structured and composition-based.",
    "The Fundamentals:\n1. Shruti (Musical pitch)\n2. Laya (Rhythm)\n3. Practice 'Sarali Varisai' (basic exercises).",
    "Advanced Compositions:\n- Varnams and Kritis.\n- Tyagaraja, Muthuswami Dikshitar, and Syama Sastri are the Trinity of Carnatic Music."
  ],
  "Bharatanatyam": [
    "Welcome to Bharatanatyam!\n\nKey takeaways:\n- A major classical dance form from Tamil Nadu.\n- Known for its fixed upper torso and bent knees (Aramandi).",
    "The Three Aspects:\n1. Nritta (Pure Dance)\n2. Nritya (Expressive Dance)\n3. Natya (Dramatic Storytelling)",
    "Abhinaya (Expression):\n- Using Mudras (hand gestures) and facial expressions to convey emotions (Rasas)."
  ],
  "Kathak": [
    "Welcome to Kathak!\n\nKey takeaways:\n- The classical dance form of North India.\n- The word Kathak means 'to tell a story'.",
    "Core Elements:\n1. Footwork (Tatkar)\n2. Spins (Chakkar)\n3. Graceful hand movements.",
    "Advanced Techniques:\n- complex rhythmic patterns (Tihai).\n- Expressive storytelling of Radha-Krishna legends."
  ],
  "Indian Cuisine": [
    "Introduction to Indian Cooking:\n\nKey takeaways:\n- Spices are the heart of Indian cuisine.\n- Learn to balance sweet, sour, salty, bitter, pungent, and astringent flavors.",
    "Essential Spices (The Masala Dabba):\n1. Cumin seeds (Jeera)\n2. Coriander powder (Dhania)\n3. Turmeric (Haldi)\n4. Garam Masala",
    "Advanced Techniques:\n- 'Tadka' or tempering spices in hot oil/ghee.\n- Slow-cooking methods like 'Dum pukht'."
  ]
};

const defaultNotes = [
  "Welcome to the course! \n\nKey takeaways:\n- This course will introduce you to the rich cultural heritage related to this topic.\n- Pay close attention to the historical context provided.",
  "Core Concepts Summary:\n1. Foundation is key.\n2. Practice and review regularly.\n3. Refer to the supplementary reading materials.",
  "Advanced Notes:\n- Remember to combine what you learned in module 1 and 2.\n- Review the case studies to see how this works in practice.\n- Congratulations on completing the course!"
];

async function updateNotes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to local DB.");

    console.log("Fetching courses and updating notes...");

    const courses = await Course.find();
    let updatedCount = 0;

    for (let course of courses) {
      const topic = course.category;
      const notesArray = topicNotes[topic] || defaultNotes;

      // Make sure the course has lectures
      if (course.lectures && course.lectures.length > 0) {
        course.lectures.forEach((lecture, index) => {
          // Assign the corresponding note, or loop back to the first if there are more lectures than notes
          lecture.notes = notesArray[index % notesArray.length];
        });
        await course.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated topic-specific notes for ${updatedCount} courses!`);
  } catch (error) {
    console.error("Error updating notes:", error);
  } finally {
    process.exit(0);
  }
}

updateNotes();
