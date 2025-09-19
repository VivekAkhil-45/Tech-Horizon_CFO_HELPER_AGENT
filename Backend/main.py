import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("API_KEY")
if not api_key:
    raise ValueError("API_KEY environment variable not set!")
genai.configure(api_key=api_key)

app = FastAPI()

scenario_counter = 0
report_counter = 0

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScenarioInput(BaseModel):
    initial_budget: int
    time_horizon: int  
    sales_volume: int  
    avg_price_per_unit: int
    staff_count: int
    marketing_spend: int
    operational_expenses: int
    pricing_adjustment: float  

def calculate_financial_outcome(data: ScenarioInput) -> dict:

    # 1. Calculate adjusted price and monthly revenue
    adjusted_price = data.avg_price_per_unit * (1 + data.pricing_adjustment / 100)
    monthly_revenue = data.sales_volume * adjusted_price

    # 2. Calculate monthly costs
    salary_costs = data.staff_count * data.average_salary
    total_monthly_costs = data.operational_expenses + data.marketing_spend + salary_costs

    # 3. Calculate monthly net cash flow (profit or loss)
    monthly_net_flow = monthly_revenue - total_monthly_costs

    # 4. Calculate runway and projected balance
    runway_months = None
    if monthly_net_flow < 0 and data.initial_budget > 0:
        runway_months = data.initial_budget / abs(monthly_net_flow)

    projected_balance = data.initial_budget + (monthly_net_flow * data.time_horizon)

    return {
        "monthly_net_flow": monthly_net_flow,
        "runway_months": runway_months,
        "projected_balance_after_horizon": projected_balance,
        "monthly_revenue": monthly_revenue,
        "total_monthly_costs": total_monthly_costs,
        "salary_costs": salary_costs
    }

def get_llm_summary(math_result: dict) -> str:

    # Format runway for display
    runway_text = f"{math_result.get('runway_months'):.1f} months" if math_result.get('runway_months') is not None else "N/A (profitable or no initial budget)"

    prompt = f"""
    You are an expert CFO assistant analyzing a business scenario.

    **Financial Forecast:**
    - Monthly Net Cash Flow: ₹{math_result.get('monthly_net_flow'):,}
    - Projected Balance after Time Horizon: ₹{math_result.get('projected_balance_after_horizon'):,}
    - Calculated Runway: {runway_text}
    - Key Drivers:
      - Monthly Revenue: ₹{math_result.get('monthly_revenue'):,}
      - Monthly Costs: ₹{math_result.get('total_monthly_costs'):,}

    **Your Task:**
    Provide a clear, structured analysis:
    1.  **Summary:** A one-sentence summary of the financial outlook.
    2.  **Key Insight:** Identify the single biggest factor (e.g., high costs, strong revenue) driving this forecast.
    3.  **Recommendation:** Suggest one actionable step to improve the financial position.
    """
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "Could not generate an AI summary for this scenario."

def get_short_llm_summary(math_result: dict) -> str:
    outcome = math_result.get('monthly_net_flow')
    outcome_text = f"a monthly profit of ₹{outcome:,}" if outcome >= 0 else f"a monthly loss of ₹{abs(outcome):,}"
    
    prompt = f"""
    You are a financial analyst summarizing a business scenario for a report headline.
    The result was {outcome_text}.
    Summarize this in a single, concise, tweet-style sentence (under 20 words).
    """
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return f"Scenario resulted in {outcome_text}."

# function for pathway api boi
# @app.get("/initial-data")
# async def get_initial_data():
#     initial_data = fetch_mock_pathway_data()
#     return {"initial_data": initial_data}

@app.post("/stimulate")
async def stimulate_scenario(data: ScenarioInput):
    global scenario_counter
    scenario_counter += 1
    
    math_result = calculate_financial_outcome(data)
    summary_text = get_llm_summary(math_result)
    
    return {
        "summary": summary_text,
        "data": math_result,
        "scenario_count": scenario_counter
    }

@app.post("/export-report")
async def export_report(data: ScenarioInput):
    global report_counter
    report_counter += 1
    
    math_result = calculate_financial_outcome(data)
    short_summary = get_short_llm_summary(math_result)
    
    return {
        "message": "Report export simulated successfully!",
        "short_summary": short_summary,
        "report_count": report_counter
    }

