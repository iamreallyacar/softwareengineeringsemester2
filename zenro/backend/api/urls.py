from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SmartHomeViewSet, SupportedDeviceViewSet, DeviceViewSet, register_user

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)                 # Route for User API endpoints
router.register(r'smarthomes', SmartHomeViewSet)       # Route for SmartHome API endpoints
router.register(r'supporteddevices', SupportedDeviceViewSet)  # Route for SupportedDevice API endpoints
router.register(r'devices', DeviceViewSet)             # Route for Device API endpoints

# The API URLs are now determined automatically by the router
# The DefaultRouter automatically creates routes for each ViewSet
urlpatterns = [
    path('', include(router.urls)),    # Include router-generated URLs
    path('register/', register_user, name='register'),  # The 'register/' path calls the register_user function for signup
]