import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


def generate_unique_codes(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        while True:
            code = uuid.uuid4().hex[:8].upper()
            if not User.objects.filter(referral_code=code).exists():
                user.referral_code = code
                user.save(update_fields=['referral_code'])
                break


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_providerprofile_reputation_tier'),
    ]

    operations = [
        # Step 1: add without unique, nullable
        migrations.AddField(
            model_name='user',
            name='referral_code',
            field=models.CharField(max_length=8, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='referred_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='referrals', to=settings.AUTH_USER_MODEL),
        ),
        # Step 2: populate unique codes for existing users
        migrations.RunPython(generate_unique_codes, migrations.RunPython.noop),
        # Step 3: enforce unique + not null
        migrations.AlterField(
            model_name='user',
            name='referral_code',
            field=models.CharField(max_length=8, unique=True),
        ),
    ]
