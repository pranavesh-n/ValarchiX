# ValarchiX - Operating System for Financial Knowledge

> 💡 **“We don't tell what to pick, we tell how to pick”**

**valarchiX** is an interactive, educational platform designed to build deep financial knowledge. Rather than providing investment recommendations, valarchiX empowers users by teaching them how to evaluate business models, assess mutual funds, calculate compounding, and compare tax regimes through dynamic data models and interactive diagnostic planners.

## 🌟 Key Features & Modules

### 1. 🤖 Vaathi (வாத்தி) - Enterprise Financial AI Assistant & Mentor
* **Single-Pass 1-Call LLM Execution**: Engineered for sub-second (~0.6s) response times by eliminating multi-turn tool calling latency, resulting in an **80% reduction in API calls & token overhead**.
* **0-Token Pre-LLM Guardrail Interceptor**: Intercepts out-of-scope or non-financial queries at the API edge before reaching LLM models, costing **0 tokens** with immediate responses.
* **Zero-Latency Semantic Response Cache**: Instantly delivers responses for common financial questions and calculations with **0ms network lag and zero token spend**.
* **Zero-Downtime Dynamic Multi-Model Failover**: Resilient fallback engine that automatically routes prompts across **Llama-3.1-8b-instant**, **Llama-3.3-70b-versatile**, and **Google Gemini Flash** to prevent 429 rate limit hiccups or service disruptions.
* **Token-Optimized Sliding Window Memory**: Preserves chat context using sliding memory windows and key entity extraction to stay within optimal context windows.
* **25+ Integrated Financial Solvers**: Connects directly to custom math engines (SIP, Step-Up SIP, CAGR, FIRE, SWP, EMI Prepayments, Union Budget 2025 Tax Slabs, etc.) and formats results into clean, readable Markdown text and structured tables—with zero raw JSON string dumping.

### 2. 📊 Mutual Funds Screener & Detail Analyzer
* **Official Daily NAV Sourcing**: Sourced directly from the official **Association of Mutual Funds in India (AMFI)** master database, ensuring 100% accurate Net Asset Values (NAV).
* **Comprehensive Metrics**: Calculates and evaluates compound annual growth rates (**1Y, 3Y, and 5Y CAGR**), annualized standard deviation (**Volatility**), **Sharpe Ratios**, and **Sortino Ratios**.
* **Interactive Charting**: Plots historical NAV performance over customizable time horizons (1Y, 3Y, 5Y) using interactive, rebased line charts that overlay benchmark performance on a common baseline of `100`.
* **Zero-Latency Search**: Features a word-tokenized local cache search engine that resolves queries instantly (0ms network lag) by splitting queries into words and matching them in any order.
* **Benchmark Disclosures**: Clearly discloses benchmark approximations and data freshness timestamps at the top of the analytics tables and chart legends.

### 3. 🗂️ Portfolio Allocator & Multi-Format Statement Parser
* **Broker Statement Uploader**: Supports drag-and-drop uploading of **PDF, Excel (XLSX/XLS), and CSV** statements exported from popular brokers (e.g. Groww, Zerodha, CAMS).
* **Structured Column Mapping**: Automatically scans and maps column headers like `Units`, `Invested Value`, and `Current Value` to extract values directly, preserving precise valuations down to the penny.
* **Direct Classification Extraction**: Maps `Category` and `Sub-category` columns from uploaded sheets directly as the asset class and sector. This aligns the split charts and diversification scores with your custom spreadsheet definitions.
* **Prefix-Based Matching Heuristics**: Compares sheet entries against local cached AMFI schemes using prefix-based intersection, resolving matches despite spelling variations, hyphens, or spacing.
* **Specificity & Word-Length Constraints**: 
  * Short words (3 letters or less, like `cap` or `mid`) must be exact matches to prevent collisions.
  * Preserves 2-letter AMC brand names (like `JM` or `NJ`).
  * Resolves multi-match collisions by calculating `specificity` (intersection / AMFI words) and using the shortest cleaned name as a tie-breaker.
* **Folio Number Filtering**: Automatically filters out large integers representing folio or account numbers, preventing them from contaminating units or valuation calculations.
* **Interactive Dashboard**: Displays total principal invested, current market valuations, net P&L absolute amount/return percentages, and dynamic allocation weight percentages.

