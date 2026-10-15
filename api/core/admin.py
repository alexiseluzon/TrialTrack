from django.contrib import admin

from .models import Site, Sponsor, Trial

admin.site.register([Sponsor, Trial, Site])