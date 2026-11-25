package com.repairservice.app

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore

class RepairServiceApp : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }

    companion object {
        const val FIRESTORE_DATABASE_ID = "ai-studio-31b324e4-e4de-4e8a-b2f5-0ba6ca6cc694"

        fun provideFirestore(): FirebaseFirestore {
            return FirebaseFirestore.getInstance(
                FirebaseApp.getInstance(),
                FIRESTORE_DATABASE_ID
            )
        }
    }
}
