package com.pulse

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class PulseFirebaseMessagingService : FirebaseMessagingService() {
  override fun onNewToken(token: String) {
    super.onNewToken(token)
    Log.d(TAG, "New FCM token: $token")
  }

  override fun onMessageReceived(message: RemoteMessage) {
    super.onMessageReceived(message)
    Log.d(TAG, "FCM message received: ${message.messageId}")
  }

  companion object {
    private const val TAG = "PulseFcmService"
  }
}
