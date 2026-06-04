from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('verify/', views.VerifyEmailView.as_view(), name='verify_email'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend_otp'),
    path('phone/send-otp/', views.SendPhoneOTPView.as_view(), name='send_phone_otp'),
    path('phone/verify/', views.VerifyPhoneView.as_view(), name='verify_phone'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/student/', views.StudentProfileView.as_view(), name='student_profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('notifications/preferences/', views.NotificationPreferencesView.as_view(), name='notification_preferences'),
]
