package com.repairservice.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.repairservice.app.data.model.Customer
import com.repairservice.app.data.repository.RepairRepository
import com.repairservice.app.util.InputValidators
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CustomerFormState(
    val fullName: String = "",
    val mobileNumber: String = "",
    val email: String = "",
    val address: String = "",
    val city: String = "",
    val pinCode: String = "",
    val fullNameError: String? = null,
    val mobileError: String? = null,
    val emailError: String? = null,
    val addressError: String? = null,
    val cityError: String? = null,
    val pinCodeError: String? = null
)

data class AuthUiState(
    val currentUser: FirebaseUser? = null,
    val isEmailVerified: Boolean = false,
    val customerProfile: Customer? = null,
    val isAdmin: Boolean = false,
    val isAuthLoading: Boolean = false,
    val isProfileLoading: Boolean = true,
    val isSavingProfile: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val formState: CustomerFormState = CustomerFormState()
)

class AuthAndCustomerViewModel(
    private val repository: RepairRepository = RepairRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var profileJob: Job? = null

    init {
        observeAuth()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            repository.observeAuthState().collect { user ->
                profileJob?.cancel()
                if (user == null) {
                    _uiState.update {
                        AuthUiState(
                            currentUser = null,
                            isEmailVerified = false,
                            customerProfile = null,
                            isAdmin = false,
                            isProfileLoading = false
                        )
                    }
                } else {
                    val verified = user.isEmailVerified
                    _uiState.update {
                        it.copy(
                            currentUser = user,
                            isEmailVerified = verified,
                            isProfileLoading = verified,
                            formState = it.formState.copy(
                                email = it.formState.email.ifBlank { user.email.orEmpty() },
                                fullName = it.formState.fullName.ifBlank { user.displayName.orEmpty() }
                            )
                        )
                    }
                    if (verified) {
                        val admin = repository.isCurrentUserAdmin()
                        _uiState.update { it.copy(isAdmin = admin) }
                        observeProfile(user.uid, user.email.orEmpty())
                    } else {
                        _uiState.update {
                            it.copy(
                                isAdmin = false,
                                customerProfile = null,
                                isProfileLoading = false
                            )
                        }
                    }
                }
            }
        }
    }

    private fun observeProfile(uid: String, fallbackEmail: String) {
        profileJob = viewModelScope.launch {
            repository.observeCustomerProfile(uid)
                .catch { e ->
                    _uiState.update {
                        it.copy(
                            isProfileLoading = false,
                            errorMessage = e.localizedMessage ?: "Failed to load customer profile."
                        )
                    }
                }
                .collect { customer ->
                    _uiState.update { state ->
                        val updatedForm = if (customer != null) {
                            state.formState.copy(
                                fullName = customer.fullName,
                                mobileNumber = customer.mobileNumber,
                                email = customer.email,
                                address = customer.address,
                                city = customer.city,
                                pinCode = customer.pinCode
                            )
                        } else {
                            state.formState.copy(
                                email = state.formState.email.ifBlank { fallbackEmail }
                            )
                        }
                        state.copy(
                            customerProfile = customer,
                            isProfileLoading = false,
                            formState = updatedForm
                        )
                    }
                }
        }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.length < 6) {
            _uiState.update { it.copy(errorMessage = "Enter a valid email and a password of at least 6 characters.") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isAuthLoading = true, errorMessage = null, successMessage = null) }
            repository.signInWithEmail(email, password)
                .onSuccess {
                    _uiState.update { it.copy(isAuthLoading = false, successMessage = "Signed in successfully.") }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isAuthLoading = false, errorMessage = e.localizedMessage ?: "Sign in failed.") }
                }
        }
    }

    fun registerAccount(email: String, password: String) {
        val emailErr = InputValidators.validateEmail(email)
        if (emailErr != null) {
            _uiState.update { it.copy(errorMessage = emailErr) }
            return
        }
        if (password.length < 6) {
            _uiState.update { it.copy(errorMessage = "Password must be at least 6 characters.") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isAuthLoading = true, errorMessage = null, successMessage = null) }
            repository.registerWithEmail(email, password)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isAuthLoading = false,
                            successMessage = "Account created. Verify your email inbox to unlock Firestore writes."
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isAuthLoading = false, errorMessage = e.localizedMessage ?: "Registration failed.") }
                }
        }
    }

    fun refreshVerificationStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isAuthLoading = true, errorMessage = null, successMessage = null) }
            repository.reloadCurrentUser()
                .onSuccess { user ->
                    val verified = user?.isEmailVerified == true
                    val admin = if (verified) repository.isCurrentUserAdmin() else false
                    _uiState.update {
                        it.copy(
                            currentUser = user,
                            isEmailVerified = verified,
                            isAdmin = admin,
                            isAuthLoading = false,
                            isProfileLoading = verified,
                            successMessage = if (verified) {
                                "Email verified successfully."
                            } else {
                                null
                            },
                            errorMessage = if (!verified) {
                                "Email is not verified yet. Click the link in your inbox and try again."
                            } else {
                                null
                            }
                        )
                    }
                    if (verified && user != null) {
                        observeProfile(user.uid, user.email.orEmpty())
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isAuthLoading = false, errorMessage = e.localizedMessage) }
                }
        }
    }

    fun sendPasswordReset(email: String) {
        val emailErr = InputValidators.validateEmail(email)
        if (emailErr != null) {
            _uiState.update { it.copy(errorMessage = emailErr, successMessage = null) }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isAuthLoading = true, errorMessage = null, successMessage = null) }
            repository.sendPasswordResetEmail(email)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isAuthLoading = false,
                            successMessage = "Password reset link sent to ${email.trim()}. Check your email inbox."
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isAuthLoading = false,
                            errorMessage = e.localizedMessage ?: "Failed to send password reset email."
                        )
                    }
                }
        }
    }

    fun resendVerificationEmail() {
        viewModelScope.launch {
            _uiState.update { it.copy(isAuthLoading = true, errorMessage = null, successMessage = null) }
            repository.resendVerificationEmail()
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isAuthLoading = false,
                            successMessage = "Verification email resent. Check your inbox."
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isAuthLoading = false,
                            errorMessage = e.localizedMessage ?: "Unable to resend verification email."
                        )
                    }
                }
        }
    }

    fun signOut() {
        repository.signOut()
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    fun updateFormField(transform: (CustomerFormState) -> CustomerFormState) {
        _uiState.update { it.copy(formState = transform(it.formState), errorMessage = null, successMessage = null) }
    }

    fun saveCustomerProfile() {
        val form = _uiState.value.formState
        val nameErr = InputValidators.validateFullName(form.fullName)
        val mobileErr = InputValidators.validateMobileNumber(form.mobileNumber)
        val emailErr = InputValidators.validateEmail(form.email)
        val addressErr = InputValidators.validateAddress(form.address)
        val cityErr = InputValidators.validateCity(form.city)
        val pinErr = InputValidators.validatePinCode(form.pinCode)

        if (listOf(nameErr, mobileErr, emailErr, addressErr, cityErr, pinErr).any { it != null }) {
            _uiState.update {
                it.copy(
                    formState = form.copy(
                        fullNameError = nameErr,
                        mobileError = mobileErr,
                        emailError = emailErr,
                        addressError = addressErr,
                        cityError = cityErr,
                        pinCodeError = pinErr
                    ),
                    errorMessage = "Please correct the highlighted fields."
                )
            }
            return
        }

        val isExisting = _uiState.value.customerProfile != null
        viewModelScope.launch {
            _uiState.update { it.copy(isSavingProfile = true, errorMessage = null, successMessage = null) }
            repository.saveCustomerProfile(
                fullName = form.fullName,
                mobileNumber = form.mobileNumber,
                email = form.email,
                address = form.address,
                city = form.city,
                pinCode = form.pinCode,
                isExistingProfile = isExisting
            ).onSuccess {
                _uiState.update {
                    it.copy(
                        isSavingProfile = false,
                        successMessage = if (isExisting) "Customer details updated in Firebase." else "Customer registration saved in Firebase."
                    )
                }
            }.onFailure { e ->
                _uiState.update {
                    it.copy(
                        isSavingProfile = false,
                        errorMessage = e.localizedMessage ?: "Unable to save customer profile."
                    )
                }
            }
        }
    }
}
