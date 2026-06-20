from rest_framework import serializers
from .models import Wallet, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'description', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'updated_at', 'transactions']


class DonateSerializer(serializers.Serializer):
    life_event_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
