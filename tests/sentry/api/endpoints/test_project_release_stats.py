from datetime import UTC, datetime

import pytest
from django.urls import reverse

from sentry.models.release import Release
from sentry.testutils.cases import APITestCase
from sentry.testutils.skips import requires_snuba

pytestmark = [requires_snuba, pytest.mark.sentry_metrics]


class ProjectReleaseStatsTest(APITestCase):
    def test_simple(self) -> None:
        """Minimal test to ensure code coverage of the endpoint"""
        self.login_as(user=self.user)

        project = self.create_project(name="foo")
        release = Release.objects.create(
            organization_id=project.organization_id,
            version="1",
            date_added=datetime(2013, 8, 13, 3, 8, 24, 880386, tzinfo=UTC),
        )
        release.add_project(project)

        url = reverse(
            "sentry-api-0-project-release-stats",
            kwargs={
                "organization_id_or_slug": project.organization.slug,
                "project_id_or_slug": project.slug,
                "version": "1",
            },
        )
        response = self.client.get(url, format="json")

        assert response.status_code == 200, response.content
