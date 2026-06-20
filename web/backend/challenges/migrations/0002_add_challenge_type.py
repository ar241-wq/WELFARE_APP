from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='challenge',
            name='challenge_type',
            field=models.CharField(
                choices=[
                    ('kpi', 'KPI Target'),
                    ('ai_adoption', 'AI Adoption'),
                    ('first_to', 'First to Complete'),
                    ('innovation', 'Innovation'),
                    ('custom', 'Custom'),
                ],
                default='custom',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='challenge',
            name='target_metric',
            field=models.CharField(
                blank=True,
                max_length=255,
                help_text='e.g. "Increase sales by 15%" or "Deploy 2 AI tools"',
            ),
        ),
    ]
