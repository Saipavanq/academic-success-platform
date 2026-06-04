import logging
from rest_framework import generics, permissions, status

logger = logging.getLogger(__name__)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailVerificationToken, PhoneVerificationToken, StudentProfile
from .utils import send_sms
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, NotificationPreferencesSerializer,
    VerifyEmailSerializer, ResendOTPSerializer,
    SendPhoneOTPSerializer, VerifyPhoneSerializer, StudentProfileSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        self._send_otp(user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful. Please verify your email with the OTP sent.',
        }, status=status.HTTP_201_CREATED)

    def _send_otp(self, user):
        token = EmailVerificationToken.objects.create(user=user, email=user.email)
        subject = 'Verify your Academic Success Platform account'
        message = f"""
Hi {user.first_name},

Your email verification OTP is: {token.otp}

This code expires in 10 minutes.

If you did not register, please ignore this email.

- Academic Success Platform Team
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_verified:
            return Response({'message': 'Email already verified.'})

        token = EmailVerificationToken.objects.filter(
            user=user, otp=otp, is_used=False, expires_at__gt=timezone.now()
        ).first()

        if not token:
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        token.is_used = True
        token.save()
        user.is_verified = True
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Email verified successfully.',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_verified:
            return Response({'message': 'Email already verified.'})

        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        token = EmailVerificationToken.objects.create(user=user, email=user.email)
        subject = 'New OTP for email verification'
        message = f"""
Hi {user.first_name},

Your new email verification OTP is: {token.otp}

This code expires in 10 minutes.

- Academic Success Platform Team
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        return Response({'message': 'A new OTP has been sent to your email.'})


class SendPhoneOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendPhoneOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this phone number.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_phone_verified:
            return Response({'message': 'Phone already verified.'})

        PhoneVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)
        token = PhoneVerificationToken.objects.create(user=user, phone=phone)
        message = f'Your Academic Success Platform verification OTP is: {token.otp}. Valid for 10 minutes.'
        sent = send_sms(phone, message)
        if not sent:
            if settings.DEBUG:
                logger.info(f'[DEV] SMS OTP for {phone}: {token.otp}')
                return Response({
                    'message': 'OTP sent to your phone.',
                    'dev_otp': token.otp,
                })
            return Response({'error': 'SMS service unavailable. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'message': 'OTP sent to your phone.'})


class VerifyPhoneView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyPhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this phone number.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_phone_verified:
            return Response({'message': 'Phone already verified.'})

        token = PhoneVerificationToken.objects.filter(
            user=user, otp=otp, is_used=False, expires_at__gt=timezone.now()
        ).first()

        if not token:
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        token.is_used = True
        token.save()
        user.is_phone_verified = True
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Phone verified successfully.',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if user is None:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_verified:
            return Response({
                'error': 'Please verify your email before logging in.',
                'needs_verification': True,
                'email': user.email,
            }, status=status.HTTP_403_FORBIDDEN)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully'})


class NotificationPreferencesView(generics.UpdateAPIView):
    serializer_class = NotificationPreferencesSerializer

    def get_object(self):
        return self.request.user
