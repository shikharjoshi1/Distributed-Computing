import { CloseIcon } from '@chakra-ui/icons'
import { Box } from '@chakra-ui/react'
import React from 'react'

export default function UserBadgeItem({user, handleFunction}) {
  return (
    <Box
    px={2}
    py={1}
    borderRadius="lg"
    m={1}
    mb={2}
    variant="solid"
    fontSize={12}
    backgroundColor="green"
    color="white"
    cursor="pointer"
    display="inline-flex" // Display inline to fit content
    alignItems="center" // Align items to center
    maxWidth="fit-content" // Limit width to fit content
    onClick={handleFunction}
    >
        {user.name}
        <CloseIcon pl={1}/>
    </Box>
  )
}
