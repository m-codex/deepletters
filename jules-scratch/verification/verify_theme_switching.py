from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Click the "Create Your Letter" button
    page.click("text=Create Your Letter")

    # Set the sender name
    page.fill("input[placeholder='Name']", "Test Sender")
    page.click("text=Save Name")

    # Toggle the theme to dark
    page.click("[aria-label='Toggle Theme']")

    # Take a screenshot of the dark theme
    page.screenshot(path="jules-scratch/verification/dark_theme.png")

    # Toggle the theme back to light
    page.click("[aria-label='Toggle Theme']")

    # Take a screenshot of the light theme
    page.screenshot(path="jules-scratch/verification/light_theme.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
