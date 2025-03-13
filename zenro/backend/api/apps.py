from django.apps import AppConfig

class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        import api.signals  # Original signals for SmartHome creation
        import api.device_signals  # New signals for device status changes

