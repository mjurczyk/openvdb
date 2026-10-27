// NOTE Shows the loading indicator while one or more keys load.
// The spinner is a CSS transform animation. It keeps moving when the main thread is busy.
const loadingElement = document.querySelector('#loading');
const loadingKeys = new Set();

export const setLoading = (key, loading) => {
  if (loading) {
    loadingKeys.add(key);
  } else {
    loadingKeys.delete(key);
  }

  loadingElement.style.display = loadingKeys.size > 0 ? '' : 'none';
};
