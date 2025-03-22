from django.http import HttpResponse
from rest_framework import viewsets, status, permissions
import datetime
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.db import models, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import (
    User, SmartHome, SupportedDevice, Device,  
    DeviceLogDaily, DeviceLogMonthly, RoomLogDaily, 
    RoomLogMonthly, Room, HomeIORoom, RoomLog1Min, DeviceLog1Min,
    EnergyGeneration1Min, EnergyGenerationDaily, EnergyGenerationMonthly,
    UserProfile
)
from .serializers import (
    DeviceLogMonthlySerializer, UserSerializer, SmartHomeSerializer, SupportedDeviceSerializer, 
    DeviceSerializer, RoomSerializer, DeviceLogDailySerializer, RoomLogDailySerializer, 
    HomeIOControlSerializer, UnlockRoomSerializer, AddDeviceSerializer, DeviceLog1MinSerializer, 
    RoomLog1MinSerializer, HomeIORoomSerializer, RoomLogMonthlySerializer, 
    EnergyGeneration1MinSerializer, EnergyGenerationDailySerializer, 
    EnergyGenerationMonthlySerializer, DeviceControlSerializer,
    UserProfileSerializer, SmartHomeListSerializer, JoinHomeSerializer
)
from .home_io.home_io_services import HomeIOService
from django_filters import rest_framework as filters
from rest_framework import viewsets, status, permissions, filters as drf_filters
from django.contrib.auth.hashers import check_password

class UserViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for User model including their profile.
    """
    permission_classes = [AllowAny]  # Consider restricting this in production
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    
    # No need to override create since the serializer now handles profile creation
    
    @action(detail=True, methods=['GET', 'PUT', 'PATCH'])
    def profile(self, request, pk=None):
        """
        Get or update the user's profile directly.
        This provides a convenient endpoint for updating just the profile.
        """
        user = self.get_object()
        
        if request.method == 'GET':
            serializer = UserProfileSerializer(user.profile)
            return Response(serializer.data)
            
        if hasattr(user, 'profile'):
            serializer = UserProfileSerializer(user.profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {"detail": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        user = self.get_object()
        
        # Check if the current user is the same as the requested user
        if request.user.id != user.id:
            return Response(
                {"detail": "You don't have permission to change this password."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if current password is correct
        current_password = request.data.get('current_password')
        if not check_password(current_password, user.password):
            return Response(
                {"current_password": ["Current password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        new_password = request.data.get('new_password')
        if not new_password:
            return Response(
                {"new_password": ["New password is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({"detail": "Password changed successfully."})

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

    def get_serializer_class(self):
        """Use a different serializer for list views to protect the join password"""
        if self.action == 'list':
            return SmartHomeListSerializer  # We'll create this below
        return self.serializer_class

    @action(detail=True, methods=['POST'])
    def join(self, request, pk=None):
        """
        Allow a user to join a smart home if they provide the correct password
        """
        smart_home = self.get_object()
        
        # Prevent creator from joining as a member
        if request.user == smart_home.creator:
            return Response(
                {"error": "You cannot join your own smart home"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a member
        if request.user in smart_home.members.all():
            return Response(
                {"error": "You are already a member of this smart home"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the proper serializer to validate the input
        serializer = JoinHomeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the password from the validated data
        provided_password = serializer.validated_data['join_password']
        
        # Verify the password
        if provided_password != smart_home.join_password:
            return Response(
                {"error": "Incorrect join password"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add the user to the members list
        smart_home.members.add(request.user)
        
        # Return success response
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['POST'])
    def leave(self, request, pk=None):
        smart_home = self.get_object()
        smart_home.members.remove(request.user)
        return Response({'status': 'left'})

    @action(detail=False, methods=['GET'])
    def available(self, request):
        """Return smart homes created by other users that the current user hasn't joined"""
        user = request.user
        
        # Get homes where user is not creator and not a member
        available_homes = SmartHome.objects.exclude(
            models.Q(creator=user) | models.Q(members=user)
        )
        
        serializer = self.get_serializer(available_homes, many=True)
        return Response(serializer.data)

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

