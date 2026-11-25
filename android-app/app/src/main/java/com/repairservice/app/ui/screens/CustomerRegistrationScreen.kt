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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.repairservice.app.ui.components.FeedbackBanner
import com.repairservice.app.ui.components.RepairTextField
import com.repairservice.app.ui.viewmodel.AuthUiState
import com.repairservice.app.ui.viewmodel.CustomerFormState

@Composable
fun CustomerRegistrationScreen(
    uiState: AuthUiState,
    onFormChange: ((CustomerFormState) -> CustomerFormState) -> Unit,
    onSave: () -> Unit,
    onSignOut: () -> Unit
) {
    val form = uiState.formState

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = if (uiState.customerProfile == null) "Customer Registration" else "Customer Profile",
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "All customer contact and address details are stored securely in Cloud Firestore.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (uiState.errorMessage != null) {
            FeedbackBanner(message = uiState.errorMessage, isError = true)
        }
        if (uiState.successMessage != null) {
            FeedbackBanner(message = uiState.successMessage, isError = false)
        }

        RepairTextField(
            value = form.fullName,
            onValueChange = { v -> onFormChange { it.copy(fullName = v, fullNameError = null) } },
            label = "Customer Full Name",
            errorText = form.fullNameError
        )

        RepairTextField(
            value = form.mobileNumber,
            onValueChange = { v ->
                val digits = v.filter { it.isDigit() }.take(10)
                onFormChange { it.copy(mobileNumber = digits, mobileError = null) }
            },
            label = "Mobile Number (10 digits)",
            errorText = form.mobileError,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )

        RepairTextField(
            value = form.email,
            onValueChange = { v -> onFormChange { it.copy(email = v, emailError = null) } },
            label = "Email Address",
            errorText = form.emailError,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )

        RepairTextField(
            value = form.address,
            onValueChange = { v -> onFormChange { it.copy(address = v, addressError = null) } },
            label = "Complete Address",
            errorText = form.addressError,
            singleLine = false,
            minLines = 2
        )

        RepairTextField(
            value = form.city,
            onValueChange = { v ->
                val filtered = v.filter { !it.isDigit() }
                onFormChange { it.copy(city = filtered, cityError = null) }
            },
            label = "City",
            errorText = form.cityError
        )

        RepairTextField(
            value = form.pinCode,
            onValueChange = { v ->
                val digits = v.filter { it.isDigit() }.take(6)
                onFormChange { it.copy(pinCode = digits, pinCodeError = null) }
            },
            label = "PIN Code (6 digits)",
            errorText = form.pinCodeError,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )

        Spacer(modifier = Modifier.height(6.dp))

        Button(
            onClick = onSave,
            enabled = !uiState.isSavingProfile,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            if (uiState.isSavingProfile) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                    modifier = Modifier.size(20.dp)
                )
            } else {
                Text(if (uiState.customerProfile == null) "Register Customer" else "Update Details")
            }
        }

        OutlinedButton(
            onClick = onSignOut,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            Text("Sign Out")
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}
