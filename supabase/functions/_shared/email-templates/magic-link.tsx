/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  name?: string
}

const LOGO_URL = 'https://rvxpqwscfmygfqanxfbq.supabase.co/storage/v1/object/public/email-assets/ufixi-logo.svg'

export const MagicLinkEmail = ({ siteName, confirmationUrl, name }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Ufixi login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt="Ufixi" width="90" height="32" style={logo} />
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>
            {name ? <><span style={gradientName}>{name}</span>, here's your login link</> : 'Your login link'}
          </Heading>
          <Text style={text}>
            Click the button below to log in to Ufixi. This link will expire shortly.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Log In
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { padding: '0', maxWidth: '480px', margin: '0 auto' }
const headerSection = { backgroundColor: '#FDF6EE', padding: '28px 25px 20px', borderRadius: '16px 16px 0 0' }
const logo = { margin: '0 auto', display: 'block' as const }
const contentSection = { backgroundColor: '#FDF6EE', padding: '8px 25px 32px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#00172F', margin: '0 0 16px', letterSpacing: '-0.02em' }
const gradientName = { background: 'linear-gradient(135deg, #E8530A 0%, #D93870 100%)', WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent', backgroundClip: 'text' as const }
const text = { fontSize: '15px', color: '#00172F', lineHeight: '1.6', margin: '0 0 20px', letterSpacing: '0.03em' }
const button = { background: 'linear-gradient(135deg, #E8530A 0%, #D93870 100%)', backgroundColor: '#E8530A', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, margin: '8px 0 0' }
const footer = { fontSize: '12px', color: 'rgba(0, 23, 47, 0.38)', margin: '24px 25px 0', letterSpacing: '0.03em' }
