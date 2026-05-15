#!/bin/bash
# Test the VAWT API endpoints

set -e

BASE_URL="${1:-http://localhost:3001}"
echo "Testing API endpoints at $BASE_URL"
echo

# Test health
echo "Testing /health..."
curl -s "$BASE_URL/health" | python3 -m json.tool > /dev/null
echo "✓ /health works"
echo

# Test list tournaments
echo "Testing /api/tournaments..."
YEARS=$(curl -s "$BASE_URL/api/tournaments")
echo "Years: $YEARS"
echo "✓ /api/tournaments works"
echo

# Test get tournament metadata
echo "Testing /api/tournaments/2026..."
curl -s "$BASE_URL/api/tournaments/2026" | python3 -m json.tool | head -8
echo "✓ /api/tournaments/2026 works"
echo

# Test get full bracket
echo "Testing /api/tournaments/2026/bracket (first bout only)..."
curl -s "$BASE_URL/api/tournaments/2026/bracket" | python3 -c "import json, sys; d = json.load(sys.stdin); print(f\"Bouts: {len(d['bouts'])}\"); print(json.dumps(d['bouts'][0], indent=2))"
echo "✓ /api/tournaments/2026/bracket works"
echo

# Test get rounds
echo "Testing /api/tournaments/2026/rounds..."
curl -s "$BASE_URL/api/tournaments/2026/rounds" | python3 -c "import json, sys; d = json.load(sys.stdin); [print(f\"Round {r['round']}: {r['boutCount']} bouts\") for r in d]"
echo "✓ /api/tournaments/2026/rounds works"
echo

# Test get single bout
echo "Testing /api/tournaments/2026/bouts/r1b1..."
curl -s "$BASE_URL/api/tournaments/2026/bouts/r1b1" | python3 -m json.tool | head -15
echo "✓ /api/tournaments/2026/bouts/r1b1 works"
echo

# Test 404
echo "Testing 404 for non-existent tournament..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/tournaments/9999")
if [ "$STATUS" = "404" ]; then
    echo "✓ 404 response correct"
else
    echo "✗ Expected 404, got $STATUS"
    exit 1
fi
echo

# Test 404 for non-existent bout
echo "Testing 404 for non-existent bout..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/tournaments/2026/bouts/r99b99")
if [ "$STATUS" = "404" ]; then
    echo "✓ 404 response correct"
else
    echo "✗ Expected 404, got $STATUS"
    exit 1
fi
echo

# Test CORS header
echo "Testing CORS headers..."
CORS=$(curl -s -I -H "Origin: http://localhost:8080" "$BASE_URL/api/tournaments" | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
    echo "✓ CORS headers present: $CORS"
else
    echo "✗ CORS headers missing"
    exit 1
fi
echo

echo "✅ All API tests passed!"
