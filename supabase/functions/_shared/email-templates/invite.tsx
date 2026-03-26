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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

const LOGO_URL = 'https://rvxpqwscfmygfqanxfbq.supabase.co/storage/v1/object/public/email-assets/ufixi-logo.svg'

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join Ufixi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt="Ufixi" width="90" height="32" style={logo} />
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>You've been invited</Heading>
          <Text style={text}>
            You've been invited to join{' '}
            <Link href={siteUrl} style={link}><strong>Ufixi</strong></Link>
            . Click below to accept the invitation and create your account.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accept Invitation
          </Button>
        </Section>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { padding: '0', maxWidth: '480px', margin: '0 auto' }
const headerSection = { backgroundColor: '#FDF6EE', padding: '28px 25px 20px', borderRadius: '16px 16px 0 0' }
const logo = { margin: '0 auto', display: 'block' as const }
const contentSection = { backgroundColor: '#FDF6EE', padding: '8px 25px 32px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#00172F', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: 'rgba(0, 23, 47, 0.55)', lineHeight: '1.6', margin: '0 0 20px', letterSpacing: '0.03em' }
const link = { color: '#00172F', textDecoration: 'underline' }
const button = { background: 'linear-gradient(135deg, #E8530A 0%, #D93870 100%)', backgroundColor: '#E8530A', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, margin: '8px 0 0' }
const footer = { fontSize: '12px', color: 'rgba(0, 23, 47, 0.38)', margin: '24px 25px 0', letterSpacing: '0.03em' }
