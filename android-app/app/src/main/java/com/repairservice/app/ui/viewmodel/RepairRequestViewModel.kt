package com.repairservice.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.repairservice.app.data.model.Customer
import com.repairservice.app.data.model.RepairRequest
import com.repairservice.app.data.model.ServiceCategory
import com.repairservice.app.data.model.ServiceType
import com.repairservice.app.data.repository.RepairRepository
import com.repairservice.app.util.InputValidators
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class RepairFormState(
    val serviceCategory: ServiceCategory = ServiceCategory.MOBILE,
    val deviceBrand: String = "",
    val deviceModel: String = "",
    val problemDescription: String = "",
    val preferredDate: String = "",
    val serviceType: ServiceType = ServiceType.SERVICE_CENTER,
    val brandError: String? = null,
    val modelError: String? = null,
    val problemError: String? = null,
    val dateError: String? = null
)

data class RepairUiState(
    val myRequests: List<RepairRequest> = emptyList(),
    val isLoadingRequests: Boolean = false,
    val isSubmitting: Boolean = false,
    val lastCreatedRequestId: String? = null,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val formState: RepairFormState = RepairFormState()
)

class RepairRequestViewModel(
    private val repository: RepairRepository = RepairRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(RepairUiState())
    val uiState: StateFlow<RepairUiState> = _uiState.asStateFlow()

    private var listenerJob: Job? = null

    fun startObservingRequests(uid: String?) {
        listenerJob?.cancel()
        if (uid == null) {
            _uiState.update { it.copy(myRequests = emptyList(), isLoadingRequests = false) }
            return
        }
        _uiState.update { it.copy(isLoadingRequests = true, errorMessage = null) }
        listenerJob = viewModelScope.launch {
            repository.observeMyRepairRequests(uid)
                .catch { e ->
                    _uiState.update {
                        it.copy(
                            isLoadingRequests = false,
                            errorMessage = e.localizedMessage ?: "Failed to sync repair requests."
                        )
                    }
                }
                .collect { requests ->
                    _uiState.update { it.copy(myRequests = requests, isLoadingRequests = false) }
                }
        }
    }

    fun updateForm(transform: (RepairFormState) -> RepairFormState) {
        _uiState.update {
            it.copy(
                formState = transform(it.formState),
                errorMessage = null,
                successMessage = null
            )
        }
    }

    fun submitRequest(customer: Customer?) {
        if (customer == null) {
            _uiState.update {
                it.copy(errorMessage = "Complete customer registration before submitting a repair request.")
            }
            return
        }

        val form = _uiState.value.formState
        val brandErr = InputValidators.validateDeviceBrand(form.deviceBrand)
        val modelErr = InputValidators.validateDeviceModel(form.deviceModel)
        val problemErr = InputValidators.validateProblemDescription(form.problemDescription)
        val dateErr = InputValidators.validatePreferredDate(form.preferredDate)

        if (listOf(brandErr, modelErr, problemErr, dateErr).any { it != null }) {
            _uiState.update {
                it.copy(
                    formState = form.copy(
                        brandError = brandErr,
                        modelError = modelErr,
                        problemError = problemErr,
                        dateError = dateErr
                    ),
                    errorMessage = "Please fix the highlighted repair form fields."
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, errorMessage = null, successMessage = null) }
            repository.submitRepairRequest(
                customer = customer,
                serviceCategory = form.serviceCategory.label,
                deviceBrand = form.deviceBrand,
                deviceModel = form.deviceModel,
                problemDescription = form.problemDescription,
                preferredDate = form.preferredDate,
                serviceType = form.serviceType.label
            ).onSuccess { requestId ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        lastCreatedRequestId = requestId,
                        successMessage = "Repair request $requestId submitted and synced to Firebase.",
                        formState = RepairFormState()
                    )
                }
            }.onFailure { e ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = e.localizedMessage ?: "Failed to submit repair request."
                    )
                }
            }
        }
    }

    fun cancelRequest(requestId: String) {
        viewModelScope.launch {
            repository.cancelPendingRequest(requestId)
                .onSuccess {
                    _uiState.update { it.copy(successMessage = "Request $requestId cancelled.") }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(errorMessage = e.localizedMessage ?: "Unable to cancel request.") }
                }
        }
    }

    fun clearFeedback() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null, lastCreatedRequestId = null) }
    }
}
