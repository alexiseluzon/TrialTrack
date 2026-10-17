from django.db import models
from django.conf import settings

class Sponsor(models.Model):
    name = models.CharField(max_length=200, unique=True)
    country = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Trial(models.Model):
    class Phase(models.TextChoices):
        P1 = "P1", "Phase 1"
        P2 = "P2", "Phase 2"
        P3 = "P3", "Phase 3"
        P4 = "P4", "Phase 4"

    class Status(models.TextChoices):
        RECRUITING = "recruiting", "Recruiting"
        ACTIVE = "active", "Active, not recruiting"
        COMPLETED = "completed", "Completed"
        SUSPENDED = "suspended", "Suspended"

    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=300)
    condition = models.CharField(max_length=200, db_index=True)
    phase = models.CharField(max_length=2, choices=Phase.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, db_index=True)
    sponsor = models.ForeignKey(Sponsor, on_delete=models.PROTECT, related_name="trials")
    start_date = models.DateField()
    enrollment = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ["-start_date", "id"]

    def __str__(self):
        return self.code

class Site(models.Model):
    trial = models.ForeignKey(Trial, on_delete=models.CASCADE, related_name="sites")
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)