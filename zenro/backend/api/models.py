from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import random
import string

class SmartHome(models.Model):
    """
    A smart home in our system that users can create and join.
    
    Think of this as the virtual representation of a physical house, connecting
    all the rooms, devices, and users together. Each home has an owner (creator) 
    and can have multiple members who can access and control the home's features.
    
    The join_password allows other users to join this home by providing the password.
    """
    name = models.CharField(max_length=255)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_homes')
    members = models.ManyToManyField(User, related_name='joined_homes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    join_password = models.CharField(max_length=50, default="", blank=True) 

class Room(models.Model):
    """
    A room within a smart home where devices can be placed.
    
    Rooms are mapped to physical locations in the HomeIO simulation. They serve
    as organizational units for grouping related devices (like a real bedroom
    or kitchen would contain specific appliances).
    
    The is_unlocked field determines if users can access and control this room,
    implementing our progressive unlocking feature.
    """
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

class SupportedDevice(models.Model):
    """
    The definition of a device type that can be installed in our system.
    
    This is like a "template" or "blueprint" for actual devices. It defines
    what kinds of devices our system supports and how they connect to HomeIO.
    
    The technical fields (address, data_type, memory_type) define how our system
    communicates with the HomeIO simulation for this type of device.
    """
    DEVICE_MEMORY_TYPE_CHOICES = [
        ('input', 'Input'),
        ('output', 'Output'),
        ('memory', 'Memory'),
    ]

    model_name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, default=None, null=True)
    number = models.IntegerField(default=None, null=True)
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

class Device(models.Model):
    """
    An actual device instance installed in a room of a smart home.
    
    While SupportedDevice defines what kinds of devices exist,
    this model represents a specific device that's been placed in a room
    and can be controlled by users.
    
    For example, "Living Room Light" would be a Device instance of a
    "Light Switch" SupportedDevice type.
    
    Devices track their current status (on/off), analog value (0-10 for dimmable
    devices), and when they were created or last updated.
    """
    name = models.CharField(max_length=100)                             
    status = models.BooleanField(default=False)                     
    analogue_value = models.IntegerField(
        null=True, 
        default=None,
        validators=[
            MinValueValidator(0, message="Value must be at least 0"),
            MaxValueValidator(10, message="Value cannot be greater than 10")
        ]
    ) 
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

class DeviceLog1Min(models.Model):
    """
    Records the energy usage of a device at one-minute intervals.
    
    This gives us high-resolution data about device energy consumption,
    allowing us to create detailed usage reports and visualizations.
    We track both the status (on/off) and the actual energy used.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    status = models.BooleanField()
    energy_usage = models.FloatField()
    created_at = models.DateTimeField(default=timezone.now)

class DeviceLogDaily(models.Model):
    """
    Aggregated daily energy usage for a device.
    
    Instead of storing every minute's data forever, we aggregate it into
    daily summaries to save space while still providing useful historical data.
    
    The status_usage_details field can store additional information like
    how long the device was on vs. off during the day.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_usage = models.FloatField(default=0.0)
    status_usage_details = models.JSONField(default=dict)  # For storing on/off intervals if needed

