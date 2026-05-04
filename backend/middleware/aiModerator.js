const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const bannedKeywords = [
  'scam', 'fake', 'fraud', 'illegal', 'hack', 'pirated', 'stolen', 'murder', 'blood', 'kill', 'hate'
];

const aiModerator = (req, res, next) => {
  try {
    const textToAnalyze = `${req.body.title || req.body.courseName || ''} ${req.body.description || ''}`.toLowerCase();

    if (!textToAnalyze.trim()) {
      return next(); // Nothing to analyze
    }

    // 1. Keyword check
    for (const word of bannedKeywords) {
      if (textToAnalyze.includes(word)) {
        return res.status(403).json({ 
          success: false, 
          message: `🛡️ AI Moderation Alert: Your content contains the restricted keyword "${word}" and has been blocked.` 
        });
      }
    }

    // 2. Sentiment analysis
    const result = sentiment.analyze(textToAnalyze);
    
    // If the content is intensely negative/toxic
    if (result.comparative < -0.5 || result.score < -3) {
      return res.status(403).json({
        success: false,
        message: "🛡️ AI Moderation Alert: Your content has been flagged for intensely negative, toxic, or inappropriate language."
      });
    }

    // Content is safe
    next();
  } catch (error) {
    console.error("AI Moderation Error:", error);
    next(); // Pass through if the AI fails, so we don't break the app
  }
};

module.exports = aiModerator;