### 4. 🪙 Calculators & Planners Suite (with Math Audits)
* **Calculation Transparency Panels**: Every calculator features a collapsible **"How This is Calculated & Excel Replication"** section displaying math formulas, variables, and step-by-step Excel/Google Sheets functions (e.g. `PMT`, `FV`).
* **Multi-Frequency SIP Simulator**: Supports **Daily, Weekly, Monthly, Quarterly, and Yearly** SIP investing intervals with dynamic slider ranges, period-compounding calculations, and dynamically generated spreadsheet replication formulas.
* **13 New Inflation-Adjusted Calculators**:
  * **SSY (Sukanya Samriddhi Yojana)**: Models 21-year sovereign savings for girl children under the 8.2% tax-free rate.
  * **EPF (Employee Provident Fund)**: Simulates 12% employee/employer splits, EPS ₹1,250 caps, annual pay raises, and discounts the final corpus.
  * **RD (Recurring Deposit)**: Standard bank recurring deposits compounded quarterly.
  * **ROI & CAGR**: Calculates absolute yields and compound annual growth rate with inflation-discounted real CAGRs.
  * **HRA Exemption**: Calculates Section 10(13A) tax exemptions and projects rent inflation vs. salary apprasial efficiency.
  * **NSC (National Savings Certificate)**: Compounding savings under the 7.7% rate with Year 1-4 Section 80C reinvested tax deductions.
  * **Advanced Income Tax**: Old vs. New slabs comparison side-by-side with a **Bracket Creep Simulator** demonstrating how inflation-matching pay rises hike your real tax rate.
  * **Gratuity**: Calculates gratuity benefits under the Payment of Gratuity Act and discounts future payouts.
  * **APY (Atal Pension Yojana)**: Maps official contributions and maps the post-retirement fixed pension decay under inflation.
  * **TDS**: Computes transactional tax deductions, limits, and PAN card missing penalty rates.
  * **POMIS (Post Office Monthly Income Scheme)**: Models the erosion of both flat monthly interest income and the principal returned at 5 years.
  * **SCSS (Senior Citizens Savings Scheme)**: Enforces the ₹30L limit and quarterly SCSS payouts, discounting both for inflation.
  * **XIRR**: Computes the Extended Internal Rate of Return for irregular transaction cash flows using a Newton-Raphson numerical solver, showing nominal vs. real yields.
* **Step Up SIP Simulator**: Compare the compounding power and maturity value of a flat monthly SIP against a Step Up SIP (increasing yearly by a percentage or a fixed amount) using interactive area charts.
* **Loan EMI & Prepayment Simulator**: Calculate monthly EMIs and simulate interest savings/tenure reduction from extra monthly/annual prepayments.
* **Emergency Fund & Liquid Runway Planner**: Determine risk-adjusted emergency reserve targets based on job sector stability and family dependent buffers.
* **FIRE Early Retirement Simulator**: Simulate lean/fat early retirement target corpuses using safe withdrawal rate (SWR) rules and calculate required monthly bridging SIPs.
* **SWP Planner**: Simulate Systematic Withdrawal Plans (SWP) to design sustainable retirement cash flows, highlighting safe withdrawal rates (4% rule) and sequence of returns risk.
* **Goal & Retirement Planners**: Plot future corpus requirements factoring in inflation, annual escalations, and target maturity horizons.
* **NPS & PPF Simulators**: Run returns compounding models for public pension and provident schemes.
* **Universal PDF Payout Download**: Features a responsive **"Download PDF"** button on every calculator page that utilizes custom print CSS styles. Hides interactive menus, sidebars, and input sliders to save clean, structured A4 PDF report files to phone or desktop.
* **Macroeconomic Benchmarks**: Displays active G-Sec 10Y yields and baseline CPI inflation rates sourced dynamically.

### 5. ⚖️ Tax Regime Hub (Union Budget 2025)
* **Budget 2025 Slabs**: Completely aligned with the revised **New Tax Regime** slabs for FY 2025-26 & FY 2026-27:
  * Up to ₹4 Lakhs: NIL
  * ₹4L to ₹8L: 5%
  * ₹8L to ₹12L: 10%
  * ₹12L to ₹16L: 15%
  * ₹16L to ₹20L: 20%
  * ₹20L to ₹24L: 25%
  * Above ₹24L: 30%
* **Standard Deductions**: Formulated to use the default **₹75,000** standard deduction for the New Regime and **₹50,000** for the Old Regime.
* **Section 87A Rebate**: Rebates tax fully up to a taxable income of **₹12,00,000**, meaning salaried individuals earning up to **₹12.75 Lakhs** pay zero tax.
* **Switch Guidelines Panel**: Explains the rules for switching regimes annually (for salaried individuals) versus once-in-a-lifetime (for business/professional income).

### 6. 📚 Beyond FDs & Learning Hub
* Educational reference guides describing debt instruments, credit risk structures, interest rate mechanics, and yields.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js (App Router)](https://nextjs.org/) (force-dynamic server rendering for daily updates)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (strict type-safe financial schemas)
* **AI Orchestration**: [LangChain](https://www.langchain.com/) & custom Single-Pass Tool-Binding Pipeline
* **LLM Engine**: Groq ([Llama 3.1 8B Instant](https://groq.com/) / Llama 3.3 70B) & Google Gemini ([Gemini Flash](https://ai.google.dev/)) with dynamic automated failover
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (dynamic Dark/Light theme switching support)
* **Charts**: [Recharts](https://recharts.org/) (smooth vector graphs, tooltips, and legends)
* **Icons**: [Lucide React](https://lucide.dev/) (consistent design elements)

---


## 🔒 Legal Disclaimer & SEBI Positioning
valarchiX is built solely as an interactive simulator to help users understand business economics, tax regimes, compounding mathematics, and mutual fund valuation metrics. The platform never issues buy, sell, or hold recommendations for any security or asset class. valarchiX is not a registered investment advisor with SEBI. Always seek the services of a certified financial planner, tax consultant, or SEBI-registered investment advisor before making real-world investments. 

Read our full disclosures at `/disclaimer`.
