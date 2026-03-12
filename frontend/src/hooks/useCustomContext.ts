import { useContext, type Context } from 'react';

export type UseCustomContextArgs<T> = { context: Context<T | null>; contextName: string };

export type UseCustomContextContent<T> = ReturnType<typeof useCustomContext<T>>;

export const useCustomContext = <T>({ context, contextName }: UseCustomContextArgs<T>) => {
  const contextValue = useContext(context);

  if (!contextValue) throw new Error(`${contextName} must be used inside ${contextName}Provider`);

  return contextValue;
};
