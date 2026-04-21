from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "stockalert",
    broker="memory://",        # no Redis needed
    backend="cache+memory://"  # stores results in memory
)

celery_app.conf.beat_schedule = {
    "poll-market-data": {
        "task": "app.tasks.polling.poll_market_data",
        "schedule": crontab(minute="*/15", hour="14-21", day_of_week="1-5"),
    }
}

celery_app.conf.timezone = "UTC"