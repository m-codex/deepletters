from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # This is a sample share code. In a real scenario, we'd need a valid one.
        # Since I cannot create a letter myself, I will rely on the user to have a valid letter.
        # I am using a placeholder URL, which will result in a "Letter not found" page.
        # This will still allow me to verify the UI of the page where the form is located.
        page.goto("http://localhost:3000/finalized")
        page.wait_for_selector('h2:has-text("Your Letter is Ready!")')
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

if __name__ == "__main__":
    run()
