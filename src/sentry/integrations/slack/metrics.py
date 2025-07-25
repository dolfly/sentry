# metrics constants

from slack_sdk.errors import SlackApiError

from sentry.integrations.slack.utils.errors import (
    SLACK_SDK_HALT_ERROR_CATEGORIES,
    unpack_slack_api_error,
)
from sentry.integrations.utils.metrics import EventLifecycle

# Utils
SLACK_UTILS_GET_USER_LIST_SUCCESS_DATADOG_METRIC = "sentry.integrations.slack.utils.users.success"
SLACK_UTILS_GET_USER_LIST_FAILURE_DATADOG_METRIC = "sentry.integrations.slack.utils.users.failure"
SLACK_UTILS_CHANNEL_SUCCESS_DATADOG_METRIC = "sentry.integrations.slack.utils.channel.success"
SLACK_UTILS_CHANNEL_FAILURE_DATADOG_METRIC = "sentry.integrations.slack.utils.channel.failure"


def record_lifecycle_termination_level(lifecycle: EventLifecycle, error: SlackApiError) -> None:
    if (
        (reason := unpack_slack_api_error(error))
        and reason is not None
        and reason in SLACK_SDK_HALT_ERROR_CATEGORIES
    ):
        lifecycle.record_halt(reason.message)
    else:
        lifecycle.record_failure(error)
