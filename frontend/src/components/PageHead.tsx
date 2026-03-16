import { APP_NAME } from '@constants';
import Head from 'expo-router/head';
import type { FC } from 'react';

export type PageHeadProps = { title?: string };

export const PageHead: FC<PageHeadProps> = ({ title }) => (
  <Head>
    <title>{title ? `${APP_NAME} - ${title}` : APP_NAME}</title>
  </Head>
);
