from twilio.rest import Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SMSService:
    @staticmethod
    def _send_sms(to_number, message):
        if not settings.TWILIO_ACCOUNT_SID:
            logger.warning("Twilio credentials not configured")
            return False

        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_number
            )
            return True
        except Exception as e:
            logger.error(f"SMS send failed: {e}")
            return False

    @classmethod
    def send_exam_reminder(cls, user, exam):
        if not user.phone:
            return False
        message = (
            f"Exam Reminder: {exam.title} for {exam.course.code} "
            f"is on {exam.date} at {exam.time or 'TBD'}. "
            f"Duration: {exam.duration_minutes} mins. Good luck!"
        )
        return cls._send_sms(user.phone, message)

    @classmethod
    def send_quiz_reminder(cls, user, quiz):
        if not user.phone:
            return False
        message = (
            f"Quiz Reminder: {quiz.title} for {quiz.course.code} "
            f"is today at {quiz.time or 'TBD'}. "
            f"Duration: {quiz.duration_minutes} mins."
        )
        return cls._send_sms(user.phone, message)

    @classmethod
    def send_study_reminder(cls, user, task):
        if not user.phone:
            return False
        message = (
            f"Study Reminder: Time to study {task.topic} "
            f"for {task.study_plan.course.code}. "
            f"Duration: {task.duration_minutes} mins."
        )
        return cls._send_sms(user.phone, message)
