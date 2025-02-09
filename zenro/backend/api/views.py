from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.db import models, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import (
    User, SmartHome, SupportedDevice, Device, DeviceLog5Sec, 
    DeviceLogDaily, DeviceLogMonthly, RoomLog5Sec, RoomLogDaily, 
    RoomLogMonthly, Room, HomeIORoom
)
from .serializers import (
    UserSerializer, SmartHomeSerializer, SupportedDeviceSerializer, 
    DeviceSerializer, RoomSerializer,
    DeviceLogDailySerializer,
    RoomLogDailySerializer, HomeIOControlSerializer, UnlockRoomSerializer,
    AddDeviceSerializer
)
from .home_io.home_io_services import HomeIOService

class UserViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for User model.
    """
    # Allow any user (including anonymous) to access UserViewSet.
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = UserSerializer

class SmartHomeViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for SmartHome model.    
    - perform_create: saves the creator as the requesting user
    - get_queryset: filters SmartHomes to only show ones the user created or is a member of
    - join: adds requesting user as a member to the SmartHome
    - leave: removes requesting user from SmartHome members
    """
    queryset = SmartHome.objects.all()
    serializer_class = SmartHomeSerializer

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

class SupportedDeviceViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for SupportedDevice model.
    """
    queryset = SupportedDevice.objects.all()
    serializer_class = SupportedDeviceSerializer

# ViewSet for handling Device CRUD operations
class DeviceViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Device model.
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

# ViewSet for handling Room CRUD operations
class RoomViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Room model.
    get_queryset(): 
        Returns filtered queryset of rooms based on user's smart home access.
        Ensures users can only access rooms in smart homes they own or are members of.
        Returns empty queryset on errors or invalid smart_home_id.
    add_device(request, pk=None):
        Adds a new device to the specified room.
        Requires 'supported_device_id' and 'name' in request data.
        Ensures unique device names within the room.
        Returns HTTP 400 if required data is missing or name is duplicate.
    daily_usage(request, pk=None):
        Retrieves the total energy usage for all devices in the room for the current day.
        Aggregates DeviceLogDaily entries for all devices in the room.
        Returns date and total usage in the response.
    weekly_usage(request, pk=None):
        Calculates the total energy usage for the room over the current week.
        Uses RoomLogDaily entries from Monday to Sunday of the current week.
        Returns start date, end date, and total usage in the response.
    """

    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_queryset(self):
        try:
            queryset = super().get_queryset()
            smart_home_id = self.request.query_params.get('smart_home')
            if smart_home_id:
                try:
                    sh_id = int(smart_home_id)
                    user_homes = SmartHome.objects.filter(
                        models.Q(creator=self.request.user) | 
                        models.Q(members=self.request.user)
                    ).values_list('id', flat=True)
                    if sh_id not in user_homes:
                        return queryset.none()
                    queryset = queryset.filter(smart_home_id=sh_id)
                except ValueError:
                    return queryset.none()
            return queryset
        # Error handling
        except Exception as e:
            print(f"Error in get_queryset: {e}")
            return Room.objects.none()

    @action(detail=True, methods=['POST'])
    def add_device(self, request, pk=None):
        """Attach a new Device to this Room."""
        room = self.get_object()
        supported_device_id = request.data.get('supported_device_id')
        device_name = request.data.get('name')

        if not (supported_device_id and device_name):
            return Response({'error': 'Missing supported_device_id or device name.'},
                            status=status.HTTP_400_BAD_REQUEST)
        # 2) Handle potential DoesNotExist error
        supported_device = get_object_or_404(SupportedDevice, pk=supported_device_id)
        try:
            Device.objects.create(
                name=device_name,
                room=room,
                supported_device=supported_device
            )
        except IntegrityError:
            return Response({'error': 'Device name must be unique within this room.'},
                            status=status.HTTP_400_BAD_REQUEST)
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

    @action(detail=True, methods=['GET'])
    def weekly_usage(self, request, pk=None):
        """Get the weekly usage for this room."""
        room = self.get_object()
        from django.utils import timezone
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        logs = RoomLogDaily.objects.filter(room=room, date__range=[start_of_week, end_of_week])
        total_usage = logs.aggregate(models.Sum('total_energy_usage'))['total_energy_usage__sum'] or 0
        return Response({'start_of_week': str(start_of_week), 'end_of_week': str(end_of_week), 'usage': total_usage})

class DeviceLogDailyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles read-only operations for DeviceLogDaily model.
    """
    queryset = DeviceLogDaily.objects.all()
    serializer_class = DeviceLogDailySerializer

class RoomLogDailyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles read-only operations for RoomLogDaily model.
    """
    queryset = RoomLogDaily.objects.all()
    serializer_class = RoomLogDailySerializer

class HomeIOControlView(APIView):
    """
    Handles HomeIO control operations.
    """
    def post(self, request):
        serializer = HomeIOControlSerializer(data=request.data)
        if serializer.is_valid():
            address = serializer.validated_data['address']
            state = serializer.validated_data['state']
            service = HomeIOService()
            service.set_device_state(address, state)
            return Response({'status': 'updated'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UnlockRoomView(APIView):
    """
    Unlock a "next" HomeIORoom in fixed layout, linking it to the user's SmartHome.
    """
    def post(self, request):
        serializer = UnlockRoomSerializer(data=request.data)
        if serializer.is_valid():
            smart_home_id = serializer.validated_data['smart_home_id']
            home_io_room_id = serializer.validated_data['home_io_room_id']
            smart_home = get_object_or_404(SmartHome, pk=smart_home_id)
            fixed_room = get_object_or_404(HomeIORoom, pk=home_io_room_id)

            # Check if already unlocked
            if Room.objects.filter(smart_home=smart_home, home_io_room=fixed_room).exists():
                return Response({"detail": "Room already unlocked"}, status=status.HTTP_400_BAD_REQUEST)

            # Instead of directly using home_io_room_id, define logic to retrieve the next locked room
            # or verify that home_io_room_id is indeed the one with the lowest unlock_order still locked.
            next_locked_room = HomeIORoom.objects.filter(room__isnull=True).order_by('unlock_order').first()
            if not next_locked_room or next_locked_room.id != home_io_room_id:
                return Response({"detail": "Invalid unlock order."}, status=status.HTTP_400_BAD_REQUEST)

            # Create "unlocked" room
            new_room = Room.objects.create(
                name=fixed_room.name, smart_home=smart_home, home_io_room=fixed_room, is_unlocked=True
            )
            return Response({"detail": "Room unlocked", "room_id": new_room.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddDeviceView(APIView):
    """
    Handles adding a new device to a room.
    """
    def post(self, request):
        serializer = AddDeviceSerializer(data=request.data)
        if serializer.is_valid():
            room_id = serializer.validated_data['room_id']
            supported_device_id = serializer.validated_data['supported_device_id']

            room = get_object_or_404(Room, pk=room_id)
            supported_device = get_object_or_404(SupportedDevice, pk=supported_device_id)

            if supported_device.home_io_room != room.home_io_room:
                return Response({"detail": "Device is not in the correct room."}, status=status.HTTP_400_BAD_REQUEST)

            # Then check that the selected device is still “locked” in that HomeIORoom
            if Device.objects.filter(room=room, supported_device=supported_device).exists():
                return Response({"detail": "Device already unlocked in this room."}, status=status.HTTP_400_BAD_REQUEST)

            device = Device.objects.create(
                room=room,
                supported_device=supported_device,
                status=False
            )

            # Use HomeIOService to set the device state (if needed)
            home_io = HomeIOService()
            home_io.set_device_state(supported_device.address, True)  # Example: set to 'True' = unlocked/active

            return Response({"detail": "Device unlocked", "device_id": device.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

