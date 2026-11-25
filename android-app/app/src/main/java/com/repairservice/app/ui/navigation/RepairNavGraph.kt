package com.repairservice.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircleOutline
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.repairservice.app.ui.components.LoadingStateCard
import com.repairservice.app.ui.screens.AdminDashboardScreen
import com.repairservice.app.ui.screens.AuthScreen
import com.repairservice.app.ui.screens.CustomerRegistrationScreen
import com.repairservice.app.ui.screens.HomeScreen
import com.repairservice.app.ui.screens.MyRequestsScreen
import com.repairservice.app.ui.screens.RepairRequestFormScreen
import com.repairservice.app.ui.viewmodel.AdminDashboardViewModel
import com.repairservice.app.ui.viewmodel.AuthAndCustomerViewModel
import com.repairservice.app.ui.viewmodel.RepairRequestViewModel

sealed class Screen(val route: String, val label: String) {
    data object Home : Screen("home", "Home")
    data object NewRequest : Screen("new_request", "Request")
    data object MyRequests : Screen("my_requests", "Repairs")
    data object Registration : Screen("registration", "Profile")
    data object Admin : Screen("admin", "Admin")
}

@Composable
fun RepairNavGraph(
    authViewModel: AuthAndCustomerViewModel = viewModel(),
    repairViewModel: RepairRequestViewModel = viewModel(),
    adminViewModel: AdminDashboardViewModel = viewModel()
) {
    val authState by authViewModel.uiState.collectAsState()
    val repairState by repairViewModel.uiState.collectAsState()
    val adminState by adminViewModel.uiState.collectAsState()

    val currentUser = authState.currentUser
    val isVerified = currentUser != null && authState.isEmailVerified

    LaunchedEffect(currentUser?.uid, isVerified) {
        if (currentUser != null && isVerified) {
            repairViewModel.startObservingRequests(currentUser.uid)
        } else {
            repairViewModel.startObservingRequests(null)
        }
    }

    LaunchedEffect(authState.isAdmin) {
        adminViewModel.startAdminSync(authState.isAdmin)
    }

    if (currentUser == null || !isVerified) {
        AuthScreen(
            uiState = authState,
            onSignIn = authViewModel::signIn,
            onRegister = authViewModel::registerAccount,
            onSendPasswordReset = authViewModel::sendPasswordReset,
            onRefreshVerification = authViewModel::refreshVerificationStatus,
            onResendVerification = authViewModel::resendVerificationEmail,
            onClearMessages = authViewModel::clearMessages,
            onSignOut = authViewModel::signOut
        )
        return
    }

    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val navItems = buildList {
        add(Screen.Home to Icons.Default.Home)
        add(Screen.NewRequest to Icons.Default.AddCircleOutline)
        add(Screen.MyRequests to Icons.Default.Build)
        add(Screen.Registration to Icons.Default.Person)
        if (authState.isAdmin) {
            add(Screen.Admin to Icons.Default.AdminPanelSettings)
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                navItems.forEach { (screen, icon) ->
                    NavigationBarItem(
                        selected = currentRoute == screen.route,
                        onClick = {
                            authViewModel.clearMessages()
                            repairViewModel.clearFeedback()
                            adminViewModel.clearMessages()
                            navController.navigate(screen.route) {
                                popUpTo(Screen.Home.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(icon, contentDescription = screen.label) },
                        label = { Text(screen.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        if (authState.isProfileLoading) {
            LoadingStateCard("Loading customer profile...")
        } else {
            NavHost(
                navController = navController,
                startDestination = Screen.Home.route,
                modifier = Modifier.padding(innerPadding)
            ) {
                composable(Screen.Home.route) {
                    HomeScreen(
                        customer = authState.customerProfile,
                        requests = repairState.myRequests,
                        isLoading = repairState.isLoadingRequests,
                        isAdmin = authState.isAdmin,
                        onNavigateToRegistration = { navController.navigate(Screen.Registration.route) },
                        onNavigateToNewRequest = { navController.navigate(Screen.NewRequest.route) },
                        onNavigateToMyRequests = { navController.navigate(Screen.MyRequests.route) },
                        onNavigateToAdmin = { navController.navigate(Screen.Admin.route) }
                    )
                }
                composable(Screen.NewRequest.route) {
                    RepairRequestFormScreen(
                        customer = authState.customerProfile,
                        uiState = repairState,
                        onFormChange = repairViewModel::updateForm,
                        onSubmit = { repairViewModel.submitRequest(authState.customerProfile) },
                        onGoToRegistration = { navController.navigate(Screen.Registration.route) }
                    )
                }
                composable(Screen.MyRequests.route) {
                    MyRequestsScreen(
                        uiState = repairState,
                        onCancelRequest = repairViewModel::cancelRequest
                    )
                }
                composable(Screen.Registration.route) {
                    CustomerRegistrationScreen(
                        uiState = authState,
                        onFormChange = authViewModel::updateFormField,
                        onSave = authViewModel::saveCustomerProfile,
                        onSignOut = authViewModel::signOut
                    )
                }
                composable(Screen.Admin.route) {
                    if (authState.isAdmin) {
                        AdminDashboardScreen(
                            uiState = adminState,
                            onSearchQueryChange = adminViewModel::updateSearchQuery,
                            onStatusFilterChange = adminViewModel::selectStatusFilter,
                            onUpdateStatus = adminViewModel::updateRequestStatus
                        )
                    }
                }
            }
        }
    }
}
