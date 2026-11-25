package com.repairservice.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.repairservice.app.ui.components.FeedbackBanner
import com.repairservice.app.ui.components.RepairTextField
import com.repairservice.app.ui.viewmodel.AuthUiState

private enum class AuthMode {
    SIGN_IN,
    REGISTER,
    RESET_PASSWORD
}

@Composable
fun AuthScreen(
    uiState: AuthUiState,
    onSignIn: (String, String) -> Unit,
    onRegister: (String, String) -> Unit,
    onSendPasswordReset: (String) -> Unit,
    onRefreshVerification: () -> Unit,
    onResendVerification: () -> Unit,
    onClearMessages: () -> Unit,
    onSignOut: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var authMode by remember { mutableStateOf(AuthMode.SIGN_IN) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Calibre Repair",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = if (uiState.currentUser != null && !uiState.isEmailVerified) {
                "Verify your email address to activate secure Firebase access."
            } else {
                when (authMode) {
                    AuthMode.SIGN_IN -> "Sign in to manage your device repairs and service requests."
                    AuthMode.REGISTER -> "Create a customer account to submit and track repair requests."
                    AuthMode.RESET_PASSWORD -> "Enter your account email to receive a password reset link."
                }
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (uiState.errorMessage != null) {
            FeedbackBanner(message = uiState.errorMessage, isError = true)
            Spacer(modifier = Modifier.height(16.dp))
        }
        if (uiState.successMessage != null) {
            FeedbackBanner(message = uiState.successMessage, isError = false)
            Spacer(modifier = Modifier.height(16.dp))
        }

        if (uiState.currentUser != null && !uiState.isEmailVerified) {
            Text(
                text = "Verification email sent to ${uiState.currentUser.email}. Confirm the link in your inbox, then tap below.",
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRefreshVerification,
                enabled = !uiState.isAuthLoading,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text(if (uiState.isAuthLoading) "Checking..." else "I Verified My Email")
            }
            Spacer(modifier = Modifier.height(10.dp))
            OutlinedButton(
                onClick = onSignOut,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Use a Different Account")
            }
            Spacer(modifier = Modifier.height(6.dp))
            TextButton(
                onClick = onResendVerification,
                enabled = !uiState.isAuthLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Resend Verification Email")
            }
        } else {
            RepairTextField(
                value = email,
                onValueChange = { email = it },
                label = "Email Address",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
            )

            if (authMode != AuthMode.RESET_PASSWORD) {
                Spacer(modifier = Modifier.height(14.dp))
                RepairTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password (min 6 characters)",
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                )
            }

            if (authMode == AuthMode.SIGN_IN) {
                Spacer(modifier = Modifier.height(4.dp))
                TextButton(
                    onClick = {
                        onClearMessages()
                        authMode = AuthMode.RESET_PASSWORD
                    }
                ) {
                    Text("Forgot Password?")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    when (authMode) {
                        AuthMode.SIGN_IN -> onSignIn(email, password)
                        AuthMode.REGISTER -> onRegister(email, password)
                        AuthMode.RESET_PASSWORD -> onSendPasswordReset(email)
                    }
                },
                enabled = !uiState.isAuthLoading,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                if (uiState.isAuthLoading) {
                    CircularProgressIndicator(
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(20.dp)
                    )
                } else {
                    Text(
                        when (authMode) {
                            AuthMode.SIGN_IN -> "Sign In"
                            AuthMode.REGISTER -> "Create Account"
                            AuthMode.RESET_PASSWORD -> "Send Reset Link"
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            TextButton(
                onClick = {
                    onClearMessages()
                    authMode = if (authMode == AuthMode.SIGN_IN) AuthMode.REGISTER else AuthMode.SIGN_IN
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    when (authMode) {
                        AuthMode.SIGN_IN -> "New customer? Create an account"
                        AuthMode.REGISTER -> "Already have an account? Sign In"
                        AuthMode.RESET_PASSWORD -> "Back to Sign In"
                    }
                )
            }
        }
    }
}
