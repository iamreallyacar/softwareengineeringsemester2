import random
import time  # Add this import for time.sleep()
from django.db import models, transaction
from django.utils import timezone
from datetime import timedelta  # Remove 'time' from this import
from .models import Room, RoomLog1Min, RoomLogDaily, RoomLogMonthly, Device, DeviceLog1Min, DeviceLogDaily, DeviceLogMonthly, SmartHome, EnergyGeneration1Min, EnergyGenerationDaily, EnergyGenerationMonthly

def is_first_day_of_month(date):
    """Check if given date is the first day of the month."""
    return date.day == 1

"""
# Legacy aggregation code kept as reference
def aggregate_room_logs():
    aggregate_logs(RoomLog1Min, RoomLogDaily, "created_at", "energy_usage", "total_energy_usage")
    aggregate_monthly_logs(RoomLogDaily, RoomLogMonthly, "date", "total_energy_usage", "total_energy_usage")

def aggregate_device_logs():
    aggregate_logs(DeviceLog1Min, DeviceLogDaily, "created_at", "energy_usage", "total_energy_usage")
    aggregate_monthly_logs(DeviceLogDaily, DeviceLogMonthly, "date", "total_energy_usage", "total_energy_usage")

# ...existing code...
"""

def generate_minute_data():
    """
    Generate 1-minute device logs for all unlocked devices.
    Uses a uniform timestamp for all logs created in this batch.
    """
    # Get the current minute timestamp (rounded down to the minute)
    now = timezone.now()
    current_minute = now.replace(second=0, microsecond=0)
    
    homes = SmartHome.objects.all()
    for home in homes:
        energy_gen = random.uniform(0, 0.083)
        EnergyGeneration1Min.objects.create(
            home=home,
            energy_generation=energy_gen,
            created_at=current_minute  # Use the uniform timestamp
        )

    devices = Device.objects.all()
    for device in devices:
        if (device.is_unlocked and device.supported_device.consumption_rate != None and "Analogue" not in device.name):
            if device.status:
                # Calculate energy usage in kWh for 1 minute period
                energy_usage = device.supported_device.consumption_rate * 60 / 3600 / 1000 # in kWh
            else:
                energy_usage = random.uniform(0, 0.00017)
            DeviceLog1Min.objects.create(
                device=device,
                status=device.status,
                energy_usage=energy_usage,
                created_at=current_minute  # Use the uniform timestamp
            )
        else: 
            continue
    
    aggregate_device_to_room_logs(current_minute)  # Pass the timestamp to make aggregation more efficient

def aggregate_energy_generation():
    """
    Aggregates energy generation data into daily and monthly summaries for all Smart Homes.
    This function runs as a scheduled task at 00:05 daily and processes data from the previous day.
    It also creates monthly aggregations at the beginning of each month.
    Process flow:
    1. Waits 30 seconds to ensure all 1-minute logs have been generated
    2. For daily aggregation:
       - Iterates through all Smart Homes
       - Collects all 1-minute energy generation logs from previous day
       - Calculates total generation for each home
       - Creates or updates EnergyGenerationDaily records
    3. For monthly aggregation (only on first day of month):
       - Iterates through all Smart Homes
       - Collects all daily energy logs from the previous month
       - Calculates total generation for the month
       - Creates or updates EnergyGenerationMonthly records
    All database operations are wrapped in a transaction to ensure data integrity.
    Raises:
        Exception: Re-raises any exceptions that occur during processing after logging
    """
    time.sleep(30) # Delay to ensure all 1-minute logs are generated
    
    try:
        with transaction.atomic():
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)

            # Step 1: Iterate over all homes
            # Step 2: Filter and sum all energy generation yesterday
            # Step 3: Save to EnergyGenerationDaily
            homes = SmartHome.objects.all()
            for home in homes:
                daily_logs = EnergyGeneration1Min.objects.filter(
                    home=home,
                    created_at__date=yesterday
                ).order_by('created_at')
                
                if not daily_logs.exists():
                    continue # No logs to aggregate
                else: 
                    total_generation = daily_logs.aggregate(
                        models.Sum('energy_generation')
                    )['energy_generation__sum'] or 0
                    
                    EnergyGenerationDaily.objects.update_or_create(
                        home=home,
                        date=yesterday,
                        defaults={'total_energy_generation': total_generation}
                    )

            # Step 1: Check if today is first of month
            # Step 2: Iterate over all homes
            # Step 3: Filter and sum previous month's daily logs
            # Step 4: Save to EnergyGenerationMonthly
            if is_first_day_of_month(today):
                first_of_prev_month = yesterday.replace(day=1)
                
                for home in homes:
                    monthly_logs = EnergyGenerationDaily.objects.filter(
                        home=home,
                        date__gte=first_of_prev_month,
                        date__lte=yesterday
                    ).order_by('date')
                    
                    if not monthly_logs.exists():
                        continue  # No logs to aggregate
                    else:
                        total_generation = monthly_logs.aggregate(
                            models.Sum('total_energy_generation')
                        )['total_energy_generation__sum'] or 0
                        
                        EnergyGenerationMonthly.objects.update_or_create(
                            home=home,
                            month=yesterday.month,
                            year=yesterday.year,
                            defaults={'total_energy_generation': total_generation}
                        )

    except Exception as e:
        print(f"Error in aggregate_energy_generation: {e}")
        raise
    
