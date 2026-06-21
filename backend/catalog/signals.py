from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='catalog.Review')
def review_post_save(sender, instance, created, **kwargs):
    """Recalculate provider reputation whenever a review is saved."""
    if created:
        from .reputation import recalculate_reputation
        recalculate_reputation(instance.provider)
