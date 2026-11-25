package com.repairservice.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.Surface
import com.repairservice.app.ui.navigation.RepairNavGraph
import com.repairservice.app.ui.theme.RepairServiceTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RepairServiceTheme {
                Surface {
                    RepairNavGraph()
                }
            }
        }
    }
}
