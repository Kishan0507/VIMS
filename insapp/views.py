from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Owner, Vehicle, Policy, Accident , Payment
from django.utils.dateparse import parse_date
from django.utils import timezone
import random
from datetime import date
from datetime import datetime, timedelta
from django.db.models import Max
from django.db import IntegrityError
import re
from django.urls import reverse
from django.http import JsonResponse
from .news import fetch_accident_news 
import matplotlib.pyplot as plt
from django.db.models import Count
from typing import Optional
import matplotlib
matplotlib.use('Agg')
from io import BytesIO 
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from io import BytesIO
import matplotlib.pyplot as plt
from django.db.models import Max # Needed for get_next_policy_number

from .models import Owner, Vehicle, Policy, Payment, Accident


def _user_has_required_data(user) -> bool:
    """
    Return True only if user has at least one owner, vehicle, policy, payment and accident.
    """
    return (
        Owner.objects.filter(user=user).exists()
        and Vehicle.objects.filter(user=user).exists()
        and Policy.objects.filter(user=user).exists()
        and Payment.objects.filter(user=user).exists()
        and Accident.objects.filter(policy__user=user).exists()
    )


@login_required
def dashboard_view(request):
    """
    Render explore.html and include dashboard counts only when the user has:
    owners, vehicles, policies, payments and accidents.
    """
    show_dashboard = _user_has_required_data(request.user)
    context = {"show_dashboard": show_dashboard}

    if show_dashboard:
        context.update({
            "policy_count": Policy.objects.filter(user=request.user).count(),
            "payment_count": Payment.objects.filter(user=request.user).count(),
            "owner_count": Owner.objects.filter(user=request.user).count(),
            "vehicle_count": Vehicle.objects.filter(user=request.user).count(),
        })

    return render(request, "explore.html", context)


def _generate_chart_image(request, chart_type="bar"):
    """
    Internal helper to generate chart image (bar or pie) for the authenticated user.
    Returns HttpResponse with PNG image or 403 if user lacks required data.
    """
    if not _user_has_required_data(request.user):
        return HttpResponse(status=403)

    data = {
        "Policies": Policy.objects.filter(user=request.user).count(),
        "Payments": Payment.objects.filter(user=request.user).count(),
        "Owners": Owner.objects.filter(user=request.user).count(),
        "Vehicles": Vehicle.objects.filter(user=request.user).count()
    }

    labels = list(data.keys())
    values = list(data.values())
    colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6']

    plt.figure(figsize=(6, 4), dpi=80)

    if chart_type == "pie":
        plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors)
        plt.title("Proportion of Entities")
    else:
        bars = plt.bar(labels, values, color=colors)
        plt.title("Entity Counts")
        plt.ylabel("Count")
        for bar in bars:
            yval = bar.get_height()
            plt.text(bar.get_x() + bar.get_width() / 2, yval + 0.5, str(yval), ha='center', va='bottom')

    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    plt.close()
    buffer.seek(0)
    return HttpResponse(buffer.getvalue(), content_type='image/png')


@login_required
def pie_chart(request):
    """Return pie chart image if user has required data, else 403."""
    return _generate_chart_image(request, chart_type="pie")


@login_required
def bar_chart(request):
    """Return bar chart image if user has required data, else 403."""
    return _generate_chart_image(request, chart_type="bar")

# ------------------- Login -------------------

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect("explore")
        messages.error(request, "Invalid username or password.")
    return render(request, "login.html")



def logout_view(request):
    """Logs out the user and redirects to the login page with a success message."""
    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect(reverse("login"))


def register(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email")
        password = request.POST.get("password")
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")

        if not username:
            messages.error(request, "Username is required.")
            return render(request, "register.html")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return render(request, "register.html")

        User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password
        )
        messages.success(request, "Registration successful. Please log in.")
        return redirect(reverse("login"))
    return render(request, "register.html")


# ------------------- HOME & DASHBOARD -------------------



