"""
Provider Reputation Score Engine
Computes a composite 0-100 score from 5 weighted components.
NEVER call this on GET requests — only from signals or management commands.
"""

import math
import statistics
from datetime import timedelta

from django.db.models import Avg, Count
from django.utils import timezone


GLOBAL_PRIOR_MEAN = 3.5
MIN_REVIEWS_FOR_FULL_WEIGHT = 30
VOLUME_CAP = 200

TIER_MIN_REVIEWS = {
    'bronze': 10,
    'silver': 20,
    'gold': 40,
    'platinum': 80,
}

TIER_MIN_SCORE = {
    'bronze': 0,
    'silver': 60,
    'gold': 75,
    'platinum': 88,
}

TIER_ORDER = ['unranked', 'bronze', 'silver', 'gold', 'platinum']


def _bayesian_avg(sum_stars, review_count):
    return (
        (GLOBAL_PRIOR_MEAN * MIN_REVIEWS_FOR_FULL_WEIGHT + sum_stars)
        / (MIN_REVIEWS_FOR_FULL_WEIGHT + review_count)
    )


def _stars_component(sum_stars, review_count):
    if review_count == 0:
        adj = GLOBAL_PRIOR_MEAN
    else:
        adj = _bayesian_avg(sum_stars, review_count)
    return ((adj - 1) / 4) * 100


def _volume_component(redemption_count):
    return min(100.0, (math.log(redemption_count + 1) / math.log(VOLUME_CAP)) * 100)


def _repeat_component(provider_user):
    from .models import Redemption
    redeemed_qs = Redemption.objects.filter(
        perk__provider=provider_user,
        status='redeemed'
    )
    unique_employees = redeemed_qs.values('employee').distinct().count()
    if unique_employees == 0:
        return 0.0, 0.0
    repeat_employees = (
        redeemed_qs.values('employee')
        .annotate(cnt=Count('id'))
        .filter(cnt__gte=2)
        .count()
    )
    repeat_rate = repeat_employees / unique_employees
    return repeat_rate, repeat_rate * 100


def _consistency_component(provider_user):
    """Monthly average stars over last 6 months, penalised by std_dev."""
    from .models import Review
    now = timezone.now()
    six_months_ago = now - timedelta(days=183)
    reviews = Review.objects.filter(
        provider=provider_user,
        created_at__gte=six_months_ago
    ).values('created_at', 'stars')

    # Bucket by year-month
    monthly = {}
    for r in reviews:
        key = r['created_at'].strftime('%Y-%m')
        monthly.setdefault(key, []).append(r['stars'])

    monthly_avgs = [sum(v) / len(v) for v in monthly.values()]

    if len(monthly_avgs) < 3:
        return 50.0  # neutral placeholder for new providers

    std_dev = statistics.stdev(monthly_avgs)
    return max(0.0, 100 - (std_dev * 25))


def _fulfillment_component(provider_user):
    from .models import Redemption
    total = Redemption.objects.filter(perk__provider=provider_user).count()
    if total == 0:
        return 1.0, 100.0  # no redemptions yet — neutral, not penalised
    redeemed = Redemption.objects.filter(
        perk__provider=provider_user,
        status='redeemed'
    ).count()
    rate = redeemed / total
    return rate, rate * 100


def _assign_tier(composite_score, review_count, provider_user):
    """Return tier string given score and review count."""
    if review_count < TIER_MIN_REVIEWS['bronze']:
        return 'unranked'

    if review_count >= TIER_MIN_REVIEWS['platinum'] and composite_score >= TIER_MIN_SCORE['platinum']:
        # Additional gate: top 5% check (approximate)
        from .models import ReputationScore
        total_ranked = ReputationScore.objects.exclude(tier='unranked').count()
        if total_ranked > 0:
            above = ReputationScore.objects.filter(
                composite_score__gte=composite_score
            ).count()
            percentile = above / total_ranked
            if percentile <= 0.05:
                return 'platinum'
        else:
            return 'platinum'

    if review_count >= TIER_MIN_REVIEWS['gold'] and composite_score >= TIER_MIN_SCORE['gold']:
        return 'gold'

    if review_count >= TIER_MIN_REVIEWS['silver'] and composite_score >= TIER_MIN_SCORE['silver']:
        return 'silver'

    return 'bronze'


