from sentry.models.group import Group
from sentry.testutils.cases import APITestCase, PerformanceIssueTestCase, SnubaTestCase
from sentry.testutils.helpers.datetime import before_now


class GroupTagDetailsTest(APITestCase, SnubaTestCase, PerformanceIssueTestCase):
    def test_simple(self) -> None:
        for i in range(3):
            self.store_event(
                data={
                    "tags": {"foo": "bar"},
                    "fingerprint": ["group1"],
                    "timestamp": before_now(seconds=1).isoformat(),
                },
                project_id=self.project.id,
            )

        group = Group.objects.get()

        self.login_as(user=self.user)

        url = f"/api/0/issues/{group.id}/tags/foo/"
        response = self.client.get(url, format="json")
        assert response.status_code == 200, response.content
        assert response.data["key"] == "foo"
        assert response.data["totalValues"] == 3

    def test_simple_perf(self) -> None:
        event = self.create_performance_issue(
            tags=[["foo", "bar"], ["biz", "baz"], ["sentry:release", "releaseme"]],
            fingerprint="group1",
            contexts={"trace": {"trace_id": "b" * 32, "span_id": "c" * 16, "op": ""}},
        )
        self.create_performance_issue(
            tags=[["foo", "guux"], ["sentry:release", "releaseme"]],
            fingerprint="group1",
            contexts={"trace": {"trace_id": "b" * 32, "span_id": "c" * 16, "op": ""}},
        )

        self.login_as(user=self.user)

        url = f"/api/0/issues/{event.group.id}/tags/foo/"
        response = self.client.get(url, format="json")
        assert response.status_code == 200, response.content
        assert response.data["key"] == "foo"
        assert response.data["totalValues"] == 2
