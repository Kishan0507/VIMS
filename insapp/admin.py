from django.contrib import admin

# Register your models here.
from .models import Owner, Vehicle, Policy, Payment, Accident
admin.site.register(Owner)
admin.site.register(Vehicle)
admin.site.register(Policy)
admin.site.register(Payment)
admin.site.register(Accident)