def home(request):
    return render(request, "home.html")

def explore(request):
    return render(request, "explore.html")  


# NOTE: Ensure your models (Policy, Owner, Vehicle) are imported at the top of your views.py file.

# --- Constants (Define these at the top of your views.py) ---
POLICY_OPTIONS = {
    "Essential Cover (3 months)": {"term_months": 3, "premium": 3000},
    "Standard Shield (6 months)": {"term_months": 6, "premium": 5500},
    "Premium Protect (12 months)": {"term_months": 12, "premium": 9000},
}
# -----------------------------------------------------------

def get_next_policy_number():
    """Generates the next sequential policy number (POLxxxx)."""
    max_num = Policy.objects.all().aggregate(Max('policy_number'))['policy_number__max']
    if max_num:
        try:
            # Extract the number from the largest existing policy number (e.g., POL1001 -> 1001)
            num = int(re.search(r'POL(\d+)', max_num).group(1))
            return f"POL{num + 1}"
        except (AttributeError, ValueError):
            return "POL1001"
    return "POL1001"

@login_required
def policy(request):
    owners = Owner.objects.filter(user=request.user)
    selected_owner_id = request.GET.get("owner") or request.POST.get("owner")
    vehicles = []
    policies = [] 

    if selected_owner_id:
        # Fetch vehicles associated with the selected owner for the "Select Vehicle" dropdown
        vehicles = Vehicle.objects.filter(owner_id=selected_owner_id, user=request.user)
        
        # Fetch policies associated with the selected owner for the table display
        all_policies = Policy.objects.filter(owner_id=selected_owner_id, user=request.user).order_by('-start_date')
        
        today = date.today()
        policies_list_for_template = []
        for p in all_policies:
            # ANNOTATE: Calculate and attach the active status for the UI
            p.is_active = p.start_date <= today <= p.end_date
            policies_list_for_template.append(p)
        
        policies = policies_list_for_template # Pass the annotated list

    next_policy_number = get_next_policy_number()

    if request.method == "POST":
        policy_type = request.POST.get("policy_type")
        start_date_str = request.POST.get("start_date")
        vehicle_id = request.POST.get("vehicle")

        if not all([selected_owner_id, vehicle_id, policy_type, start_date_str]):
            messages.error(request, "All fields are required.")
            return redirect(reverse("policy") + f"?owner={selected_owner_id}")

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            messages.error(request, "Invalid start date format.")
            return redirect(reverse("policy") + f"?owner={selected_owner_id}")

        if policy_type not in POLICY_OPTIONS:
            messages.error(request, "Invalid policy type selected.")
            return redirect(reverse("policy") + f"?owner={selected_owner_id}")

        term_months = POLICY_OPTIONS[policy_type]["term_months"]
        premium_amount = POLICY_OPTIONS[policy_type]["premium"]
        
        # Calculate end date (approximation, assuming 30 days per month)
        end_date = start_date + timedelta(days=term_months * 30 + 10) 

        owner = get_object_or_404(Owner, id=selected_owner_id, user=request.user)
        vehicle = get_object_or_404(Vehicle, id=vehicle_id, owner=owner, user=request.user)

        try:
            Policy.objects.create(
                user=request.user,
                owner=owner,
                vehicle=vehicle,
                policy_number=next_policy_number,
                policy_type=policy_type,
                start_date=start_date,
                end_date=end_date,
                premium_amount=premium_amount
            )
            messages.success(request, f"Policy {next_policy_number} added successfully for {owner.owner}.")
        except IntegrityError:
            messages.error(request, "Policy number already exists. Please try again.")
        
        # Redirect back to the page with the owner selected to refresh the table
        return redirect(reverse("policy") + f"?owner={selected_owner_id}")

    return render(request, "policy.html", {
        "owners": owners,
        "vehicles": vehicles,
        "policies": policies, # Annotated list passed to HTML
        "selected_owner_id": selected_owner_id,
        "next_policy_number": next_policy_number,
        "policy_types": POLICY_OPTIONS.keys()
    })

