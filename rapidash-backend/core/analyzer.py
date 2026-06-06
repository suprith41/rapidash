import json
import os
import logging
from collections import defaultdict
from typing import List

from models.schema import AssetHolding, CashLedgerSummary


logger = logging.getLogger(__name__)


IDEAL_ALLOCATION = {
    "large_cap_equity": 0.40,
    "mid_cap_equity": 0.20,
    "small_cap_equity": 0.10,
    "mutual_funds": 0.20,
    "cash_reserve": 0.10,
}

LARGE_CAP_ISINS = [
    "INE002A01018",  # RELIANCE
    "INE040A01034",  # HDFCBANK
    "INE009A01021",  # INFY
    "INE364U01010",  # ADANIGREEN
    "INE742F01042",  # ADANIPORTS
    "INE931S01010",  # ADANITRANS
    "INE021A01026",
    "INE090A01021",
    "INE062A01020",
    "INE030A01027",
    "INE154A01025",
    "INE238A01034",
    "INE348B01021",
    "INE467B01029",
    "INE397D01024",
    "INE242A01010",
    "INE918I01026",
    "INE060A01024",
    "INE155A01022",
    "INE276A01018",
]

RECOMMENDED_FUNDS = {
    "large_cap_equity": [
        {
            "name": "Mirae Asset Large Cap Fund",
            "isin": "INF769K01010",
            "category": "Large Cap",
            "min_sip": 1000,
        },
        {
            "name": "Axis Bluechip Fund",
            "isin": "INF846K01EW2",
            "category": "Large Cap",
            "min_sip": 500,
        },
    ],
    "mid_cap_equity": [
        {
            "name": "Kotak Emerging Equity Fund",
            "isin": "INF174K01LS2",
            "category": "Mid Cap",
            "min_sip": 1000,
        },
        {
            "name": "HDFC Mid-Cap Opportunities Fund",
            "isin": "INF179K01VQ3",
            "category": "Mid Cap",
            "min_sip": 500,
        },
    ],
    "small_cap_equity": [
        {
            "name": "SBI Small Cap Fund",
            "isin": "INF200K01VF3",
            "category": "Small Cap",
            "min_sip": 500,
        },
        {
            "name": "Nippon India Small Cap Fund",
            "isin": "INF204K01U35",
            "category": "Small Cap",
            "min_sip": 100,
        },
    ],
    "mutual_funds": [
        {
            "name": "Parag Parikh Flexi Cap Fund",
            "isin": "INF879O01019",
            "category": "Flexi Cap",
            "min_sip": 1000,
        },
        {
            "name": "HDFC Flexi Cap Fund",
            "isin": "INF179K01BC6",
            "category": "Flexi Cap",
            "min_sip": 500,
        },
    ],
}


def classify_holding(holding: AssetHolding) -> str:
    # Classify by ISIN prefix and known patterns
    if holding.isin.startswith("INF"):
        return "mutual_funds"

    if holding.isin in LARGE_CAP_ISINS:
        return "large_cap_equity"

    ticker = holding.ticker_symbol.upper()
    if ticker.startswith(("NIFTY", "LIQUID", "GILT", "ARBITRAGE")):
        return "mutual_funds"

    if holding.current_market_value <= 0:
        return "small_cap_equity"

    if holding.current_market_value >= 1_000_000:
        return "large_cap_equity"
    if holding.current_market_value >= 250_000:
        return "mid_cap_equity"
    return "small_cap_equity"


def calculate_rebalancing(
    holdings: List[AssetHolding],
    ledger: CashLedgerSummary,
) -> dict:
    total_value = sum(h.current_market_value for h in holdings)
    total_with_cash = total_value + ledger.closing_cash_balance

    # Current allocation
    current = {
        "large_cap_equity": 0.0,
        "mid_cap_equity": 0.0,
        "small_cap_equity": 0.0,
        "mutual_funds": 0.0,
        "cash_reserve": ledger.closing_cash_balance,
    }

    for h in holdings:
        category = classify_holding(h)
        current[category] += h.current_market_value

    # Calculate suggestions
    suggestions = []
    for category, ideal_pct in IDEAL_ALLOCATION.items():
        ideal_value = total_with_cash * ideal_pct
        current_value = current.get(category, 0)
        diff = ideal_value - current_value
        diff_pct = (diff / total_with_cash) * 100 if total_with_cash > 0 else 0

        if abs(diff_pct) < 2:
            action = "hold"
        elif diff > 0:
            action = "buy"
        else:
            action = "sell"

        suggestions.append(
            {
                "category": category.replace("_", " ").title(),
                "current_value": round(current_value, 2),
                "ideal_value": round(ideal_value, 2),
                "difference": round(diff, 2),
                "difference_pct": round(diff_pct, 2),
                "action": action,
                "action_label": (
                    f"{'Add' if action == 'buy' else 'Reduce by' if action == 'sell' else 'Hold'} "
                    f"₹{abs(diff):,.2f}"
                ),
            }
        )

    return {
        "total_portfolio_value": round(total_with_cash, 2),
        "suggestions": suggestions,
        "summary": (
            "Your portfolio needs "
            f"{len([s for s in suggestions if s['action'] != 'hold'])} adjustments "
            "to reach ideal allocation"
        ),
    }


