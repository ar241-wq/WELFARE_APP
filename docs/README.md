# Welfare App — Feature Documentation Index

This folder contains deep documentation for every feature built by Claude Code agents. Each doc covers every file, the data model, API endpoints, mobile screens, web pages, and a testing checklist. Written so any Claude instance or teammate can pick up the codebase instantly.

## Features

| Doc | Feature | Stack |
|---|---|---|
| [SECRET_SANTA.md](./SECRET_SANTA.md) | Department gift exchange with random assignment, credit gifting, and reveal | Backend + Mobile |
| [GROUP_BUYING.md](./GROUP_BUYING.md) | Group discount purchasing — 3=5%, 5=10%, 10=15% off perks | Backend + Mobile |
| [INTERNAL_PERKS.md](./INTERNAL_PERKS.md) | Company-owned perks (days off, coaching, etc.) with HR approval flow | Backend + Mobile + Web |

## Architecture Quick Reference

| Layer | Location | Notes |
|---|---|---|
| Django backend | `backend/` | DRF, JWT auth, SQLite |
| Expo mobile | `mobile/` | SDK 54, expo-router file-based routing |
| Next.js web | `web/` | Employer + Provider dashboards |
| Python venv | `venv/` at repo root | Activate before running Django |

### Auth
- JWT via `rest_framework_simplejwt`
- Tokens stored in mobile `AuthContext`
- Web uses cookie-based session or token in localStorage
- All API views require `IsAuthenticated` permission class

### User roles
- `employer` — full HR access, creates perks/events, approves requests
- `employee` — standard user, redeems perks, joins events
- `provider` — external perk provider (separate dashboard)

### Wallet & Credits
- `wallet.Wallet` — one per employee, `balance` field (Decimal)
- `wallet.Transaction` — every credit movement. `type` field: `credit | debit | refund`
- Always use `Decimal(str(wallet.balance))` for arithmetic — avoids float precision bugs

### Common patterns

**Backend view skeleton:**
```python
class MyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # always pass context={'request': request} to serializers
        return Response(MySerializer(qs, many=True, context={'request': request}).data)
```

**Mobile API call pattern:**
```js
// All calls go through apiFetch() in mobile/lib/api.js
// which attaches the JWT token and base URL automatically
export const getSomething = (id) => apiFetch(`/api/something/${id}/`);
export const createSomething = (data) => apiFetch('/api/something/', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

**Mobile screen pattern:**
```jsx
export default function MyScreen() {
  const { id } = useLocalSearchParams();   // dynamic route param
  const insets = useSafeAreaInsets();       // always use for paddingTop
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() { ... }
  useEffect(() => { load(); }, [id]);

  if (loading) return <ActivityIndicator />;
  return <ScrollView contentContainerStyle={{ paddingBottom: 80 }} />;
}
```

**New Django app registration checklist:**
1. Create `backend/<app_name>/` with `__init__.py`, `models.py`, `serializers.py`, `views.py`, `urls.py`
2. Add `'<app_name>'` to `INSTALLED_APPS` in `backend/config/settings.py`
3. Add `path('api/<url>/', include('<app_name>.urls'))` to `backend/config/urls.py`
4. Run `python manage.py makemigrations <app_name>` then `python manage.py migrate`
