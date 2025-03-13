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
    DeviceLogMonthlyViewSet, RoomLogMonthlyViewSet, HomeIORoomViewSet, DeviceControlView
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)                 # Route for User API endpoints
router.register(r'smarthomes', SmartHomeViewSet)       # Route for SmartHome API endpoints
router.register(r'supporteddevices', SupportedDeviceViewSet)  # Route for SupportedDevice API endpoints
router.register(r'devices', DeviceViewSet)             # Route for Device API endpoints
router.register(r'rooms', RoomViewSet)                 # Add route for RoomViewSet
router.register(r'devicelogdaily', DeviceLogDailyViewSet, basename='devicelogdaily')  # Add route for DeviceLogDailyViewSet
router.register(r'roomlogdaily', RoomLogDailyViewSet, basename='roomlogdaily')        # Add route for RoomLogDailyViewSet
router.register(r'devicelogs', DeviceLog1MinViewSet, basename='devicelogs')
router.register(r'roomlogs', RoomLog1MinViewSet, basename='roomlogs')
router.register(r'devicelogsmonthly', DeviceLogMonthlyViewSet, basename='devicelogsmonthly')
router.register(r'roomlogsmonthly', RoomLogMonthlyViewSet, basename='roomlogsmonthly')
router.register(r'homeio-rooms', HomeIORoomViewSet, basename='homeio-rooms')

# The API URLs are now determined automatically by the router
# The DefaultRouter automatically creates routes for each ViewSet
urlpatterns = [
    path('', include(router.urls)),    # Include router-generated URLs
    path('register/', register_user, name='register'),  # The 'register/' path calls the register_user function for signup
    path('homeio/control/', HomeIOControlView.as_view(), name='homeio-control'), 
    path('unlock-room/', UnlockRoomView.as_view(), name='unlock-room'),
    path('add-device/', AddDeviceView.as_view(), name='add-device'),
    path('dashboard/', dashboard_summary, name='dashboard'),
    path('devices/<int:pk>/control/', DeviceControlView.as_view(), name='device-control'),
]