def calculate_sip_plan(rebalancing: dict, monthly_budget: float = 5000) -> dict:
    buy_suggestions = [
        s for s in rebalancing["suggestions"] if s["action"] == "buy"
    ]

    if not buy_suggestions:
        return {
            "monthly_budget": monthly_budget,
            "allocations": [],
            "message": "Your portfolio is well balanced. No SIP adjustments needed.",
        }

    total_deficit = sum(abs(s["difference"]) for s in buy_suggestions)
    allocations = []

    for suggestion in buy_suggestions:
        category_key = suggestion["category"].lower().replace(" ", "_")
        weight = abs(suggestion["difference"]) / total_deficit if total_deficit > 0 else 0
        monthly_amount = round(monthly_budget * weight, -2)
        monthly_amount = max(monthly_amount, 500)

        funds = RECOMMENDED_FUNDS.get(category_key, [])
        if funds:
            recommended_fund = funds[0]
            allocations.append(
                {
                    "category": suggestion["category"],
                    "monthly_amount": monthly_amount,
                    "fund_name": recommended_fund["name"],
                    "fund_isin": recommended_fund["isin"],
                    "fund_category": recommended_fund["category"],
                    "min_sip": recommended_fund["min_sip"],
                    "months_to_target": round(
                        abs(suggestion["difference"]) / monthly_amount
                    )
                    if monthly_amount > 0
                    else 0,
                    "action_label": f"Start ₹{monthly_amount:,.0f}/month SIP",
                }
            )

    return {
        "monthly_budget": monthly_budget,
        "total_monthly_sip": sum(a["monthly_amount"] for a in allocations),
        "allocations": allocations,
        "message": (
            f"Invest ₹{sum(a['monthly_amount'] for a in allocations):,.0f}/month across "
            f"{len(allocations)} funds to reach ideal allocation"
        ),
    }


