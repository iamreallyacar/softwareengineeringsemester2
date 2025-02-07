from django.db import models, transaction
from django.utils import timezone
from datetime import timedelta
from .models import Room, RoomLog5Sec, RoomLogDaily, RoomLogMonthly, Device, DeviceLog5Sec, DeviceLogDaily, DeviceLogMonthly

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

            # Step 1: Iterate over all rooms
            # Step 2: Filter and sum all energy usage yesterday
            # Step 3: Save to RoomLogDaily
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

            # Step 1: Check if today is first of month
            # Step 2: Aggregate previous month's daily logs
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

def aggregate_device_to_room_logs():
    """
    Aggregates 5-second device logs (DeviceLog5Sec) into a single 5-second room log (RoomLog5Sec)
    for each room, preserving the exact created_at time for each 5-second interval.

    Steps:
      1. Find the latest RoomLog5Sec entry (max created_at).
      2. Only gather new DeviceLog5Sec entries (created_at > latest room log time).
      3. Group these device logs by (room, created_at).
      4. For each group, sum up the energy_usage of all devices in that room for that 5-second period.
      5. Create a new RoomLog5Sec entry if it doesn't already exist for (room, created_at).
         - This ensures we don't overwrite or duplicate existing logs.
      6. The newly created RoomLog5Sec entry gets the exact same created_at as the device logs, 
         preserving the 5-second interval alignment.
    """

    try:
        with transaction.atomic():
            # 1. Determine the last recorded room log time (or fallback to a default).
            last_room_log = RoomLog5Sec.objects.order_by('-created_at').first()
            if last_room_log:
                cutoff_time = last_room_log.created_at
            else:
                # If no previous room logs exist, we look back a bit so we can catch all device logs.
                cutoff_time = timezone.now() - timedelta(days=30)

            # 2. Gather new device logs since the last known room log time
            new_device_logs = DeviceLog5Sec.objects.filter(
                created_at__gt=cutoff_time
            ).select_related('device__room').order_by('created_at')

            if not new_device_logs.exists():
                return  # Nothing new to aggregate

            # 3. Group logs by (room, created_at)
            room_groups = {}
            for dev_log in new_device_logs:
                room = dev_log.device.room.id
                ts = dev_log.created_at  # All matching logs share the same 5-second timestamp

                # Use room.id + exact timestamp as the group key
                key = (room.id, ts)
                if key not in room_groups:
                    room_groups[key] = {
                        'room': room,
                        'created_at': ts,
                        'total_usage': 0.0
                    }
                room_groups[key]['total_usage'] += dev_log.energy_usage

            # 4. For each group, create a new RoomLog5Sec if it doesn't already exist
            for data in room_groups.values():
                # Check if there's already a record for (room, created_at)
                exists = RoomLog5Sec.objects.filter(
                    room=data['room'],
                    created_at=data['created_at']
                ).exists()

                if not exists:
                    # Create a new RoomLog5Sec entry 
                    RoomLog5Sec.objects.create(
                        room=data['room'],
                        energy_usage=data['total_usage'],
                        created_at=data['created_at']
                    )

    except Exception as e:
        print(f"Error in aggregate_device_to_room_logs: {e}")
        raise
