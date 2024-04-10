import React from 'react'
import ScrollableFeed from "react-scrollable-feed";
import { isLastMessage, isSameSender, isSameSenderMargin, isSameUser } from '../config/ChatLogic';
import { ChatState } from '../Context/ChatProvider';
import { Avatar, Tooltip } from '@chakra-ui/react';

function ScrollableChat({messages}) {

    const {user} = ChatState();
  return (
    <div style={{maxHeight: '97%', overflow: 'auto'}}>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id)
            || isLastMessage(messages,i,user._id)
            )&& (
                <Tooltip
                label={m.sender.name}
                placement='bottom-start'
                hasArrow
                >
                    <Avatar 
                    mt='7px'
                    mr={1}
                    size="sm"
                    name={m.sender.name}
                    src={m.sender.pic}
                    />
                </Tooltip>
            )}

            <span style={{
                backgroundColor: `${
                    m.sender._id === user._id ? '#BEE3F8': '#89F5D0'
                }`,
                borderRadius:"20px",
                padding:"5px 15px",
                maxwidth: "75%",
                marginLeft:isSameSenderMargin(messages,m,i, user._id),
                marginTop: isSameUser(messages,m,i,user._id)? 3:10,
                }}>
                    {m.content}
            </span>
          </div>
        ))}
    </div>
  );
}

export default ScrollableChat