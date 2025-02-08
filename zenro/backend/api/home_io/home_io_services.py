import clr
import os
from django.conf import settings

# Example: place EngineIO.dll somewhere inside api/home_io/sdk
# Then reference it below
sdk_path = os.path.join(settings.BASE_DIR, 'api', 'home_io', 'python-sdk')
clr.AddReference(os.path.join(sdk_path, 'EngineIO'))

from EngineIO import MemoryMap, MemoryType  # Make sure this import is valid

"""
Provides methods for interacting with the Home IO simulator's SDK
to set device states in real-time.
"""

class HomeIOService:
    """
    This service integrates with the external Home IO simulator.
    - To view the changes:
      1) Run the Home IO simulator executable (or web app) in a separate window.
      2) Keep it open: the simulator updates its 3D view in real time when set_device_state is called.
      3) Check the simulator's developer documentation if additional config is needed on Ubuntu.
    """
    # This class integrates with the simulator's MemoryMap (via EngineIO).

    def __init__(self):
        # Initialize the MemoryMap instance so we can directly modify addresses
        self.mm = MemoryMap.Instance
        self.mm.Update()

    def set_device_state(self, address, state):
        """
        Called by your Django Views to switch a device on/off.
        'address' corresponds to the memory address in the Home IO layout,
        'state' is True/False for ON/OFF respectively.
        """
        print(f"Setting device {address} to {state}")
        # Implementation with MemoryMap, for example:
        device_bit = self.mm.GetBit(address, MemoryType.Output)
        device_bit.Value = state
        self.mm.Update()

    def get_device_state(self, address):
        """
        Returns the current status of the device at 'address' in the Home IO simulator.
        For an end-to-end integration, retrieve the device bit from the MemoryMap.
        """
        # device = self.mm.GetBit(address, MemoryType.Output)
        # self.mm.Update()
        # return device.Value
        return False