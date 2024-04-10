import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";

function MeetingListModal({ children }) {
  const { user, updateMeeting } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log("User token:", user.token);
      const response = await axios.get(
        "http://localhost:5000/api/message/user-meetings",
        config
      );
      console.log("API response:", response.data);
      setMeetings(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user, updateMeeting]);

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
          >
            Meeting List
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody d="flex" flexDir="column" alignItems="center">
            {loading ? (
              <Spinner />
            ) : (
              <Table variant="striped" colorScheme="gray">
                <Thead>
                  <Tr>
                    <Th>Meeting ID</Th>
                    <Th>Content</Th>
                    <Th>Sender</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {meetings.map((meeting) => (
                    <Tr key={meeting.meetingId}>
                      <Td>{meeting.meetingId}</Td>
                      <Td>{meeting.content}</Td>
                      <Td>{meeting.sender}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default MeetingListModal;
