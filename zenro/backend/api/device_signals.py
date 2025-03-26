import logging
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Device
from .home_io.home_io_services import HomeIOService

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Device)
def update_homeio_on_device_change(sender, instance, **kwargs):
    """
    When a device's status or analogue_value changes in the database, send an HTTP request to control
    the corresponding HomeIO device.
    """
    # Skip for new devices (no pk yet)
    if not instance.pk:
        return
        
    try:
        # Get the original device state from database
        old_instance = Device.objects.get(pk=instance.pk)
        service = HomeIOService()
        
        # Handle status changes
        if old_instance.status != instance.status:
            # Log the change
            logger.info(f"Device {instance.name} status changed from {old_instance.status} to {instance.status}")
            
            # Control the device through HomeIO HTTP
            success = service.set_device_state(instance)
            
            # Handle possible failure
            if not success:
                logger.warning(f"Failed to control HomeIO device {instance.name} status")
        
        # Handle direct analogue value changes (when status didn't change or changed in other ways)
        elif old_instance.analogue_value != instance.analogue_value:
            # Only proceed if the device has an analogue value and is turned on
            if instance.analogue_value is not None and instance.status:
                # Log the analogue value change
                logger.info(f"Device {instance.name} analogue value changed from {old_instance.analogue_value} to {instance.analogue_value}")
                
                # Control the device through HomeIO HTTP
                success = service.set_device_analogue_value(instance)
                
                # Handle possible failure
                if not success:
                    logger.warning(f"Failed to set analogue value for HomeIO device {instance.name}")
            
    except Exception as e:
        logger.error(f"Error handling device change: {e}")