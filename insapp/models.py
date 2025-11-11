from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# ------------------- OWNER MODEL -------------------

class Owner(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    owner = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    dob = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.owner

# ------------------- VEHICLE MODEL -------------------

class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='vehicles')
    title = models.CharField(max_length=100, default='Unknown Vehicle')
    vehicle_number = models.CharField(max_length=20, unique=True, default='UNKNOWN')
    model_name = models.CharField(max_length=100, default='Unknown')
    model_year = models.PositiveIntegerField(default=5)
    vehicle_type = models.CharField(max_length=50, default='Unknown')
    vin = models.CharField(max_length=17)

    def __str__(self):
        return f"{self.title} ({self.vehicle_number})"

# ------------------- POLICY MODEL -------------------

class Policy(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='policies')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='policies')
    policy_number = models.CharField(max_length=100, unique=True)
    policy_type = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    premium_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Policy {self.policy_number} - {self.policy_type}"

# ------------------- ACCIDENT MODEL -------------------

class Accident(models.Model):
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    policy = models.ForeignKey(Policy, on_delete=models.CASCADE)
    date_of_accident = models.DateField()
    location = models.CharField(max_length=255)
    description = models.TextField()
    policy_status = models.CharField(max_length=20, choices=[("Active", "Active"), ("Lapsed", "Lapsed")])
    reported_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Accident on {self.date_of_accident} - {self.vehicle.vehicle_number}"

# ------------------- PAYMENT MODEL -------------------

class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    policy = models.OneToOneField(Policy, on_delete=models.CASCADE, related_name='payment')
    accident = models.OneToOneField(Accident, on_delete=models.CASCADE, related_name='payment', null=True, blank=True)
    payment_id = models.CharField(max_length=20, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    payment_method = models.CharField(max_length=50)

    def __str__(self):
        return f"Payment {self.payment_id}: ₹{self.amount} on {self.payment_date} for Policy {self.policy.policy_number}"