def calculate_health_score(
    holdings: List[AssetHolding],
    ledger: CashLedgerSummary,
) -> dict:
    total_value = sum(h.current_market_value for h in holdings)
    total_with_cash = total_value + ledger.closing_cash_balance
    score = 100
    breakdown = []

    # RULE 1 - Diversification (30 points)
    # Deduct points if fewer than 8 holdings
    holding_count = len([h for h in holdings if h.current_market_value > 0])
    if holding_count < 4:
        score -= 30
        breakdown.append(
            {
                "label": "Diversification",
                "score": 0,
                "max": 30,
                "message": "Less than 4 holdings - very high concentration risk",
            }
        )
    elif holding_count < 8:
        deduction = (8 - holding_count) * 4
        score -= deduction
        breakdown.append(
            {
                "label": "Diversification",
                "score": 30 - deduction,
                "max": 30,
                "message": f"Only {holding_count} holdings - consider diversifying",
            }
        )
    else:
        breakdown.append(
            {
                "label": "Diversification",
                "score": 30,
                "max": 30,
                "message": "Good diversification across holdings",
            }
        )

    # RULE 2 - Cash Drag (25 points)
    cash_ratio = ledger.closing_cash_balance / total_with_cash if total_with_cash > 0 else 0
    if cash_ratio > 0.30:
        score -= 25
        breakdown.append(
            {
                "label": "Cash Utilization",
                "score": 0,
                "max": 25,
                "message": f"Idle cash at {cash_ratio * 100:.1f}% - severe purchasing power loss",
            }
        )
    elif cash_ratio > 0.15:
        score -= 12
        breakdown.append(
            {
                "label": "Cash Utilization",
                "score": 13,
                "max": 25,
                "message": f"Idle cash at {cash_ratio * 100:.1f}% - consider deploying",
            }
        )
    else:
        breakdown.append(
            {
                "label": "Cash Utilization",
                "score": 25,
                "max": 25,
                "message": "Cash levels are optimal",
            }
        )

    # RULE 3 - Sector Concentration (25 points)
    # Group by first 4 chars of ticker as sector proxy
    sector_values = defaultdict(float)
    for h in holdings:
        sector = h.ticker_symbol[:4]
        sector_values[sector] += h.current_market_value

    max_sector_pct = max(
        (v / total_value * 100 for v in sector_values.values()),
        default=0,
    )
    if max_sector_pct > 50:
        score -= 25
        breakdown.append(
            {
                "label": "Sector Balance",
                "score": 0,
                "max": 25,
                "message": f"Single sector at {max_sector_pct:.1f}% - dangerous concentration",
            }
        )
    elif max_sector_pct > 35:
        score -= 12
        breakdown.append(
            {
                "label": "Sector Balance",
                "score": 13,
                "max": 25,
                "message": f"Sector concentration at {max_sector_pct:.1f}% - monitor closely",
            }
        )
    else:
        breakdown.append(
            {
                "label": "Sector Balance",
                "score": 25,
                "max": 25,
                "message": "Sector allocation looks balanced",
            }
        )

    # RULE 4 - Zero value holdings (20 points)
    zero_holdings = len([h for h in holdings if h.current_market_value == 0])
    if zero_holdings > 3:
        score -= 20
        breakdown.append(
            {
                "label": "Portfolio Quality",
                "score": 0,
                "max": 20,
                "message": f"{zero_holdings} holdings with zero value - possible delisted stocks",
            }
        )
    elif zero_holdings > 0:
        deduction = zero_holdings * 4
        score -= deduction
        breakdown.append(
            {
                "label": "Portfolio Quality",
                "score": 20 - deduction,
                "max": 20,
                "message": f"{zero_holdings} holdings with zero value - review these positions",
            }
        )
    else:
        breakdown.append(
            {
                "label": "Portfolio Quality",
                "score": 20,
                "max": 20,
                "message": "All holdings have active market value",
            }
        )

    # Clamp score between 0 and 100
    score = max(0, min(100, score))

    # Grade
    if score >= 80:
        grade = "A"
        grade_label = "Excellent"
        color = "green"
    elif score >= 60:
        grade = "B"
        grade_label = "Good"
        color = "blue"
    elif score >= 40:
        grade = "C"
        grade_label = "Fair"
        color = "amber"
    else:
        grade = "D"
        grade_label = "Needs Attention"
        color = "red"

    return {
        "score": score,
        "grade": grade,
        "grade_label": grade_label,
        "color": color,
        "breakdown": breakdown,
        "total_portfolio_value": total_with_cash,
    }


def generate_investment_memo(
    holdings: List[AssetHolding],
    ledger: CashLedgerSummary,
    health_score: dict | None = None,
    rebalancing: dict | None = None,
    sip_plan: dict | None = None,
) -> str:
    total_value = sum(holding.current_market_value for holding in holdings)
    total_with_cash = total_value + ledger.closing_cash_balance
    top_holdings = sorted(
        holdings,
        key=lambda holding: holding.current_market_value,
        reverse=True,
    )[:3]

    context = {
        "total_portfolio_value": round(total_with_cash, 2),
        "cash_balance": round(ledger.closing_cash_balance, 2),
        "holding_count": len(holdings),
        "top_holdings": [
            {
                "ticker_symbol": holding.ticker_symbol,
                "isin": holding.isin,
                "market_value": round(holding.current_market_value, 2),
            }
            for holding in top_holdings
        ],
        "health_score": health_score,
        "rebalancing": rebalancing,
        "sip_plan": sip_plan,
    }

    try:
        from groq import Groq

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        system_prompt = (
            "You are an experienced wealth manager writing a concise portfolio memo. "
            "Return only plain text. No bullets, no headings, no markdown, no JSON. "
            "Write 2-4 short paragraphs in a calm, confident, conversational tone. "
            "Base the memo strictly on the portfolio facts provided. "
            "Do not mention personal identifiers or sensitive information. "
            "Do not overstate certainty. "
            "Mention concentration, cash deployment, diversification, and SIP pacing only if supported by the data."
        )
        user_prompt = (
            "Write a paragraph-style investment memo for this portfolio.\n\n"
            f"Portfolio data:\n{json.dumps(context, ensure_ascii=False, indent=2)}\n\n"
            "The memo should read like a financial advisor speaking to a client: "
            "practical, specific, and direct. Close with a brief forward-looking sentence "
            "about the next sensible action."
        )

        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=500,
        )
        memo = completion.choices[0].message.content or ""
        memo = memo.strip()
        if memo:
            return memo
    except Exception as exc:
        logger.warning("Groq investment memo generation failed: %s", exc)

    return _fallback_investment_memo(context)


