const asyncHandler = require("express-async-handler");
const Message = require("../Models/messageModel");
const User = require("../Models/userModel");
const Chat = require("../Models/chatModel");

const scheduleMeeting = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;
  
    if (!content || !chatId) {
      console.log(
        "Invalid data passed. It should be in format of mm/dd/yyyy @ time"
      );
      return res.sendStatus(400);
    }
  
    // Extract meeting details from the content
    const regex =
      /schedule meeting for (\d{1,2}\/\d{1,2}\/\d{4}) @ (\d{1,2}:\d{2})/i;
    const match = content.match(regex);
  
    if (!match) {
      return res.status(400).json({ message: "Invalid meeting schedule format" });
    }
  
    const meetingDate = match[1];
    const meetingTime = match[2];
  
    console.log(req.user._id);

    // Create a new message for the meeting for the sender
    const senderMessage = {
      message: `Meeting scheduled successfully for ${meetingDate} at ${meetingTime}`,
      sender: req.user._id,
      content: content,
      chat: chatId,
    };
    
  console.log(senderMessage);
    // Create a new message for the meeting for the other user
    const chat = await Chat.findById(chatId);
    const otherUserId = chat.users.find(
      (user) => user.toString() !== req.user._id.toString()
    );
    const otherUserMessage = {
      message: `Meeting scheduled successfully for ${meetingDate} at ${meetingTime}`,
      sender: req.user._id,
      content: content,
      chat: chatId,
    };
  
    try {
      // Create messages for both users
      const senderMeetingMessage = await Message.create(senderMessage);
    //   const otherUserMeetingMessage = await Message.create(otherUserMessage);
  
      // Update the chat's latestMessage with the meeting messages
      await Chat.findByIdAndUpdate(chatId, {
        latestMessage: senderMeetingMessage,
      });
  
      // Return the created message for the sender along with the meeting scheduled message
      res.json({
        message: `Meeting scheduled for ${meetingDate} at ${meetingTime}`,
        senderMeetingMessage: senderMeetingMessage
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  

  const getUserMeetings = asyncHandler(async (req, res) => {
    console.log("AAija: ",req.user);
    try {
      // Fetch all messages containing meeting schedules sent by the logged-in user
      console.log(req.user); 
      const userMeetings = await Message.find({
        sender: req.user._id,
        content: {
          $regex:
            /schedule meeting for (\d{1,2}\/\d{1,2}\/\d{4}) @ (\d{1,2}:\d{2})/i,
        },
      }).populate('chat');
  
      // Extract required information from the user meetings
      const meetingsInfo = userMeetings.map((meeting) => ({
        meetingId: meeting._id,
        content: meeting.content,
        sender: meeting.sender,
        chatId: meeting.chat._id, // Access the chat ObjectId directly
        otherUserId: meeting.chat.users.find(
          (user) => user.toString() !== req.user._id.toString()
        ),
      }));
  
      res.json(meetingsInfo);
    } catch (error) {
      console.error("Error fetching user meetings:", error);
      res
        .status(500)
        .json({ message: "Error occurred while fetching user meetings" });
    }
  });
  

module.exports = { scheduleMeeting, getUserMeetings };
