from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from sentry.models.recentsearch import RecentSearch, remove_excess_recent_searches
from sentry.testutils.cases import TestCase
from sentry.utils.hashlib import md5_text


class RecentSearchTest(TestCase):
    def test_query_hash(self) -> None:
        recent_search = RecentSearch.objects.create(
            organization=self.organization, user_id=self.user.id, type=0, query="hello"
        )
        recent_search = RecentSearch.objects.get(id=recent_search.id)
        assert recent_search.query_hash == md5_text(recent_search.query).hexdigest()


class RemoveExcessRecentSearchesTest(TestCase):
    def test(self) -> None:
        with patch("sentry.models.recentsearch.MAX_RECENT_SEARCHES", new=1):
            RecentSearch.objects.create(
                organization=self.organization,
                user_id=self.user.id,
                type=0,
                query="hello",
                last_seen=timezone.now() - timedelta(minutes=10),
            )
            remove_excess_recent_searches(self.organization, self.user, 0)
            assert list(RecentSearch.objects.all().values_list("query", flat=True)) == ["hello"]
            RecentSearch.objects.create(
                organization=self.organization, user_id=self.user.id, type=0, query="goodbye"
            )
            remove_excess_recent_searches(self.organization, self.user, 0)
            assert list(RecentSearch.objects.all().values_list("query", flat=True)) == ["goodbye"]
