# Generated by Django 5.1.4 on 2025-01-26 01:58

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_devicelogdaily_devicelogmonthly_room_roomlog5sec_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='roomlog5sec',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
