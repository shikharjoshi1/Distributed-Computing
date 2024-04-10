import React, { useState, useEffect } from 'react';
import { ChatState } from '../Context/ChatProvider';
import {
  Box,
  IconButton,
  Text,
  Flex,
  Spinner,
  FormControl,
  Input,
  useToast,
} from '@chakra-ui/react';
import './style.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderDetails } from '../config/ChatLogic';
import ProfileModal from './miscellaneous/ProfileModal';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from 'axios';
import ScrollableChat from './ScrollableChat';
import io from 'socket.io-client';

const ENDPOINT = 'http://localhost:5000';
var socket;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcription, setTranscription] = useState('');
  const { user, selectedChat, setSelectedChat, notification, setNotification, updateMeeting, setUpdateMeeting } = ChatState();
  const toast = useToast();
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    fetchMessages(); // Call fetchMessages initially
  }, []); // Empty dependency array ensures this runs only once on component mount

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(); // Call fetchMessages whenever selectedChat changes
    }
  }, [selectedChat]); // Dependency on selectedChat

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      socket.on("message received", (newMessageReceived) => {
        // Handle incoming messages
        if (
          !selectedChatCompare ||
          selectedChatCompare._id !== newMessageReceived.chat._id
        ) {
          if (!notification.includes(newMessageReceived)) {
            setNotification([newMessageReceived, ...notification]);
            setFetchAgain(!fetchAgain);
          }
        } else {
          setMessages([...messages, newMessageReceived]);
        }
        console.log("Notification test Successful: ", notification);
      });
    }
  }, [messages, notification, selectedChatCompare, fetchAgain]); // Dependencies for the useEffect hook

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(`http://localhost:5000/api/message/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const startRecording = async () => {
    // Your recording logic
  };

  const stopRecording = () => {
    // Your stop recording logic
  };

  const sendMessage = async (event) => {
    // Your sendMessage logic
  };

  const typingHandler = (e) => {
    // Your typingHandler logic
  };

  return (
    <>
      {selectedChat ? (
        <>
          {/* Render your chat interface */}
        </>
      ) : (
        // Render a message if no chat is selected
        <Box
          d="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
          textAlign="center"
          marginLeft="auto"
          marginRight="auto"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
