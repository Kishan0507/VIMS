from django.contrib import admin
from django.urls import path
from insapp import views # Assuming your app name is 'insapp'
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = [
    # --- ADMIN ---
    path('admin/', admin.site.urls),
    
    # --- AUTHENTICATION & HOME ---
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register, name='register'),
    path('accounts/login/', views.login_view, name='account_login'),
    
  
    
    # --- MANAGEMENT MODULES (CRUD) ---
    path('owners/', views.owners, name='owners'),
    path('vehicles/', views.vehicles, name='vehicles'),
    path('policy/', views.policy, name='policy'),
    path('accidents/', views.accidents, name='accidents'),
    path('payment/', views.payment, name='payment'), 
    path('news/', views.news, name='news'),

    # --- OWNER ACTIONS ---
    path('owners/update/<int:owner_id>/', views.update_owner, name='update_owner'),
    path('owners/delete/<int:owner_id>/', views.delete_owner, name='delete_owner'),
    
    # --- VEHICLE ACTIONS ---
    path('vehicles/update/<int:vehicle_id>/', views.update_vehicle, name='update_vehicle'), 
    path('vehicles/delete/<int:vehicle_id>/', views.delete_vehicle, name='delete_vehicle'),
    
    # --- UTILITIES & CHARTS ---
    # This is the correct API path definition.
    path('api/check-policy-status/', views.check_policy_status, name='check_policy_status'), 
   
    path('about/', views.about_view, name='about'),
    path('contact/', views.contact_view, name='contact'),
    path('explore/', views.explore, name='explore'),
    path('filter/', views.filter_view, name='filter_view'),
]

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += staticfiles_urlpatterns()