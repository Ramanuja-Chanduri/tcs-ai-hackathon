# TradeSummaryAI

**AI-Powered Trade Intelligence Platform**

TradeSummaryAI is a modern FastAPI application that ingests trade data (CSV/JSON), processes it through an intelligent LangGraph pipeline, and generates AI-powered summaries and insights across portfolios, individual tickers, and market domains.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![LangGraph](https://img.shields.io/badge/LangGraph-powered-orange)

## Features

- **Multi-Format Data Ingestion**: Upload trade data via CSV or JSON files
- **AI-Powered Summaries**: Generate intelligent summaries at three levels:
  - **Overall Portfolio Summary**: Executive summary with volume analysis, sector overview, and risk flags
  - **Per-Ticker Summaries**: Individual stock analysis with trading activity and market context
  - **Per-Domain Summaries**: Sector-level insights with buy/sell sentiment analysis
- **Real-Time Data Enrichment**: Fetches stock performance data and company information via web search (Tavily)
- **Interactive Web Dashboard**: Modern, responsive UI for viewing summaries and metrics
- **Persistent Storage**: SQLite database with session-based data organization
- **Comprehensive Metrics**: Calculate and store key trading metrics (volume, buy/sell ratios, etc.)
- **RESTful API**: Full API support for programmatic access

## Architecture

### Tech Stack

| Component | Technology |
|-----------|------------|
| Backend Framework | FastAPI |
| Pipeline Orchestration | LangGraph |
| LLM Provider | Ollama (llama3.2:1b) / Groq |
| Embeddings | HuggingFace (sentence-transformers/all-MiniLM-L6-v2) |
| Web Search | Tavily / DuckDuckGo |
| Database | SQLite |
| Frontend | Vanilla HTML/CSS/JS |

### Pipeline Flow

```
┌─────────────┐    ┌─────────────────┐     ┌──────────────────┐
│   Upload    │───▶│  Ingest (CSV/   │───▶│ Filter & Extract │
│  (CSV/JSON) │    │     JSON)       │     │ (Tickers/Domains)│
└─────────────┘    └─────────────────┘     └──────────────────┘
                                                   │
┌─────────────────┐    ┌─────────────────┐         ▼
│ Generate        │◄───│ Build           │◄──┌──────────────────┐
│ Summaries       │    │ Enrichment      │   │ Fetch            │
│ (LLM-Powered)   │    │ (JSON Context)  │   │ Enrichment       │
└─────────────────┘    └─────────────────┘   │ (Web Search)     │
                                             └──────────────────┘
                                                        │
                                               ┌──────────────────┐
                                               │ Calculate        │
                                               │ Metrics          │
                                               └──────────────────┘
```

## Installation

### Prerequisites

- Python 3.11+
- [Ollama](https://ollama.ai/) installed locally (for LLM) OR Groq API key
- API keys for external services

### 1. Clone the Repository

```bash
git clone https://github.com/Ramanuja-Chanduri/trade-stock-summaries.git
cd TradeSummaryAI
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
HF_TOKEN=your_huggingface_token_here
TAVILY_API_KEY=your_tavily_api_key_here
```

**Note**: If using Ollama locally (default), you don't need `GROQ_API_KEY`. The application uses `llama3.2:1b` model by default.

### 5. Setup Ollama (if using local LLM)

```bash
# Pull the required model
ollama pull llama3.2:1b
```

### 6. Run the Application

```bash
python main.py
```

The application will start on `http://localhost:8000`

## Usage

### Web Interface

1. Open your browser and navigate to `http://localhost:8000`
2. Upload a trade data file (CSV or JSON format)
3. View AI-generated summaries across three tabs:
   - **Overall Summary**: Portfolio-wide analysis
   - **By Ticker**: Individual stock summaries
   - **By Domain**: Sector-level insights

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve web frontend |
| `/api/upload` | POST | Upload trade data file |
| `/api/summary/overall/{session_id}` | GET | Get overall portfolio summary |
| `/api/summary/ticker/{session_id}/{ticker}` | GET | Get summary for specific ticker |
| `/api/summary/domain/{session_id}/{domain}` | GET | Get summary for specific domain |
| `/api/metrics/{session_id}` | GET | Get calculated metrics |
| `/api/tickers/{session_id}` | GET | List all tickers in session |
| `/api/domains/{session_id}` | GET | List all domains in session |

### Sample Data

A sample trade file is provided at `sample_data/sample_trades.csv` for testing:

```csv
trade_id,timestamp,ticker,company_name,domain,trade_type,quantity,price,total_value,currency,exchange,trader_id
T001,2026-02-20T09:30:00Z,AAPL,Apple Inc.,Technology,BUY,500,182.50,91250.00,USD,NASDAQ,TR001
T002,2026-02-20T09:33:00Z,GOOGL,Alphabet Inc.,Technology,BUY,200,141.20,28240.00,USD,NASDAQ,TR002
...
```

### API Example

```bash
# Upload trade data
curl -X POST "http://localhost:8000/api/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_data/sample_trades.csv"

# Response:
# {
#   "session_id": "uuid-string",
#   "status": "success",
#   "trade_count": 20,
#   "tickers": ["AAPL", "GOOGL", ...],
#   "domains": ["Technology", "Finance", ...]
# }

# Get overall summary
curl "http://localhost:8000/api/summary/overall/{session_id}"

# Get ticker summary
curl "http://localhost:8000/api/summary/ticker/{session_id}/AAPL"

# Get domain summary
curl "http://localhost:8000/api/summary/domain/{session_id}/Technology"
```

## Project Structure

```
TradeSummaryAI/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables (not in git)
├── .gitignore
├── README.md
│
├── src/                   # Source code
│   ├── __init__.py
│   ├── config.py          # Configuration management
│   ├── database.py        # SQLite database operations
│   ├── llm_client.py      # LLM and embedding clients
│   ├── logger.py          # Logging utilities
│   ├── models.py          # Pydantic models
│   ├── pipeline.py        # LangGraph pipeline orchestration
│   └── nodes/             # Pipeline nodes
│       ├── __init__.py
│       ├── ingest.py        # Data ingestion (CSV/JSON)
│       ├── filter_extract.py # Filter and extract tickers/domains
│       ├── calculate_metrics.py # Calculate trading metrics
│       ├── fetch_enrichment.py  # Fetch external data (web search)
│       ├── build_enrichment.py  # Build enrichment context
│       └── generate_summaries.py # Generate AI summaries
│
├── static/                # Frontend assets
│   ├── index.html         # Main web interface
│   ├── styles.css         # Styling
│   └── app.js             # Frontend JavaScript
│
├── sample_data/           # Sample data for testing
│   └── sample_trades.csv
│
└── logs/                  # Application logs
```

## Data Schema

### Trade Record Format

| Field | Type | Description |
|-------|------|-------------|
| `trade_id` | string | Unique trade identifier |
| `timestamp` | string | ISO 8601 timestamp |
| `ticker` | string | Stock ticker symbol (uppercase) |
| `company_name` | string | Company name (optional) |
| `domain` | string | Market sector/domain |
| `trade_type` | string | BUY or SELL |
| `quantity` | integer | Number of shares |
| `price` | float | Price per share |
| `total_value` | float | Total trade value |
| `currency` | string | Currency code (default: USD) |
| `exchange` | string | Stock exchange (optional) |
| `trader_id` | string | Trader identifier (optional) |

## Configuration

### LLM Options

Edit `src/llm_client.py` to switch between LLM providers:

```python
# Option 1: Ollama (local, default)
llm = ChatOllama(model="llama3.2:1b", temperature=0.7)

# Option 2: Groq (cloud-based)
llm = ChatGroq(
    model="openai/gpt-oss-20b", 
    api_key=settings.GROQ_API_KEY, 
    temperature=0.7
)
```

### Search Provider

```python
# Option 1: Tavily (default)
search_tool = TavilySearchResults(api_key=settings.TAVILY_API_KEY, max_results=5)

# Option 2: DuckDuckGo
search_tool = DuckDuckGoSearchResults(max_results=5)
```

## Development

### Running Tests

```bash
# Add tests here
pytest
```

### Database Schema

The application automatically creates the following SQLite tables on startup:

- `raw_trades`: Stores ingested trade records
- `metrics`: Stores calculated metrics
- `enrichment_data`: Stores web search enrichment data
- `summaries`: Stores AI-generated summaries



## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Pipeline powered by [LangGraph](https://langchain-ai.github.io/langgraph/)
- LLM capabilities via [Ollama](https://ollama.ai/) and [Groq](https://groq.com/)
- Web search by [Tavily](https://tavily.com/)
