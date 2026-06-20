import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def get_ai_response(context, user_message):
    expiring = f"\n- Expiring soon: {context['expiring_note']}" if context['expiring_note'] else ''

    system = (
        "You are a friendly wellness concierge bot for a corporate employee benefits platform. "
        "You help employees make the most of their wellness credits. "
        "Be warm, concise, and specific. Never use markdown or bullet points. "
        "Keep responses under 3 sentences."
    )

    user_prompt = (
        f"Employee: {context['name']}\n"
        f"Wallet balance: {context['balance']} credits\n"
        f"Recent redeems: {', '.join(context['recent_redemptions'])}\n"
        f"Perks they can afford: {', '.join(context['affordable_perks'])}"
        f"{expiring}\n\n"
        f"They say: \"{user_message}\"\n\n"
        f"Reply naturally. If they seem stressed or mention wellbeing, recommend one specific perk "
        f"(name it, include the credit cost). If they ask about balance or perks, answer directly."
    )

    payload = {
        'model': 'llama-3.1-8b-instant',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user_prompt},
        ],
        'max_tokens': 200,
        'temperature': 0.75,
    }

    res = requests.post(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {settings.GROQ_API_KEY}',
            'Content-Type': 'application/json',
        },
        json=payload,
        timeout=15,
    )

    if not res.ok:
        logger.error(f"Groq API error {res.status_code}: {res.text}")
        res.raise_for_status()

    return res.json()['choices'][0]['message']['content'].strip()
