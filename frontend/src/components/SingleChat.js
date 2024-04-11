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
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderDetails } from '../config/ChatLogic';
import ProfileModal from './miscellaneous/ProfileModal';
import ScrollableChat from './ScrollableChat';
import io from 'socket.io-client';
import axios from 'axios';


const ENDPOINT = 'http://localhost:5000';
// var socket, selectedChatCompare;


const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const socket = io('http://localhost:5000');
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);


  const { user, selectedChat, setSelectedChat, notification, setNotification, updateMeeting, setUpdateMeeting } =
    ChatState();


    const fetchMessages = async () => {
      if (!selectedChat) return;
 
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        setLoading(true);
        const { data } = await axios.get(
          `http://localhost:5000/api/message/${selectedChat._id}`,
          config,
        );
 
        console.log(messages);
        setMessages(data);
        setLoading(false);
 
        socket.emit("join chat", selectedChat._id);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to load the Messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);


      recorder.addEventListener('dataavailable', async (event) => {
        const audioBlob = event.data;
        const base64Audio = await audioBlobToBase64(audioBlob);


        try {
          const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
            {
              config: { encoding: 'WEBM_OPUS', sampleRateHertz: 48000, languageCode: 'en-US' },
              audio: { content: base64Audio },
            }
          );


          if (response.data.results && response.data.results.length > 0) {
            setTranscription(response.data.results[0].alternatives[0].transcript);
          } else {
            setTranscription('No transcription available');
          }
        } catch (error) {
          console.error('Error with Google Speech-to-Text API:', error.response.data);
        }
      });


      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error getting user media:', error);
    }
  };


  const stopRecording = () => {
    setTranscription('');
    setNewMessage(transcription || '');
    setRecording(false);
  };


  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);


      const scheduleRegex = /schedule meeting for (\d{2}\/\d{2}\/\d{4}) @ (\d{2}:\d{2})/;
      const match = newMessage.match(scheduleRegex);


      if (match) {
        const [_, dateString, timeString] = match;
        const scheduleDate = new Date(dateString + " " + timeString);


        if (!isNaN(scheduleDate.getTime())) {
          try {
            const config = {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
            };


            const { data } = await axios.post(
              "http://localhost:5000/api/message/schedule-meeting",
              { content: newMessage, chatId: selectedChat._id },
              config
            );


            setUpdateMeeting(!updateMeeting);
            console.log("Meeting scheduled:", data);
          } catch (error) {
            console.error("Failed to schedule meeting:", error);
          }
        } else {
          toast({
            title: "Invalid date format",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }


      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "http://localhost:5000/api/message",
          { content: newMessage, chatId: selectedChat._id },
          config
        );


        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };


  const typingHandler = (e) => {
    setNewMessage(e.target.value);


    if (!socketConnected) return;


    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", selectedChat._id);
    }


    setTimeout(() => {
      if (isTyping) {
        socket.emit("stop typing", selectedChat._id);
        setIsTyping(false);
      }
    }, 3000);
  };


  useEffect(() => {
    const socket = io(ENDPOINT);
    socket.emit("setup", user);


    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));


    return () => {
      socket.disconnect(); // Clean up socket connection
    };
  }, [user]);


  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);


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
    setNewMessage(transcription);
  }, [transcription]);


  return (
    <>
      {selectedChat ? (
        <>
          <Flex align="center" justify="space-between">
            {isSmallScreen && (
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={() => setSelectedChat("")}
              />
            )}
            <Box>
              {!selectedChat.isGroupChat ? (
                <>{getSender(user, selectedChat.users)}</>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                </>
              )}
            </Box>
            <Box>
              {!selectedChat.isGroupChat && (
                <ProfileModal
                  user={getSenderDetails(user, selectedChat.users)}
                />
              )}
            </Box>
          </Flex>
          <Box>
            {loading ? (
              <Spinner size="xl" w={20} h={20} margin="auto" />
            ) : (
              <ScrollableChat messages={messages} />
            )}
            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {isTyping && <div>Typing..</div>}
              <Flex align="center">
                <Box mr={2}>
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    style={{ color: recording ? 'red' : 'black' }}
                    aria-label="Microphone"
                    onClick={() => {
                      if (recording) {
                        stopRecording();
                      } else {
                        startRecording();
                      }
                    }}
                  />
                </Box>
                <Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message...."
                  onChange={typingHandler}
                  value={newMessage}
                  disabled={recording}
                />
              </Flex>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box textAlign="center">
          <Text fontSize="3xl" pb={3}>
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};


export default SingleChat;


// Function to convert audio blob to base64 encoded string
const audioBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = btoa(
        new Uint8Array(reader.result).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};
