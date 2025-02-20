"use client";

import { useState } from "react";
import { auth } from "@/lib/services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useSnackbarStore } from "@/store/snackbarStore";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        showSnackbar("Please verify your email before logging in!", "warning");
        router.push("/email-verification");
      } else {
        showSnackbar("Login successful!", "success");

        router.push("/");
      }
    } catch (err: any) {
      console.log(err.code);
      if (err.code === "auth/invalid-credential") {
        showSnackbar("Invalid credential!", "error");
      } else if (err.code === "auth/user-not-found") {
        showSnackbar("User not found!", "error");
      } else if (err.code === "auth/wrong-password") {
        showSnackbar("Invalid password!", "error");
      } else if (err.code === "auth/invalid-email") {
        showSnackbar("Invalid credential!", "error");
      } else {
        showSnackbar(err.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
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
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={6}
          sx={{ padding: 4, borderRadius: 3, textAlign: "center" }}
        >
          <Typography variant="h5" gutterBottom>
            Login
          </Typography>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Login"}
          </Button>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Don't have an account?{" "}
            <Link
              href="/signup"
              style={{ textDecoration: "none", color: "#1976d2" }}
            >
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
