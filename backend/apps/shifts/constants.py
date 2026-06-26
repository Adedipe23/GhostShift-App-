from django.db import models


class ShiftStatus(models.TextChoices):
    CREATED = "CREATED", "Created"
    ASSIGNED = "ASSIGNED", "Assigned"
    SCHEDULED = "SCHEDULED", "Scheduled"
    UPCOMING = "UPCOMING", "Upcoming"
    OPEN = "OPEN", "Open"
    CLOCKED_IN = "CLOCKED_IN", "Clocked In"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    CLOCKED_OUT = "CLOCKED_OUT", "Clocked Out"
    CANCELLED = "CANCELLED", "Cancelled"
    EARLY_CHECKOUT_PENDING = "EARLY_CHECKOUT_PENDING", "Early Checkout Pending"
    EARLY_CHECKOUT = "EARLY_CHECKOUT", "Early Checkout"
    REPLACEMENT_REQUESTED = "REPLACEMENT_REQUESTED", "Replacement Requested"
    COVERED = "COVERED", "Covered"


MAX_WEEKLY_HOURS = 60
MIN_REST_HOURS = 8