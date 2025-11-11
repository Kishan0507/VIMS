from django.contrib.auth.models import User
# NOTE: Ensure these models are correctly imported from your app's models.py
from .models import Owner, Vehicle, Policy, Accident, Payment 
from faker import Faker
import random
from datetime import timedelta, date, datetime

# Constants for seeding
VEHICLE_TYPES = ['SUV', 'Sedan', 'Hatchback', 'Bike', 'Truck']
POLICY_TYPES = ['Essential Cover (3 months)', 'Standard Shield (6 months)', 'Premium Protect (12 months)']

def seed_database_single_user(target_username='testuser', num_owners=5, vehicles_per_owner=2):
    """
    Seeds the database with a specific number of entities, all belonging to one user.
    """
    fake = Faker()

    # --- 1. Create or Get the Target User ---
    try:
        target_user = User.objects.get(username=target_username)
        print(f"Using existing user: {target_username}")
    except User.DoesNotExist:
        target_user = User.objects.create_user(
            username=target_username,
            email='test@vims.com',
            password="password123",
            first_name="Test",
            last_name="User"
        )
        print(f"Created new user: {target_username} (Password: password123)")

    # --- Clear previous data for this user (Optional, but recommended for clean seeding) ---
    Owner.objects.filter(user=target_user).delete()
    print("Cleared old data for the target user.")
    
    
    # --- 2. Create Owners, Vehicles, Policies, Accidents, and Payments ---
    
    for owner_index in range(num_owners):
        # Generate DOB ensuring the owner is older than 18
        owner_dob = fake.date_of_birth(minimum_age=25, maximum_age=65) 
        
        owner = Owner.objects.create(
            user=target_user, # Assign to the single target user
            owner=f"{fake.first_name()} {fake.last_name()} {owner_index+1}",
            address=fake.address(),
            phone_number=fake.phone_number(),
            dob=owner_dob
        )
        
        # Keep track of the generated policies for this owner to create payments/accidents later
        generated_policies = [] 

        for vehicle_index in range(vehicles_per_owner):
            vehicle_type = random.choice(VEHICLE_TYPES)
            
            vehicle = Vehicle.objects.create(
                user=target_user, # Assign to the single target user
                owner=owner,
                title=f"{vehicle_type} - {fake.word().title()}",
                vehicle_number=fake.unique.license_plate()[:10], # Keep vehicle number short and unique
                model_name=fake.word().title(),
                model_year=random.randint(2015, 2024),
                vehicle_type=vehicle_type,
                vin=fake.unique.bothify(text='??????????')[:10] # Ensure VIN is exactly 10 chars
            )

            # Create one policy per vehicle (policies_per_vehicle=1)
            policy_type = random.choice(POLICY_TYPES)
            term_months = 12 # Hardcode to 12 months for simplicity
            premium_amount = round(random.uniform(9000.0, 30000.0), 2)
            
            start_date_obj = fake.date_between(start_date='-1y', end_date='today')
            end_date_obj = start_date_obj + timedelta(days=term_months * 30 + 10)

            policy = Policy.objects.create(
                user=target_user,
                owner=owner,
                vehicle=vehicle,
                policy_number=fake.unique.bothify(text=f'POL-{random.randint(1000, 9999)}'),
                policy_type=policy_type,
                start_date=start_date_obj,
                end_date=end_date_obj,
                premium_amount=premium_amount
            )
            generated_policies.append(policy)
            
        # --- 3. Create Accidents & Payments (only for a subset of policies) ---
        
        # Select one policy from the owner's set to claim an accident and payment
        if generated_policies and random.choice([True, False]):
            policy_for_claim = random.choice(generated_policies)
            
            # Date of accident must be within the policy term
            accident_date = fake.date_between(
                start_date=policy_for_claim.start_date, 
                end_date=min(date.today(), policy_for_claim.end_date)
            )
            
            # Determine status at time of accident
            policy_status = "Active" if policy_for_claim.start_date <= accident_date <= policy_for_claim.end_date else "Lapsed"

            Accident.objects.create(
                policy=policy_for_claim,
                owner=owner, # Assign directly to the owner object
                vehicle=policy_for_claim.vehicle,
                date_of_accident=accident_date,
                location=fake.city(),
                description=f"Minor collision reported on {fake.street_name()}.",
                policy_status=policy_status
            )
            
            # Record a payment for the policy if an accident was reported
            if policy_status == "Active":
                Payment.objects.create(
                    user=target_user,
                    owner=owner,
                    vehicle=policy_for_claim.vehicle,
                    policy=policy_for_claim,
                    payment_id=f"PAY-{random.randint(100000, 999999)}",
                    amount=round(premium_amount, 2), # Using premium as a placeholder for payment amount
                    payment_date=accident_date + timedelta(days=random.randint(5, 30)),
                    payment_method=random.choice(['UPI', 'Card', 'Bank Transfer'])
                )


if __name__ == "__main__":
    # You MUST run this from the Django shell: python manage.py shell
    # Then call: seed_database_single_user()
    print("Please run this function inside the Django shell.")
    seed_database_single_user()
    print("Database seeding completed for one user.")