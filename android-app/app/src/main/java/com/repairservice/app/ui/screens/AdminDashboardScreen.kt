package com.repairservice.app.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.repairservice.app.data.model.Customer
import com.repairservice.app.data.model.RepairRequest
import com.repairservice.app.data.model.RepairStatus
import com.repairservice.app.ui.components.FeedbackBanner
import com.repairservice.app.ui.components.LoadingStateCard
import com.repairservice.app.ui.components.StatusIndicator
import com.repairservice.app.ui.viewmodel.AdminDashboardUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdminDashboardScreen(
    uiState: AdminDashboardUiState,
    onSearchQueryChange: (String) -> Unit,
    onStatusFilterChange: (RepairStatus?) -> Unit,
    onUpdateStatus: (String, RepairStatus, String?) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var activeRequest by remember { mutableStateOf<RepairRequest?>(null) }

    activeRequest?.let { req ->
        var nextStatus by remember(req.requestId) { mutableStateOf(RepairStatus.fromLabel(req.status)) }
        var notes by remember(req.requestId) { mutableStateOf(req.adminNotes.orEmpty()) }
        val customerInfo: Customer? = uiState.customers.firstOrNull { it.uid == req.customerId }

        AlertDialog(
            onDismissRequest = { activeRequest = null },
            title = {
                Text(
                    text = "Repair ${req.requestId}",
                    style = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Monospace)
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Customer: ${req.customerName} (${req.customerMobile})")
                    if (customerInfo != null) {
                        Text("Address: ${customerInfo.address}, ${customerInfo.city} - ${customerInfo.pinCode}")
                        Text("Email: ${customerInfo.email}")
                    }
                    HorizontalDivider()
                    Text("Device: ${req.deviceBrand} ${req.deviceModel} (${req.serviceCategory})")
                    Text("Service: ${req.serviceType} on ${req.preferredDate}")
                    Text("Issue: ${req.problemDescription}")
                    HorizontalDivider()
                    Text("Update Status", style = MaterialTheme.typography.titleMedium)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RepairStatus.entries.forEach { st ->
                            FilterChip(
                                selected = nextStatus == st,
                                onClick = { nextStatus = st },
                                label = { Text(st.label) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Technician Notes (Optional)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateStatus(req.requestId, nextStatus, notes)
                        activeRequest = null
                    },
                    enabled = !uiState.isUpdating
                ) {
                    Text("Save Status")
                }
            },
            dismissButton = {
                TextButton(onClick = { activeRequest = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
            Text("Admin Dashboard", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${uiState.requests.size} Repair Requests • ${uiState.customers.size} Registered Customers",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = onSearchQueryChange,
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                label = { Text("Search customer by name, mobile, or request ID") },
                singleLine = true,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            )
        }

        if (uiState.errorMessage != null) {
            FeedbackBanner(
                message = uiState.errorMessage,
                isError = true,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
            )
        }
        if (uiState.successMessage != null) {
            FeedbackBanner(
                message = uiState.successMessage,
                isError = false,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
            )
        }

        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("Repair Requests (${uiState.filteredRequests.size})") }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text("Customers (${uiState.filteredCustomers.size})") }
            )
        }

        if (uiState.isLoading) {
            LoadingStateCard("Loading Firebase operations data...")
        } else if (selectedTab == 0) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(6.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = uiState.selectedStatusFilter == null,
                            onClick = { onStatusFilterChange(null) },
                            label = { Text("All") }
                        )
                        RepairStatus.entries.forEach { st ->
                            FilterChip(
                                selected = uiState.selectedStatusFilter == st,
                                onClick = { onStatusFilterChange(st) },
                                label = { Text(st.label) }
                            )
                        }
                    }
                }
                items(uiState.filteredRequests, key = { it.requestId }) { req ->
                    Card(
                        onClick = { activeRequest = req },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = req.requestId,
                                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace)
                                )
                                StatusIndicator(statusLabel = req.status)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "${req.customerName} • ${req.customerMobile}",
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = "${req.deviceBrand} ${req.deviceModel} (${req.serviceCategory}) • ${req.serviceType}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Preferred: ${req.preferredDate} — Tap to inspect & update status",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(20.dp)) }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { Spacer(modifier = Modifier.height(6.dp)) }
                items(uiState.filteredCustomers, key = { it.uid }) { customer ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(customer.fullName, style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("${customer.mobileNumber} • ${customer.email}", style = MaterialTheme.typography.bodyMedium)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "${customer.address}, ${customer.city} - ${customer.pinCode}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(20.dp)) }
            }
        }
    }
}
