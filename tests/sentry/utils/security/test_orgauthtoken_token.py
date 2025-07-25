from unittest import TestCase

from sentry.utils import json
from sentry.utils.security.orgauthtoken_token import (
    SENTRY_ORG_AUTH_TOKEN_PREFIX,
    base64_encode_str,
    generate_token,
    parse_token,
)


class OrgAuthTokenTokenTest(TestCase):
    def test_generate_token(self) -> None:
        token = generate_token("test-org", "https://test-region.sentry.io")

        assert token
        assert token.startswith(SENTRY_ORG_AUTH_TOKEN_PREFIX)

    def test_parse_token(self) -> None:
        token = generate_token("test-org", "https://test-region.sentry.io")
        token_payload = parse_token(token)

        assert token_payload is not None
        assert token_payload["org"] == "test-org"
        assert token_payload["url"] == "http://testserver"
        assert token_payload["region_url"] == "https://test-region.sentry.io"

    def test_parse_invalid_token(self) -> None:
        assert parse_token("invalid-token") is None

    def test_parse_invalid_token_json(self) -> None:
        payload_str = (
            '{"iat": 12345678,"url": "test-site","region_url": "test-site","org": "test-org}'
        )
        payload_hashed = base64_encode_str(payload_str)
        token = SENTRY_ORG_AUTH_TOKEN_PREFIX + payload_hashed + "_secret"

        assert parse_token(token) is None

    def test_parse_invalid_token_iat(self) -> None:
        payload = {
            "url": "test-site",
            "region_url": "test-site",
            "org": "test-org",
        }

        payload_str = json.dumps(payload)
        payload_hashed = base64_encode_str(payload_str)
        token = SENTRY_ORG_AUTH_TOKEN_PREFIX + payload_hashed + "_secret"

        assert parse_token(token) is None

    def test_parse_invalid_token_missing_secret(self) -> None:
        payload = {
            "iat": 12345678,
            "url": "test-site",
            "region_url": "test-site",
            "org": "test-org",
        }

        payload_str = json.dumps(payload)
        payload_hashed = base64_encode_str(payload_str)
        token = SENTRY_ORG_AUTH_TOKEN_PREFIX + payload_hashed

        assert parse_token(token) is None

    def test_generate_token_unique(self) -> None:
        jwt1 = generate_token("test-org", "https://test-region.sentry.io")
        jwt2 = generate_token("test-org", "https://test-region.sentry.io")
        jwt3 = generate_token("test-org", "https://test-region.sentry.io")

        assert jwt1
        assert jwt2
        assert jwt3
        assert jwt1 != jwt2
        assert jwt2 != jwt3
