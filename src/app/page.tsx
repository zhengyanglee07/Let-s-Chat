"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/services/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  CircularProgress,
  Avatar,
  Box,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Paper,
  TextField,
  Typography,
  InputBase,
  Menu,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import SendIcon from "@mui/icons-material/Send";

interface IMessage {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  createdAt: number;
}

let socket: Socket;

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [activeUids, setActiveUids] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setCurrentUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const setUserOnline = () => {
    if (!currentUser) return;
    if (document.visibilityState === "visible") {
      socket.emit("userOnline", { userId: currentUser.uid });
    }
  };

  const setUserOffline = () => {
    if (!currentUser) return;
    socket.emit("userOffline", { userId: currentUser.uid });
  };

  useEffect(() => {
    if (!currentUser) return;

    socket = io("http://localhost:3001", {
      reconnection: true,
      transports: ["websocket"],
    });

    setUserOnline();

    socket.on("updateUserList", (users: any) => {
      setActiveUids(users.map((m: any) => m.userId));
    });
    socket.on("receiveMessage", (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });
    document.addEventListener("visibilitychange", setUserOnline);
    window.addEventListener("focus", setUserOnline);
    window.addEventListener("blur", setUserOffline);
    window.addEventListener("beforeunload", setUserOffline);

    return () => {
      document.removeEventListener("visibilitychange", setUserOnline);
      window.removeEventListener("focus", setUserOnline);
      window.removeEventListener("blur", setUserOffline);
      window.removeEventListener("beforeunload", setUserOffline);
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get("/api/getVerifiedUsers");
      setUsers(res.data.verifiedUsers);
    };
    fetchUsers();
  }, []);

  const filteredUser = useMemo(() => {
    if (!search) return users;
    return users.filter((user: any) =>
      user.displayName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  useEffect(() => {
    console.log("selectedUser", selectedUser);
    if (!selectedUser || !currentUser) return;

    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    socket.emit("joinChat", chatId);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages?chatId=${chatId}`);
        setMessages(res.data.messages);
        setTimeout(() => {
          chatBoxScrollToBottom();
        }, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  const chatBoxScrollToBottom = () => {
    const chatBox = document.querySelector(`#chatbox-${selectedUser?.uid}`);
    if (!chatBox) return;
    chatBox.scrollTo({
      left: 0,
      top: chatBox.scrollHeight,
      behavior: "smooth",
    });
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");

    const newMessage = {
      sender: currentUser.uid,
      receiver: selectedUser.uid,
      text: messageText,
      createdAt: Date.now(),
      chatId,
    };

    socket.emit("sendMessage", newMessage);

    try {
      await axios.post("/api/messages", newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }

    chatBoxScrollToBottom();
    setMessageText("");
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await auth.signOut(); // Logout function
    handleClose();
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, black 50%, white 50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 2,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          height: isMobile ? "100vh" : "85vh",
          width: isMobile ? "100vw" : "80vw",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: 3,
          padding: isMobile ? 0 : "",
        }}
        component={Paper}
        elevation={6}
      >
        {/* Left Sidebar (User List) */}
        <Box
          sx={{
            width: "30%",
            backgroundColor: "#1E1E1E",
            color: "white",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              padding: 2,
              borderBottom: "1px solid #444",
            }}
          >
            <SearchIcon sx={{ marginRight: 1 }} />
            <InputBase
              placeholder="Search users..."
              onChange={(e) => setSearch(e.target.value)}
              sx={{ color: "white", flex: 1 }}
            />
          </Box>

          {/* User List */}
          <List>
            {filteredUser.length ? (
              filteredUser.map((user) => (
                <ListItemButton
                  key={user.uid}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#333" },
                  }}
                  selected={selectedUser?.uid === user.uid}
                  onClick={() => setSelectedUser(user)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: activeUids.includes(user.uid)
                          ? "green"
                          : "gray",
                        width: "max(40,10vw)",
                        height: "max(40,10vw)",
                      }}
                    >
                      {user?.displayName?.charAt(0) ?? "-"}
                    </Avatar>
                  </ListItemAvatar>
                  { <ListItemText primary={user.displayName} />}
                </ListItemButton>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No users found" />
              </ListItem>
            )}
          </List>
        </Box>

        {/* Right Side (Chat Area) */}
        <Box
          sx={{
            width: "70%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 2,
              borderBottom: "1px solid #ddd",
            }}
          >
            <Typography variant="h6">
              {selectedUser ? (
                <div className="flex gap-3 items-center">
                  <Avatar
                    sx={{
                      bgcolor: activeUids.includes(selectedUser.uid)
                        ? "green"
                        : "gray",
                      width: "max(40,10vw)",
                      height: "max(40,10vw)",
                    }}
                  >
                    {}
                    {selectedUser?.displayName?.charAt(0) ?? "-"}
                  </Avatar>
                  <ListItemText primary={selectedUser.displayName} />
                </div>
              ) : (
                "Chat"
              )}
            </Typography>
            <IconButton onClick={handleClick}>
              <SettingsIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>

          {/* Chat Messages */}
          <Box
            id={`chatbox-${selectedUser?.uid}`}
            sx={{
              flex: 1,
              overflowY: "auto",
              padding: 2,
              backgroundColor: "#f5f5f5",
            }}
          >
            <List>
              {messages.length ? (
                messages.map((msg, idx) => (
                  <ListItem
                    key={`${msg.id}-${idx}`}
                    sx={{
                      justifyContent:
                        msg.sender === currentUser?.uid
                          ? "flex-end"
                          : "flex-start",
                    }}
                  >
                    {/* {msg.sender !== currentUser?.uid  && (
                    <ListItemAvatar>
                      <Avatar>{msg.sender.charAt(0)}</Avatar>
                    </ListItemAvatar>
                  )} */}
                    <Paper
                      sx={{
                        padding: 1.5,
                        maxWidth: "75%",
                        backgroundColor:
                          msg.sender === currentUser?.uid
                            ? "#1976d2"
                            : "#ffffff",
                        color:
                          msg.sender === currentUser?.uid ? "#fff" : "#000",
                        borderRadius: 2,
                      }}
                    >
                      <ListItemText primary={msg.text} />
                    </Paper>
                  </ListItem>
                ))
              ) : (
                <ListItemText primary="Welcome!" />
              )}
            </List>
          </Box>

          {/* Message Input */}
          <Box
            sx={{
              display: "flex",
              padding: 1,
              borderTop: "1px solid #ddd",
              backgroundColor: "white",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <IconButton color="primary" onClick={handleSendMessage}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