class DeviceLogMonthly(models.Model):
    """
    Aggregated monthly energy usage for a device.
    
    This provides an even higher level of aggregation for long-term
    analysis and reporting. Month and year are stored as separate fields
    to make querying by month or year more efficient.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_usage = models.FloatField(default=0.0)
    daily_summaries = models.JSONField(default=dict)

class RoomLog1Min(models.Model):
    """
    Records the energy usage of an entire room at one-minute intervals.
    
    This aggregates the energy usage of all devices in a room, giving us
    a picture of which rooms are using the most energy at any given time.
    """
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    energy_usage = models.FloatField()
    created_at = models.DateTimeField(default=timezone.now)

class RoomLogDaily(models.Model):
    """
    Aggregated daily energy usage for a room.
    
    Similar to device logs, we aggregate room energy usage into daily
    summaries for easier analysis of room-level consumption patterns.
    """
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_usage = models.FloatField(default=0.0)

class RoomLogMonthly(models.Model):
    """
    Aggregated monthly energy usage for a room.
    
    This provides a long-term view of which rooms use the most energy
    across different months of the year.
    """
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_usage = models.FloatField(default=0.0)

class HomeIORoom(models.Model):
    """
    Represents rooms defined in the HomeIO simulation.
    
    These are the fixed rooms that exist in the simulation environment.
    Our system's Room objects reference these to map virtual rooms to 
    the corresponding simulation rooms.
    
    The unlock_order field helps us implement the progressive unlocking feature,
    controlling which rooms become available to users in what order.
    """
    name = models.CharField(max_length=100, unique=True)
    zone = models.CharField(max_length=5, default=None, null=True)
    unlock_order = models.PositiveIntegerField(null=True)  # Enforce fixed order

    def __str__(self):
        return f"{self.name} (order {self.unlock_order})"

class EnergyGeneration1Min(models.Model): 
    """
    Records the energy generated by a smart home at one-minute intervals.
    
    This tracks how much energy the home's solar panels (or other generation sources)
    are producing, allowing us to compare generation against consumption.
    """
    home = models.ForeignKey(SmartHome, on_delete=models.CASCADE)
    energy_generation = models.FloatField()
    created_at = models.DateTimeField(default=timezone.now)

class EnergyGenerationDaily(models.Model):
    """
    Aggregated daily energy generation for a smart home.
    
    This gives us a day-by-day view of how much energy the home produced,
    which we can compare against the home's total consumption.
    """
    home = models.ForeignKey(SmartHome, on_delete=models.CASCADE)
    date = models.DateField()
    total_energy_generation = models.FloatField(default=0.0)

class EnergyGenerationMonthly(models.Model):
    """
    Aggregated monthly energy generation for a smart home.
    
    This provides a long-term view of the home's energy production patterns,
    useful for seasonal analysis (e.g., summer vs winter generation).
    """
    home = models.ForeignKey(SmartHome, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_energy_generation = models.FloatField(default=0.0)

class UserProfile(models.Model):
    """
    Extends the built-in User model with additional profile information.
    
    This gives us a place to store user details that aren't covered by
    Django's default User model, like date of birth and contact information.
    
    The one-to-one relationship ensures each user has exactly one profile.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(null=True, default=None)
    gender = models.CharField(
        max_length=10, 
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
        null=True,
        default=None
    )
    phone_number = models.CharField(max_length=15, null=True, default=None)
    
    def __str__(self):
        return f"Profile for {self.user.username}"

class RecoveryCode(models.Model):
    """
    One-time use codes that let users recover their account if they forget their password.
    
    Each user can have up to 10 recovery codes. When a user uses a code to reset their
    password, that code is deleted so it can't be used again. The codes follow a specific
    format (xxxxx-xxxxx) to make them easy to read and enter.
    
    Recovery codes are a security best practice, providing an alternative to email-based
    password reset which may not always be accessible.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recovery_codes')
    code = models.CharField(max_length=12, unique=True)  # Format: xxxxx-xxxxx
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Recovery code for {self.user.username}"
    
    @classmethod
    def generate_code(cls):
        """
        Creates a new random recovery code in the format xxxxx-xxxxx.
        
        We use a mix of lowercase letters and digits to make codes
        that are secure but still readable.
        """
        chars = string.ascii_lowercase + string.digits
        part1 = ''.join(random.choices(chars, k=5))
        part2 = ''.join(random.choices(chars, k=5))
        return f"{part1}-{part2}"
    
    @classmethod
    def create_for_user(cls, user, count=10):
        """
        Creates a fresh set of recovery codes for a user.
        
        This removes any existing codes the user has (for security),
        then generates a new set of unique codes. By default, we create
        10 codes, giving users plenty of recovery options while keeping
        the number manageable.
        """
        # First, invalidate any existing unused codes
        cls.objects.filter(user=user).delete()
        
        # Generate new codes
        new_codes = []
        for _ in range(count):
            code = cls.generate_code()
            while cls.objects.filter(code=code).exists():
                code = cls.generate_code()  # Ensure uniqueness
                
            new_code = cls.objects.create(user=user, code=code)
            new_codes.append(new_code)
            
        return new_codes