from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SmartHomeViewSet, SupportedDeviceViewSet, DeviceViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)                 # Route for User API endpoints
router.register(r'smarthomes', SmartHomeViewSet)       # Route for SmartHome API endpoints
router.register(r'supporteddevices', SupportedDeviceViewSet)  # Route for SupportedDevice API endpoints
router.register(r'devices', DeviceViewSet)             # Route for Device API endpoints

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),    # Include router-generated URLs
]