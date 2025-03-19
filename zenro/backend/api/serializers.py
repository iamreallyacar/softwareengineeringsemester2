from rest_framework import serializers
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import (
    User, SmartHome, SupportedDevice, Device, Room, DeviceLog1Min, 
    DeviceLogDaily, DeviceLogMonthly, RoomLog1Min, RoomLogDaily, 
    RoomLogMonthly, HomeIORoom, EnergyGeneration1Min, EnergyGenerationDaily, 
    EnergyGenerationMonthly, UserProfile
)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'date_of_birth', 'gender', 'phone_number']
        read_only_fields = ['user']

# Enhanced UserSerializer to handle nested profile updates
class UserSerializer(serializers.ModelSerializer):
    # Make profile data writable
    profile = UserProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile', 'first_name', 'last_name', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True},
            'date_joined': {'read_only': True},
            'last_login': {'read_only': True}
        }
    
    def create(self, validated_data):
        # Extract profile data if present
        profile_data = validated_data.pop('profile', None)
        
        # Create the user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # If profile data was provided, ensure profile exists and update it
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=user)
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()
            
        return user

    def update(self, instance, validated_data):
        # Extract and handle profile data if present
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        
        # Update password if provided
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update profile if data was provided
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance

# Enhanced SmartHomeSerializer to validate members
class SmartHomeSerializer(serializers.ModelSerializer):
    is_creator = serializers.SerializerMethodField()
    creator_name = serializers.ReadOnlyField(source='creator.username')
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SmartHome
        fields = ['id', 'name', 'creator', 'creator_name', 'members', 'created_at', 
                  'updated_at', 'is_creator', 'member_count', 'join_password']
        read_only_fields = ['creator', 'created_at', 'updated_at']
        extra_kwargs = {
            'join_password': {'write_only': True}  # Password should not be visible in responses
        }
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.creator

    def get_member_count(self, obj):
        return obj.members.count()

    def validate_members(self, value):
        """
        Check that the creator is not in the members list
        """
        request = self.context.get('request')
        
        # For create operations, the creator will be the current user
        if self.instance is None and request:
            creator = request.user
            if creator in value:
                raise serializers.ValidationError("The creator cannot be added as a member")
        
        # For update operations, check against the existing creator
        elif self.instance:
            creator = self.instance.creator
            if creator in value:
                raise serializers.ValidationError("The creator cannot be added as a member")
                
        return value
        
    def create(self, validated_data):
        # Ensure members doesn't contain the creator
        if 'members' in validated_data:
            members = validated_data.get('members', [])
            creator = self.context['request'].user
            if creator in members:
                members.remove(creator)
            
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

# Replace DeviceLog5SecSerializer with DeviceLog1MinSerializer
class DeviceLog1MinSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceLog1Min
        fields = '__all__'

class DeviceLogDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceLogDaily
        fields = '__all__'

class DeviceLogMonthlySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceLogMonthly
        fields = '__all__'

class RoomLogDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomLogDaily
        fields = '__all__'

class RoomLogMonthlySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomLogMonthly
        fields = '__all__'

# Fix the RoomSerializer to use RoomLog1Min
class RoomSerializer(serializers.ModelSerializer):
    devices = DeviceSerializer(many=True, read_only=True)
    daily_usage = serializers.SerializerMethodField()
    home_io_room_name = serializers.CharField(source='home_io_room.name', read_only=True)
    smart_home_name = serializers.CharField(source='smart_home.name', read_only=True)  # Add this line

    class Meta:
        model = Room
        fields = ['id', 'name', 'smart_home', 'smart_home_name', 'devices', 'daily_usage', 
                 'is_unlocked', 'home_io_room', 'home_io_room_name']

    def get_daily_usage(self, obj):
        today = timezone.now().date()
        logs = RoomLog1Min.objects.filter(room=obj, created_at__date=today)
        total_usage = logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
        return total_usage

# Add RoomLog1MinSerializer which was missing
class RoomLog1MinSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomLog1Min
        fields = '__all__'

class HomeIORoomSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    
    class Meta:
        model = HomeIORoom
        fields = ['id', 'name', 'zone', 'unlock_order', 'is_unlocked']
    
    def get_is_unlocked(self, obj):
        # Check if this HomeIORoom is linked to any Room
        return Room.objects.filter(home_io_room=obj).exists()

class HomeIOControlSerializer(serializers.Serializer):
    address = serializers.IntegerField()
    state = serializers.BooleanField()

class UnlockRoomSerializer(serializers.Serializer):
    smart_home_id = serializers.IntegerField()
    home_io_room_id = serializers.IntegerField()

class AddDeviceSerializer(serializers.Serializer):
    room_id = serializers.IntegerField()
    supported_device_id = serializers.IntegerField()

# Add EnergyGeneration serializers
class EnergyGeneration1MinSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyGeneration1Min
        fields = '__all__'

class EnergyGenerationDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyGenerationDaily
        fields = '__all__'

class EnergyGenerationMonthlySerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyGenerationMonthly
        fields = '__all__'

# Add specific serializer for device control
class DeviceControlSerializer(serializers.Serializer):
    status = serializers.BooleanField(required=False)
    analogue_value = serializers.IntegerField(
        required=False,
        min_value=0,
        max_value=10
    )
    
    def validate(self, data):
        """
        Check that at least one of status or analogue_value is provided
        """
        if not data:
            raise serializers.ValidationError(
                "Either status or analogue_value must be provided"
            )
        return data

class JoinHomeSerializer(serializers.Serializer):
    join_password = serializers.CharField(required=True)

class SmartHomeListSerializer(SmartHomeSerializer):
    class Meta(SmartHomeSerializer.Meta):
        extra_kwargs = {
            'join_password': {'write_only': True}
        }