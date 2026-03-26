/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://rvxpqwscfmygfqanxfbq.supabase.co/storage/v1/object/public/email-assets/ufixi-logo.svg'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Ufixi verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt="Ufixi" width="90" height="32" style={logo} />
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>Verification code</Heading>
          <Text style={text}>Use the code below to confirm your identity:</Text>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { padding: '0', maxWidth: '480px', margin: '0 auto' }
const headerSection = { backgroundColor: '#FDF6EE', padding: '28px 25px 20px', borderRadius: '16px 16px 0 0' }
const logo = { margin: '0 auto', display: 'block' as const }
const contentSection = { backgroundColor: '#FDF6EE', padding: '8px 25px 32px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#00172F', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: 'rgba(0, 23, 47, 0.55)', lineHeight: '1.6', margin: '0 0 20px', letterSpacing: '0.03em' }
const codeStyle = { fontFamily: "'Helvetica Neue', Helvetica, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#E8530A', margin: '0 0 24px', letterSpacing: '0.15em' }
const footer = { fontSize: '12px', color: 'rgba(0, 23, 47, 0.38)', margin: '24px 25px 0', letterSpacing: '0.03em' }
