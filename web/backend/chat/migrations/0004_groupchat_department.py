from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_add_group_chat'),
        ('companies', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='groupchat',
            name='category',
            field=models.OneToOneField(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='group_chat',
                to='catalog.category',
            ),
        ),
        migrations.AddField(
            model_name='groupchat',
            name='department',
            field=models.OneToOneField(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='group_chat',
                to='companies.department',
            ),
        ),
    ]
