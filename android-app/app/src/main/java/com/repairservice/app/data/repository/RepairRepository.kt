package com.repairservice.app.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.repairservice.app.RepairServiceApp
import com.repairservice.app.data.model.Customer
import com.repairservice.app.data.model.RepairRequest
import com.repairservice.app.data.model.RepairStatus
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class RepairRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = RepairServiceApp.provideFirestore()
) {
    companion object {
        private const val CUSTOMERS_COLLECTION = "customers"
        private const val REQUESTS_COLLECTION = "repairRequests"
        private const val ADMINS_COLLECTION = "admins"
    }

    val currentUser: FirebaseUser?
        get() = auth.currentUser

    fun observeAuthState(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signInWithEmail(email: String, password: String): Result<FirebaseUser> = runCatching {
        val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
        result.user ?: error("Authentication failed. Please try again.")
    }

    suspend fun registerWithEmail(email: String, password: String): Result<FirebaseUser> = runCatching {
        val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
        val user = result.user ?: error("Account creation failed.")
        user.sendEmailVerification().await()
        user
    }

    suspend fun reloadCurrentUser(): Result<FirebaseUser?> = runCatching {
        val user = auth.currentUser ?: return@runCatching null
        user.reload().await()
        user.getIdToken(true).await()
        auth.currentUser
    }

    suspend fun sendPasswordResetEmail(email: String): Result<Unit> = runCatching {
        auth.sendPasswordResetEmail(email.trim()).await()
    }

    suspend fun resendVerificationEmail(): Result<Unit> = runCatching {
        val user = auth.currentUser ?: error("Please sign in first.")
        user.sendEmailVerification().await()
    }

    fun signOut() {
        auth.signOut()
    }

    suspend fun isCurrentUserAdmin(): Boolean {
        val user = auth.currentUser ?: return false
        if (!user.isEmailVerified) return false
        return try {
            val doc = db.collection(ADMINS_COLLECTION).document(user.uid).get().await()
            doc.exists()
        } catch (_: Exception) {
            false
        }
    }

    fun observeCustomerProfile(uid: String): Flow<Customer?> = callbackFlow {
        val listener = db.collection(CUSTOMERS_COLLECTION)
            .document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val customer = snapshot?.toObject(Customer::class.java)
                trySend(customer)
            }
        awaitClose { listener.remove() }
    }

    suspend fun saveCustomerProfile(
        fullName: String,
        mobileNumber: String,
        email: String,
        address: String,
        city: String,
        pinCode: String,
        isExistingProfile: Boolean
    ): Result<Unit> = runCatching {
        val user = auth.currentUser ?: error("User session expired. Please sign in again.")
        if (!user.isEmailVerified) {
            user.reload().await()
        }
        user.getIdToken(true).await()
        if (!user.isEmailVerified) {
            error("Please verify your email address before saving customer registration.")
        }
        val docRef = db.collection(CUSTOMERS_COLLECTION).document(user.uid)

        val payload = hashMapOf<String, Any>(
            "uid" to user.uid,
            "fullName" to fullName.trim().take(100),
            "mobileNumber" to mobileNumber.filter { it.isDigit() }.take(10),
            "email" to email.trim().take(150),
            "address" to address.trim().take(300),
            "city" to city.trim().take(80),
            "pinCode" to pinCode.filter { it.isDigit() }.take(6),
            "updatedAt" to FieldValue.serverTimestamp()
        )

        if (isExistingProfile) {
            docRef.update(payload).await()
        } else {
            payload["createdAt"] = FieldValue.serverTimestamp()
            docRef.set(payload).await()
        }
    }

    fun generateUniqueRequestId(): String {
        val datePart = SimpleDateFormat("yyyyMMdd", Locale.US).format(Date())
        val randomPart = UUID.randomUUID().toString()
            .replace("-", "")
            .uppercase(Locale.US)
            .take(6)
        return "REP-$datePart-$randomPart"
    }

    suspend fun submitRepairRequest(
        customer: Customer,
        serviceCategory: String,
        deviceBrand: String,
        deviceModel: String,
        problemDescription: String,
        preferredDate: String,
        serviceType: String
    ): Result<String> = runCatching {
        val user = auth.currentUser ?: error("Please sign in before submitting a repair request.")
        val requestId = generateUniqueRequestId()
        val payload = hashMapOf<String, Any>(
            "requestId" to requestId,
            "customerId" to user.uid,
            "customerName" to customer.fullName.trim().take(100),
            "customerMobile" to customer.mobileNumber.filter { it.isDigit() }.takeLast(10),
            "serviceCategory" to serviceCategory,
            "deviceBrand" to deviceBrand.trim().take(60),
            "deviceModel" to deviceModel.trim().take(80),
            "problemDescription" to problemDescription.trim().take(1000),
            "preferredDate" to preferredDate.trim(),
            "serviceType" to serviceType,
            "status" to RepairStatus.PENDING.label,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )

        db.collection(REQUESTS_COLLECTION).document(requestId).set(payload).await()
        requestId
    }

    fun observeMyRepairRequests(uid: String): Flow<List<RepairRequest>> = callbackFlow {
        val listener = db.collection(REQUESTS_COLLECTION)
            .whereEqualTo("customerId", uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val list = snapshot?.documents
                    ?.mapNotNull { it.toObject(RepairRequest::class.java) }
                    ?.sortedByDescending { it.createdAt?.seconds ?: 0L }
                    ?: emptyList()
                trySend(list)
            }
        awaitClose { listener.remove() }
    }

    suspend fun cancelPendingRequest(requestId: String): Result<Unit> = runCatching {
        db.collection(REQUESTS_COLLECTION).document(requestId)
            .update(
                mapOf(
                    "status" to RepairStatus.CANCELLED.label,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            .await()
    }

    fun observeAllCustomers(): Flow<List<Customer>> = callbackFlow {
        val listener = db.collection(CUSTOMERS_COLLECTION)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val customers = snapshot?.documents
                    ?.mapNotNull { it.toObject(Customer::class.java) }
                    ?.sortedBy { it.fullName.lowercase(Locale.US) }
                    ?: emptyList()
                trySend(customers)
            }
        awaitClose { listener.remove() }
    }

    fun observeAllRepairRequests(): Flow<List<RepairRequest>> = callbackFlow {
        val listener = db.collection(REQUESTS_COLLECTION)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val requests = snapshot?.documents
                    ?.mapNotNull { it.toObject(RepairRequest::class.java) }
                    ?: emptyList()
                trySend(requests)
            }
        awaitClose { listener.remove() }
    }

    suspend fun updateRepairStatus(
        requestId: String,
        newStatus: RepairStatus,
        adminNotes: String?
    ): Result<Unit> = runCatching {
        val updates = hashMapOf<String, Any>(
            "status" to newStatus.label,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (!adminNotes.isNullOrBlank()) {
            updates["adminNotes"] = adminNotes.trim().take(500)
        }
        db.collection(REQUESTS_COLLECTION).document(requestId)
            .update(updates)
            .await()
    }
}
