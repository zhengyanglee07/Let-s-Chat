"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/services/firebase";
import { sendEmailVerification } from "firebase/auth";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbarStore } from "@/store/snackbarStore";

const EmailVerification = () => {
  const [countdown, setCountdown] = useState<number>(0);
  const router = useRouter();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        showSnackbar("Verification email sent! Check your inbox.", "success");
        setCountdown(60);
      } catch (error) {
        showSnackbar(error.message, "error");
      }
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const checkVerification = setInterval(async () => {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        showSnackbar("Email verified! Redirecting...", "success");
        clearInterval(checkVerification);
        router.push("/");
      }
    }, 3000);

    return () => clearInterval(checkVerification);
  }, [router, showSnackbar]);

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
            Verify Your Email
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            A verification email has been sent to your email. Please verify your
            account.{" "}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleResendVerification}
            disabled={countdown > 0}
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend Verification Email"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailVerification;
