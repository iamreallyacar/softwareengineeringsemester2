# Registers models with Django admin for easy management.

from django import forms
from django.contrib import admin
from .models import (
    SmartHome, HomeIORoom, SupportedDevice, Room, Device,
    DeviceLog1Min, DeviceLogDaily, DeviceLogMonthly,
    RoomLog1Min, RoomLogDaily, RoomLogMonthly, EnergyGenerationDaily, EnergyGenerationMonthly, EnergyGeneration1Min,
    UserProfile
)

# Create a custom form for Device
class DeviceAdminForm(forms.ModelForm):
    class Meta:
        model = Device
        fields = '__all__'
        
    def __init__(self, *args, **kwargs):
        super(DeviceAdminForm, self).__init__(*args, **kwargs)
        self.fields['analogue_value'].required = False

# Create a custom admin class using the form
class DeviceAdmin(admin.ModelAdmin):
    form = DeviceAdminForm

# Created a custom admin class for UserProfile
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'gender', 'phone_number')

# Register your models with the admin site
admin.site.register(SmartHome)
admin.site.register(HomeIORoom)
admin.site.register(SupportedDevice)
admin.site.register(Room)
admin.site.register(Device, DeviceAdmin)  # Use the custom admin class
admin.site.register(DeviceLog1Min)
admin.site.register(DeviceLogDaily)
admin.site.register(DeviceLogMonthly)
admin.site.register(RoomLog1Min)
admin.site.register(RoomLogDaily)
admin.site.register(RoomLogMonthly)
admin.site.register(EnergyGeneration1Min)
admin.site.register(EnergyGenerationDaily)
admin.site.register(EnergyGenerationMonthly)
admin.site.register(UserProfile, UserProfileAdmin)