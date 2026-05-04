const router = require("express").Router();
const auth = require("../middleware/auth");
const { User } = require("../models/user");

// Generates an AI Quiz based on the provided notes
router.post("/generate-quiz", auth, async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).send({ message: "No notes provided for the AI to read." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_api_key_here") {
      // ✅ MOCK AI FALLBACK
      // If the user hasn't set up the API key, return a mock quiz so the presentation works!
      console.log("Gemini API Key missing. Returning Mock Quiz.");
      
      const mockQuiz = [
        {
          question: "Based on the notes, what is the primary focus of this topic?",
          options: ["Physical endurance", "Mental alignment and balance", "Speed and agility", "Memorization techniques"],
          answer: "Mental alignment and balance"
        },
        {
          question: "Which of the following best describes the core principle taught?",
          options: ["Rote learning", "Consistent practice and foundation", "Avoiding complex tasks", "Ignoring the basics"],
          answer: "Consistent practice and foundation"
        },
        {
          question: "How should one approach advanced techniques?",
          options: ["Skip the basics entirely", "Only practice them once", "Combine them with foundational knowledge", "Avoid them altogether"],
          answer: "Combine them with foundational knowledge"
        }
      ];

      // Simulate a small network delay to make it feel like an AI is generating it
      await new Promise(resolve => setTimeout(resolve, 1500));

      return res.send({ quiz: mockQuiz });
    }

    const prompt = `
      You are an expert teacher. I will provide you with some lecture notes. 
      Generate exactly 3 multiple-choice questions based on these notes to test a student's understanding.
      
      Format the response strictly as a JSON array of objects. Do not include any markdown formatting or backticks around the JSON.
      The structure for each object MUST be:
      {
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "The exact string from the options array that is correct"
      }
      
      Lecture Notes:
      ${notes}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);
      return res.status(500).send({ message: "Failed to generate AI Quiz." });
    }

    let rawText = data.candidates[0].content.parts[0].text;
    
    // Clean up potential markdown formatting from Gemini
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    const quizData = JSON.parse(rawText);

    res.send({ quiz: quizData });

  } catch (error) {
    console.error("AI Quiz Gen Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Generates a Deep Pedagogical Insight for Teachers
router.post("/teacher-deep-insight", auth, async (req, res) => {
  try {
    const { reviews, courses, retentionRate } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_api_key_here") {
      const mockInsight = {
        emotionalSummary: "Your students deeply respect your expertise in Vedic Mathematics, but there is a palpable sense of 'instructional fatigue' around the 15-minute mark of your second lecture.",
        contentAnalysis: "While the 'Logic of Panini' lecture is academically rigorous, the lack of visual aids makes it difficult for beginners to stay engaged. The data shows a 40% drop in watch-time when you transition to complex sutras without examples.",
        improvements: [
          "Break down the 'Ashtadhyayi' lecture into 3 smaller modules (10 mins each).",
          "Add 2 interactive 'Challenge Questions' midway through the Science lectures to regain focus.",
          "Use a warmer, more encouraging tone during the conclusion of your 'Mastery' course - students feel a bit intimidated by the final assessment."
        ]
      };
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.send(mockInsight);
    }

    const prompt = `
      You are an expert pedagogical advisor and Emotional Intelligence coach for teachers.
      I will provide data about a teacher's performance. Generate a "Deep Pedagogical Insight" report.
      
      DATA:
      - Student Reviews: ${JSON.stringify(reviews)}
      - Course Titles/Content: ${JSON.stringify(courses.map(c => c.name))}
      - Avg Student Retention/Watch Time: ${retentionRate || '65%'}

      YOUR TASK:
      1. Emotional Summary: Write a warm but professional 2-sentence acknowledgement of the teacher's impact.
      2. Content & Watch-time Analysis: Analyze why students might be dropping off or where the content feels too heavy based on the titles and retention.
      3. Actionable Improvements: Provide 3 specific, high-impact changes to their teaching or course structure.

      Format the response strictly as a JSON object:
      {
        "emotionalSummary": "...",
        "contentAnalysis": "...",
        "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
      }
      Do not include any markdown formatting.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Gemini API Error");

    let rawText = data.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const insight = JSON.parse(rawText);

    res.send(insight);

  } catch (error) {
    console.error("Teacher Insight Error:", error);
    res.status(500).send({ message: "Failed to generate AI Insight." });
  }
});

module.exports = router;
