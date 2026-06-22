#!/bin/bash
# Seed script: registers test users, creates circles, and adds members
# Usage: bash seed.sh

API="http://localhost:8081"

echo "=== Seeding Orbit test data ==="

# Register users
echo ""
echo "--- Registering users ---"

declare -A USERS
USERS["alice"]="alice@test.com;pass123"
USERS["bob"]="bob@test.com;pass123"
USERS["charlie"]="charlie@test.com;pass123"
USERS["diana"]="diana@test.com;pass123"
USERS["eve"]="eve@test.com;pass123"

for username in "${!USERS[@]}"; do
  IFS=";" read -r email password <<< "${USERS[$username]}"
  echo "Registering $username..."
  curl -s -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\"}" > /dev/null
done

echo ""
echo "--- Logging in as alice to get token ---"
ALICE_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"credential":"alice@test.com","password":"pass123"}')
ALICE_TOKEN=$(echo "$ALICE_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
ALICE_ID=$(echo "$ALICE_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "Alice token: ${ALICE_TOKEN:0:20}..."
echo "Alice ID: $ALICE_ID"

echo ""
echo "--- Bob follows Alice ---"
BOB_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"credential":"bob@test.com","password":"pass123"}')
BOB_TOKEN=$(echo "$BOB_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
BOB_ID=$(echo "$BOB_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "$API/user/$ALICE_ID/follow" \
  -H "Authorization: Bearer $BOB_TOKEN" > /dev/null
echo "Bob ($BOB_ID) follows Alice"

# Charlie follows Alice
CHAR_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"credential":"charlie@test.com","password":"pass123"}')
CHAR_TOKEN=$(echo "$CHAR_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CHAR_ID=$(echo "$CHAR_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "$API/user/$ALICE_ID/follow" \
  -H "Authorization: Bearer $CHAR_TOKEN" > /dev/null
echo "Charlie ($CHAR_ID) follows Alice"

# Diana follows Alice
DIANA_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"credential":"diana@test.com","password":"pass123"}')
DIANA_TOKEN=$(echo "$DIANA_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
DIANA_ID=$(echo "$DIANA_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "$API/user/$ALICE_ID/follow" \
  -H "Authorization: Bearer $DIANA_TOKEN" > /dev/null
echo "Diana ($DIANA_ID) follows Alice"

# Eve follows Alice
EVE_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"credential":"eve@test.com","password":"pass123"}')
EVE_TOKEN=$(echo "$EVE_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
EVE_ID=$(echo "$EVE_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "$API/user/$ALICE_ID/follow" \
  -H "Authorization: Bearer $EVE_TOKEN" > /dev/null
echo "Eve ($EVE_ID) follows Alice"

echo ""
echo "--- Alice creates circles ---"
# College Friends
CF_CIRCLE=$(curl -s -X POST "$API/circles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"name":"College Friends"}')
CF_ID=$(echo "$CF_CIRCLE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created 'College Friends' -> $CF_ID"

# Family
FAM_CIRCLE=$(curl -s -X POST "$API/circles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"name":"Family"}')
FAM_ID=$(echo "$FAM_CIRCLE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created 'Family' -> $FAM_ID"

# Work
WORK_CIRCLE=$(curl -s -X POST "$API/circles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{"name":"Work"}')
WORK_ID=$(echo "$WORK_CIRCLE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created 'Work' -> $WORK_ID"

echo ""
echo "--- Adding members ---"
# College Friends: Bob, Charlie
curl -s -X POST "$API/circles/$CF_ID/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{\"user_ids\":[\"$BOB_ID\",\"$CHAR_ID\"]}" > /dev/null
echo "Added Bob + Charlie to College Friends"

# Family: Diana
curl -s -X POST "$API/circles/$FAM_ID/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{\"user_ids\":[\"$DIANA_ID\"]}" > /dev/null
echo "Added Diana to Family"

# Work: Eve
curl -s -X POST "$API/circles/$WORK_ID/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d "{\"user_ids\":[\"$EVE_ID\"]}" > /dev/null
echo "Added Eve to Work"

# Alice follows Bob back so Bob can create stories too
curl -s -X POST "$API/user/$BOB_ID/follow" \
  -H "Authorization: Bearer $ALICE_TOKEN" > /dev/null

echo ""
echo "=== Done! ==="
echo "Log in as alice / pass123 to see circles with members."
echo "Usernames: alice, bob, charlie, diana, eve (all with password: pass123)"
