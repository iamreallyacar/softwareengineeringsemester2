from django.http import HttpResponse
from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import User, SmartHome, SupportedDevice, Device, DeviceLog5Sec, DeviceLogDaily, DeviceLogMonthly, RoomLog5Sec, RoomLogDaily, RoomLogMonthly, Room
from .serializers import UserSerializer, SmartHomeSerializer, SupportedDeviceSerializer, DeviceSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

# ViewSet for handling User CRUD operations
class UserViewSet(viewsets.ModelViewSet):
    # Allow any user (including anonymous) to access UserViewSet.
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = UserSerializer

# ViewSet for handling SmartHome CRUD operations
class SmartHomeViewSet(viewsets.ModelViewSet):
    serializer_class = SmartHomeSerializer
    queryset = SmartHome.objects.all()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def get_queryset(self):
        user = self.request.user
        return SmartHome.objects.filter(
            models.Q(creator=user) | models.Q(members=user)
        ).distinct()

    @action(detail=True, methods=['POST'])
    def join(self, request, pk=None):
        smart_home = self.get_object()
        smart_home.members.add(request.user)
        return Response({'status': 'joined'})

    @action(detail=True, methods=['POST'])
    def leave(self, request, pk=None):
        smart_home = self.get_object()
        smart_home.members.remove(request.user)
        return Response({'status': 'left'})

# ViewSet for handling SupportedDevice CRUD operations
class SupportedDeviceViewSet(viewsets.ModelViewSet):
    queryset = SupportedDevice.objects.all()
    serializer_class = SupportedDeviceSerializer

# ViewSet for handling Device CRUD operations
class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    # ...existing code if you need a serializer class...

    @action(detail=True, methods=['POST'])
    def add_device(self, request, pk=None):
        """Attach a new Device to this Room."""
        room = self.get_object()
        supported_device_id = request.data.get('supported_device_id')
        device_name = request.data.get('name')
        # ...existing code for validation...
        supported_device = SupportedDevice.objects.get(pk=supported_device_id)
        Device.objects.create(
            name=device_name,
            room=room,
            supported_device=supported_device
        )
        return Response({'status': 'device_added'})

    @action(detail=True, methods=['GET'])
    def daily_usage(self, request, pk=None):
        """Get the daily usage for this room."""
        room = self.get_object()
        # Summation of DeviceLogDaily for all devices in the room (today)
        from django.utils import timezone
        today = timezone.now().date()
        devices = room.devices.all()
        total_usage = DeviceLogDaily.objects.filter(
            device__in=devices, date=today
        ).aggregate(models.Sum('total_energy_usage'))['total_energy_usage__sum'] or 0
        return Response({'date': str(today), 'usage': total_usage})

def aggregate_logs():
    """
    Example logic to move data from DeviceLog5Sec to DeviceLogDaily,
    then from DeviceLogDaily to DeviceLogMonthly (and similarly for Room logs).
    This can be called via a cron or Celery worker.
    """
    # ...existing code or aggregator logic...
    pass

# Home view to handle the root URL
def home(request):
    return HttpResponse("Welcome to the Smart Home API")

@api_view(['POST'])
@authentication_classes([])  # No authentication required
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user without requiring authentication"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'username': user.username,
            'email': user.email,
            'id': user.id
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

