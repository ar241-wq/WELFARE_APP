from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0002_add_challenge_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='challengeentry',
            name='submission',
            field=models.TextField(blank=True, default=''),
        ),
    ]
