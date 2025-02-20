"use client";

import { useState } from "react";
import { auth } from "@/lib/services/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
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
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>
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
