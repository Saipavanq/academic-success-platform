from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def _send_email(to_email, subject, html_content):
        if not settings.SENDGRID_API_KEY:
            logger.warning("SendGrid API key not configured")
            return False

        try:
            message = Mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(message)
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False

    @classmethod
    def send_exam_reminder(cls, user, exam):
        subject = f"Exam Reminder: {exam.title}"
        html_content = f"""
        <h2>Exam Reminder</h2>
        <p>Dear {user.get_full_name()},</p>
        <p>This is a reminder about your upcoming exam:</p>
        <ul>
            <li><strong>Course:</strong> {exam.course.code} - {exam.course.name}</li>
            <li><strong>Exam:</strong> {exam.title}</li>
            <li><strong>Date:</strong> {exam.date}</li>
            <li><strong>Time:</strong> {exam.time or 'TBD'}</li>
            <li><strong>Duration:</strong> {exam.duration_minutes} minutes</li>
            <li><strong>Total Marks:</strong> {exam.total_marks}</li>
        </ul>
        <p>Good luck with your preparation!</p>
        """
        return cls._send_email(user.email, subject, html_content)

    @classmethod
    def send_goal_reminder(cls, user, goal):
        subject = f"Goal Deadline: {goal.title}"
        html_content = f"""
        <h2>Goal Deadline Approaching</h2>
        <p>Dear {user.get_full_name()},</p>
        <p>Your goal is approaching its deadline:</p>
        <ul>
            <li><strong>Goal:</strong> {goal.title}</li>
            <li><strong>Target Date:</strong> {goal.target_date}</li>
            <li><strong>Current Progress:</strong> {goal.progress}%</li>
        </ul>
        <p>Keep up the good work!</p>
        """
        return cls._send_email(user.email, subject, html_content)

    @classmethod
    def send_weekly_report(cls, user, progress_data):
        subject = "Weekly Progress Report"
        goals_html = ""
        for goal in progress_data.get('goal_progress', []):
            goals_html += f"<li>{goal['title']}: {goal['progress']}%</li>"

        html_content = f"""
        <h2>Weekly Progress Report</h2>
        <p>Dear {user.get_full_name()},</p>
        <p>Here's your weekly progress summary:</p>
        <ul>
            <li><strong>Total Tasks:</strong> {progress_data['total_tasks']}</li>
            <li><strong>Completed Tasks:</strong> {progress_data['completed_tasks']}</li>
            <li><strong>Completion Rate:</strong> {progress_data['completion_rate']}%</li>
            <li><strong>Active Plans:</strong> {progress_data['active_plans']}</li>
        </ul>
        <h3>Goals Progress:</h3>
        <ul>{goals_html}</ul>
        <p>Keep pushing towards your goals!</p>
        """
        return cls._send_email(user.email, subject, html_content)
