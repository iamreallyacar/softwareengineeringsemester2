from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Model representing a smart home
# SmartHome stores home info, creator, members, timestamps
class SmartHome(models.Model):
    # Name of the smart home
    name = models.CharField(max_length=255)
    # Reference to the user who created the smart home
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_homes')
    # Users who are members of the smart home
    members = models.ManyToManyField(User, related_name='joined_homes', blank=True)
    # Timestamp when the smart home was created
    created_at = models.DateTimeField(auto_now_add=True)
    # Timestamp when the smart home was last updated
    updated_at = models.DateTimeField(auto_now=True)

# 1. Should we add a field for privileged users?
# 2. Should we instead make a separate table for member list and add a field for privilege?

# Model representing a room in a smart home
class Room(models.Model):
    # Name of the room
    name = models.CharField(max_length=100)
    # Reference to the smart home the room belongs to
    smart_home = models.ForeignKey(SmartHome, on_delete=models.CASCADE, related_name='rooms')

# Model representing a supported device model that can be added to a smart home
# SupportedDevice lists device models and types
class SupportedDevice(models.Model):
    # Model name of the supported device
    model_name = models.CharField(max_length=255)
    # Type/category of the device (e.g., 'light', 'thermostat')
    type = models.CharField(max_length=50)

# 1. Should we make a table to keep track of all the legal types and then reference them here?

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

# 1. Should we use MAC address to identify devices?

# Model representing a energy generation log entry for a device
# DeviceLog stores energy usage and status of a device every 5 seconds
class DeviceLog5Sec(models.Model):
    # Reference to the device instance
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    # Status of the device at the time of the log
    status = models.BooleanField()
    # Energy usage of the device at the time of the log
    energy_usage = models.FloatField()
    # Timestamp when the log was created
    created_at = models.DateTimeField(default=timezone.now)

# Model representing energy generation for a device
# DeviceLogDaily stores daily energy usage summaries
class DeviceLogDaily(models.Model):
    # Reference to the device instance
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    # Date of the log entry
    date = models.DateField()
    # Total energy usage of the device for the day
    total_energy_usage = models.FloatField(default=0.0)
    # Usage details for the day
    status_usage_details = models.JSONField(default=dict)  # For storing on/off intervals if needed

# 1. rename date to created_at for consistency?

# Model representing energy generation for a device
class DeviceLogMonthly(models.Model):
    # Reference to the device instance
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    # Month of the log entry
    month = models.IntegerField()
    # Year of the log entry
    year = models.IntegerField()
    # Total energy usage of the device for the month
    total_energy_usage = models.FloatField(default=0.0)
    # Usage details for the month
    daily_summaries = models.JSONField(default=dict)

# 1. Can't we just store month and year as created_at and then use it to figure out the month or year when we need it?

# Model representing energy generation for a room
class RoomLog5Sec(models.Model):
    # Reference to the room instance
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    # Energy usage of the device at the time of the log
    energy_usage = models.FloatField()
    # Timestamp when the log was created                
    created_at = models.DateTimeField(default=timezone.now)

class RoomLogDaily(models.Model):
    # Reference to the room instance
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    # Date of the log entry
    date = models.DateField()
    # Total energy usage of the room for the day
    total_energy_usage = models.FloatField(default=0.0)

class RoomLogMonthly(models.Model):
    # Reference to the room instance
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    # Month of the log entry
    month = models.IntegerField()
    # Year of the log entry
    year = models.IntegerField()
    # Total energy usage of the room for the month
    total_energy_usage = models.FloatField(default=0.0)
