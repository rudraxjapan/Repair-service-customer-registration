package com.repairservice.app.data.model

import com.google.firebase.Timestamp

enum class ServiceCategory(val label: String) {
    MOBILE("Mobile"),
    LAPTOP("Laptop"),
    COMPUTER("Computer"),
    TELEVISION("Television"),
    REFRIGERATOR("Refrigerator"),
    WASHING_MACHINE("Washing Machine"),
    OTHER("Other");

    companion object {
        fun fromLabel(label: String): ServiceCategory {
            return entries.firstOrNull { it.label.equals(label, ignoreCase = true) } ?: OTHER
        }
    }
}

enum class ServiceType(val label: String) {
    HOME_SERVICE("Home Service"),
    SERVICE_CENTER("Service Center");

    companion object {
        fun fromLabel(label: String): ServiceType {
            return entries.firstOrNull { it.label.equals(label, ignoreCase = true) } ?: SERVICE_CENTER
        }
    }
}

enum class RepairStatus(val label: String) {
    PENDING("Pending"),
    ACCEPTED("Accepted"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    companion object {
        fun fromLabel(label: String): RepairStatus {
            return entries.firstOrNull { it.label.equals(label, ignoreCase = true) } ?: PENDING
        }
    }
}

data class RepairRequest(
    val requestId: String = "",
    val customerId: String = "",
    val customerName: String = "",
    val customerMobile: String = "",
    val serviceCategory: String = ServiceCategory.MOBILE.label,
    val deviceBrand: String = "",
    val deviceModel: String = "",
    val problemDescription: String = "",
    val preferredDate: String = "",
    val serviceType: String = ServiceType.SERVICE_CENTER.label,
    val status: String = RepairStatus.PENDING.label,
    val adminNotes: String? = null,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)
