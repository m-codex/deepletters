
import re
from playwright.sync_api import Page, expect
import time

def test_dashboard_features(page: Page):
    print("Running Playwright script...")
    try:
        time.sleep(5) # Wait for the server to start
        page.goto("http://localhost:3000/dashboard")
        page.wait_for_selector("text=Dashboard")
        page.screenshot(path="jules-scratch/verification/dashboard.png")
        print("Screenshot taken successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

# This is a synchronous script, so we need to run it with the sync_api
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    test_dashboard_features(page)
    browser.close()
