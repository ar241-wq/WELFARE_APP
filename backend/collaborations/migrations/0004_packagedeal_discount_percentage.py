from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collaborations', '0003_merge_20260620_1424'),
    ]

    operations = [
        migrations.AddField(
            model_name='packagedeal',
            name='discount_percentage',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
