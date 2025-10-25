// routes/aiAdvisoryRoutes.js
const express = require('express');
const router = express.Router();
const { roleMiddleware } = require('../middleware/auth');

router.use(roleMiddleware(['farmer']));

// POST /ai/advice - Receive query and return AI advisory (mock)
router.post('/advice', async (req, res) => {
  const { query, photoUrl, voiceNoteUrl } = req.body;
  // Here you would integrate AI model or API

  // Placeholder response
  res.json({
    advice: "This is a sample AI advisory based on your input.",
    query,
    photoUrl,
    voiceNoteUrl,
  });
});

module.exports = router;