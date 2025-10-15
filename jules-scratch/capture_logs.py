from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open a file to write the console logs
        with open("console_logs.txt", "w") as f:
            # Capture and write console messages to the file
            page.on('console', lambda msg: f.write(f"CONSOLE: {msg.text}\n"))

            try:
                # Navigate to the landing page and clear local storage for a clean slate
                page.goto("http://localhost:3002", timeout=60000)
                page.evaluate("() => localStorage.clear()")
                page.reload()

                # Navigate through the creation flow
                page.click("text=Create Your Letter", timeout=5000)

                name_input = page.locator('input[placeholder="Name"]')
                # Use expect to wait for the name input to be visible
                expect(name_input).to_be_visible(timeout=10000)

                name_input.fill("Test Sender")
                save_button = page.locator("text=Save Name")
                save_button.click()
                # Wait for the UI to update after saving the name
                expect(name_input).to_be_hidden()

                # Now that the name is saved, the textarea should be visible
                textarea = page.locator("textarea")
                expect(textarea).to_be_visible(timeout=5000)
                textarea.click()

                page.click("text=Next Step")

                page.wait_for_selector("text=Record your voice", timeout=5000)
                page.click("text=Next Step")

                # Wait for the music step to load fully
                page.wait_for_selector("text=Choose Background Music", timeout=5000)

                # Give a moment for all async operations and logs to complete
                page.wait_for_timeout(3000)

                print("Script finished successfully. Logs captured in console_logs.txt")

            except Exception as e:
                print(f"An error occurred: {e}")
                f.write(f"SCRIPT ERROR: {e}\n")

            finally:
                browser.close()

if __name__ == "__main__":
    run()
