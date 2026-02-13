// export const CLIENT_URL = process.env.REACT_APP_NODE_ENV == "development" ? process.env.REACT_APP_DEV_CLIENT_URL : process.env.REACT_APP_PROD_CLIENT_URL;
// export const SERVER_URL = process.env.REACT_APP_NODE_ENV == "development" ? process.env.REACT_APP_DEV_SERVER_URL : process.env.REACT_APP_PROD_SERVER_URL;

export const API_ROUTE = "/api";
export const ASSETS_URL = "https://assets.fortnitepathtopro.com";

export const errorMessage = err => {
  return err?.response?.data?.message;
};