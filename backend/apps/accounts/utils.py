import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms(phone_number, message):
    try:
        from twilio.rest import Client
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        twilio_phone = settings.TWILIO_PHONE_NUMBER
        if not account_sid or not auth_token or not twilio_phone:
            logger.warning(f'Twilio not configured. SMS would be sent to {phone_number}: {message}')
            return False
        client = Client(account_sid, auth_token)
        client.messages.create(body=message, from_=twilio_phone, to=phone_number)
        return True
    except ImportError:
        logger.warning('Twilio package not installed')
        return False
    except Exception as e:
        logger.error(f'Failed to send SMS: {e}')
        return False
