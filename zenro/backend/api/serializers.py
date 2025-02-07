from rest_framework import serializers
from django.db import models
from django.utils import timezone
from datetime import timedelta
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

class DeviceLog5SecSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceLog5Sec
        fields = '__all__'

    def get_energy_usage(self, obj, start_time, end_time):
        """Fetch total energy usage for a given time range."""
        logs = DeviceLog5Sec.objects.filter(
            device=obj, created_at__gte=start_time, created_at__lte=end_time
        )
        return logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0

    def get_past_24_hours_usage(self, obj, end_time=None):
        """Get energy usage for the past 24 hours from a specified end_time (defaults to now)."""
        if end_time is None:
            end_time = timezone.now()
        start_time = end_time - timedelta(hours=24)
        return self.get_energy_usage(obj, start_time, end_time)

    def get_yesterday_usage(self, obj):
        """Get energy usage for yesterday (00:00 - 23:59)."""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        return self.get_energy_usage(obj, yesterday, today)

class DeviceLogDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceLogDaily
        fields = '__all__'

class RoomLogDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomLogDaily
        fields = '__all__'

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

class HomeIOControlSerializer(serializers.Serializer):
    address = serializers.IntegerField()
    state = serializers.BooleanField()