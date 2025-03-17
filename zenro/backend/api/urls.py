# This file defines the API endpoint routing. 
# The DefaultRouter auto-generates routes for all ViewSets, plus some custom paths.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, SmartHomeViewSet, SupportedDeviceViewSet, 
    DeviceViewSet, register_user, RoomViewSet,
    DeviceLogDailyViewSet, RoomLogDailyViewSet, HomeIOControlView,
    UnlockRoomView, AddDeviceView,
    DeviceLog1MinViewSet, RoomLog1MinViewSet, dashboard_summary,
    DeviceLogMonthlyViewSet, RoomLogMonthlyViewSet, HomeIORoomViewSet, DeviceControlView,
    EnergyGeneration1MinViewSet, EnergyGenerationDailyViewSet, EnergyGenerationMonthlyViewSet,
    energy_summary, UserProfileViewSet, current_user_info  # Add current_user_info here
)

# Create a router and register our viewsets with it
router = DefaultRouter()

# Core data models (full CRUD - GET/POST/PUT/PATCH/DELETE)
router.register(r'users', UserViewSet)                 
router.register(r'user-profiles', UserProfileViewSet)
router.register(r'smarthomes', SmartHomeViewSet)       
router.register(r'devices', DeviceViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'supporteddevices', SupportedDeviceViewSet)  
router.register(r'homeio-rooms', HomeIORoomViewSet, basename='homeio-rooms')

# Energy & device log models (read-only - GET)
router.register(r'devicelogs', DeviceLog1MinViewSet, basename='devicelogs')
router.register(r'devicelogs/daily', DeviceLogDailyViewSet, basename='devicelogdaily')
router.register(r'devicelogs/monthly', DeviceLogMonthlyViewSet, basename='devicelogsmonthly')
router.register(r'roomlogs', RoomLog1MinViewSet, basename='roomlogs')
router.register(r'roomlogs/daily', RoomLogDailyViewSet, basename='roomlogdaily')
router.register(r'roomlogs/monthly', RoomLogMonthlyViewSet, basename='roomlogsmonthly')
router.register(r'energy-generation', EnergyGeneration1MinViewSet, basename='energy-generation')
router.register(r'energy-generation/daily', EnergyGenerationDailyViewSet, basename='energy-generation-daily')
router.register(r'energy-generation/monthly', EnergyGenerationMonthlyViewSet, basename='energy-generation-monthly')

# Organized URL patterns by function
urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('register/', register_user, name='register'),
    path('user/current/', current_user_info, name='current-user-info'),  # Add this line
    
    # Dashboard and analytics
    path('dashboard/', dashboard_summary, name='dashboard'),
    path('energy-summary/', energy_summary, name='energy-summary'),
    
    # HomeIO control
    path('homeio/control/', HomeIOControlView.as_view(), name='homeio-control'), 
    path('unlock-room/', UnlockRoomView.as_view(), name='unlock-room'),
    path('add-device/', AddDeviceView.as_view(), name='add-device'),
    path('devices/<int:pk>/control/', DeviceControlView.as_view(), name='device-control'),
]