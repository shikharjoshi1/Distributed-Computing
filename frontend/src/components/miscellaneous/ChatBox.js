import React from 'react'
import { ChatState } from '../../Context/ChatProvider' 
import { Box } from '@chakra-ui/react';
import SingleChat from '../SingleChat';

const ChatBox=({fetchAgain, setFetchAgain}) =>{
  const {selectedChat}= ChatState();
  return (
    <Box
    d={{base:selectedChat?"flex":"none",md:"flex"}}
    align="center"
    flexDir="column"
    p={3}
    bg="white"
    w={{base:"100%", md:"68%"}}
    h="auto"
    borderRadius="lg"
    borderWidth="1px"
    overflowY="scroll"
    >
      <SingleChat
      fetchAgain={fetchAgain}
      setFetchAgain={setFetchAgain}
      ></SingleChat>
    </Box>
  )
}

export default ChatBox