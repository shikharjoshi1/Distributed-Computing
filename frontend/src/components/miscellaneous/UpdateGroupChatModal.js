import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Button,
  useToast,
  Box,
  FormControl,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedChat, setSelectedChat, user, setChats } = ChatState();

  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState();
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const toast = useToast();


    const onModalClose = ()=>{
      setSearchResult([]);
      onClose();
    }

  const handleRemove = async(user1) => {
    if(selectedChat.groupAdmin._id !== user._id && user1._id !== user._id){
        toast({
            title:"Only Admins can remove users!",
            status: "error",
            duration:5000,  
            isClosable:true,
            position: "bottom"
        })
        return;
  };
  try {
    setLoading(true)

    const config={
        headers:{
            Authorization:`Bearer ${user.token}`,
        },
    };

    const {data} = await axios.put('http://localhost:5000/api/chat/groupremove',{
        chatId: selectedChat._id,
        userId: user1._id
    }, config);
        
    user1._id === user._id ? setSelectedChat(): setSelectedChat(data);
    setFetchAgain(!fetchAgain);
    fetchMessages();
    setLoading(false);
    toast({
        title: " Group Chat Updated Successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
} catch (error) {
    toast({
        title:"Error Occurred!",
        description:error.response.data.message,
        status: "error",
        duration:5000,
        isClosable:true,
        position: "bottom"
    });
    setLoading(false);
}
}

  const handleAddUser = async(user1) => {
    if(selectedChat.users.find((u)=> u._id === user1._id)){
        toast({
            title:"User Already in Group!",
            status: "error",
            duration:5000,
            isClosable:true,
            position: "bottom"
        })
        return;
    }
    if (selectedChat.groupAdmin._id !== user._id){
        toast({
            title:"Only admins can add someone",
            status: "error",
            duration:5000,
            isClosable:true,
            position: "bottom"
        });
        return;
    }
    try {
        setLoading(true)

        const config={
            headers:{
                Authorization:`Bearer ${user.token}`,
            },
        };

        const {data} = await axios.put('http://localhost:5000/api/chat/groupadd',{
            chatId: selectedChat._id,
            userId: user1._id
        }, config);
        setSelectedChat(data);
        setFetchAgain(!fetchAgain);
        setLoading(false);
    } catch (error) {
        toast({
            title:"Error Occurred!",
            description:error.response.data.message,
            status: "error",
            duration:5000,
            isClosable:true,
            position: "bottom"
        });
    }

  };

  

  const handleRename = async () => {
    if (!groupChatName) return;
    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const {data} = await axios.put(
        'http://localhost:5000/api/chat/update',
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config
      );

        const chatListData= await axios.get(
          'http://localhost:5000/api/chat',config
        );
        setChats(chatListData.data)

      // console.log("Response:", data); // Add this line to log the response
      setSelectedChat(data);
      setFetchAgain(fetchAgain);
      setRenameLoading(false);
      toast({
        title: " Group Chat Updated Successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      
    } catch (error) {
      console.error("Error:", error); // Add this line to log any errors
      toast({
        title: "Error Occurred!",
        description: error.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      return;
    }
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `http://localhost:5000/api/user?search=${search}`,
        config
      );
//      console.log(data);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />

      <Modal isOpen={isOpen} onClose={onModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedChat.chatName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              {selectedChat.users.map((u) => (
                <UserBadgeItem
                  key={user._id}
                  user={u}
                  handleFunction={() => handleRemove(u)}
                />
              ))}
            </Box>
            <FormControl d="flex">
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                variant="solid"
                colorScheme="teal"
                ml={1}
                isLoading={renameLoading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add User to group"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>
            {loading?(
                <Spinner size="lg"/>
            ):(searchResult?.map((user)=>(
                <UserListItem
                key={user._id}
                user={user}
                handleFunction={()=> handleAddUser(user)}
                />
            ))
        )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={() => handleRemove(user)}>
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
