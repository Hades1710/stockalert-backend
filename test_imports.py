try:
    from app import config
    print("config OK")
except Exception as e:
    print(f"config FAILED: {e}")

try:
    from app import database
    print("database OK")
except Exception as e:
    print(f"database FAILED: {e}")

try:
    from app.routers import auth
    print("auth OK")
except Exception as e:
    print(f"auth FAILED: {e}")

try:
    from app.routers import watchlist
    print("watchlist OK")
except Exception as e:
    print(f"watchlist FAILED: {e}")

try:
    from app.services import market_data
    print("market_data OK")
except Exception as e:
    print(f"market_data FAILED: {e}")

try:
    from app.services import alert_engine
    print("alert_engine OK")
except Exception as e:
    print(f"alert_engine FAILED: {e}")

try:
    from app.tasks import polling
    print("polling OK")
except Exception as e:
    print(f"polling FAILED: {e}")

try:
    from app import main
    print("main OK")
except Exception as e:
    print(f"main FAILED: {e}")