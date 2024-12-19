from django.db import models
from django.contrib.auth.models import User

# Model representing a smart home
class SmartHome(models.Model):
    name = models.CharField(max_length=255)                     # Name of the smart home
    creator = models.ForeignKey(User, on_delete=models.CASCADE) # Reference to the user who created the smart home
    created_at = models.DateTimeField(auto_now_add=True)        # Timestamp when the smart home was created
    updated_at = models.DateTimeField(auto_now=True)            # Timestamp when the smart home was last updated

# Model representing a supported device model that can be added to a smart home
class SupportedDevice(models.Model):
    model_name = models.CharField(max_length=255)               # Model name of the supported device
    type = models.CharField(max_length=50)                      # Type/category of the device (e.g., 'light', 'thermostat')

# Model representing a device instance added to a smart home
class Device(models.Model):
    name = models.CharField(max_length=100)                             # Name of the device instance
    status = models.BooleanField(default=False)                         # Current status of the device (e.g., on/off)
    smart_home = models.ForeignKey(SmartHome, on_delete=models.CASCADE) # Reference to the smart home the device belongs to
    supported_device = models.ForeignKey(SupportedDevice, on_delete=models.CASCADE) # Reference to the supported device model
    created_at = models.DateTimeField(auto_now_add=True)                # Timestamp when the device instance was created
    updated_at = models.DateTimeField(auto_now=True)                    # Timestamp when the device instance was last updated

    class Meta:
        constraints = [
            # Ensure that each device name is unique within a smart home
            models.UniqueConstraint(fields=['name', 'smart_home'], name='unique_device_per_home')
        ]

