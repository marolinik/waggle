"""UCX-4 Glass Brain Chat Tester — sends queries and captures responses."""
import json
import time
import sys
import urllib.request
import urllib.error
import ssl

BASE_URL = "http://localhost:3333"
WORKSPACE = "mirela-glass-brain"

def get_token():
    """Get current auth token from health endpoint."""
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read())
        return data.get("wsToken", "")

def send_chat(message, session_id, token=None):
    """Send a chat message and return the parsed response."""
    if not token:
        token = get_token()

    body = json.dumps({
        "message": message,
        "workspace": WORKSPACE,
        "session": session_id,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/chat",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8") if e.fp else ""
        return {
            "error": f"HTTP {e.code}: {err_body}",
            "content": "",
            "tools": [],
            "tokens": 0,
            "elapsed": time.time() - start,
        }
    except Exception as e:
        return {
            "error": str(e),
            "content": "",
            "tools": [],
            "tokens": 0,
            "elapsed": time.time() - start,
        }

    elapsed = time.time() - start

    # Parse SSE events
    content = ""
    tools = []
    tokens_in = 0
    tokens_out = 0
    errors = []
    steps = []

    for line in raw.split("\n"):
        line = line.strip()
        if not line.startswith("data: "):
            continue
        try:
            d = json.loads(line[6:])
        except:
            continue

        # Done event has usage
        if "usage" in d:
            content = d.get("content", "")
            tools = d.get("toolsUsed", [])
            tokens_in = d["usage"].get("inputTokens", 0)
            tokens_out = d["usage"].get("outputTokens", 0)
        elif "message" in d and len(d) <= 2:
            # Error event
            errors.append(d["message"])

    return {
        "content": content,
        "tools": tools,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "elapsed": elapsed,
        "errors": errors,
        "error": "; ".join(errors) if errors else "",
    }

def run_test(label, message, session_id, delay=8):
    """Run a single test and print results."""
    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"QUERY: {message[:100]}...")
    print(f"{'='*60}")

    time.sleep(delay)  # Rate limit spacing

    result = send_chat(message, session_id)

    if result.get("error"):
        print(f"ERROR: {result['error']}")
    else:
        print(f"RESPONSE ({result['elapsed']:.1f}s, {result['tokens_in']}+{result['tokens_out']} tokens):")
        safe_content = result["content"][:2000].encode("ascii", "replace").decode("ascii")
        print(safe_content)
        if result["tools"]:
            print(f"\nTOOLS USED: {result['tools']}")

    return result

def main():
    token = get_token()
    print(f"Token: {token[:16]}...")
    results = {}

    # Step 2: Architecture Advice
    results["arch"] = run_test(
        "Architecture Advice",
        "I'm putting everything from my work life into Waggle for a week. Help me design the memory architecture: 3 strategic initiatives, daily operations, 200+ stakeholder relationships, my own thinking. One workspace or multiple? How do I retrieve anything in 6 months?",
        "ucx4-r2-arch3",
        delay=2,
    )

    # Step 3: 8 Retrieval Queries
    queries = [
        ("Q1 Series B", "What did we decide about the Series B timeline?"),
        ("Q2 Viktor", "What do I know about Viktor?"),
        ("Q3 Hiring", "What are all the hiring decisions made this month?"),
        ("Q4 Investor concerns", "Find everything captured about investor concerns."),
        ("Q5 Open questions", "What are my own open questions - things I said I need to think about?"),
        ("Q6 Decision log", "Give me a decision log for March 2026."),
        ("Q7 Team mood", "What's the mood of the team based on what I've captured?"),
        ("Q8 Top relationships", "Who are my 5 most important external relationships right now?"),
    ]

    for i, (label, query) in enumerate(queries):
        results[label] = run_test(label, query, f"ucx4-r2-q{i+1}", delay=10)

    # Step 4: Adversarial Tests
    # GB-1: Contradiction
    results["GB-1"] = run_test(
        "GB-1 Contradiction",
        "What did we decide about hiring a CMO?",
        "ucx4-r2-gb1",
        delay=10,
    )

    # GB-2: Fuzzy Recall
    results["GB-2"] = run_test(
        "GB-2 Fuzzy Recall",
        "What was that thing I said about the board?",
        "ucx4-r2-gb2",
        delay=10,
    )

    # GB-5: Synthesis
    results["GB-5"] = run_test(
        "GB-5 Synthesis",
        "What have I learned about investor concerns this week? Give me a synthesis, not a list.",
        "ucx4-r2-gb5",
        delay=10,
    )

    # Save all results
    output = {k: {
        "content": v.get("content", "")[:5000],
        "tools": v.get("tools", []),
        "elapsed": v.get("elapsed", 0),
        "error": v.get("error", ""),
        "tokens_in": v.get("tokens_in", 0),
        "tokens_out": v.get("tokens_out", 0),
    } for k, v in results.items()}

    with open("D:/Projects/MS Claw/waggle-poc/UAT/artifacts/uc-x-results/ucx4_raw_results.json", "w") as f:
        json.dump(output, f, indent=2)

    print("\n\n=== ALL TESTS COMPLETE ===")
    print(f"Results saved to ucx4_raw_results.json")
    for k, v in results.items():
        status = "OK" if v.get("content") and not v.get("error") else "FAIL"
        print(f"  {k}: {status} ({v.get('elapsed',0):.1f}s)")

if __name__ == "__main__":
    main()
