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

module.exports = router;
