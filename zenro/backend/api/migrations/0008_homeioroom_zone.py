# Generated by Django 5.1.4 on 2025-03-14 02:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_supporteddevice_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='homeioroom',
            name='zone',
            field=models.CharField(default=None, max_length=5, null=True),
        ),
    ]
