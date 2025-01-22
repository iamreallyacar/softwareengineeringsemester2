from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models  # Add this import
from .models import User, SmartHome, SupportedDevice, Device, Room, DeviceLog5Sec, DeviceLogDaily, DeviceLogMonthly, RoomLog5Sec, RoomLogDaily, RoomLogMonthly

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    # The password field is write-only to prevent it from being exposed.
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True}
        }
    
    def create(self, validated_data):
        # Create a new user with the provided validated data
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

    def update(self, instance, validated_data):
        # Update the user instance with the provided validated data
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        password = validated_data.get('password', None)
        if password:
            # If a new password is provided, set it for the user instance
            instance.set_password(password)
        instance.save()
        return instance

# Serializer for the SmartHome model
class SmartHomeSerializer(serializers.ModelSerializer):
    is_creator = serializers.SerializerMethodField()
    
    class Meta:
        model = SmartHome
        fields = ['id', 'name', 'creator', 'members', 'created_at', 'is_creator']
        read_only_fields = ['creator']
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.creator

    def create(self, validated_data):
        # Set creator to current user
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)

# Serializer for the SupportedDevice model
class SupportedDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportedDevice
        fields = '__all__'  # Include all fields from the SupportedDevice model

# Serializer for the Device model
class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'  # Include all fields from the Device model
    
    def create(self, validated_data):
        # Removed the old 'smart_home' assignment
        return super().create(validated_data)

    # Returns energy usage from a specified time to a specified time
    def get_from_to_time(self, obj, start_time, end_time):
        # Filter DeviceLog5Sec entries for this device from start_time to end_time
        logs = DeviceLog5Sec.objects.filter(device=obj, created_at__gte=start_time, created_at__lte=end_time)
        total_usage = logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
        return total_usage
    
    # Returns energy usage for the past 24 hours from a specified time
    def get_24_hours_from_specified_time(self, obj, end_time=None):
        from django.utils import timezone
        from datetime import timedelta

        # Use the provided end_time or default to the current time
        if end_time is None:
            end_time = timezone.now()

        # Calculate the time 24 hours ago from end_time
        past_24_hours = end_time - timedelta(hours=24)

        # Use the get_from_to_time method to get the total usage
        total_usage = self.get_from_to_time(obj, past_24_hours, end_time)
        return total_usage

    def get_past_24_hours_usage(self, obj):
        return self.get_24_hours_from_specified_time(obj)
    
    def get_yesterday_usage(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        yesterday = today - timezone.timedelta(days=1)
        return self.get_24_hours_from_specified_time(obj, end_time=yesterday)


# Serializer for the Room model
class RoomSerializer(serializers.ModelSerializer):
    devices = DeviceSerializer(many=True, read_only=True)
    daily_usage = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'smart_home', 'devices', 'daily_usage']

    def get_daily_usage(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        # Sum all RoomLog5Sec entries for this room for 'today'
        logs = RoomLog5Sec.objects.filter(room=obj, created_at__date=today)
        total_usage = logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
        return total_usage
