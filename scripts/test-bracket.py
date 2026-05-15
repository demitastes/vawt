#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from datetime import datetime, timedelta

def load_bracket(path="data/bracket-2026.json"):
    with open(path) as f:
        return json.load(f)

def test_bout_count():
    d = load_bracket()
    bouts = d["bouts"]
    expected = 16 + 8 + 4 + 2 + 1  # 31 total
    assert len(bouts) == expected, f"Expected {expected} bouts, got {len(bouts)}"
    print(f"✓ Bout count: {len(bouts)} (16 + 8 + 4 + 2 + 1)")

def test_round_distribution():
    d = load_bracket()
    expected_per_round = {1: 16, 2: 8, 3: 4, 4: 2, 5: 1}
    for round_num, expected_count in expected_per_round.items():
        bouts = [b for b in d["bouts"] if b["round"] == round_num]
        assert len(bouts) == expected_count, f"Round {round_num}: expected {expected_count}, got {len(bouts)}"
        print(f"✓ Round {round_num}: {len(bouts)} bouts")

def test_bout_ids():
    d = load_bracket()
    for bout in d["bouts"]:
        expected_id = f"r{bout['round']}b{bout['bout']}"
        assert bout["id"] == expected_id, f"Bout ID mismatch: {bout['id']} != {expected_id}"
    print(f"✓ All {len(d['bouts'])} bout IDs are correct")

def test_sides():
    d = load_bracket()
    for bout in d["bouts"]:
        expected_side = "left" if bout["bout"] % 2 == 1 else "right"
        assert bout["side"] == expected_side, f"Bout {bout['id']}: side {bout['side']} != {expected_side}"
    print(f"✓ All bout sides are correct (odd=left, even=right)")

def test_feeders():
    d = load_bracket()
    bout_map = {b["id"]: b for b in d["bouts"]}

    # Round 1: no feeders
    for bout in d["bouts"]:
        if bout["round"] == 1:
            assert bout["feeders"] == [], f"R1 bout {bout['id']} should have no feeders"
    print(f"✓ Round 1 bouts have no feeders")

    # Round 2: each bout feeds from 2 adjacent round 1 bouts
    expected = {
        "r2b1": ["r1b1", "r1b2"],
        "r2b2": ["r1b3", "r1b4"],
        "r2b3": ["r1b5", "r1b6"],
        "r2b4": ["r1b7", "r1b8"],
        "r2b5": ["r1b9", "r1b10"],
        "r2b6": ["r1b11", "r1b12"],
        "r2b7": ["r1b13", "r1b14"],
        "r2b8": ["r1b15", "r1b16"],
    }
    for bout_id, expected_feeders in expected.items():
        bout = bout_map[bout_id]
        assert bout["feeders"] == expected_feeders, f"{bout_id}: feeders {bout['feeders']} != {expected_feeders}"
    print(f"✓ Round 2 feeder structure correct")

    # Final: should feed from both round 4 bouts
    r5b1 = bout_map["r5b1"]
    assert r5b1["feeders"] == ["r4b1", "r4b2"], f"Final feeders: {r5b1['feeders']}"
    print(f"✓ Round 5 (Final) feeds from both Round 4 bouts")

def test_round1_participants():
    d = load_bracket()
    r1_bouts = [b for b in d["bouts"] if b["round"] == 1]

    # Check total participant count (16 bouts with 3-4 participants each)
    total_participants = sum(len(b["participants"]) for b in r1_bouts)
    assert total_participants > 50, f"R1 participants: {total_participants} is too low"
    print(f"✓ Round 1 has {total_participants} total participants (16 bouts × 3-4 each)")

    # Check each bout has 3-4 participants
    for bout in r1_bouts:
        count = len(bout["participants"])
        assert 3 <= count <= 5, f"{bout['id']} has {count} participants (expected 3-5)"
    print(f"✓ Each Round 1 bout has 3-5 participants")

    # Check first bout has correct participants
    r1b1 = [b for b in r1_bouts if b["id"] == "r1b1"][0]
    expected_names = ["Open Road", "Brady's", "Old House", "3 Crosses"]
    actual_names = [p["name"] for p in r1b1["participants"]]
    assert actual_names == expected_names, f"R1B1 participants: {actual_names} != {expected_names}"
    print(f"✓ R1B1 has correct participants")

def test_veteran_owned_flags():
    d = load_bracket()
    veteran_owned = {"KO Distilling", "Mean Spirits Distilling", "Ironclad"}

    for bout in d["bouts"]:
        for participant in bout["participants"]:
            has_flag = "veteran-owned" in participant["flags"]
            is_veteran = participant["name"] in veteran_owned
            assert has_flag == is_veteran, f"{participant['name']}: flag={has_flag}, should be {is_veteran}"

    # Count flagged participants
    flagged = sum(
        1 for b in d["bouts"]
        for p in b["participants"]
        if "veteran-owned" in p["flags"]
    )
    print(f"✓ Veteran-owned flags correct ({flagged} flagged)")

def test_voting_dates():
    d = load_bracket()
    start_date = datetime.strptime(d["startDate"], "%Y-%m-%d")

    bout_seq = 1
    for round_num in range(1, 6):
        round_bouts = [b for b in d["bouts"] if b["round"] == round_num]
        for bout in sorted(round_bouts, key=lambda b: b["bout"]):
            expected_date = (start_date + timedelta(days=(bout_seq - 1) * 7)).strftime("%Y-%m-%d")
            actual_date = bout["votingDate"]
            assert actual_date == expected_date, f"{bout['id']}: date {actual_date} != {expected_date}"
            bout_seq += 1

    print(f"✓ All voting dates computed correctly (weekly cadence from {d['startDate']})")

def test_rounds_2_5_participants():
    d = load_bracket()
    # Rounds 2-5 should have no participants (filled by winners)
    for bout in d["bouts"]:
        if bout["round"] > 1:
            assert bout["participants"] == [], f"{bout['id']} should have no participants yet"
    print(f"✓ Rounds 2-5 have empty participants (filled by winners)")

def test_winners_initialized():
    d = load_bracket()
    for bout in d["bouts"]:
        assert bout["winner"] is None, f"{bout['id']} winner should be None"
    print(f"✓ All bouts have winner=null (no results set)")

def main():
    try:
        print("Testing bracket-2026.json structure...\n")
        test_bout_count()
        test_round_distribution()
        test_bout_ids()
        test_sides()
        test_feeders()
        test_round1_participants()
        test_veteran_owned_flags()
        test_voting_dates()
        test_rounds_2_5_participants()
        test_winners_initialized()
        print("\n✅ All tests passed!")
        return 0
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