def aggregate_room_logs():
    """
    Aggregates daily and monthly logs for all Rooms.
    Runs at 00:05 daily to handle data from the previous day or month.
    
    Process:
    1. For each room, aggregate all 1-minute logs from yesterday into a daily entry
    2. On first day of month, aggregate previous month's daily logs into a monthly entry
    """
    time.sleep(30) # Delay to ensure all 1-minute logs are generated

    try:
        with transaction.atomic():
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)

            # Step 1: Iterate over all rooms
            # Step 2: Filter and sum all energy usage yesterday
            # Step 3: Save to RoomLogDaily
            rooms = Room.objects.all()
            for room in rooms:
                daily_logs = RoomLog1Min.objects.filter(
                    room=room,
                    created_at__date=yesterday
                ).order_by('created_at')
                
                if not daily_logs.exists():
                    continue # No logs to aggregate
                else: 
                    total_usage = daily_logs.aggregate(
                        models.Sum('energy_usage')
                    )['energy_usage__sum'] or 0
                    
                    RoomLogDaily.objects.update_or_create(
                        room=room,
                        date=yesterday,
                        defaults={'total_energy_usage': total_usage}
                    )

            # Step 1: Check if today is first of month
            # Step 2: Iterate over all rooms
            # Step 3: Filter and sum previous month's daily logs
            # Step 4: Save to RoomLogMonthly
            if is_first_day_of_month(today):
                first_of_prev_month = yesterday.replace(day=1)
                
                for room in rooms:
                    monthly_logs = RoomLogDaily.objects.filter(
                        room=room,
                        date__gte=first_of_prev_month,
                        date__lte=yesterday
                    ).order_by('date')
                    
                    if not monthly_logs.exists():
                        continue  # No logs to aggregate
                    else:
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
    """
    Calculate device metrics from 1-minute logs.
    
    Parameters:
        logs: QuerySet of DeviceLog1Min entries
    
    Returns:
        Dictionary with metrics including total usage, average usage,
        and separate metrics for periods when the device was on vs. off
    """
    # Overall metrics
    total_usage = logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
    usage_duration = logs.count() * 60 # Convert to seconds for consistent metrics
    avg_usage_per_second = total_usage / usage_duration  # per second for whole day
    
    # Uptime metrics
    uptime_logs = logs.filter(status=True)
    uptime_count = uptime_logs.count()
    uptime_seconds = uptime_count * 60  # Convert to seconds for consistent metrics
    uptime_usage = uptime_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
    avg_uptime_usage = uptime_usage / uptime_seconds if uptime_seconds > 0 else 0
    
    # Downtime metrics
    downtime_logs = logs.filter(status=False)
    downtime_count = downtime_logs.count()
    downtime_seconds = downtime_count * 60  # Convert to seconds for consistent metrics
    downtime_usage = downtime_logs.aggregate(models.Sum('energy_usage'))['energy_usage__sum'] or 0
    avg_downtime_usage = downtime_usage / downtime_seconds if downtime_seconds > 0 else 0
    
    return {
        'total_usage': total_usage,
        'avg_usage_per_second': avg_usage_per_second,
        'uptime': {
            'duration': uptime_seconds,  # Reported in seconds for consistency
            'total_usage': uptime_usage,
            'avg_usage_per_second': avg_uptime_usage
        },
        'downtime': {
            'duration': downtime_seconds,  # Reported in seconds for consistency
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
    """
    Calculate monthly metrics from daily logs.
    
    Parameters:
        daily_logs: QuerySet of DeviceLogDaily entries
        
    Returns:
        Dictionary with daily summaries and monthly totals/averages
    """
    # No changes needed here as this function works with daily logs
    # ...existing code...
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
    
    Process:
    1. Aggregate previous day's 1-minute logs to daily with detailed status metrics
    2. On first day of month, aggregate previous month's daily logs to monthly
    """
    time.sleep(30) # Delay to ensure all 1-minute logs are generated

    try:
        with transaction.atomic():
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)

            # Step 1: Aggregate DeviceLog1Min to DeviceLogDaily
            devices = Device.objects.all()
            for device in devices:
                # Get yesterday's logs
                daily_logs = DeviceLog1Min.objects.filter(
                    device=device,
                    created_at__date=yesterday
                ).order_by('created_at')
                
                if not daily_logs.exists():
                    continue  # No logs to aggregate
                else:
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
                    
                    if not monthly_logs.exists():
                        continue  # No logs to aggregate
                    else:
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

def aggregate_device_to_room_logs(current_minute=None):
    """
    Aggregates 1-minute device logs (DeviceLog1Min) into a single 1-minute room log (RoomLog1Min)
    for each room. This function is called immediately after generate_device_logs().
    
    Parameters:
        current_minute: Timestamp to use for filtering logs. If not provided,
                        the function will determine it based on the current time.
                        
    Process:
    1. Get all device logs with the exact timestamp
    2. Group the logs by room and sum their energy usage
    3. Create a room log for each room with the same timestamp
    """
    try:
        with transaction.atomic():
            # Use the passed timestamp or determine it if not provided
            if current_minute is None:
                now = timezone.now()
                current_minute = now.replace(second=0, microsecond=0)
            
            # Get device logs with the exact current_minute timestamp
            current_device_logs = DeviceLog1Min.objects.filter(
                created_at=current_minute
            ).select_related('device__room')
            
            if not current_device_logs.exists():
                return  # No logs to aggregate

            # Group logs by room
            room_energy_usage = {}
            for dev_log in current_device_logs:
                room = dev_log.device.room
                if room is None:
                    # Skip devices that are not assigned to a room
                    continue
                    
                if room.id not in room_energy_usage:
                    room_energy_usage[room.id] = {
                        'room': room,
                        'total_usage': 0.0
                    }
                room_energy_usage[room.id]['total_usage'] += dev_log.energy_usage

            # Create room logs for each room (using the same timestamp)
            for room_data in room_energy_usage.values():
                RoomLog1Min.objects.create(
                    room=room_data['room'],
                    energy_usage=room_data['total_usage'],
                    created_at=current_minute  # Use the same uniform timestamp
                )

    except Exception as e:
        print(f"Error in aggregate_device_to_room_logs: {e}")
        raise

def calculate_realtime_energy_usage(room_id=None, device_id=None, hours=24):
    """
    Calculates real-time energy usage for a specific room or device.
    
    This utility function is helpful for on-demand energy usage calculation
    rather than waiting for the daily aggregation.
    
    Parameters:
        room_id: Optional - Filter by room ID
        device_id: Optional - Filter by device ID
        hours: Number of hours to look back (default: 24)
        
    Returns:
        Dictionary with usage metrics
    """
    end_time = timezone.now()
    start_time = end_time - timedelta(hours=hours)
    
    result = {
        'start_time': start_time,
        'end_time': end_time,
        'period_hours': hours,
        'total_usage': 0
    }
    
    if room_id:
        # Calculate room-level energy usage
        logs = RoomLog1Min.objects.filter(
            room_id=room_id,
            created_at__gte=start_time,
            created_at__lte=end_time
        )
        result['total_usage'] = logs.aggregate(
            models.Sum('energy_usage')
        )['energy_usage__sum'] or 0
        
    elif device_id:
        # Calculate device-level energy usage
        logs = DeviceLog1Min.objects.filter(
            device_id=device_id,
            created_at__gte=start_time,
            created_at__lte=end_time
        )
        result['total_usage'] = logs.aggregate(
            models.Sum('energy_usage')
        )['energy_usage__sum'] or 0
        
        # Add status breakdown for devices
        on_logs = logs.filter(status=True)
        result['on_time_minutes'] = on_logs.count()
        result['on_time_usage'] = on_logs.aggregate(
            models.Sum('energy_usage')
        )['energy_usage__sum'] or 0
        
    return result