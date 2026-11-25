package com.repairservice.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.repairservice.app.data.model.RepairRequest
import com.repairservice.app.data.model.RepairStatus
import com.repairservice.app.ui.theme.Amber700
import com.repairservice.app.ui.theme.Cobalt700
import com.repairservice.app.ui.theme.Emerald700
import com.repairservice.app.ui.theme.Rose700

@Composable
fun StatusIndicator(statusLabel: String, modifier: Modifier = Modifier) {
    val status = RepairStatus.fromLabel(statusLabel)
    val (tint, bg, icon) = when (status) {
        RepairStatus.PENDING -> Triple(Amber700, Color(0xFFFEF3C7), Icons.Default.HourglassTop)
        RepairStatus.ACCEPTED -> Triple(Cobalt700, Color(0xFFDBEAFE), Icons.Default.ThumbUp)
        RepairStatus.IN_PROGRESS -> Triple(Color(0xFF4338CA), Color(0xFFE0E7FF), Icons.Default.Build)
        RepairStatus.COMPLETED -> Triple(Emerald700, Color(0xFFD1FAE5), Icons.Default.CheckCircle)
        RepairStatus.CANCELLED -> Triple(Rose700, Color(0xFFFFE4E6), Icons.Default.Cancel)
    }

    Surface(
        modifier = modifier,
        color = bg,
        shape = RoundedCornerShape(6.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = status.label,
                tint = tint,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = status.label,
                style = MaterialTheme.typography.labelMedium,
                color = tint,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun FeedbackBanner(
    message: String,
    isError: Boolean,
    modifier: Modifier = Modifier
) {
    val containerColor = if (isError) Color(0xFFFFF1F2) else Color(0xFFECFDF5)
    val borderColor = if (isError) Color(0xFFFECDD3) else Color(0xFFA7F3D0)
    val textColor = if (isError) Rose700 else Emerald700
    val icon = if (isError) Icons.Default.ErrorOutline else Icons.Default.CheckCircle

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = containerColor,
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = textColor
            )
        }
    }
}

@Composable
fun LoadingStateCard(message: String = "Synchronizing with Firebase...") {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        CircularProgressIndicator(modifier = Modifier.size(22.dp), strokeWidth = 2.5.dp)
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun RepairTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    errorText: String? = null,
    singleLine: Boolean = true,
    minLines: Int = 1,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    enabled: Boolean = true
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            isError = errorText != null,
            singleLine = singleLine,
            minLines = minLines,
            enabled = enabled,
            keyboardOptions = keyboardOptions,
            visualTransformation = visualTransformation,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        )
        if (errorText != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = errorText,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}

@Composable
fun RepairSummaryCard(
    request: RepairRequest,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = request.requestId,
                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                StatusIndicator(statusLabel = request.status)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${request.deviceBrand} ${request.deviceModel}",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${request.serviceCategory} • ${request.serviceType} • ${request.preferredDate}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = request.problemDescription,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 2
            )
        }
    }
}
