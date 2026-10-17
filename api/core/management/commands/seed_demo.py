import os
import random
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from core.models import Site, Sponsor, Trial

SPONSORS = [("Northwind Pharma", "USA"), ("Helix Biosciences", "UK"),
            ("Aster Therapeutics", "Germany"), ("Meridian Health", "Singapore"),
            ("Lumen Labs", "Canada"), ("Cobalt Medical", "Japan")]
CONDITIONS = ["Type 2 Diabetes", "Hypertension", "Asthma", "Migraine",
              "Rheumatoid Arthritis", "Major Depression", "Psoriasis", "COPD",
              "Chronic Kidney Disease", "Breast Cancer"]
DRUGS = ["ZX-101", "AL-240", "VR-77", "NB-305", "TQ-18", "KM-902"]
CITIES = [("Manila", "Philippines"), ("Singapore", "Singapore"), ("Boston", "USA"),
          ("London", "UK"), ("Berlin", "Germany"), ("Toronto", "Canada"),
          ("Tokyo", "Japan"), ("Sydney", "Australia")]


class Command(BaseCommand):
    help = "Seed fake demo data (fake data only)."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=60)
        parser.add_argument("--reset", action="store_true")

    def handle(self, *args, **opts):
        password = os.getenv("DEMO_PASSWORD")
        if not password:
            raise CommandError("Set DEMO_PASSWORD in .env")

        if opts["reset"]:
            Trial.objects.all().delete()

        if not Trial.objects.exists():
            rng = random.Random(42)
            sponsors = [
                Sponsor.objects.get_or_create(name=n, defaults={"country": c})[0]
                for n, c in SPONSORS
            ]
            for i in range(1, opts["count"] + 1):
                condition = rng.choice(CONDITIONS)
                trial = Trial.objects.create(
                    code=f"TT-{i:05d}",
                    title=f"{rng.choice(DRUGS)} for {condition}",
                    condition=condition,
                    phase=rng.choice(Trial.Phase.values),
                    status=rng.choice(Trial.Status.values),
                    sponsor=rng.choice(sponsors),
                    start_date=date(2022, 1, 1) + timedelta(days=rng.randint(0, 1400)),
                    enrollment=rng.randint(30, 3000),
                )
                Site.objects.bulk_create(
                    Site(trial=trial, name=f"{city} Research Center", city=city, country=country)
                    for city, country in (rng.choice(CITIES) for _ in range(rng.randint(1, 4)))
                )

        admin_password = os.getenv("DEMO_ADMIN_PASSWORD") or password
        User = get_user_model()
        for username, staff, pw in (
            ("demo", False, password),
            ("demo_admin", True, admin_password),
        ):
            user, _ = User.objects.get_or_create(username=username)
            user.is_staff = staff
            user.set_password(pw)
            user.save()
        self.stdout.write(self.style.SUCCESS("Seeded."))