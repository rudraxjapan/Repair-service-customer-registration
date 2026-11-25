package com.repairservice.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.repairservice.app.data.model.Customer
import com.repairservice.app.data.model.ServiceCategory
import com.repairservice.app.data.model.ServiceType
import com.repairservice.app.ui.components.FeedbackBanner
import com.repairservice.app.ui.components.RepairTextField
import com.repairservice.app.ui.viewmodel.RepairFormState
import com.repairservice.app.ui.viewmodel.RepairUiState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun RepairRequestFormScreen(
    customer: Customer?,
    uiState: RepairUiState,
    onFormChange: ((RepairFormState) -> RepairFormState) -> Unit,
    onSubmit: () -> Unit,
    onGoToRegistration: () -> Unit
) {
    val form = uiState.formState
    var showDatePicker by remember { mutableStateOf(false) }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val millis = datePickerState.selectedDateMillis
                    if (millis != null) {
                        val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }
                        val formatted = formatter.format(Date(millis))
                        onFormChange { it.copy(preferredDate = formatted, dateError = null) }
                    }
                    showDatePicker = false
                }) {
                    Text("Confirm")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "Submit Repair Request",
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "Each request generates a unique tracking ID in Firebase Firestore.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (customer == null) {
            FeedbackBanner(
                message = "Please complete customer registration before submitting a repair request.",
                isError = true
            )
            OutlinedButton(onClick = onGoToRegistration, shape = RoundedCornerShape(10.dp)) {
                Text("Go to Customer Registration")
            }
        } else {

        if (uiState.errorMessage != null) {
            FeedbackBanner(message = uiState.errorMessage, isError = true)
        }
        if (uiState.successMessage != null) {
            FeedbackBanner(message = uiState.successMessage, isError = false)
        }

        Text("Service Category", style = MaterialTheme.typography.titleMedium)
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            ServiceCategory.entries.forEach { category ->
                FilterChip(
                    selected = form.serviceCategory == category,
                    onClick = { onFormChange { it.copy(serviceCategory = category) } },
                    label = { Text(category.label) }
                )
            }
        }

        RepairTextField(
            value = form.deviceBrand,
            onValueChange = { v -> onFormChange { it.copy(deviceBrand = v, brandError = null) } },
            label = "Device Brand (e.g., Apple, Samsung, LG)",
            errorText = form.brandError
        )

        RepairTextField(
            value = form.deviceModel,
            onValueChange = { v -> onFormChange { it.copy(deviceModel = v, modelError = null) } },
            label = "Device Model",
            errorText = form.modelError
        )

        RepairTextField(
            value = form.problemDescription,
            onValueChange = { v -> onFormChange { it.copy(problemDescription = v, problemError = null) } },
            label = "Problem Description",
            errorText = form.problemError,
            singleLine = false,
            minLines = 3
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                RepairTextField(
                    value = form.preferredDate,
                    onValueChange = { v -> onFormChange { it.copy(preferredDate = v, dateError = null) } },
                    label = "Preferred Date (YYYY-MM-DD)",
                    errorText = form.dateError
                )
            }
            OutlinedButton(
                onClick = { showDatePicker = true },
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .padding(top = 6.dp)
                    .height(52.dp)
            ) {
                Text("Pick Date")
            }
        }

        Text("Service Type", style = MaterialTheme.typography.titleMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            ServiceType.entries.forEach { type ->
                FilterChip(
                    selected = form.serviceType == type,
                    onClick = { onFormChange { it.copy(serviceType = type) } },
                    label = { Text(type.label) }
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        Button(
            onClick = onSubmit,
            enabled = !uiState.isSubmitting,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            if (uiState.isSubmitting) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                    modifier = Modifier.size(20.dp)
                )
            } else {
                Text("Submit Repair Request")
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
