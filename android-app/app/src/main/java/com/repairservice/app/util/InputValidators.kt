package com.repairservice.app.util

object InputValidators {
    private val EMAIL_REGEX = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    private val MOBILE_REGEX = Regex("^[0-9]{10}$")
    private val CITY_REGEX = Regex("^[a-zA-Z\\s.\\-']{2,80}$")
    private val PIN_REGEX = Regex("^[0-9]{6}$")
    private val DATE_REGEX = Regex("^\\d{4}-\\d{2}-\\d{2}$")

    fun validateFullName(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < 2 -> "Full name must be at least 2 characters."
            trimmed.length > 100 -> "Full name cannot exceed 100 characters."
            else -> null
        }
    }

    fun validateMobileNumber(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.isEmpty() -> "Mobile number is required."
            !MOBILE_REGEX.matches(trimmed) -> "Mobile number must be exactly 10 digits."
            else -> null
        }
    }

    fun validateEmail(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < 5 || trimmed.length > 150 -> "Email must be 5 to 150 characters."
            !EMAIL_REGEX.matches(trimmed) -> "Enter a valid email address."
            else -> null
        }
    }

    fun validateAddress(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < 5 -> "Complete address must be at least 5 characters."
            trimmed.length > 300 -> "Address cannot exceed 300 characters."
            else -> null
        }
    }

    fun validateCity(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < 2 -> "City must be at least 2 characters."
            trimmed.length > 80 -> "City cannot exceed 80 characters."
            !CITY_REGEX.matches(trimmed) -> "City name cannot contain numbers or special symbols."
            else -> null
        }
    }

    fun validatePinCode(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.isEmpty() -> "PIN code is required."
            !PIN_REGEX.matches(trimmed) -> "PIN code must be exactly 6 digits."
            else -> null
        }
    }

    fun validateDeviceBrand(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.isEmpty() -> "Device brand is required."
            trimmed.length > 60 -> "Device brand cannot exceed 60 characters."
            else -> null
        }
    }

    fun validateDeviceModel(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.isEmpty() -> "Device model is required."
            trimmed.length > 80 -> "Device model cannot exceed 80 characters."
            else -> null
        }
    }

    fun validateProblemDescription(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < 10 -> "Describe the issue in at least 10 characters."
            trimmed.length > 1000 -> "Problem description cannot exceed 1000 characters."
            else -> null
        }
    }

    fun validatePreferredDate(value: String): String? {
        val trimmed = value.trim()
        return when {
            !DATE_REGEX.matches(trimmed) -> "Select a valid date (YYYY-MM-DD)."
            else -> null
        }
    }
}
