# Generated by Django 5.1.4 on 2025-03-15 02:20

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_alter_device_analogue_value'),
    ]

    operations = [
        migrations.AlterField(
            model_name='device',
            name='analogue_value',
            field=models.IntegerField(default=None, null=True, validators=[django.core.validators.MinValueValidator(0, message='Value must be at least 0'), django.core.validators.MaxValueValidator(10, message='Value cannot be greater than 10')]),
        ),
    ]
