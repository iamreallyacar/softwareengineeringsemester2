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
    
    def _get_device_details(self, device):
        """Helper method to extract common device details"""
        device_type = device.supported_device.type
        device_number = device.supported_device.number
        zone = device.supported_device.home_io_room.zone
        return device_type, device_number, zone
    
    def _send_request(self, url, device_name, action_type):
        """Helper method to send HTTP requests to HomeIO"""
        try:
            logger.info(f"Sending HomeIO control request: {url}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                logger.info(f"Successfully controlled device {device_name} ({action_type})")
                return True
            else:
                logger.error(f"Failed to control device: {response.status_code}, {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error controlling HomeIO device: {e}")
            return False
        
    def set_device_state(self, device):
        """
        Control a device's on/off status in HomeIO
        
        Args:
            device: Device model instance with status, supported_device, etc.
        """
        try:
            # Get device details
            device_type, device_number, zone = self._get_device_details(device)
            status = device.status
            
            # Handle different device types
            if device_type == 'lighting':
                action = "turn_on" if status else "turn_off"
                url = f"{self.base_url}/swl/{action}/{device_number}/{zone}"
            elif device_type == 'heating':
                action = "turn_on" if status else "turn_off"
                url = f"{self.base_url}/swh/{action}/{zone}"
            elif device_type == 'shades':
                action = "up" if status else "down"
                url = f"{self.base_url}/strs/{device_number}/{action}/{zone}"
            else:
                logger.info(f"Device type {device_type} not supported for HTTP control yet")
                return False
                
            return self._send_request(url, device.name, f"status: {action}")
                
        except Exception as e:
            logger.error(f"Error controlling HomeIO device: {e}")
            return False
            
    def set_device_analogue_value(self, device):
        """
        Control a device's analogue value in HomeIO
        
        Args:
            device: Device model instance with analogue_value, supported_device, etc.
        """
        try:
            # Get device details
            device_type, device_number, zone = self._get_device_details(device)
            analogue_value = device.analogue_value
            
            if analogue_value is None:
                logger.info(f"Device {device.name} has no analogue value to set")
                return False
                
            # Handle different device types
            if device_type == 'lighting':
                url = f"{self.base_url}/stl/{device_number}/{zone}/{analogue_value}"
            elif device_type == 'heating':
                url = f"{self.base_url}/sth/{zone}/{analogue_value}"
            else:
                logger.info(f"Device type {device_type} does not support analogue control")
                return False
                
            return self._send_request(url, device.name, f"analogue value: {analogue_value}")
                
        except Exception as e:
            logger.error(f"Error setting device analogue value: {e}")
            return False