@login_required
def edit_policy(request, policy_id):
    """Placeholder view for editing a policy."""
    messages.warning(request, "Policy editing not yet implemented.")
    return redirect("policy")

@login_required
def delete_policy(request, policy_id):
    """Deletes a policy and redirects back to the policy list."""
    policy = get_object_or_404(Policy, id=policy_id, user=request.user)
    policy_number = policy.policy_number
    # Retain selected owner ID if available for redirection context
    owner_id = policy.owner.id
    policy.delete()
    messages.success(request, f"Policy {policy_number} deleted successfully.")
    return redirect(reverse("policy") + f"?owner={owner_id}")
    
# ------------------- OWNER -------------------

@login_required
def owners(request):
    if request.method == "POST":
        owner_name = request.POST.get("owner")
        address = request.POST.get("address")
        phone_number = request.POST.get("phoneNumber")

        if not owner_name or not address or not phone_number:
            messages.error(request, "All fields are required.")
            return redirect("owners")

        Owner.objects.create(
            user=request.user,
            owner=owner_name,
            address=address,
            phone_number=phone_number
        )
        messages.success(request, "Owner added successfully.")
        return redirect(reverse("owners"))

    search_query = request.GET.get("search")
    owners = Owner.objects.filter(user=request.user, owner__icontains=search_query) if search_query else Owner.objects.filter(user=request.user)
    return render(request, "owners.html", {"owners": owners})

@login_required
def update_owner(request, owner_id):
    owner = get_object_or_404(Owner, id=owner_id, user=request.user)
    if request.method == "POST":
        owner.owner = request.POST.get("owner")
        owner.address = request.POST.get("address")
        owner.phone_number = request.POST.get("phoneNumber")
        owner.save()
        messages.success(request, "Owner updated successfully.")
        return redirect(reverse("owners"))
    return render(request, "updateowner.html", {"owner": owner})

@login_required
def delete_owner(request, owner_id):
    owner = get_object_or_404(Owner, id=owner_id, user=request.user)
    owner.delete()
    messages.success(request, "Owner deleted successfully.")
    return redirect(reverse("owners"))

# ------------------- VEHICLE -------------------
def is_valid_vin(vin):
    return len(vin) == 10

def is_valid_vehicle_number(number):
    return bool(re.match(r'^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$', number))

@login_required
def vehicles(request):
    vehicle_types = ["SUV", "Sedan", "Hatchback", "Bike", "Auto", "Truck"]
    owners = Owner.objects.filter(user=request.user)
    vehicles = Vehicle.objects.filter(user=request.user)

    editing_vehicle = None
    edit_id = request.GET.get("edit")
    if edit_id:
        editing_vehicle = get_object_or_404(Vehicle, id=edit_id, user=request.user)

    if request.method == "POST":
        vehicle_id = request.POST.get("vehicle_id")
        title = request.POST.get("title") or "Unknown Vehicle"
        vehicle_type = request.POST.get("vehicle_type")
        vehicle_number = request.POST.get("vehicle_number")
        model_name = request.POST.get("model_name")
        model_year = request.POST.get("model_year")
        vin = request.POST.get("vin")
        owner_id = request.POST.get("owner")

        if not all([vehicle_type, vehicle_number, model_name, model_year, vin, owner_id]):
            messages.error(request, "All fields are required.")
            return redirect("vehicles")

        if not is_valid_vehicle_number(vehicle_number):
            messages.error(request, "Invalid vehicle number format. Use KA-01-AB-1234 or KA-03-A-2882.")
            return redirect("vehicles")

        if not is_valid_vin(vin):
            messages.error(request, "VIN must be exactly 10 characters.")
            return redirect("vehicles")

        owner = get_object_or_404(Owner, id=owner_id, user=request.user)

        if vehicle_id:
            vehicle = get_object_or_404(Vehicle, id=vehicle_id, user=request.user)
            vehicle.title = title
            vehicle.vehicle_type = vehicle_type
            vehicle.vehicle_number = vehicle_number
            vehicle.model_name = model_name
            vehicle.model_year = model_year
            vehicle.vin = vin
            vehicle.owner = owner
            vehicle.save()
            messages.success(request, "Vehicle updated successfully.")
        else:
            Vehicle.objects.create(
                user=request.user,
                title=title,
                vehicle_type=vehicle_type,
                vehicle_number=vehicle_number,
                model_name=model_name,
                model_year=model_year,
                vin=vin,
                owner=owner
            )
            messages.success(request, "Vehicle added successfully.")

        return redirect("vehicles")

    return render(request, "vehicle.html", {
        "owners": owners,
        "vehicles": vehicles,
        "editing_vehicle": editing_vehicle,
        "vehicle_types": vehicle_types,
    })

