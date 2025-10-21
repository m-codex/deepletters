
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the dashboard
        page.goto("http://localhost:3000/dashboard")

        # Check if we are on the login page
        if page.is_visible("input[placeholder='you@example.com']"):
            page.get_by_placeholder("you@example.com").fill("testuser@test.com")
            page.get_by_role("button", name="Send Magic Link").click()
            page.wait_for_timeout(1000)
            page.goto("http://localhost:3000/dashboard")
            page.wait_for_selector("main.flex-1")

        # Take a screenshot of the dashboard to see its state
        page.screenshot(path="jules-scratch/verification/dashboard_state.png")

        # Click on the first letter card
        first_letter_card = page.query_selector(".grid > div")
        if first_letter_card:
            first_letter_card.click()
            page.wait_for_selector(".fixed.inset-0", timeout=5000) # Wait for the modal
            page.screenshot(path="jules-scratch/verification/verification.png")
            print("Successfully captured modal screenshot.")
        else:
            print("No letter cards found on the dashboard. Screenshot of the empty dashboard was taken.")

        browser.close()

if __name__ == "__main__":
    run()
