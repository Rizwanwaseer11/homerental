// Auto-approve pending properties after 1 hour and notify owner
const mongoose = require('mongoose');
const Property = require('../models/property');
const Notification = require('../models/notification');

async function autoApprovePendingProperties() {
  // Find properties pending for more than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const pendingProps = await Property.find({ status: 'pending', createdAt: { $lte: oneHourAgo } });
  for (const prop of pendingProps) {
    prop.status = 'available';
    await prop.save();
    await Notification.create({
      receiverId: prop.ownerId,
      propertyId: prop._id,
      message: `Your house (ID: ${prop._id}) is now listed on the site.`
    });
  }
}

module.exports = autoApprovePendingProperties;
