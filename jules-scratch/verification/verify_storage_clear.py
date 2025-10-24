
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:3000/create/write")

    # Check if the letter writing view is already present
    if not page.is_visible('textarea[placeholder*="Dear friend"]'):
        # Fill in sender and recipient names
        page.get_by_label("Your Name").fill("Test Sender")
        page.get_by_label("Recipient's Name").fill("Test Recipient")
        page.get_by_role("button", name="Save Names").click()

    # Wait for the textarea to be visible
    page.wait_for_selector('textarea[placeholder*="Dear friend"]', state='visible')

    # Add some text to the letter
    page.get_by_placeholder("Dear friend, I wanted to tell you...").fill("This is a test letter.")

    # Save the letter
    page.get_by_role("button", name="Save").click()

    # Wait for the "Saved!" message to appear and then disappear
    page.wait_for_selector('text=Saved!', state='visible')
    page.wait_for_selector('text=Saved!', state='hidden')

    # Click the "New" button
    page.get_by_role("button", name="New").click()

    # The discard dialog should appear for anonymous users
    page.wait_for_selector('text=Discard Draft', state='visible')
    page.get_by_role("button", name="Discard").click()

    # Reload the page
    page.reload()

    # Check that the sender name is pre-filled and the recipient name is empty
    sender_name = page.input_value('input[id="senderName"]')
    recipient_name = page.input_value('input[id="recipientName"]')

    assert sender_name == "Test Sender"
    assert recipient_name == ""

    print("Verification successful!")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
