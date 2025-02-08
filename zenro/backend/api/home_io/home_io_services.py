import clr
import os
from django.conf import settings

# Example: place EngineIO.dll somewhere inside api/home_io/sdk
# Then reference it below
sdk_path = os.path.join(settings.BASE_DIR, 'api', 'home_io', 'python-sdk')
clr.AddReference(os.path.join(sdk_path, 'EngineIO'))

# from EngineIO import MemoryMap, MemoryType

class HomeIOService:
    def __init__(self):
        # self.mm = MemoryMap.Instance
        pass

    def set_device_state(self, address, state):
        # e.g. flip the bit for the device at 'address'
        print(f"Setting device {address} to {state}")
        # Implementation with MemoryMap, e.g.:
        # device = self.mm.GetBit(address, MemoryType.Output)
        # device.Value = state
        # self.mm.Update()

    def get_device_state(self, address):
        # device = self.mm.GetBit(address, MemoryType.Output)
        # self.mm.Update()
        # return device.Value
        return False