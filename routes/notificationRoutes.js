// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { roleMiddleware } = require('../middleware/auth');
const { getNotifications, markAsRead } = require('../services/notificationService');

router.use(roleMiddleware(['farmer', 'dealer', 'admin', 'delivery']));

router.get('/', async (req, res) => {
  const notifications = await getNotifications(req.user._id);
  res.json({ notifications });
});

router.patch('/:id/read', async (req, res) => {
  const notification = await markAsRead(req.params.id, req.user._id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ message: 'Notification marked as read', notification });
});

module.exports = router;