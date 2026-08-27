#!/usr/bin/env bash
# Simulate a card tap against the check-in API.
# Only useful when MOCK_CARD_USER is set in .env.local.
#
# Usage: ./scripts/fake-tap.sh [host]
#   host defaults to http://localhost:3000

HOST="${1:-http://localhost:3000}"

echo "Sending fake card tap to ${HOST}/api/checkin ..."
curl -s -X POST "${HOST}/api/checkin" \
  -H "Content-Type: application/json" \
  -d '{"rawCardId":"12345678901"}' | python3 -m json.tool

echo
