from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0003_entry_submission_optional'),
        ('companies', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='challenge',
            name='winner_department',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='won_challenges',
                to='companies.department',
            ),
        ),
        migrations.RemoveField(
            model_name='challenge',
            name='winner',
        ),
    ]
