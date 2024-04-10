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
var socket, selectedChatCompare;

 // Function to convert audio blob to base64 encoded string
 const audioBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
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

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState();
  const [socketConnected, setSocketConnected] = useState(false); //use state for socket.io
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcription, setTranscription] = useState('');
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const toast = useToast();

  const { user, selectedChat, setSelectedChat, notification, setNotification, updateMeeting, setUpdateMeeting } =
    ChatState();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

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

const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const startRecording = async () => {
    console.log('startingg')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.start();
      console.log('Recording started');

      // Event listener to handle data availability
      recorder.addEventListener('dataavailable', async (event) => {
        console.log('Data available event triggered');
        const audioBlob = event.data;

        const base64Audio = await audioBlobToBase64(audioBlob);
        //console.log('Base64 audio:', base64Audio);

        try {
          const startTime = performance.now();

          const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent('AIzaSyA43ww-_lW0qR7s_chr9U8HALVl_vaybiM')}`,
            {
              config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
              },
              audio: {
                content: base64Audio,
              },
            }
          );

          const endTime = performance.now();
          const elapsedTime = endTime - startTime;

          //console.log('API response:', response);
          console.log('Time taken (ms):', elapsedTime);

          if (response.data.results && response.data.results.length > 0) {
            setTranscription(response.data.results[0].alternatives[0].transcript);
          } else {
            console.log('No transcription results in the API response:', response.data);
            setTranscription('No transcription available');
          }
        } catch (error) {
          console.error('Error with Google Speech-to-Text API:', error.response.data);
        }
      });

      setRecording(true);
      setMediaRecorder(recorder);
    } catch (error) {
      stopRecording();
      console.error('Error getting user media:', error);
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
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
  });

    // Cleanup function to stop recording and release media resources
    useEffect(() => {
      return () => {
        if (mediaRecorder) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      };
    }, [mediaRecorder]);

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      
      // Check if the message contains the keyword "schedule meeting for"
    const scheduleRegex = /schedule meeting for (\d{2}\/\d{2}\/\d{4}) @ (\d{2}:\d{2})/;
    const match = newMessage.match(scheduleRegex);

    if (match) {
      const [_, dateString, timeString] = match; // Extract date and time from the message
      const scheduleDate = new Date(dateString + " " + timeString);

      // Check if the extracted date is valid
      if (isNaN(scheduleDate.getTime())) {
        // Invalid date format
        toast({
          title: "Invalid date format",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Send a request to your backend API to schedule the meeting
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.post(
          "http://localhost:5000/api/message/schedule-meeting",
          {
            content: newMessage, // Adjust date format as needed
            chatId: selectedChat._id,
          },
          config
        );

        setUpdateMeeting(!updateMeeting)

        // Handle the response from the backend API (if needed)
        console.log("Meeting scheduled:", data);
      } catch (error) {
        console.error("Failed to schedule meeting:", error);
        // Handle error response (if needed)
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
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );

        console.log(data);

        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
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

    // typing indicator logic
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Adjust breakpoint as needed
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const stopRecording = (transcription) => {
    setTranscription('')
    if(transcription) {
      setNewMessage(transcription)
    } else {
      setNewMessage('')
    }
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log('Recording stopped');
      setRecording(false);
    }
  };

  useEffect(()=> {
    setNewMessage(transcription)
  },[transcription])

  return (
    <>
      {selectedChat ? (
        <>
          {/* <Flex
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            justifyContent="space-between"
            alignItems="center"
          > */}
          {isSmallScreen && ( // Render IconButton only on small screens
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
              <ProfileModal user={getSenderDetails(user, selectedChat.users)} />
            )}
          </Box>
          {/* </Flex> */}
          <Box
            d="flex"
            flexDir="column"
            alignContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="90%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignItems="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}
            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {isTyping ? <div>Typing..</div> : <></>}
              <Flex align="center">
                <Box mr={2}>
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    style={{color: recording?'red':'black'}}
                    aria-label="Microphone"
                    onClick={()=>{
                      if(recording) {
                        stopRecording(transcription)
                      } else {
                        startRecording()
                      }
                      }
                    }
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