@login_required
def update_vehicle(request, vehicle_id):
    vehicle = get_object_or_404(Vehicle, id=vehicle_id, user=request.user)

    if request.method == "POST":
        vehicle.title = request.POST.get("title")
        vehicle.vehicle_type = request.POST.get("vehicle_type")
        vehicle_number = request.POST.get("vehicle_number")
        model_name = request.POST.get("model_name")
        model_year = request.POST.get("model_year")
        vin = request.POST.get("vin")
        owner_id = request.POST.get("owner")

        if not all([vehicle.title, vehicle.vehicle_type, vehicle_number, model_name, model_year, vin, owner_id]):
            messages.error(request, "All fields are required.")
            return redirect(reverse("update_vehicle", args=[vehicle_id]))

        if not is_valid_vehicle_number(vehicle_number):
            messages.error(request, "Invalid vehicle number format.")
            return redirect(reverse("update_vehicle", args=[vehicle_id]))

        if not is_valid_vin(vin):
            messages.error(request, "VIN must be exactly 10 characters.")
            return redirect(reverse("update_vehicle", args=[vehicle_id]))

        vehicle.vehicle_number = vehicle_number
        vehicle.model_name = model_name
        vehicle.model_year = model_year
        vehicle.vin = vin
        vehicle.vehicle_type = request.POST.get("vehicle_type")
        vehicle.title = request.POST.get("title")
        vehicle.owner = get_object_or_404(Owner, id=owner_id, user=request.user)

        vehicle.save()
        messages.success(request, "Vehicle updated successfully.")
        return redirect("explore")

    owners = Owner.objects.filter(user=request.user)
    vehicle_types = ["SUV", "Sedan", "Hatchback", "Bike", "Auto", "Truck"]
    return render(request, "updatevehicle.html", {
        "vehicle": vehicle,
        "owners": owners,
        "vehicle_types": vehicle_types,
    })

@login_required
def delete_vehicle(request, vehicle_id):
    vehicle = get_object_or_404(Vehicle, id=vehicle_id, user=request.user)
    vehicle.delete()
    messages.success(request, "Vehicle deleted successfully.")
    return redirect("explore")

