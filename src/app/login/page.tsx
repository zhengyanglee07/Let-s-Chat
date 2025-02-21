"use client";

import { useState } from "react";
import { auth } from "@/lib/services/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Divider,
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

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const signUpWithGoogle = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      if (res) {
        showSnackbar("Successfully login with google", "success");
        router.push("/");
      }
    } catch (err) {
      console.log(err.code, "error");
      showSnackbar("Failed to login with google", "error");
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Login"}
          </Button>
          <Divider className="py-2" textAlign="center">
            or
          </Divider>
          <button
            className="bg-white leading-normal flex items-center justify-center px-5 py-2.5 border w-full rounded-lg shadow hover:shadow-lg disabled:opacity-50"
            onClick={signUpWithGoogle}
          >
            <img
              className="w-[18px] h-[18px]"
              alt="google"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            />
            <span className="text-[#757575] pl-[16px] text-[14px] flex align-center gap-3">
              Login with Google
              {isGoogleLoading && <CircularProgress size={18} />}
            </span>
          </button>

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
