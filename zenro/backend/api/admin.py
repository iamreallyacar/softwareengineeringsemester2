# Registers models with Django admin for easy management.

from django.contrib import admin
from .models import SmartHome, SupportedDevice, Device, Room, DeviceLog5Sec, DeviceLogDaily, DeviceLogMonthly, RoomLogDaily, RoomLogMonthly, RoomLog5Sec, HomeIORoom

# Register your models here.
admin.site.register(SmartHome)
admin.site.register(SupportedDevice)
admin.site.register(Device)
admin.site.register(Room)
admin.site.register(DeviceLog5Sec)
admin.site.register(DeviceLogDaily)
admin.site.register(DeviceLogMonthly)
admin.site.register(RoomLogDaily)
admin.site.register(RoomLogMonthly)
admin.site.register(RoomLog5Sec)
admin.site.register(HomeIORoom)
