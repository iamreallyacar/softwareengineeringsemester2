from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Model representing a smart home
# SmartHome stores home info, creator, members, timestamps
class SmartHome(models.Model):
    name = models.CharField(max_length=255)                     # Name of the smart home
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_homes') # Reference to the user who created the smart home
    members = models.ManyToManyField(User, related_name='joined_homes', blank=True) # Users who are members of the smart home
    created_at = models.DateTimeField(auto_now_add=True)        # Timestamp when the smart home was created
    updated_at = models.DateTimeField(auto_now=True)            # Timestamp when the smart home was last updated

# Model representing a room in a smart home
class Room(models.Model):
    name = models.CharField(max_length=100)
    smart_home = models.ForeignKey(SmartHome, on_delete=models.CASCADE, related_name='rooms')

# Model representing a supported device model that can be added to a smart home
# SupportedDevice lists device models and types
class SupportedDevice(models.Model):
    model_name = models.CharField(max_length=255)               # Model name of the supported device
    type = models.CharField(max_length=50)                      # Type/category of the device (e.g., 'light', 'thermostat')

# Model representing a device instance added to a smart home
# Device associates a named device with a SmartHome and SupportedDevice
class Device(models.Model):
    name = models.CharField(max_length=100)                             # Name of the device instance
    status = models.BooleanField(default=False)                         # Current status of the device (e.g., on/off)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='devices') # Reference to the room the device belongs to
    supported_device = models.ForeignKey(SupportedDevice, on_delete=models.CASCADE) # Reference to the supported device model
    created_at = models.DateTimeField(auto_now_add=True)                # Timestamp when the device instance was created
    updated_at = models.DateTimeField(auto_now=True)                    # Timestamp when the device instance was last updated

    class Meta:
        constraints = [
            # Ensure that each device name is unique within a room
            models.UniqueConstraint(fields=['name', 'room'], name='unique_device_in_room')
        ]

# Model representing a energy generation log entry for a device
# DeviceLog stores device status, energy usage, and timestamps
class DeviceLog5Sec(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE) # Reference to the device instance
    status = models.BooleanField()                               # Status of the device at the time of the log
    energy_usage = models.FloatField()                           # Energy usage of the device at the time of the log
    created_at = models.DateTimeField(default=timezone.now)         # Timestamp when the log was created

class DeviceLogDaily(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_usage = models.FloatField(default=0.0)
    status_usage_details = models.JSONField(default=dict)  # For storing on/off intervals if needed

class DeviceLogMonthly(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_usage = models.FloatField(default=0.0)
    daily_summaries = models.JSONField(default=dict)  # Each day's usage for the month

# Model representing energy generation for a room
class RoomLog5Sec(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE) # Reference to the room instance
    energy_usage = models.FloatField()                           # Energy usage of the device at the time of the log
    created_at = models.DateTimeField(default=timezone.now)  # Change from auto_now_add

class RoomLogDaily(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_usage = models.FloatField(default=0.0)

class RoomLogMonthly(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_usage = models.FloatField(default=0.0)
