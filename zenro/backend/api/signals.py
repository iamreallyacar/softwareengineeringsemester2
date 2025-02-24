from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import SmartHome, HomeIORoom, SupportedDevice, Room, Device

@receiver(post_save, sender=SmartHome)
def create_home_layout(sender, instance, created, **kwargs):
    """
    When a new SmartHome is created, this signal handler copies the template layout from HomeIORoom and SupportedDevice
    into Room and Device respectively.
    """
    if created:
        # Iterate over all Home I/O template rooms
        for home_io_room in HomeIORoom.objects.all():
            # Create a new Room for the SmartHome using the HomeIORoom template
            new_room = Room.objects.create(
                name=home_io_room.name,
                smart_home=instance,
                home_io_room=home_io_room,
                is_unlocked=False  # Initially locked
            )
            # For each template device in this room...
            supported_devices = SupportedDevice.objects.filter(home_io_room=home_io_room)
            for s_device in supported_devices:
                # Create the copy device in the new SmartHome room
                Device.objects.create(
                    name=s_device.model_name,  # You might append additional info if needed
                    status=False,              # Initial device status is off/false
                    room=new_room,
                    supported_device=s_device,
                    is_unlocked=False          # Initially locked
                )