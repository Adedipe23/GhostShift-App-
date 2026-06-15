import logging

from django.contrib.auth import get_user_model

from .services import BurnoutService

logger = logging.getLogger(__name__)
User = get_user_model()


def recalculate_burnout_scores():
    """
    Django Q2 scheduled task.

    Recalculates burnout scores for all active employees.
    Schedule hourly via:
        python manage.py shell
        >>> from django_q.models import Schedule
        >>> Schedule.objects.create(
        ...     func='apps.burnout.tasks.recalculate_burnout_scores',
        ...     schedule_type='H',
        ...     name='Burnout Recalculation'
        ... )
    """
    employees = User.objects.filter(is_active=True, role="EMPLOYEE")
    success_count = 0
    error_count = 0

    for employee in employees:
        try:
            BurnoutService.calculate_for_employee(employee)
            success_count += 1
        except Exception as exc:
            logger.error("Burnout calculation failed for %s: %s", employee.email, exc)
            error_count += 1

    logger.info(
        "Burnout recalculation complete. Success: %d, Errors: %d",
        success_count,
        error_count,
    )
    return {"success": success_count, "errors": error_count}


def calculate_burnout_for_employee(employee_id: str):
    """Async task to calculate burnout for a single employee by ID."""
    try:
        employee = User.objects.get(id=employee_id, is_active=True)
        score = BurnoutService.calculate_for_employee(employee)
        logger.info("Burnout calculated for %s: score=%d", employee.email, score.score)
        return score.id
    except User.DoesNotExist:
        logger.error("User %s not found for burnout calculation.", employee_id)
