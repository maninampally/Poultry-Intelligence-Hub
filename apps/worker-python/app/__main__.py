"""Run the Celery worker with ``python -m app``."""

from .celery_app import celery_app


if __name__ == "__main__":
    celery_app.start(["worker", "--loglevel=INFO"])

