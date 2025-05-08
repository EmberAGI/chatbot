import NextAuth from 'next-auth';

import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { parseSiweMessage, validateSiweMessage } from 'viem/siwe';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials: any) {
        try {
          const siweMessage = parseSiweMessage(credentials?.message);

          if (
            !validateSiweMessage({
              address: siweMessage?.address,
              message: siweMessage,
            })
          ) {
            return null;
          }

          return {
            id: siweMessage.address,
          };
        } catch (e) {
          console.error('Error authorizing user', e);
          return null;
        }
      },
      credentials: {
        message: {
          label: 'Message',
          placeholder: '0x0',
          type: 'text',
        },
        signature: {
          label: 'Signature',
          placeholder: '0x0',
          type: 'text',
        },
      },
      name: 'Ethereum',
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // @ts-ignore
      session.address = token.sub;
      // @ts-ignore
      session.user = {
        // @ts-ignore
        id: 0,
        name: token.sub,
      };
      return session;
    },
  },
});
