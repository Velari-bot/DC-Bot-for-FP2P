import { AUTH_URL } from './constants';

export const EPIC_URL = process.env.REACT_APP_NODE_ENV == "development" ? `https://dev.nobleprac.com/auth/epic` : `${AUTH_URL}/auth/epic`;