#------------------- ACCIDENT  -------------------
@login_required
def accidents(request):
    owners = Owner.objects.filter(user=request.user)
    vehicles = []
    policies = []

    selected_owner_id = request.GET.get("owner") or request.POST.get("owner")
    selected_vehicle_id = request.GET.get("vehicle") or request.POST.get("vehicle")

    if selected_owner_id:
        vehicles = Vehicle.objects.filter(owner_id=selected_owner_id, user=request.user)

    if selected_vehicle_id:
        policies = Policy.objects.filter(vehicle_id=selected_vehicle_id, owner_id=selected_owner_id)

    if request.method == "POST":
        policy_id = request.POST.get("policy")
        accident_date_str = request.POST.get("date_of_accident")
        location = request.POST.get("location")
        description = request.POST.get("description")

        if not all([selected_owner_id, selected_vehicle_id, policy_id, accident_date_str, location, description]):
            messages.error(request, "All fields are required.")
            return redirect("accidents")

        accident_date = parse_date(accident_date_str)
        if not accident_date:
            messages.error(request, "Invalid accident date format.")
            return redirect("accidents")

        policy = get_object_or_404(Policy, id=policy_id)

        # Check if policy already has an accident
        if Accident.objects.filter(policy=policy).exists():
            messages.error(request, f"Policy {policy.policy_number} has already been claimed.")
            return redirect("accidents")

        # Determine policy status at time of accident
        policy_status = "Active" if policy.start_date <= accident_date <= policy.end_date else "Lapsed"

        # Create accident record
        Accident.objects.create(
            owner_id=selected_owner_id,
            vehicle_id=selected_vehicle_id,
            policy=policy,
            date_of_accident=accident_date,
            location=location,
            description=description,
            policy_status=policy_status
        )

        messages.success(request, f"Accident reported successfully. Policy was {policy_status.lower()} at the time.")
        return redirect("accidents")

    return render(request, "accidents.html", {
        "owners": owners,
        "vehicles": vehicles,
        "policies": policies,
        "selected_owner_id": selected_owner_id,
        "selected_vehicle_id": selected_vehicle_id
    })
#------------------- PAYMENT  -------------------
@login_required
def payment(request):
    if request.method == "POST":
        policy_id = request.POST.get("policy_id")
        amount = request.POST.get("amount")
        payment_date = request.POST.get("payment_date")
        payment_method = request.POST.get("payment_method")
        payment_id = request.POST.get("payment_id")

        if not policy_id:
            messages.error(request, "Please select a policy.")
            return redirect("payment")

        policy = get_object_or_404(Policy, id=policy_id)

        # Check if payment already exists
        if Payment.objects.filter(policy=policy).exists():
            messages.warning(request, f"Payment already exists for Policy {policy.policy_number}.")
            return redirect("payment")

        # Check if accident exists for this policy
        accident = Accident.objects.filter(policy=policy).first()
        if not accident:
            messages.error(request, f"No accident reported for Policy {policy.policy_number}. Payment requires a valid accident.")
            return redirect("payment")

        # Check if policy is active at time of accident
        if not (policy.start_date <= accident.date_of_accident <= policy.end_date):
            messages.error(request, f"Policy {policy.policy_number} was not active at the time of accident.")
            return redirect("payment")

        # Create payment
        Payment.objects.create(
            user=request.user,
            owner=policy.owner,
            vehicle=policy.vehicle,
            policy=policy,
            payment_id=payment_id,
            amount=amount,
            payment_date=payment_date,
            payment_method=payment_method
        )

        messages.success(request, f"Payment recorded successfully. Payment ID: {payment_id}")
        return redirect("payment")

    # GET request: show policies
    policies = Policy.objects.filter(user=request.user)
    return render(request, "payment.html", {"policies": policies})



@login_required
def check_policy_status(request):
    policy_id = request.GET.get("policy_id")

    if not policy_id:
        return JsonResponse({"status": "error", "message": "Policy ID is required."}, status=400)

    try:
        policy = Policy.objects.get(id=policy_id, user=request.user)
    except Policy.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Policy not found."}, status=404)

    # Check if accident exists
    accident_exists = Accident.objects.filter(policy=policy).exists()

    # Check if policy is active today
    from datetime import date
    today = date.today()
    is_active = policy.start_date <= today <= policy.end_date

    return JsonResponse({
        "status": "success",
        "policy_number": policy.policy_number,
        "is_active": is_active,
        "has_accident": accident_exists
    })
    
    
    



#------------------- NEWS  -------------------

@login_required
def news(request):
    """
    Render news.html with latest accident-related articles.
    """
    articles = fetch_accident_news(limit=10)
    return render(request, "news.html", {"articles": articles})

#------------------- ABOUT  -------------------

def about_view(request):
    return render(request, "about.html")



#------------------- CONTACT  -------------------
def contact_view(request):
    return render(request, "contact.html")