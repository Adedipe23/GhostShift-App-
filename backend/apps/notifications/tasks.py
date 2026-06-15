import logging

from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


def send_notification_task(user_id: str, title: str, message: str, notification_type: str = "INFO"):
    """
    Django Q2 async task — create a Notification record for a user.

    Usage:
        from django_q.tasks import async_task
        async_task(
            'apps.notifications.tasks.send_notification_task',
            user_id=str(user.id),
            title='Shift Approved',
            message='Your swap request has been approved.',
        )
    """
    from apps.notifications.models import Notification

    try:
        user = User.objects.get(id=user_id)
        print(f"Sending notification to {user.email}: {title} - {message}")
        notif = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        logger.info("Notification sent to %s: %s", user.email, title)
        return str(notif.id)
    except User.DoesNotExist:
        logger.error("User %s not found for notification.", user_id)
