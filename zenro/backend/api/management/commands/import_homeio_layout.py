import json
import os
from django.core.management.base import BaseCommand, CommandError
from api.models import HomeIORoom, SupportedDevice

class Command(BaseCommand):
    help = "Import Home I/O layout from a JSON file into HomeIORoom and SupportedDevice tables"

    def add_arguments(self, parser):
        parser.add_argument(
            'json_path',
            type=str,
            help='Path of the home_io_layout.json file'
        )

    def handle(self, *args, **options):
        json_path = options['json_path']

        if not os.path.exists(json_path):
            raise CommandError(f"File not found: {json_path}")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        rooms_data = data.get('rooms', [])
        # 1) Process "rooms" array
        for room_item in rooms_data:
            room_name = room_item.get('name')
            unlock_order = room_item.get('unlock_order')

            # Create or update HomeIORoom
            homeio_room, _ = HomeIORoom.objects.update_or_create(
                name=room_name,
                defaults={'unlock_order': unlock_order}
            )

            # For input_devices
            input_devices = room_item.get('input_devices', [])
            for dev in input_devices:
                model_name = dev.get('model_name')
                address = dev.get('address')
                contact_type = dev.get('contact_type') if dev.get('contact_type') != 'NULL' else None
                data_type = dev.get('data_type')
                dev_type = dev.get('type')       # e.g. 'sensor', 'light_switch'
                # memory_type='input' for input_devices
                SupportedDevice.objects.update_or_create(
                    model_name=model_name,
                    address=address,
                    data_type=data_type,
                    memory_type='input',
                    home_io_room=homeio_room,
                    defaults={
                        'contact_type': contact_type,
                        'type': dev_type
                    }
                )

            # For output_devices
            output_devices = room_item.get('output_devices', [])
            for dev in output_devices:
                model_name = dev.get('model_name')
                address = dev.get('address')
                contact_type = dev.get('contact_type') if dev.get('contact_type') != 'NULL' else None
                data_type = dev.get('data_type')
                dev_type = dev.get('type')       # e.g. 'lighting', 'heating'
                # memory_type='output' for output_devices
                SupportedDevice.objects.update_or_create(
                    model_name=model_name,
                    address=address,
                    data_type=data_type,
                    memory_type='output',
                    home_io_room=homeio_room,
                    defaults={
                        'contact_type': contact_type,
                        'type': dev_type
                    }
                )

            # For memory devices inside each room
            mem_devices = room_item.get('memory', [])
            for dev in mem_devices:
                name = dev.get('name')
                address = dev.get('address')
                data_type = dev.get('data_type')
                # “memory” devices: model_name = 'Memory: ' + name
                # type / contact_type can be None
                # memory_type='memory'
                SupportedDevice.objects.update_or_create(
                    model_name= name,
                    address=address,
                    data_type=data_type,
                    memory_type='memory',
                    home_io_room=homeio_room,
                    defaults={
                        'type': None,
                        'contact_type': None
                    }
                )

        # 2) Process top-level "memories" array (these don’t belong to any room)
        global_memories = data.get('memories', [])
        for dev in global_memories:
            name = dev.get('name')
            address = dev.get('address')
            data_type = dev.get('data_type')

            # model_name = 'Memory: ' + name
            SupportedDevice.objects.update_or_create(
                model_name=name,
                address=address,
                data_type=data_type,
                memory_type='memory',
                home_io_room=None,
                defaults={
                    'type': None,
                    'contact_type': None
                }
            )

        self.stdout.write(self.style.SUCCESS("Home I/O layout import completed."))