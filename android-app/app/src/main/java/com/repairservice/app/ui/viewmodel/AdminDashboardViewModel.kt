package com.repairservice.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.repairservice.app.data.model.Customer
import com.repairservice.app.data.model.RepairRequest
import com.repairservice.app.data.model.RepairStatus
import com.repairservice.app.data.repository.RepairRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AdminDashboardUiState(
    val customers: List<Customer> = emptyList(),
    val requests: List<RepairRequest> = emptyList(),
    val searchQuery: String = "",
    val selectedStatusFilter: RepairStatus? = null,
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
) {
    val filteredCustomers: List<Customer>
        get() {
            val q = searchQuery.trim().lowercase()
            if (q.isEmpty()) return customers
            return customers.filter {
                it.fullName.lowercase().contains(q) || it.mobileNumber.lowercase().contains(q)
            }
        }

    val filteredRequests: List<RepairRequest>
        get() {
            val q = searchQuery.trim().lowercase()
            return requests.filter { req ->
                val matchesStatus = selectedStatusFilter == null || req.status == selectedStatusFilter.label
                val matchesQuery = q.isEmpty() ||
                    req.customerName.lowercase().contains(q) ||
                    req.customerMobile.lowercase().contains(q) ||
                    req.requestId.lowercase().contains(q)
                matchesStatus && matchesQuery
            }
        }
}

class AdminDashboardViewModel(
    private val repository: RepairRepository = RepairRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminDashboardUiState())
    val uiState: StateFlow<AdminDashboardUiState> = _uiState.asStateFlow()

    private var customersJob: Job? = null
    private var requestsJob: Job? = null

    fun startAdminSync(isAdmin: Boolean) {
        customersJob?.cancel()
        requestsJob?.cancel()
        if (!isAdmin) {
            _uiState.update { AdminDashboardUiState() }
            return
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }

        customersJob = viewModelScope.launch {
            repository.observeAllCustomers()
                .catch { e ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = e.localizedMessage ?: "Failed to load customers.")
                    }
                }
                .collect { customers ->
                    _uiState.update { it.copy(customers = customers, isLoading = false) }
                }
        }

        requestsJob = viewModelScope.launch {
            repository.observeAllRepairRequests()
                .catch { e ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = e.localizedMessage ?: "Failed to load repair requests.")
                    }
                }
                .collect { requests ->
                    _uiState.update { it.copy(requests = requests, isLoading = false) }
                }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun selectStatusFilter(status: RepairStatus?) {
        _uiState.update { it.copy(selectedStatusFilter = status) }
    }

    fun updateRequestStatus(requestId: String, status: RepairStatus, notes: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUpdating = true, errorMessage = null, successMessage = null) }
            repository.updateRepairStatus(requestId, status, notes)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isUpdating = false,
                            successMessage = "Request $requestId updated to ${status.label}."
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isUpdating = false,
                            errorMessage = e.localizedMessage ?: "Failed to update request status."
                        )
                    }
                }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }
}
