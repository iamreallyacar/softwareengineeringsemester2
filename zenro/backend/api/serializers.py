from rest_framework import serializers
from django.contrib.auth.models import User
from .models import User, SmartHome, SupportedDevice, Device

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'date_joined', 'last_login']
        extra_kwargs = {'password': {'write_only': True}}
    
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
    class Meta:
        model = SmartHome
        fields = '__all__'  # Include all fields from the SmartHome model

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
