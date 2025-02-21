"use client";

import { useState } from "react";
import { auth } from "@/lib/services/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
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
import { useSnackbarStore } from "@/store/snackbarStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const signUpWithGoogle = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      if (res) {
        showSnackbar("Successfully signed up with google", "success");
        router.push("/");
      }
    } catch (err: any) {
      console.log(err.code, "error");
      showSnackbar("Failed to signup with google", "error");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      if (!firstname || !lastname || !email || !password) {
        setError("All fields are required!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstname} ${lastname}`,
      });

      if (user) {
        await sendEmailVerification(user);
        showSnackbar("Check your email for verification!", "success");
        router.push("/email-verification");
      }
    } catch (err: any) {
      if (err.code === "auth/weak-password") {
        showSnackbar("Password is too weak! Please try again.", "error");
      } else if (err.code === "auth/email-already-in-use") {
        showSnackbar("Account already exists! Please log in.", "error");
      } else {
        setError(err.message);
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
            Sign Up
          </Typography>
          <div className="flex gap-4">
            <TextField
              fullWidth
              label="First Name"
              margin="normal"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
            <TextField
              fullWidth
              label="Last Name"
              margin="normal"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </div>{" "}
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
          {error && <Typography color="error">{error}</Typography>}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleRegister}
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Sign Up"}
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
              Signup with Google
              {isGoogleLoading && <CircularProgress size={18} />}
            </span>
          </button>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ textDecoration: "none", color: "#1976d2" }}
            >
              Login
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
