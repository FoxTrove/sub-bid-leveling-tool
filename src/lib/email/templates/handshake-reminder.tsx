import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const LOGO_URL = 'https://bidlevel.foxtrove.ai/bidlevel-logo.png'

interface HandshakeReminderEmailProps {
  firstName: string
  daysRemaining: number
  reminderType: 'day7' | 'day21' | 'day27'
}

export function HandshakeReminderEmail({
  firstName,
  daysRemaining,
  reminderType,
}: HandshakeReminderEmailProps) {
  const content = getContent(reminderType, daysRemaining)

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidLevel" style={logo} />
          </Section>

          <Heading style={h1}>{content.headline}</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>{content.intro}</Text>

          {reminderType === 'day7' && (
            <>
              <Text style={text}>
                If you haven't tried it yet, now's the perfect time—we're covering all the AI costs for the next {daysRemaining} days.
              </Text>

              <Section style={statsBox}>
                <Text style={statsTitle}>Fully-covered access</Text>
                <Text style={statsValue}>{daysRemaining} days left</Text>
                <Text style={statsSubtext}>Then just bring your own API key—BidLevel stays free</Text>
              </Section>
            </>
          )}

          {reminderType === 'day21' && (
            <>
              <Section style={warningBox}>
                <Text style={warningTitle}>Here's the deal</Text>
                <Text style={warningText}>
                  Other GCs pay $99-299/month for tools like this. As a HANDSHAKE partner, <strong>BidLevel is free for you forever</strong>—you only cover your own OpenAI API costs (~$1-3 per comparison, paid directly to OpenAI).
                </Text>
              </Section>

              <Text style={text}>
                Getting an API key takes 2 minutes:
              </Text>
              <Text style={listItem}>1. Go to platform.openai.com</Text>
              <Text style={listItem}>2. Create an account & add a payment method</Text>
              <Text style={listItem}>3. Generate an API key</Text>
              <Text style={listItem}>4. Paste it in your BidLevel settings</Text>

              <Text style={text}>
                That's it. No subscription to us. No monthly fees. Just pay-as-you-go directly to OpenAI for what you use.
              </Text>
            </>
          )}

          {reminderType === 'day27' && (
            <>
              <Section style={urgentBox}>
                <Text style={urgentTitle}>{daysRemaining} days to keep your free access</Text>
                <Text style={urgentText}>
                  Your HANDSHAKE partner access doesn't expire—but you need to add your OpenAI key to keep running comparisons. This takes 2 minutes.
                </Text>
              </Section>

              <Text style={text}>
                <strong>Remember:</strong> BidLevel is free for you. No subscription, ever. You only pay OpenAI directly for the AI costs (~$1-3 per comparison). That's the partner deal.
              </Text>
            </>
          )}

          <Section style={buttonContainer}>
            <Button
              style={reminderType === 'day27' ? urgentButton : button}
              href="https://bidlevel.foxtrove.ai/settings"
            >
              {reminderType === 'day7' ? 'View Dashboard' : 'Add Your API Key'}
            </Button>
          </Section>

          {reminderType !== 'day7' && (
            <Section style={helpBox}>
              <Text style={helpTitle}>Need help getting an API key?</Text>
              <Text style={helpText}>
                Check out{' '}
                <Link href="https://platform.openai.com/api-keys" style={link}>
                  OpenAI's API key page
                </Link>{' '}
                or reply to this email and we'll walk you through it.
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            BidLevel by Foxtrove
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function getContent(reminderType: 'day7' | 'day21' | 'day27', daysRemaining: number) {
  switch (reminderType) {
    case 'day7':
      return {
        preview: `${daysRemaining} days left of fully-covered access`,
        headline: `${daysRemaining} days of fully-covered access remaining`,
        intro: `You've had a week to try BidLevel with all AI costs on us. Have you had a chance to run a comparison yet?`,
      }
    case 'day21':
      return {
        preview: `Quick setup needed to keep your free partner access`,
        headline: `Action needed: ${daysRemaining} days to set up your API key`,
        intro: `Your 30-day fully-covered period is ending soon. The good news? BidLevel stays completely free for you as a HANDSHAKE partner—you just need to bring your own OpenAI key.`,
      }
    case 'day27':
      return {
        preview: `${daysRemaining} days left - Keep your free partner access`,
        headline: `Don't lose your free partner access`,
        intro: `Your fully-covered trial ends in ${daysRemaining} days. Take 2 minutes to add your OpenAI key and keep using BidLevel—still free, no subscription ever.`,
      }
  }
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
}

const listItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '4px',
  paddingLeft: '8px',
}

const statsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const statsTitle = {
  color: '#166534',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
  marginTop: '0',
}

const statsValue = {
  color: '#15803d',
  fontSize: '32px',
  fontWeight: '700',
  marginTop: '0',
  marginBottom: '4px',
}

const statsSubtext = {
  color: '#166534',
  fontSize: '12px',
  marginTop: '0',
  marginBottom: '0',
}

const warningBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  border: '1px solid #fcd34d',
}

const warningTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '8px',
  marginTop: '0',
}

const warningText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '0',
  marginBottom: '0',
}

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  border: '1px solid #fca5a5',
}

const urgentTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '8px',
  marginTop: '0',
}

const urgentText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '0',
  marginBottom: '0',
}

const helpBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const helpTitle = {
  color: '#475569',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '4px',
  marginTop: '0',
}

const helpText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '0',
  marginBottom: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const urgentButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const link = {
  color: '#10b981',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '24px',
}

export default HandshakeReminderEmail
