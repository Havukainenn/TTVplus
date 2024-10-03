console.log("TTVplus content script loaded!");

let removalTimeout;
let observer;
const THROTTLE_DELAY = 100; // milliseconds
let clickShowMoreTimeout;
let isPageUnloading = false;

// Function to hide elements by selectors with error handling
function hideElements(selectors) {
  if (isPageUnloading) return;
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;
    elements.forEach(element => {
      if (isPageUnloading) return;
      try {
        element.style.display = 'none';
      } catch (error) {
        console.error(`Failed to hide element: ${selector}`, error);
      }
    });
  });
}

// Function to show elements by selectors with error handling
function showElements(selectors) {
  if (isPageUnloading) return;
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;
    elements.forEach(element => {
      if (isPageUnloading) return;
      try {
        element.style.display = '';
      } catch (error) {
        console.error(`Failed to show element: ${selector}`, error);
      }
    });
  });
}

// Function to adjust layout styles
function adjustLayout(selectors, styles) {
  if (isPageUnloading) return;
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;
    elements.forEach(element => {
      if (isPageUnloading) return;
      Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
      });
    });
  });
}

// Function to inject custom CSS based on user preferences
function injectCSS(preferences) {
  if (isPageUnloading) return;
  try {
    if (!document.head) {
      console.warn("document.head is not available. CSS injection skipped.");
      return;
    }
    // Remove existing style element if it exists
    const existingStyle = document.getElementById('ttvplus-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    const style = document.createElement('style');
    style.id = 'ttvplus-custom-css';
    let cssContent = '';

    if (preferences.hideShowMoreButton && preferences.autoExpandFollowedChannels) {
      cssContent += `
      /* Hide the "Show More" button */
      .side-nav-show-more-toggle__button,
      [data-a-target="side-nav-show-more-button"] {
          display: none !important;
      }
      `;
    }

    if (preferences.hideStories) {
      cssContent += `
      /* Hide the "Stories" section */
      [class*="storiesLeftNavSection"] {
          display: none !important;
      }
      `;
    }

    // Adjust the main content container if any elements are hidden
    if (preferences.hideCarousel || preferences.hideHeadliner) {
      cssContent += `
      /* Adjust the main content container to remove top margin and padding */
      [data-a-target="main-content"] {
          margin-top: 0 !important;
          padding-top: 0 !important;
      }
      `;
    }

    style.textContent = cssContent;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Error in injectCSS():", error);
  }
}

// Function to handle hiding and showing elements based on preferences
function handleElementVisibility(preferences) {
  if (isPageUnloading) return;

  let selectorsToHide = [];
  let selectorsToShow = [];

  if (preferences.hideCarousel) {
    selectorsToHide.push(
      '.featured-content-carousel',
      '.front-page-carousel',
      '[data-a-target="front-page-carousel"]'
    );
  } else {
    selectorsToShow.push(
      '.featured-content-carousel',
      '.front-page-carousel',
      '[data-a-target="front-page-carousel"]'
    );
  }

  if (preferences.hideHeadliner) {
    selectorsToHide.push(
      '[data-a-target="frontpage-headliner"]',
      '.headliner-ad',
      '[data-a-target="frontpage-headliner-layout"]'
    );
  } else {
    selectorsToShow.push(
      '[data-a-target="frontpage-headliner"]',
      '.headliner-ad',
      '[data-a-target="frontpage-headliner-layout"]'
    );
  }

  // Hide or show the "Stories" section
  const storiesSelector = '[class*="storiesLeftNavSection"]';
  if (preferences.hideStories) {
    selectorsToHide.push(storiesSelector);
  } else {
    selectorsToShow.push(storiesSelector);
  }

  hideElements(selectorsToHide);
  showElements(selectorsToShow);

  // Automatically click the "Show More" button if the user wants to auto-expand
  if (preferences.autoExpandFollowedChannels) {
    clickShowMoreRecursively();
    // After expanding, hide the button
    injectCSS(preferences);
  } else {
    // Stop any ongoing recursive clicks
    clearTimeout(clickShowMoreTimeout);
    // Make sure the button is visible for manual use
    showElements(['[data-a-target="side-nav-show-more-button"]']);
  }
}

// Function to automatically click the "Show More" button recursively
function clickShowMoreRecursively() {
  if (isPageUnloading) return;
  const showMoreButton = document.querySelector('[data-a-target="side-nav-show-more-button"]');
  if (showMoreButton) {
    showMoreButton.click();
    clickShowMoreTimeout = setTimeout(() => {
      clickShowMoreRecursively();
    }, 1000); // Adjust the delay as needed
  } else {
    clearTimeout(clickShowMoreTimeout);
  }
}

// MutationObserver setup with throttling
function setupMutationObserver() {
  observer = new MutationObserver((mutationsList) => {
    if (isPageUnloading) return;
    if (removalTimeout) return;
    removalTimeout = setTimeout(() => {
      applyUserPreferences();
      removalTimeout = null;
    }, THROTTLE_DELAY);
  });

  const config = { childList: true, subtree: true, attributes: true };
  const targetNode = document.body;

  if (targetNode) {
    observer.observe(targetNode, config);
    console.log("MutationObserver is active.");
  } else {
    console.log("Body element not found for MutationObserver.");
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  isPageUnloading = true;
  if (observer) {
    observer.disconnect();
  }
  if (removalTimeout) {
    clearTimeout(removalTimeout);
  }
  if (clickShowMoreTimeout) {
    clearTimeout(clickShowMoreTimeout);
  }
});

// Function to apply user preferences
function applyUserPreferences() {
  chrome.storage.local.get({
    hideCarousel: true,
    hideHeadliner: true,
    hideStories: true,
    hideShowMoreButton: true,
    autoExpandFollowedChannels: true
  }, (preferences) => {
    injectCSS(preferences);
    handleElementVisibility(preferences);
  });
}

// Initial execution
applyUserPreferences();
setupMutationObserver();
