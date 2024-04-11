import { Button, FormControl, FormLabel, VStack, useToast } from "@chakra-ui/react";
import { Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import React, { useState } from "react";
import  axios from "axios";
import {  useHistory} from "react-router-dom";

const Login = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const history = useHistory();
  const handleClick = () => setShow(!show);

  const submitHndler = async() => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please fill all the fields.",
        status:"warning",
        duration: 5000,
        isClosable: true,
        position: "bottom"
      });
      setLoading(false);
      return;
    }
    // if (password !== confirmPassword) {
    //   toast({
    //     title: "Password and confirm password do not match.",
    //     status:"warning",
    //     duration: 5000,
    //     isClosable: true,
    //     position: "bottom"
    //   })
    //   return;
    // }

    try {
      const config ={
        headers:{
          'Content-type': 'application/json'
        }
      };
      const {data} = await axios.post(`${process.env.REACT_APP_API_URL}/user/login`,
      { email, password }, config
      );
      console.log("logged in!")
      toast({
        title: "Logged in Successfully!",
        status:"success",
        duration: 15000,
        isClosable: true,
        position: "bottom"
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      history.push('/chats')
    } catch (error) {
      toast({
        title: "Something went wrong!",
        description: error.response.data.message,
        status:"error",
        duration: 5000,
        isClosable: true,
        position: "bottom"
      }) 
      setLoading(false);
    }
  };

  return (
    <VStack spacing="5px">
      <FormControl id="email" isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          placeholder="Enter your Email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>

      <FormControl id="password" isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter your Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        colorScheme="blue"
        width="100%"
        style={{ marginTop: 15 }}
        onClick={submitHndler}
        isLoading = {loading}
      >
        Log In
      </Button>
    </VStack>
  );
};

export default Login;
