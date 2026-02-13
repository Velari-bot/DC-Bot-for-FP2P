declare module 'validator' {
  export function isEmail(email: string): boolean;
  export default validator;
  const validator: {
    isEmail: (email: string) => boolean;
    [key: string]: any;
  };
}

