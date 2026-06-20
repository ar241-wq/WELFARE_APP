import hashlib
import hmac
import json
import threading
import time

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .ai import get_ai_response
from .context import get_user_context
from .slack_client import get_user_email, post_message

# Track processed event IDs to avoid duplicate handling
_seen_events = set()


def _verify_signature(request):
    secret = getattr(settings, 'SLACK_SIGNING_SECRET', '')
    if not secret:
        return True  # Skip in dev if not configured

    ts = request.headers.get('X-Slack-Request-Timestamp', '')
    sig = request.headers.get('X-Slack-Signature', '')

    # Reject replays older than 5 minutes
    try:
        if abs(time.time() - float(ts)) > 300:
            return False
    except ValueError:
        return False

    basestring = f'v0:{ts}:{request.body.decode()}'
    expected = 'v0=' + hmac.new(
        secret.encode(), basestring.encode(), hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, sig)


def _handle_message(event):
    slack_user_id = event.get('user')
    text = (event.get('text') or '').strip()
    channel = event.get('channel')

    if not text or not slack_user_id or not channel:
        return

    # Look up user by Slack email
    email = get_user_email(slack_user_id)
    if not email:
        post_message(channel, "I couldn't match your Slack account to the wellness platform. Make sure you registered with the same email.")
        return

    context = get_user_context(email)
    if not context:
        post_message(channel, "I couldn't find your wellness account. Try logging into the app first!")
        return

    try:
        reply = get_ai_response(context, text)
    except Exception as e:
        reply = f"Sorry {context['name']}, I hit a snag. You have {context['balance']} credits available — head to the app to browse perks!"

    post_message(channel, reply)


@csrf_exempt
def slack_events(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    # Step 1: URL verification (one-time Slack handshake)
    if data.get('type') == 'url_verification':
        return JsonResponse({'challenge': data['challenge']})

    # Step 2: Verify signature for all other requests
    if not _verify_signature(request):
        return HttpResponse(status=403)

    # Step 3: Handle events
    if data.get('type') == 'event_callback':
        event_id = data.get('event_id', '')

        # Deduplicate — Slack sometimes sends the same event twice
        if event_id in _seen_events:
            return HttpResponse(status=200)
        _seen_events.add(event_id)
        if len(_seen_events) > 500:
            _seen_events.clear()

        event = data.get('event', {})

        # Only handle direct messages, not bot messages
        if (
            event.get('type') == 'message'
            and event.get('channel_type') == 'im'
            and not event.get('bot_id')
            and not event.get('subtype')
        ):
            # Process in background so we return 200 within Slack's 3s limit
            threading.Thread(target=_handle_message, args=(event,), daemon=True).start()

    return HttpResponse(status=200)


class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'detail': 'message is required.'}, status=400)

        # Build context using the user's email
        context = get_user_context(request.user.email)
        if not context:
            context = {
                'name': request.user.full_name.split()[0],
                'balance': 0,
                'recent_redemptions': ['None yet'],
                'affordable_perks': ['No perks available'],
                'expiring_note': None,
            }

        try:
            reply = get_ai_response(context, message)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"AIChatView error: {e}")
            reply = f"I'm having trouble connecting right now. You have {context['balance']} credits — head to the Catalog to browse perks!"

        return Response({'reply': reply, 'balance': context['balance']})
