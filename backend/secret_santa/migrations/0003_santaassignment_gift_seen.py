from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('secret_santa', '0002_santaassignment_gifted_perk'),
    ]

    operations = [
        migrations.AddField(
            model_name='santaassignment',
            name='gift_seen',
            field=models.BooleanField(default=False),
        ),
    ]
