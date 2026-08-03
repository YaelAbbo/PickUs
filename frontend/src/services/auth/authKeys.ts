export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  token: () => [...authKeys.all, 'token'] as const,
};
