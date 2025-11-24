from django.contrib.auth.models import User
from .models import Owner, Vehicle, Policy, Accident, Payment
from faker import Faker
import random, uuid
from datetime import timedelta, date

# Constants
VEHICLE_TYPES = ['SUV', 'Sedan', 'Hatchback', 'Bike', 'Truck']
POLICY_TYPES = [
    'Essential Cover (3 months)',
    'Standard Shield (6 months)',
    'Premium Protect (12 months)'
]

def seed_database_single_user(target_username='test', num_owners=20, vehicles_per_owner=5):
   
    fake = Faker()

    # --- 1. Create or Get the Target User ---
    target_user, created = User.objects.get_or_create(
        username=target_username,
        defaults={
            "email": "test@vims.com",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    if created:
        print(f"Created new user: {target_username}")
    else:
        print(f"Using existing user: {target_username}")

    # --- Clear previous data for this user ---
    Owner.objects.filter(user=target_user).delete()
    print("Cleared old data for the target user.")

    total_policies = 0

    # --- 2. Create Owners, Vehicles, Policies ---
    for owner_index in range(num_owners):
        owner_dob = fake.date_of_birth(minimum_age=25, maximum_age=65)
        owner = Owner.objects.create(
            user=target_user,
            owner=f"{fake.first_name()} {fake.last_name()} {owner_index+1}",
            address=fake.address(),
            phone_number=fake.phone_number(),
            dob=owner_dob
        )

        generated_policies = []
        for vehicle_index in range(vehicles_per_owner):
            vehicle_type = random.choice(VEHICLE_TYPES)
            vehicle = Vehicle.objects.create(
                user=target_user,
                owner=owner,
                title=f"{vehicle_type} - {fake.word().title()}",
                vehicle_number=f"{fake.unique.license_plate()}-{uuid.uuid4().hex[:4]}",
                model_name=fake.word().title(),
                model_year=random.randint(2015, 2024),
                vehicle_type=vehicle_type,
                vin=uuid.uuid4().hex[:10].upper()
            )

            policy_type = random.choice(POLICY_TYPES)
            premium_amount = round(random.uniform(9000.0, 30000.0), 2)

            # Randomly decide if this policy should be Active or Lapsed
            if random.choice([True, False]):
                # Active policy: valid today
                start_date_obj = fake.date_between(start_date='-6m', end_date='-1m')
                end_date_obj = start_date_obj + timedelta(days=365)
            else:
                # Lapsed policy: expired before today
                start_date_obj = fake.date_between(start_date='-2y', end_date='-1y')
                end_date_obj = start_date_obj + timedelta(days=180)  # shorter term, already expired

            policy = Policy.objects.create(
                user=target_user,
                owner=owner,
                vehicle=vehicle,
                policy_number=f"POL-{uuid.uuid4().hex[:8].upper()}",
                policy_type=policy_type,
                start_date=start_date_obj,
                end_date=end_date_obj,
                premium_amount=premium_amount
            )
            generated_policies.append(policy)
            total_policies += 1

        # --- 3. Create Accidents & Payments ---
        for policy_for_claim in random.sample(generated_policies, k=random.randint(0, len(generated_policies))):
            # Accident date can be inside or outside policy term
            accident_date = fake.date_between(
                start_date=policy_for_claim.start_date,
                end_date=min(date.today(), policy_for_claim.end_date + timedelta(days=200))
            )
            policy_status = "Active" if policy_for_claim.start_date <= accident_date <= policy_for_claim.end_date else "Lapsed"

            Accident.objects.create(
                policy=policy_for_claim,
                owner=owner,
                vehicle=policy_for_claim.vehicle,
                date_of_accident=accident_date,
                location=fake.city(),
                description=f"Minor collision reported on {fake.street_name()}.",
                policy_status=policy_status
            )

            # Only Active policies get payments
            if policy_status == "Active":
                Payment.objects.create(
                    user=target_user,
                    owner=owner,
                    vehicle=policy_for_claim.vehicle,
                    policy=policy_for_claim,
                    payment_id=f"PAY-{uuid.uuid4().hex[:6].upper()}",
                    amount=round(policy_for_claim.premium_amount, 2),
                    payment_date=accident_date + timedelta(days=random.randint(5, 30)),
                    payment_method=random.choice(['UPI', 'Card', 'Bank Transfer'])
                )

    print(f"✅ Database seeding completed: {total_policies} policies created for user {target_username}.")