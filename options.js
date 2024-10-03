document.addEventListener('DOMContentLoaded', () => {
    const hideCarouselCheckbox = document.getElementById('hideCarousel');
    const hideStoriesCheckbox = document.getElementById('hideStories');
    const autoExpandFollowedChannelsCheckbox = document.getElementById('autoExpandFollowedChannels');
    const saveButton = document.getElementById('saveButton');
    const status = document.getElementById('status');
  
    // Load saved preferences
    chrome.storage.local.get({
      hideCarousel: true,
      hideStories: true,
      autoExpandFollowedChannels: true
    }, (items) => {
      hideCarouselCheckbox.checked = items.hideCarousel;
      hideStoriesCheckbox.checked = items.hideStories;
      autoExpandFollowedChannelsCheckbox.checked = items.autoExpandFollowedChannels;
    });
  
    // Save preferences when the Save button is clicked
    saveButton.addEventListener('click', () => {
      const preferences = {
        hideCarousel: hideCarouselCheckbox.checked,
        hideStories: hideStoriesCheckbox.checked,
        autoExpandFollowedChannels: autoExpandFollowedChannelsCheckbox.checked
      };
  
      chrome.storage.local.set(preferences, () => {
        // Notify the user that the preferences were saved
        status.textContent = 'Preferences saved!';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      });
    });
  });