def _compute_gap(current_tier, composite_score, review_count, score_breakdown):
    next_map = {
        'unranked': 'bronze',
        'bronze': 'silver',
        'silver': 'gold',
        'gold': 'platinum',
    }
    target = next_map.get(current_tier)
    if target is None:
        return {'tier': 'platinum', 'message': 'You are at the top tier.', 'actions': []}

    actions = []
    score_gap = max(0.0, TIER_MIN_SCORE[target] - (composite_score or 0))
    if score_gap > 0:
        actions.append(f'Increase composite score by {score_gap:.1f} points')

    reviews_needed = max(0, TIER_MIN_REVIEWS[target] - review_count)
    if reviews_needed > 0:
        actions.append(f'Get {reviews_needed} more verified reviews')

    if score_breakdown:
        weakest = min(score_breakdown, key=lambda k: score_breakdown[k])
        actions.append(f'Biggest opportunity: improve your {weakest} score')

    return {
        'tier': target,
        'points_needed': round(score_gap, 1),
        'actions': actions,
    }


def recalculate_reputation(provider_user):
    """
    Compute and persist ReputationScore for provider_user.
    Called from post_save signal on Review, and from management commands.
    """
    from .models import Review, Redemption, ReputationScore
    from users.models import ProviderProfile

    reviews = Review.objects.filter(provider=provider_user)
    review_count = reviews.count()

    # Basic aggregates
    sum_stars = sum(r.stars for r in reviews) if review_count > 0 else 0
    raw_avg = (sum_stars / review_count) if review_count > 0 else None

    total_redemptions = Redemption.objects.filter(perk__provider=provider_user).count()
    redeemed_count = Redemption.objects.filter(
        perk__provider=provider_user, status='redeemed'
    ).count()

    # Five components
    sc = _stars_component(sum_stars, review_count)
    vc = _volume_component(redeemed_count)
    repeat_rate, rc = _repeat_component(provider_user)
    cc = _consistency_component(provider_user)
    _, fc = _fulfillment_component(provider_user)

    composite = (
        sc * 0.40
        + vc * 0.20
        + rc * 0.20
        + cc * 0.10
        + fc * 0.10
    )

    score_breakdown = {
        'stars': round(sc, 1),
        'volume': round(vc, 1),
        'repeat': round(rc, 1),
        'consistency': round(cc, 1),
        'fulfillment': round(fc, 1),
    }

    if review_count < TIER_MIN_REVIEWS['bronze']:
        tier = 'unranked'
        composite_saved = None
    else:
        tier = _assign_tier(composite, review_count, provider_user)
        composite_saved = round(composite, 2)

    gap_to_next = _compute_gap(tier, composite_saved, review_count, score_breakdown)

    rep, _ = ReputationScore.objects.get_or_create(provider=provider_user)
    rep.composite_score = composite_saved
    rep.tier = tier
    rep.avg_stars = round(raw_avg, 2) if raw_avg is not None else None
    rep.review_count = review_count
    rep.redemption_count = redeemed_count
    rep.repeat_rate = round(repeat_rate, 4)
    rep.consistency_score = round(cc, 2)
    rep.score_breakdown = score_breakdown
    rep.gap_to_next = gap_to_next
    rep.save()

    # Mirror tier on ProviderProfile for fast access
    try:
        profile = provider_user.provider_profile
        profile.reputation_tier = tier
        profile.save(update_fields=['reputation_tier'])
    except ProviderProfile.DoesNotExist:
        pass

    return rep
