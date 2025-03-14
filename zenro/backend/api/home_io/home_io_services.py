import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class HomeIOService:
    """
    HomeIO service that controls devices via HTTP requests
    """
    def __init__(self):
        # Get base URL from settings or use default
        self.base_url = getattr(settings, 'HOME_IO_API_URL', 'http://192.168.1.112:9797')
        
    def set_device_state(self, device):
        """
        Control a device in HomeIO based on its current state in the database
        
        Args:
            device: Device model instance with status, supported_device, etc.
        """
        try:
            # Get device details
            device_type = device.supported_device.type
            device_number = device.supported_device.number
            zone = device.supported_device.home_io_room.zone
            status = device.status
            
            # Only handle lights for now
            if device_type != 'lighting':
                logger.info(f"Device type {device_type} not supported for HTTP control yet")
                return False
                
            # Build URL based on device status
            action = "turn_on" if status else "turn_off"
            url = f"{self.base_url}/swl/{action}/{device_number}/{zone}"
            
            logger.info(f"Sending HomeIO control request: {url}")
            
            # Send the request
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                logger.info(f"Successfully controlled device {device.name} ({action})")
                return True
            else:
                logger.error(f"Failed to control device: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error controlling HomeIO device: {e}")
            return False