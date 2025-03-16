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
    # Add new ViewSets
    EnergyGeneration1MinViewSet, EnergyGenerationDailyViewSet, EnergyGenerationMonthlyViewSet,
    energy_summary
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)                 
router.register(r'smarthomes', SmartHomeViewSet)       
router.register(r'supporteddevices', SupportedDeviceViewSet)  
router.register(r'devices', DeviceViewSet)             
router.register(r'rooms', RoomViewSet)                 
router.register(r'devicelogdaily', DeviceLogDailyViewSet, basename='devicelogdaily')  
router.register(r'roomlogdaily', RoomLogDailyViewSet, basename='roomlogdaily')        
router.register(r'devicelogs', DeviceLog1MinViewSet, basename='devicelogs')
router.register(r'roomlogs', RoomLog1MinViewSet, basename='roomlogs')
router.register(r'devicelogsmonthly', DeviceLogMonthlyViewSet, basename='devicelogsmonthly')
router.register(r'roomlogsmonthly', RoomLogMonthlyViewSet, basename='roomlogsmonthly')
router.register(r'homeio-rooms', HomeIORoomViewSet, basename='homeio-rooms')

# Register new energy generation viewsets
router.register(r'energy-generation', EnergyGeneration1MinViewSet, basename='energy-generation')
router.register(r'energy-generation-daily', EnergyGenerationDailyViewSet, basename='energy-generation-daily')
router.register(r'energy-generation-monthly', EnergyGenerationMonthlyViewSet, basename='energy-generation-monthly')

# Organized URL patterns for better maintainability
urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('register/', register_user, name='register'),
    
    # Dashboard and analytics
    path('dashboard/', dashboard_summary, name='dashboard'),
    path('energy-summary/', energy_summary, name='energy-summary'),
    
    # HomeIO control
    path('homeio/control/', HomeIOControlView.as_view(), name='homeio-control'), 
    path('unlock-room/', UnlockRoomView.as_view(), name='unlock-room'),
    path('add-device/', AddDeviceView.as_view(), name='add-device'),
    path('devices/<int:pk>/control/', DeviceControlView.as_view(), name='device-control'),
]