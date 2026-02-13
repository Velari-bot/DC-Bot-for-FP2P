export const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('access_token');
};

export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

export const removeAccessToken = () => {
  localStorage.removeItem('access_token');
};

export const saveAccessToken = token => {
  localStorage.setItem('access_token', token);
};

export const removeAccessTokenFromURL = () => {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);

  params.delete('access_token');

  const newQuery = params.toString();
  const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;

  window.history.replaceState({}, document.title, newUrl);
};