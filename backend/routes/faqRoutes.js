const express = require('express');
const router = express.Router();
const { findResponse, getQuickReplies } = require('../services/faqService');

router.post('/faq/message', (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = findResponse(message);
    res.json(result);
  } catch (error) {
    console.error('FAQ message error:', error);
    res.status(500).json({
      error: 'An error occurred processing your message'
    });
  }
});

router.get('/faq/quick-replies', (req, res) => {
  try {
    const quickReplies = getQuickReplies();
    res.json({ quickReplies });
  } catch (error) {
    console.error('FAQ quick-replies error:', error);
    res.status(500).json({
      error: 'An error fetching quick replies'
    });
  }
});

module.exports = router;
