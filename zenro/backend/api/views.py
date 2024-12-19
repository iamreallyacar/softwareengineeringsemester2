from django.http import HttpResponse
from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import User, SmartHome, SupportedDevice, Device
from .serializers import UserSerializer, SmartHomeSerializer, SupportedDeviceSerializer, DeviceSerializer

# ViewSet for handling User CRUD operations
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# ViewSet for handling SmartHome CRUD operations
class SmartHomeViewSet(viewsets.ModelViewSet):
    queryset = SmartHome.objects.all()
    serializer_class = SmartHomeSerializer

# ViewSet for handling SupportedDevice CRUD operations
class SupportedDeviceViewSet(viewsets.ModelViewSet):
    queryset = SupportedDevice.objects.all()
    serializer_class = SupportedDeviceSerializer

# ViewSet for handling Device CRUD operations
class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

# Home view to handle the root URL
def home(request):
    return HttpResponse("Welcome to the Smart Home API")

