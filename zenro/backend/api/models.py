from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Model representing a smart home
# SmartHome stores home info, creator, members, timestamps
# name - Name of the smart home
# creator - Reference to the user who created the smart home
# member - Users who are members of the smart home
# created_at - Timestamp when the smart home was created
# updated_at - Timestamp when the smart home was last updated
class SmartHome(models.Model):
    name = models.CharField(max_length=255)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_homes')
    members = models.ManyToManyField(User, related_name='joined_homes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# Questions
# 1. Should we add a field for privileged users?
# - Es ist für später, wenn wir Admins hinzufügen wollen.
# 2. Should we instead make a separate table for member list and add a field for privilege?

# Model representing a room in a smart home
# name - Name of the room
# smart_home - Reference to the smart home the room belongs to
class Room(models.Model):
    name = models.CharField(max_length=255)
    smart_home = models.ForeignKey(SmartHome, on_delete=models.CASCADE, related_name='rooms')
    home_io_room = models.ForeignKey('HomeIORoom', on_delete=models.CASCADE)
    is_unlocked = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name', 'smart_home'], name='unique_room_in_home')
        ]

    def __str__(self):
        return f"{self.name} (Home: {self.smart_home.name})"

# Model representing a supported device model that can be added to a smart home
# model_name - Model name of the supported device
# type - Type/category of the device (e.g., 'light', 'thermostat')
class SupportedDevice(models.Model):
    DEVICE_MEMORY_TYPE_CHOICES = [
        ('input', 'Input'),
        ('output', 'Output'),
        ('memory', 'Memory'),
    ]

    model_name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, default=None, null=True)
    home_io_room = models.ForeignKey('HomeIORoom', on_delete=models.CASCADE, null=True, default=None)
    address = models.IntegerField()
    data_type = models.CharField(max_length=10)
    contact_type = models.CharField(max_length=10, null=True, default=None)
    memory_type = models.CharField(
        max_length=10,
        choices=DEVICE_MEMORY_TYPE_CHOICES,
    )
    consumption_rate = models.IntegerField(null=True, default=None)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['address', 'data_type', 'memory_type'],
                name='unique_addr_data_memtype'
            )
        ]

    def __str__(self):
        return f"{self.model_name} ({self.memory_type}, addr={self.address}, {self.data_type})"

# Questions
# 1. Should we make a table to keep track of all the legal types and then reference them here?

# Model representing a device instance added to a smart home
# Device associates a named device with a SmartHome and SupportedDevice
# device - Name of the device instance
# status - Current status of the device (e.g., on/off)
# room - Reference to the room the device belongs to
# supported_device - Reference to the supported device model
# created_at - Timestamp when the device instance was created
# updated_at - Timestamp when the device instance was last updated
class Device(models.Model):
    name = models.CharField(max_length=100)                             
    status = models.BooleanField(default=False)                         
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='devices', null=True) 
    supported_device = models.ForeignKey(SupportedDevice, on_delete=models.CASCADE) 
    created_at = models.DateTimeField(auto_now_add=True)                
    updated_at = models.DateTimeField(auto_now=True)                    
    is_unlocked = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name', 'room'], name='unique_device_in_room')
        ]

    def __str__(self):
        return f"{self.name} in {self.room.name}"

# Question
# 1. Should we use MAC address to identify devices?

# Model representing a energy generation log entry for a device
# DeviceLog stores energy usage and status of a device every 5 seconds
# device - Reference to the device instance
# status - Status of the device at the time of the log
# energy_usage - Energy usage of the device at the time of the log
# created_at - Timestamp when the log was created
class DeviceLog5Sec(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    status = models.BooleanField()
    energy_usage = models.FloatField()
    created_at = models.DateTimeField(default=timezone.now)

# Model representing energy generation for a device
# DeviceLogDaily stores daily energy usage summaries
# device - Reference to the device instance
# date - Date of the log entry
# total_energy_usage - Total energy usage of the device for the day
# status_usage_details Usage details for the day
class DeviceLogDaily(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_usage = models.FloatField(default=0.0)
    status_usage_details = models.JSONField(default=dict)  # For storing on/off intervals if needed

# 1. rename date to created_at for consistency?

# Model representing energy generation for a device
# device - Reference to the device instance
# month - Month of the log entry
# year - Year of the log entry
# total_energy_usage - Total energy usage of the device for the month
# daily_summaries - Usage details for the month
class DeviceLogMonthly(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_usage = models.FloatField(default=0.0)
    daily_summaries = models.JSONField(default=dict)

# 1. Can't we just store month and year as created_at and then use it to figure out the month or year when we need it?

# Model representing energy generation for a room
# RoomLog5Sec stores energy usage of a room every 5 seconds
# room - Reference to the room instance
# energy_usage - Energy usage of the room at the time of the log
# created_at - Timestamp when the log was created
class RoomLog5Sec(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    energy_usage = models.FloatField()
    created_at = models.DateTimeField(default=timezone.now)

# Model representing daily energy generation for a room
# RoomLogDaily stores daily energy usage summaries
# room - Reference to the room instance
# date - Date of the log entry
# total_energy_usage - Total energy usage of the room for the day
class RoomLogDaily(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_usage = models.FloatField(default=0.0)

# Model representing monthly energy generation for a room
# RoomLogMonthly stores monthly energy usage summaries
# room - Reference to the room instance
# month - Month of the log entry
# year - Year of the log entry
# total_energy_usage - Total energy usage of the room for the month
class RoomLogMonthly(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_usage = models.FloatField(default=0.0)

# Model representing a fixed room layout in Home I/O
# name - Name of the room in Home I/O
class HomeIORoom(models.Model):
    name = models.CharField(max_length=100, unique=True)
    unlock_order = models.PositiveIntegerField(null=True)  # Enforce fixed order

    def __str__(self):
        return f"{self.name} (order {self.unlock_order})"
