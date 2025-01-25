from django.http import HttpResponse
from rest_framework import viewsets
from .models import User, SmartHome, SupportedDevice, Device, DeviceLog5Sec, DeviceLogDaily, DeviceLogMonthly, RoomLog5Sec, RoomLogDaily, RoomLogMonthly, Room
from .serializers import UserSerializer, SmartHomeSerializer, SupportedDeviceSerializer, DeviceSerializer, RoomSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.response import Response
from rest_framework import status
from django.db import models, IntegrityError, transaction
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from calendar import monthrange
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import models
from .models import Room, RoomLog5Sec, RoomLogDaily, RoomLogMonthly


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

# ViewSet for handling Room CRUD operations
class RoomViewSet(viewsets.ModelViewSet):
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

def is_first_day_of_month(date):
    """Check if given date is the first day of the month."""
    return date.day == 1

def aggregate_room_logs():
    """
    Aggregate logs at 00:05 daily.
    1. Always aggregate previous day's 5sec logs to daily
    2. On first day of month, also aggregate previous month's daily logs to monthly
    """
    try:
        with transaction.atomic():
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)

            # Step 1: Aggregate RoomLog5Sec to RoomLogDaily
            rooms = Room.objects.all()
            for room in rooms:
                # Strictly get yesterday's logs only
                daily_logs = RoomLog5Sec.objects.filter(
                    room=room,
                    created_at__date=yesterday
                ).order_by('created_at')
                
                if daily_logs.exists():
                    total_usage = daily_logs.aggregate(
                        models.Sum('energy_usage')
                    )['energy_usage__sum'] or 0
                    
                    RoomLogDaily.objects.update_or_create(
                        room=room,
                        date=yesterday,
                        defaults={'total_energy_usage': total_usage}
                    )

            # Step 2: If today is first of month, aggregate previous month's daily logs
            if is_first_day_of_month(today):
                first_of_prev_month = yesterday.replace(day=1)
                
                for room in rooms:
                    monthly_logs = RoomLogDaily.objects.filter(
                        room=room,
                        date__gte=first_of_prev_month,
                        date__lte=yesterday
                    ).order_by('date')
                    
                    if monthly_logs.exists():
                        total_usage = monthly_logs.aggregate(
                            models.Sum('total_energy_usage')
                        )['total_energy_usage__sum'] or 0
                        
                        RoomLogMonthly.objects.update_or_create(
                            room=room,
                            month=yesterday.month,
                            year=yesterday.year,
                            defaults={'total_energy_usage': total_usage}
                        )

    except Exception as e:
        print(f"Error in aggregate_room_logs: {e}")
        raise

def calculate_device_metrics(logs):
    """Calculate device metrics from 5-second logs."""
    # Overall metrics
    total_usage = logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
    avg_usage_per_second = total_usage / (24 * 60 * 60)  # per second for whole day
    
    # Uptime metrics
    uptime_logs = logs.filter(status=True)
    uptime_count = uptime_logs.count()
    uptime_seconds = uptime_count * 5
    uptime_usage = uptime_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
    avg_uptime_usage = uptime_usage / uptime_seconds if uptime_seconds > 0 else 0
    
    # Downtime metrics
    downtime_logs = logs.filter(status=False)
    downtime_count = downtime_logs.count()
    downtime_seconds = downtime_count * 5
    downtime_usage = downtime_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
    avg_downtime_usage = downtime_usage / downtime_seconds if downtime_seconds > 0 else 0
    
    return {
        'total_usage': total_usage,
        'avg_usage_per_second': avg_usage_per_second,
        'uptime': {
            'duration': uptime_seconds,
            'total_usage': uptime_usage,
            'avg_usage_per_second': avg_uptime_usage
        },
        'downtime': {
            'duration': downtime_seconds,
            'total_usage': downtime_usage,
            'avg_usage_per_second': avg_downtime_usage
        },
        'logs': [
            {
                'timestamp': log.created_at.isoformat(),
                'status': log.status,
                'energy_usage': log.energy_usage
            } for log in logs
        ]
    }

def calculate_monthly_metrics(daily_logs):
    """Calculate monthly metrics from daily logs."""
    total_days = daily_logs.count()
    if total_days == 0:
        return {}
        
    total_usage = 0
    total_uptime_usage = 0
    total_downtime_usage = 0
    daily_summaries = {}
    
    for log in daily_logs:
        details = log.status_usage_details
        total_usage += log.total_energy_usage
        total_uptime_usage += details.get('uptime', {}).get('total_usage', 0)
        total_downtime_usage += details.get('downtime', {}).get('total_usage', 0)
        
        daily_summaries[str(log.date)] = {
            'total_usage': log.total_energy_usage,
            'uptime': details.get('uptime', {}),
            'downtime': details.get('downtime', {})
        }
    
    return {
        'daily_summaries': daily_summaries,
        'monthly_totals': {
            'total_usage': total_usage,
            'uptime_usage': total_uptime_usage,
            'downtime_usage': total_downtime_usage
        },
        'monthly_averages': {
            'avg_daily_usage': total_usage / total_days,
            'avg_daily_uptime_usage': total_uptime_usage / total_days,
            'avg_daily_downtime_usage': total_downtime_usage / total_days
        }
    }

def aggregate_device_logs():
    """
    Aggregate device logs at 00:05 daily.
    1. Aggregate previous day's 5sec logs to daily with detailed status metrics
    2. On first day of month, aggregate previous month's daily logs to monthly
    """
    try:
        with transaction.atomic():
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)

            # Step 1: Aggregate DeviceLog5Sec to DeviceLogDaily
            devices = Device.objects.all()
            for device in devices:
                # Get yesterday's logs
                daily_logs = DeviceLog5Sec.objects.filter(
                    device=device,
                    created_at__date=yesterday
                ).order_by('created_at')
                
                if daily_logs.exists():
                    metrics = calculate_device_metrics(daily_logs)
                    
                    DeviceLogDaily.objects.update_or_create(
                        device=device,
                        date=yesterday,
                        defaults={
                            'total_energy_usage': metrics['total_usage'],
                            'status_usage_details': metrics
                        }
                    )

            # Step 2: If first of month, aggregate to monthly
            if is_first_day_of_month(today):
                first_of_prev_month = yesterday.replace(day=1)
                
                for device in devices:
                    monthly_logs = DeviceLogDaily.objects.filter(
                        device=device,
                        date__gte=first_of_prev_month,
                        date__lte=yesterday
                    ).order_by('date')
                    
                    if monthly_logs.exists():
                        monthly_metrics = calculate_monthly_metrics(monthly_logs)
                        
                        DeviceLogMonthly.objects.update_or_create(
                            device=device,
                            month=yesterday.month,
                            year=yesterday.year,
                            defaults={
                                'total_energy_usage': monthly_metrics['monthly_totals']['total_usage'],
                                'daily_summaries': monthly_metrics
                            }
                        )

    except Exception as e:
        print(f"Error in aggregate_device_logs: {e}")
        raise

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

