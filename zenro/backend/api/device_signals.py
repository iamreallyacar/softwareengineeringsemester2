import logging
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Device
from .home_io.home_io_services import HomeIOService

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Device)
def update_homeio_on_device_change(sender, instance, **kwargs):
    """
    When a device's status changes in the database, send an HTTP request to control
    the corresponding HomeIO device.
    """
    # Skip for new devices (no pk yet)
    if not instance.pk:
        return
        
    try:
        # Get the original device state from database
        old_instance = Device.objects.get(pk=instance.pk)
        
        # Only proceed if status has changed
        if old_instance.status != instance.status:
            # Get supported device details
            supported_device = instance.supported_device
            
            # Log the change
            logger.info(f"Device {instance.name} status changed from {old_instance.status} to {instance.status}")
            
            # Control the device through HomeIO HTTP
            service = HomeIOService()
            success = service.set_device_state(instance)
            
            # Handle possible failure
            if not success:
                logger.warning(f"Failed to control HomeIO device {instance.name}")
            
    except Exception as e:
        logger.error(f"Error handling device status change: {e}")