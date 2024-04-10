const express = require('express');
const { protect } = require('../middlewares/authHandler');
const { sendMessage, allMessages } = require('../controllers/messageController');
const { scheduleMeeting, getUserMeetings } = require('../controllers/meetingController');
const router = express.Router()

router.route('/').post(protect, sendMessage)
router.route('/user-meetings').get(protect, getUserMeetings)
router.route('/:chatId').get(protect, allMessages)
router.route('/schedule-meeting').post(protect, scheduleMeeting)

module.exports=router;