class DeviceLog1MinViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying device energy usage logs at 1-minute intervals.
    Provides energy usage data recorded for each device.
    
    Query parameters:
    - device: Filter by device ID
    - start_date: Filter by start date (YYYY-MM-DD)
    - end_date: Filter by end date (YYYY-MM-DD)
    """
    serializer_class = DeviceLog1MinSerializer
    
    def get_queryset(self):
        queryset = DeviceLog1Min.objects.all().order_by('-created_at')
        
        # Filter by device if specified
        device_id = self.request.query_params.get('device')
        if device_id:
            queryset = queryset.filter(device_id=device_id)
            
        # Filter by date range if specified
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
                
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        # Limit results to prevent performance issues
        return queryset[:1000]  # Limit to 1000 most recent records

class RoomLog1MinViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying room energy usage logs at 1-minute intervals.
    Provides aggregated energy usage data for each room.
    
    Query parameters:
    - room: Filter by room ID
    - start_date: Filter by start date (YYYY-MM-DD)
    - end_date: Filter by end date (YYYY-MM-DD)
    """
    serializer_class = RoomLog1MinSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['room', 'created_at']
    
    def get_queryset(self):
        queryset = RoomLog1Min.objects.all()
        room_id = self.request.query_params.get('room')
        date_str = self.request.query_params.get('date')
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        if date_str:
            date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            next_day = date + datetime.timedelta(days=1)
            queryset = queryset.filter(
                created_at__gte=datetime.datetime.combine(date, datetime.time.min),
                created_at__lt=datetime.datetime.combine(next_day, datetime.time.min)
            )
            
        return queryset

class DeviceLogMonthlyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying device monthly energy usage logs.
    """
    queryset = DeviceLogMonthly.objects.all()
    serializer_class = DeviceLogMonthlySerializer
    
    def get_queryset(self):
        queryset = DeviceLogMonthly.objects.all()
        
        # Filter by device if specified
        device_id = self.request.query_params.get('device')
        if device_id:
            queryset = queryset.filter(device_id=device_id)
            
        # Filter by year/month if specified
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
                
        month = self.request.query_params.get('month')
        if month:
            queryset = queryset.filter(month=month)
            
        return queryset

class RoomLogMonthlyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying room monthly energy usage logs.
    """
    queryset = RoomLogMonthly.objects.all()
    serializer_class = RoomLogMonthlySerializer
    
    def get_queryset(self):
        queryset = RoomLogMonthly.objects.all()
        
        # Filter by room if specified
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
            
        # Filter by year/month if specified
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
                
        month = self.request.query_params.get('month')
        if month:
            queryset = queryset.filter(month=month)
            
        return queryset

class HomeIORoomViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying available HomeIO room layouts.
    """
    queryset = HomeIORoom.objects.all().order_by('unlock_order')
    serializer_class = HomeIORoomSerializer
    permission_classes = [AllowAny]  # Allow frontend to view room layouts without auth

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
        # Return the complete user object including profile
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def dashboard_summary(request):
    """
    Provides a summary of energy usage data for the dashboard.
    
    Returns:
        - today_usage: Total energy usage across all rooms for today
        - yesterday_usage: Total energy usage across all rooms for yesterday
        - room_summary: Per-room breakdown of today's energy usage
        - device_summary: Top energy-consuming devices today
    """
    try:
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Get today's room logs
        today_logs = RoomLog1Min.objects.filter(created_at__date=today)
        today_usage = today_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
        
        # Get yesterday's usage
        yesterday_logs = RoomLogDaily.objects.filter(date=yesterday)
        yesterday_usage = yesterday_logs.aggregate(models.Sum('total_energy_usage'))['total_energy_usage__sum'] or 0
        
        # Room-by-room breakdown
        rooms = Room.objects.all()
        room_summary = []
        for room in rooms:
            room_logs = RoomLog1Min.objects.filter(room=room, created_at__date=today)
            room_usage = room_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
            if room_usage > 0:  # Only include rooms with usage
                room_summary.append({
                    'id': room.id,
                    'name': room.name,
                    'usage': room_usage
                })
        
        # Get top energy-consuming devices
        device_summary = []
        today_device_logs = DeviceLog1Min.objects.filter(created_at__date=today)
        if today_device_logs.exists():
            # Group by device and sum usage
            top_devices = today_device_logs.values('device', 'device__name')\
                .annotate(total=models.Sum('energy_usage'))\
                .order_by('-total')[:5]  # Top 5 devices
                
            for device in top_devices:
                device_summary.append({
                    'id': device['device'],
                    'name': device['device__name'],
                    'usage': device['total']
                })
        
        return Response({
            'today_usage': today_usage,
            'yesterday_usage': yesterday_usage,
            'room_summary': room_summary,
            'device_summary': device_summary
        })
        
    except Exception as e:
        print(f"Error in dashboard_summary: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add this new class to views.py

class DeviceControlView(APIView):
    """
    API endpoint to directly control devices.
    
    POST /api/devices/{id}/control/ - Controls a device's status or analogue value
    
    Request Body:
    - status (boolean, optional): Turn device on/off
    - analogue_value (integer, optional): Set device's intensity (0-10)
    
    Either status or analogue_value must be provided.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        device = get_object_or_404(Device, pk=pk)
        
        # Check if user has access to the device's smart home
        smart_home = device.room.smart_home
        if not SmartHome.objects.filter(
            models.Q(creator=request.user) | models.Q(members=request.user),
            id=smart_home.id
        ).exists():
            return Response(
                {"error": "You don't have permission to control this device"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = DeviceControlSerializer(data=request.data)
        if serializer.is_valid():
            status_value = serializer.validated_data.get('status')
            analogue_value = serializer.validated_data.get('analogue_value')
            
            # Update device properties
            if status_value is not None:
                device.status = status_value
            
            if analogue_value is not None:
                device.analogue_value = analogue_value
                
            device.save()  # This will trigger the pre_save signal
            
            # Return the updated device
            return Response(
                DeviceSerializer(device).data, 
                status=status.HTTP_200_OK
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EnergyGeneration1MinViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying energy generation data at 1-minute intervals.
    """
    serializer_class = EnergyGeneration1MinSerializer
    
    def get_queryset(self):
        queryset = EnergyGeneration1Min.objects.all().order_by('-created_at')
        
        # Filter by home if specified
        home_id = self.request.query_params.get('home')
        if home_id:
            queryset = queryset.filter(home_id=home_id)
            
        # Filter by date range if specified
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
                
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        # Limit results to prevent performance issues
        return queryset[:1000]  # Limit to 1000 most recent records

class EnergyGenerationDailyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying daily energy generation data.
    """
    serializer_class = EnergyGenerationDailySerializer
    
    def get_queryset(self):
        queryset = EnergyGenerationDaily.objects.all().order_by('-date')
        
        # Filter by home if specified
        home_id = self.request.query_params.get('home')
        if home_id:
            queryset = queryset.filter(home_id=home_id)
            
        # Filter by date range if specified
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
                
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        return queryset

class EnergyGenerationMonthlyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for querying monthly energy generation data.
    """
    serializer_class = EnergyGenerationMonthlySerializer
    
    def get_queryset(self):
        queryset = EnergyGenerationMonthly.objects.all()
        
        # Filter by home if specified
        home_id = self.request.query_params.get('home')
        if home_id:
            queryset = queryset.filter(home_id=home_id)
            
        # Filter by year/month if specified
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
                
        month = self.request.query_params.get('month')
        if month:
            queryset = queryset.filter(month=month)
            
        return queryset

@api_view(['GET'])
def energy_summary(request):
    """
    Provides a summary of energy generation and consumption data.
    
    Returns:
        - generation_today: Total energy generated today
        - consumption_today: Total energy consumed today
        - net_energy: Net energy (generation - consumption)
        - comparison: Percentage change from yesterday
    """
    try:
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Get home ID from query params
        home_id = request.query_params.get('home')
        if not home_id:
            # If no home specified, use the first one
            home = SmartHome.objects.first()
            if not home:
                return Response({'error': 'No smart homes found'}, status=status.HTTP_404_NOT_FOUND)
            home_id = home.id
            
        # Today's generation
        today_gen = EnergyGeneration1Min.objects.filter(
            home_id=home_id,
            created_at__date=today
        )
        generation_today = today_gen.aggregate(models.Sum('energy_generation'))['energy_generation__sum'] or 0
        
        # Today's consumption (from all rooms in the home)
        rooms = Room.objects.filter(smart_home_id=home_id)
        room_ids = rooms.values_list('id', flat=True)
        today_consumption = RoomLog1Min.objects.filter(
            room_id__in=room_ids,
            created_at__date=today
        ).aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
        
        # Yesterday's net energy
        yesterday_gen = EnergyGenerationDaily.objects.filter(
            home_id=home_id, 
            date=yesterday
        ).aggregate(models.Sum('total_energy_generation'))['total_energy_generation__sum'] or 0
        
        yesterday_consumption = RoomLogDaily.objects.filter(
            room__smart_home_id=home_id,
            date=yesterday
        ).aggregate(models.Sum('total_energy_usage'))['total_energy_usage__sum'] or 0
        
        # Calculate net energy and comparison
        net_today = generation_today - today_consumption
        net_yesterday = yesterday_gen - yesterday_consumption
        
        # Calculate percentage change
        comparison = 0
        if net_yesterday != 0:
            comparison = ((net_today - net_yesterday) / abs(net_yesterday)) * 100
            
        return Response({
            'generation_today': generation_today,
            'consumption_today': today_consumption,
            'net_energy': net_today,
            'yesterday_net': net_yesterday,
            'comparison': round(comparison, 2)
        })
        
    except Exception as e:
        print(f"Error in energy_summary: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def dashboard_summary(request):
    """
    Provides a summary of energy usage and generation data for the dashboard.
    
    GET /api/dashboard/?home={id} - Get energy summary for a specific home
    
    Returns:
        - today_usage: Total energy usage across all rooms for today
        - yesterday_usage: Total energy usage across all rooms for yesterday
        - room_summary: Per-room breakdown of today's energy usage
        - device_summary: Top energy-consuming devices today
        - energy_generation: Energy generation data including net usage
    """
    try:
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Get home ID from query params or use first home
        home_id = request.query_params.get('home')
        home = None
        
        if home_id:
            home = get_object_or_404(SmartHome, pk=home_id)
        else:
            # If no home specified, use the first one the user has access to
            if request.user.is_authenticated:
                home = SmartHome.objects.filter(
                    models.Q(creator=request.user) | models.Q(members=request.user)
                ).first()
            
            if not home:
                home = SmartHome.objects.first()
                
            if home:
                home_id = home.id
        
        if not home:
            return Response({'error': 'No smart homes found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Calculate room info only for the selected home
        rooms = Room.objects.filter(smart_home_id=home_id)
        room_ids = rooms.values_list('id', flat=True)
            
        # Get today's room logs
        today_logs = RoomLog1Min.objects.filter(
            room_id__in=room_ids,
            created_at__date=today
        )
        today_usage = today_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
        
        # Get yesterday's usage
        yesterday_logs = RoomLogDaily.objects.filter(
            room_id__in=room_ids,
            date=yesterday
        )
        yesterday_usage = yesterday_logs.aggregate(models.Sum('total_energy_usage'))['total_energy_usage__sum'] or 0
        
        # Room-by-room breakdown
        room_summary = []
        for room in rooms:
            room_logs = RoomLog1Min.objects.filter(room=room, created_at__date=today)
            room_usage = room_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
            if room_usage > 0 or True:  # Include all rooms regardless of usage
                room_summary.append({
                    'id': room.id,
                    'name': room.name,
                    'usage': room_usage
                })
        
        # Get top energy-consuming devices
        device_summary = []
        devices = Device.objects.filter(room__smart_home_id=home_id)
        device_ids = devices.values_list('id', flat=True)
        
        today_device_logs = DeviceLog1Min.objects.filter(
            device_id__in=device_ids,
            created_at__date=today
        )
        if today_device_logs.exists():
            # Group by device and sum usage
            top_devices = today_device_logs.values('device', 'device__name')\
                .annotate(total=models.Sum('energy_usage'))\
                .order_by('-total')[:5]  # Top 5 devices
                
            for device in top_devices:
                device_summary.append({
                    'id': device['device'],
                    'name': device['device__name'],
                    'usage': device['total']
                })
        
        # Add energy generation data
        today_gen = EnergyGeneration1Min.objects.filter(
            home_id=home_id,
            created_at__date=today
        )
        generation_today = today_gen.aggregate(models.Sum('energy_generation'))['energy_generation__sum'] or 0
        
        yesterday_gen = EnergyGenerationDaily.objects.filter(
            home_id=home_id,
            date=yesterday
        ).aggregate(models.Sum('total_energy_generation'))['total_energy_generation__sum'] or 0
        
        return Response({
            'today_usage': today_usage,
            'yesterday_usage': yesterday_usage,
            'room_summary': room_summary,
            'device_summary': device_summary,
            'energy_generation': {
                'today': generation_today,
                'yesterday': yesterday_gen,
                'net_today': generation_today - today_usage
            }
        })
        
    except Exception as e:
        print(f"Error in dashboard_summary: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows user profiles to be viewed or edited.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    
    def get_queryset(self):
        """
        Filter to return only the current user's profile or profiles they have permission to view.
        """
        if self.request.user.is_superuser:
            return UserProfile.objects.all()
        
        # Regular users can only access their own profile
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """
        Associate the profile with the current user when creating.
        """
        serializer.save(user=self.request.user)
        
    def update(self, request, *args, **kwargs):
        """
        Ensure users can only update their own profile unless they're superusers
        """
        profile = self.get_object()
        if profile.user != request.user and not request.user.is_superuser:
            return Response(
                {"detail": "You don't have permission to edit this profile"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
        
    def partial_update(self, request, *args, **kwargs):
        """
        Ensure users can only update their own profile unless they're superusers
        """
        profile = self.get_object()
        if profile.user != request.user and not request.user.is_superuser:
            return Response(
                {"detail": "You don't have permission to edit this profile"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_info(request):
    """
    Endpoint to retrieve current user information including profile data
    """
    user = request.user
    serializer = UserSerializer(user, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_smart_home(request, pk):
    """
    Dedicated endpoint for joining a smart home with password
    """
    try:
        smart_home = get_object_or_404(SmartHome, pk=pk)
        
        # Prevent creator from joining as a member
        if request.user == smart_home.creator:
            return Response(
                {"error": "You cannot join your own smart home"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a member
        if request.user in smart_home.members.all():
            return Response(
                {"error": "You are already a member of this smart home"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the password
        serializer = JoinHomeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        provided_password = serializer.validated_data['join_password']
        
        # Verify the password
        if provided_password != smart_home.join_password:
            return Response(
                {"error": "Incorrect join password"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add the user to the members list
        smart_home.members.add(request.user)
        
        # Return success response
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )