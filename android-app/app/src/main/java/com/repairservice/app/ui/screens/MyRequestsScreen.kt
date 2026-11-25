package com.repairservice.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.repairservice.app.data.model.RepairRequest
import com.repairservice.app.data.model.RepairStatus
import com.repairservice.app.ui.components.FeedbackBanner
import com.repairservice.app.ui.components.LoadingStateCard
import com.repairservice.app.ui.components.RepairSummaryCard
import com.repairservice.app.ui.components.StatusIndicator
import com.repairservice.app.ui.viewmodel.RepairUiState

@Composable
fun MyRequestsScreen(
    uiState: RepairUiState,
    onCancelRequest: (String) -> Unit
) {
    var selectedRequest by remember { mutableStateOf<RepairRequest?>(null) }

    selectedRequest?.let { req ->
        AlertDialog(
            onDismissRequest = { selectedRequest = null },
            title = {
                Text(
                    text = req.requestId,
                    style = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Monospace)
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusIndicator(statusLabel = req.status)
                    HorizontalDivider()
                    Text("Device: ${req.deviceBrand} ${req.deviceModel}")
                    Text("Category: ${req.serviceCategory}")
                    Text("Service Type: ${req.serviceType}")
                    Text("Preferred Date: ${req.preferredDate}")
                    Text("Issue: ${req.problemDescription}")
                    if (!req.adminNotes.isNullOrBlank()) {
                        Text("Technician Notes: ${req.adminNotes}")
                    }
                }
            },
            confirmButton = {
                if (req.status == RepairStatus.PENDING.label) {
                    TextButton(
                        onClick = {
                            onCancelRequest(req.requestId)
                            selectedRequest = null
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Cancel Request")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedRequest = null }) {
                    Text("Close")
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text("My Repair Requests", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Live status updates synchronized with Firebase Firestore.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (uiState.errorMessage != null) {
            item { FeedbackBanner(message = uiState.errorMessage, isError = true) }
        }
        if (uiState.successMessage != null) {
            item { FeedbackBanner(message = uiState.successMessage, isError = false) }
        }

        if (uiState.isLoadingRequests) {
            item { LoadingStateCard("Loading your repair requests...") }
        } else if (uiState.myRequests.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Text(
                        text = "You have not submitted any repair requests yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(uiState.myRequests, key = { it.requestId }) { request ->
                Column {
                    RepairSummaryCard(request = request, onClick = { selectedRequest = request })
                    if (request.status == RepairStatus.PENDING.label) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp),
                            horizontalArrangement = Arrangement.End
                        ) {
                            OutlinedButton(
                                onClick = { onCancelRequest(request.requestId) },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Cancel Pending")
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(20.dp)) }
    }
}
