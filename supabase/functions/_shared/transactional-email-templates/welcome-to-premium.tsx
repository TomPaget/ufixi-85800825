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

import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://rvxpqwscfmygfqanxfbq.supabase.co/storage/v1/object/public/email-assets/ufixi-logo.svg'
const SITE_NAME = 'ufixi'

interface WelcomeToPremiumProps {
  name?: string
}

const WelcomeToPremiumEmail = ({ name }: WelcomeToPremiumProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Ufixi Premium</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt="Ufixi" width="90" height="32" style={logo} />
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>
            Welcome aboard, {name ? <span style={gradientName}>{name}</span> : 'friend'}!
          </Heading>
          <Text style={text}>
            You've just upgraded to Ufixi Premium — great choice.
            You now have access to our full suite of home diagnosis tools.
          </Text>
          <Text style={textBold}>Here's what you've unlocked:</Text>
          <Text style={featureList}>
            ✦ Unlimited saved diagnoses{'\n'}
            ✦ 45-day scan history{'\n'}
            ✦ Ad-free experience{'\n'}
            ✦ Priority AI analysis{'\n'}
            ✦ Landlord letter generator{'\n'}
            ✦ PDF exports
          </Text>
          <Text style={text}>
            Ready to get started? Scan your first issue and let Ufixi
            do the hard work for you.
          </Text>
          <Button style={button} href="https://ufixi.lovable.app/home">
            Start Diagnosing
          </Button>
        </Section>
        <Text style={footer}>
          Thanks for supporting Ufixi. If you have any questions,
          we're always here to help.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeToPremiumEmail,
  subject: 'Welcome to Ufixi Premium — you legend',
  displayName: 'Welcome to Premium',
  previewData: { name: 'Tom' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { padding: '0', maxWidth: '480px', margin: '0 auto' }
const headerSection = { backgroundColor: '#FDF6EE', padding: '28px 25px 20px', borderRadius: '16px 16px 0 0' }
const logo = { margin: '0 auto', display: 'block' as const }
const contentSection = { backgroundColor: '#FDF6EE', padding: '8px 25px 32px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#00172F', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: 'rgba(0, 23, 47, 0.55)', lineHeight: '1.6', margin: '0 0 20px', letterSpacing: '0.03em' }
const textBold = { fontSize: '15px', color: '#00172F', lineHeight: '1.6', margin: '0 0 8px', letterSpacing: '0.03em', fontWeight: 'bold' as const }
const featureList = { fontSize: '14px', color: 'rgba(0, 23, 47, 0.55)', lineHeight: '2', margin: '0 0 20px', letterSpacing: '0.03em', whiteSpace: 'pre-line' as const, paddingLeft: '8px' }
const button = { background: 'linear-gradient(135deg, #E8530A 0%, #D93870 100%)', backgroundColor: '#E8530A', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, margin: '8px 0 0' }
const footer = { fontSize: '12px', color: 'rgba(0, 23, 47, 0.38)', margin: '24px 25px 0', letterSpacing: '0.03em' }
