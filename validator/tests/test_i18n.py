# SPDX-License-Identifier: EUPL-1.2
"""i18n unit tests."""
from __future__ import annotations

import pytest

from akn_pt.i18n import get_language, set_language, t


def test_default_language_is_pt():
    set_language("pt")
    assert get_language() == "pt"
    assert "completa" in t("valid").lower()


def test_set_language_en():
    set_language("en")
    assert get_language() == "en"
    assert "passed" in t("valid").lower()


def test_unknown_language_raises():
    with pytest.raises(ValueError):
        set_language("fr")


def test_translation_fallback_for_unknown_key():
    set_language("en")
    assert t("nonexistent_key_xyz") == "nonexistent_key_xyz"
