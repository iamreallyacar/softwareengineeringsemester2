# Registers models with Django admin for easy management.

from django.contrib import admin
from .models import (
    SmartHome, HomeIORoom, SupportedDevice, Room, Device,
    DeviceLog1Min, DeviceLogDaily, DeviceLogMonthly,
    RoomLog1Min, RoomLogDaily, RoomLogMonthly
)

# Register your models here.
admin.site.register(SmartHome)
admin.site.register(HomeIORoom)
admin.site.register(SupportedDevice)
admin.site.register(Room)
admin.site.register(Device)
admin.site.register(DeviceLog1Min)
admin.site.register(DeviceLogDaily)
admin.site.register(DeviceLogMonthly)
admin.site.register(RoomLog1Min)
admin.site.register(RoomLogDaily)
admin.site.register(RoomLogMonthly)
