from __future__ import annotations

from typing import Any
from unittest import TestCase, mock

import pytest

from sentry.auth.exceptions import IdentityNotValid
from sentry.auth.providers.saml2.provider import Attributes, SAML2Provider
from sentry.auth.view import AuthView
from sentry.testutils.silo import control_silo_test

dummy_provider_config = {
    "attribute_mapping": {
        Attributes.IDENTIFIER: "id",
        Attributes.USER_EMAIL: "email",
        Attributes.FIRST_NAME: "first",
        Attributes.LAST_NAME: "last",
    }
}


class DummySAML2Provider(SAML2Provider):
    name = "dummy"
    key = "dummy_saml2"

    def get_saml_setup_pipeline(self) -> list[AuthView]:
        raise NotImplementedError


@control_silo_test
class SAML2ProviderTest(TestCase):
    provider = DummySAML2Provider()

    def test_build_config_adds_attributes(self) -> None:
        config = self.provider.build_config({})

        assert "attribute_mapping" in config

    def test_build_config_with_provider_attributes(self) -> None:
        with mock.patch.object(self.provider, "attribute_mapping") as attribute_mapping:
            config = self.provider.build_config({})

            assert "attribute_mapping" in config
            assert config["attribute_mapping"] == attribute_mapping.return_value

    def test_build_identity_invalid(self) -> None:
        self.provider.config = dummy_provider_config
        state: dict[str, dict[str, Any]] = {"auth_attributes": {}}

        with pytest.raises(IdentityNotValid):
            self.provider.build_identity(state)

        state = {"auth_attributes": {"id": [""], "email": ["valid@example.com"]}}

        with pytest.raises(IdentityNotValid):
            self.provider.build_identity(state)

        state = {"auth_attributes": {"id": ["1234"], "email": [""]}}

        with pytest.raises(IdentityNotValid):
            self.provider.build_identity(state)

    def test_build_identity(self) -> None:
        self.provider.config = dummy_provider_config
        attrs = {
            "id": ["123"],
            "email": ["valid@example.com"],
            "first": ["Morty"],
            "last": ["Smith"],
        }

        state = {"auth_attributes": attrs}
        identity = self.provider.build_identity(state)

        assert identity["id"] == "123"
        assert identity["email"] == "valid@example.com"
        assert identity["name"] == "Morty Smith"

    def test_build_identity_empty_lastname(self) -> None:
        self.provider.config = dummy_provider_config
        attrs = {
            "id": ["123"],
            "email": ["valid@example.com"],
            "first": ["Morty"],
            "last": [],
        }

        state = {"auth_attributes": attrs}
        identity = self.provider.build_identity(state)

        assert identity["id"] == "123"
        assert identity["email"] == "valid@example.com"
        assert identity["name"] == "Morty"
