from pywebpush import webpush
from django.conf import settings
import json
import logging

logger = logging.getLogger(__name__)


class PushService:
    @staticmethod
    def _send_push(user, title, body, data=None):
        if not user.fcm_token and not user.vapid_key:
            return False

        try:
            payload = {
                'title': title,
                'body': body,
                'data': data or {},
            }

            if hasattr(user, 'webpush_info'):
                subscription_info = user.webpush_info
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims=settings.VAPID_CLAIM_EMAIL,
                )
                return True

            logger.info(f"Push notification would be sent: {title}")
            return True
        except Exception as e:
            logger.error(f"Push notification failed: {e}")
            return False

    @classmethod
    def send_exam_reminder(cls, user, exam):
        title = f"Exam Reminder: {exam.title}"
        body = f"{exam.course.code} exam is on {exam.date}"
        data = {
            'type': 'exam_reminder',
            'exam_id': str(exam.id),
            'course_code': exam.course.code,
        }
        return cls._send_push(user, title, body, data)

    @classmethod
    def send_quiz_reminder(cls, user, quiz):
        title = f"Quiz Today: {quiz.title}"
        body = f"Quiz for {quiz.course.code} at {quiz.time or 'TBD'}"
        data = {
            'type': 'quiz_reminder',
            'quiz_id': str(quiz.id),
            'course_code': quiz.course.code,
        }
        return cls._send_push(user, title, body, data)

    @classmethod
    def send_study_task_reminder(cls, user, task):
        title = f"Study: {task.topic}"
        body = f"Time to study {task.topic} for {task.study_plan.course.code}"
        data = {
            'type': 'study_task',
            'task_id': str(task.id),
            'plan_id': str(task.study_plan.id),
        }
        return cls._send_push(user, title, body, data)
