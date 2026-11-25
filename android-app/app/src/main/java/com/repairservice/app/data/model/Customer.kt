package com.repairservice.app.data.model

import com.google.firebase.Timestamp

data class Customer(
    val uid: String = "",
    val fullName: String = "",
    val mobileNumber: String = "",
    val email: String = "",
    val address: String = "",
    val city: String = "",
    val pinCode: String = "",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)
