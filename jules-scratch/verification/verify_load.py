
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:3000/create/write")

    # Check if the "Save" button is visible
    page.wait_for_selector('text=Save', state='visible')

    print("Verification successful!")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
