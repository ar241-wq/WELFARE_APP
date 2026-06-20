import json
import ssl
import urllib.request
import urllib.parse
from django.conf import settings

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


def _post(endpoint, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f'https://slack.com/api/{endpoint}',
        data=data,
        headers={
            'Authorization': f'Bearer {settings.SLACK_BOT_TOKEN}',
            'Content-Type': 'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=10, context=_ssl_ctx) as res:
        return json.loads(res.read())


def post_message(channel, text):
    _post('chat.postMessage', {'channel': channel, 'text': text})


def get_user_email(slack_user_id):
    params = urllib.parse.urlencode({'user': slack_user_id})
    req = urllib.request.Request(
        f'https://slack.com/api/users.info?{params}',
        headers={'Authorization': f'Bearer {settings.SLACK_BOT_TOKEN}'},
    )
    with urllib.request.urlopen(req, timeout=10, context=_ssl_ctx) as res:
        data = json.loads(res.read())
    if data.get('ok'):
        return data['user']['profile'].get('email')
    return None
