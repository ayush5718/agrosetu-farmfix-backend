// services/notificationService.js
const Notification = require('../models/Notification');

async function sendNotification(userId, message, type = 'system') {
  const notification = new Notification({ userId, message, type });
  await notification.save();
  // Here integrate with SMS/WhatsApp/App push if needed
  return notification;
}

async function getNotifications(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 });
}

async function markAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate({ _id: notificationId, userId }, { read: true }, { new: true });
}

module.exports = { sendNotification, getNotifications, markAsRead };