def generate_dash_reply(
    holdings: List[AssetHolding],
    ledger: CashLedgerSummary,
    history: list[dict[str, str]],
) -> str:
    total_value = sum(holding.current_market_value for holding in holdings)
    total_with_cash = total_value + ledger.closing_cash_balance
    top_holdings = sorted(
        holdings,
        key=lambda holding: holding.current_market_value,
        reverse=True,
    )[:5]

    context = {
        "total_portfolio_value": round(total_with_cash, 2),
        "cash_balance": round(ledger.closing_cash_balance, 2),
        "holding_count": len(holdings),
        "top_holdings": [
            {
                "ticker_symbol": holding.ticker_symbol,
                "isin": holding.isin,
                "market_value": round(holding.current_market_value, 2),
                "confidence": holding.confidence,
            }
            for holding in top_holdings
        ],
    }

    try:
        from groq import Groq

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        system_prompt = (
            "You are Dash, a calm and practical investment copilot inside the Rapidash app. "
            "Write in a conversational but professional tone like a helpful financial analyst. "
            "Use plain text only. No bullets unless the user explicitly asks for them. "
            "Keep replies focused, specific, and grounded in the provided portfolio data. "
            "If the user asks for deeper analysis, explain the next steps clearly and briefly. "
            "Never mention private data beyond the portfolio context provided. "
            "If the user asks an irrelevant question, politely steer back to the portfolio."
        )
        chat_messages: list[dict[str, str]] = [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": (
                    "Portfolio context:\n"
                    f"{json.dumps(context, ensure_ascii=False, indent=2)}\n\n"
                    "Conversation so far:\n"
                    f"{json.dumps(history[-8:], ensure_ascii=False, indent=2)}\n\n"
                    "Respond to the user's latest question with a concise but useful answer."
                ),
            },
        ]

        completion = client.chat.completions.create(
            messages=chat_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=350,
        )
        reply = completion.choices[0].message.content or ""
        reply = reply.strip()
        if reply:
            return reply
    except Exception as exc:
        logger.warning("Groq dash reply generation failed: %s", exc)

    lead = top_holdings[0]["ticker_symbol"] if top_holdings else "the portfolio"
    return (
        f"I’m Dash, and I’d start with {lead}. Your portfolio is worth "
        f"₹{total_with_cash:,.2f} across {len(holdings)} holdings, with cash at "
        f"₹{ledger.closing_cash_balance:,.2f}. If you want to go deeper, we can break this down "
        f"holding by holding, map concentration risk, or turn the rebalancing plan into specific next actions."
    )


def _fallback_investment_memo(context: dict) -> str:
    total_value = context["total_portfolio_value"]
    cash_balance = context["cash_balance"]
    holding_count = context["holding_count"]
    top_holdings = context["top_holdings"]
    rebalancing = context.get("rebalancing") or {}
    health_score = context.get("health_score") or {}

    lead_holding = top_holdings[0]["ticker_symbol"] if top_holdings else "your core positions"
    if health_score.get("grade_label"):
        concentration_note = (
            f"Your current health score sits at {health_score.get('score', 0)}/100, "
            f"which points to a {health_score.get('grade_label', 'cautious').lower()} setup."
        )
    else:
        concentration_note = (
            "The portfolio is concentrated enough that diversification deserves attention."
        )

    action_note = (
        rebalancing.get("summary")
        or "There is room to rebalance the mix toward a steadier allocation."
    )
    cash_note = (
        f"Cash of ₹{cash_balance:,.2f} is part of the picture, so it should be deployed intentionally."
        if cash_balance > 0
        else "There is no idle cash cushion, so allocation decisions will matter more than timing."
    )

    return (
        f"This portfolio is currently valued at ₹{total_value:,.2f} across {holding_count} holdings, with "
        f"{lead_holding} acting as the largest visible anchor. {concentration_note} "
        f"{action_note} {cash_note}\n\n"
        f"The next sensible step is to keep the core positions under review, use any buy-side gaps with discipline, "
        f"and avoid letting one holding dominate the narrative. "
        f"If you stay consistent with the rebalancing plan, the portfolio should become easier to manage over time."
    )
