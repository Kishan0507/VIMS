# 🚗 Vehicle Insurance Management System (VIMS)

VIMS is a comprehensive Django-based web application designed to streamline the management of vehicle owner data, insurance policies, payment logs, and accident reporting. This system was developed as a final project for a Database Management Systems (DBMS) course.

The application features a modern, clean, and fully responsive user interface built using **Django Templating** and **Tailwind CSS**, adhering to a consistent light theme across all modules.

---

## ✨ Features Overview

* **Authentication:** Secure User Login, Registration, and Logout functionality.
* **Core CRUD:** Full management (Create, Read, Update, Delete) for **Owners** and **Vehicles**, including strict validation for VIN and Vehicle Numbers.
* **Policy Management:** Register new policies, automatically generate sequential policy numbers, and display policy status (Active/Expired) specific to the selected owner.
* **Accident Reporting:** Log accident incidents against specific vehicles and policies, including a placeholder for visual proof (UI-only).
* **Payment Tracking:** Record policy payments, typically linked to a successful accident claim.
* **Dashboard & Analytics:** Centralized dashboard displaying key operational counts for Policies, Payments, Owners, and Vehicles, plus dynamic bar and pie chart visualizations (conditional rendering).
* **News Feed:** Integration for displaying the latest industry news.

---

## 🔌 REST API Integration: News Feed

The project integrates with an external RESTful API to provide real-time, relevant news articles on the `/news/` page.

| API Service | Integration Point | Purpose |
| :--- | :--- | :--- |
| **News API** | `insapp/news.py` (or similar utility file) | Fetches the latest global news related to accidents, insurance, or the automotive industry to populate the user-facing News Feed. |
| **Requirement** | API Key | The external function (`fetch_accident_news`) requires a valid API key to operate, typically stored securely in environment variables or Django settings. |

---

## 🛠️ Technology Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python, Django 5.x | Core application logic, routing, and ORM. |
| **Frontend Styling** | Tailwind CSS | Modern, responsive, and minimalist UI components. |
| **Database** | SQLite (Development) | Default data storage. |
| **Charting** | Matplotlib | Dynamic generation of dashboard analytics charts (served as PNG). |
| **Seeding** | Faker | Database population for development and testing. |

---

## 🚀 Setup and Installation

Follow these steps to get the VIMS project running on your local machine.

### 1. Prerequisites

Ensure you have **Python (3.8+)** and **pip** installed.

### 2. Clone the Repository & Setup Environment

```bash
# Clone the repository
git clone [YOUR_REPOSITORY_URL]
cd [YOUR_PROJECT_NAME_DIR] 

# Create and activate the virtual environment
python -m venv env
.\env\Scripts\activate  # Windows
# source env/bin/activate # Linux/macOS
3. Install DependenciesInstall all required Python packages (ensure you have a requirements.txt file):Bashpip install -r requirements.txt
4. Database InitializationApply migrations to create the database structure:Bashpython manage.py makemigrations
python manage.manage.py migrate
🧪 Seeding the Database (Optional)To quickly populate the system with dummy data owned by a single test user:Open the Django shell:Bashpython manage.py shell
Import and run the seeding function (assuming it's in insapp/seeder.py):Pythonfrom insapp.seeder import seed_database_single_user
seed_database_single_user(num_owners=5, vehicles_per_owner=2)
exit()
Access Credentials (Test User)UsernamePasswordtestuserpassword123▶️ Running the ApplicationStart the local development server:Bashpython manage.py runserver
Open your browser and navigate to: http://127.0.0.1:8000/
