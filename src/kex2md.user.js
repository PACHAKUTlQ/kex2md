// ==UserScript==
// @name         kex2md
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Format KaTeX Code generated by GPT into Markdown-compatible LaTeX
// @author       Pachakutiq
// @match        https://chatgpt.com/*
// @match        https://aistudio.google.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Selector for the existing Copy buttons
  const copyButtonSelectors = [
    'button.rounded-lg.text-token-text-secondary.hover\\:bg-token-main-surface-secondary[aria-label="Copy"][data-testid="copy-turn-action-button"]',
    'button.mat-mdc-menu-item.mat-focus-indicator.ng-star-inserted[role="menuitem"]',
  ];

  function addFormatButton(copyButton) {
    // Check if the Format KaTeX button is already added
    if (
      copyButton.nextSibling &&
      copyButton.nextSibling.classList &&
      copyButton.nextSibling.classList.contains("format-katex-button")
    ) {
      return;
    }

    // Create the Format KaTeX button
    const formatButton = document.createElement("button");
    formatButton.textContent = "Copy md";
    formatButton.className =
      "rounded-lg text-token-text-secondary hover:bg-token-main-surface-secondary format-katex-button";
    formatButton.style.marginLeft = "5px";

    // Add click event listener
    formatButton.addEventListener("click", async function () {
      // Simulate click on the corresponding Copy button
      copyButton.click();

      // Wait a bit for the clipboard to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Read text from clipboard
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch (err) {
        console.error("Failed to read clipboard contents: ", err);
        alert(
          "Failed to read clipboard contents. Please ensure the browser has permissions to access the clipboard."
        );
        return;
      }

      // Perform replacements
      text = formatKaTeX(text);

      // Save modified text to clipboard
      try {
        await navigator.clipboard.writeText(text);
        // alert('Formatted KaTeX copied to clipboard.');
      } catch (err) {
        console.error("Failed to write to clipboard: ", err);
        // alert('Failed to write to clipboard. Please ensure the browser has permissions to access the clipboard.');
      }
    });

    // Insert the Format KaTeX button after the Copy button
    copyButton.parentNode.insertBefore(formatButton, copyButton.nextSibling);
  }

  // Observe the body for added nodes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            addFormatButtons(node);
          }
        });
      }
    });
  });

  // Replace `\( ` and `\(` with `$`, `\[ ` and `\[` with `$$`
  function formatKaTeX(text) {
    let formattedText = text;
    formattedText = formattedText.replace(/\\\( /g, "$").replace(/ \\\)/g, "$");
    formattedText = formattedText.replace(/\\\(/g, "$").replace(/\\\)/g, "$");
    formattedText = formattedText
      .replace(/\\\[ /g, "$$")
      .replace(/ \\\]/g, "$$");
    formattedText = formattedText.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");

    // Replace `$E = m c^2$` to `$$\nE = m c^2\n$$`
    formattedText = formattedText
      .split("\n")
      .map((line) => {
        if (
          line.length > 2 &&
          line.startsWith("$") &&
          line.endsWith("$") &&
          line.indexOf("$", 1) === line.length - 1
        ) {
          return `$$\n${line.slice(1, -1)}\n$$`;
        }
        return line;
      })
      .join("\n");

    // Replace `$$E = m c^2$$` to `$$\nE = m c^2\n$$`
    formattedText = formattedText
      .split("\n")
      .map((line) => {
        if (
          line.length > 4 &&
          line.startsWith("$$") &&
          line.endsWith("$$") &&
          line.indexOf("$", 2) === line.length - 2
        ) {
          return `$$\n${line.slice(2, -2)}\n$$`;
        }
        return line;
      })
      .join("\n");

    return formattedText;
  }

  // Function to query-select all valid buttons and add format button
  function addFormatButtons(node) {
    // Check if the node is a GPT Copy button or a Gemini Copy button
    if (window.location.hostname.includes("chatgpt.com")) {
      const copyButtonSelector = copyButtonSelectors[0];
      let buttons = node.querySelectorAll(copyButtonSelector);
      buttons.forEach((button) => {
        addFormatButton(button);
      });
    } else if (window.location.hostname.includes("aistudio.google.com")) {
      const copyButtonSelector = copyButtonSelectors[1];
      let buttons = node.querySelectorAll(copyButtonSelector);
      buttons.forEach((button) => {
        if (button.querySelector("span > span.copy-markdown-button")) {
          addFormatButton(button);
        }
      });
    }
  }

  observer.observe(document.body, { childList: true, subtree: true });
})();
