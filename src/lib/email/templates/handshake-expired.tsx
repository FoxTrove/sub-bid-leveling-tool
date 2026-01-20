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

interface HandshakeExpiredEmailProps {
  firstName: string
}

export function HandshakeExpiredEmail({ firstName }: HandshakeExpiredEmailProps) {
  const previewText = 'Quick setup to keep your free BidLevel access'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidLevel" style={logo} />
          </Section>

          <Section style={partnerBadge}>
            <Text style={badgeText}>HANDSHAKE PARTNER</Text>
          </Section>

          <Heading style={h1}>Your fully-covered period has ended</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            Your 30 days of fully-covered access are up—but your HANDSHAKE partner access isn't going anywhere. You just need to add your own OpenAI API key to keep using BidLevel.
          </Text>

          <Section style={infoBox}>
            <Text style={infoTitle}>Your partner deal (still active):</Text>
            <Text style={infoText}>
              <strong>BidLevel is still free for you</strong> — No subscription fees, ever. Other GCs pay $99-299/month for this.
            </Text>
            <Text style={infoText}>
              <strong>You just cover your own AI costs</strong> — Pay OpenAI directly, ~$1-3 per comparison. That's it.
            </Text>
            <Text style={infoText}>
              <strong>Your data is safe</strong> — All your past comparisons and results are still here waiting for you.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidlevel.foxtrove.ai/settings">
              Add Your API Key
            </Button>
          </Section>

          <Section style={stepsBox}>
            <Text style={stepsTitle}>How to get your API key (2 minutes)</Text>
            <Text style={stepText}>1. Go to <Link href="https://platform.openai.com/signup" style={link}>platform.openai.com</Link></Text>
            <Text style={stepText}>2. Create an account and add a payment method</Text>
            <Text style={stepText}>3. Go to API Keys and create a new secret key</Text>
            <Text style={stepText}>4. Copy and paste it in your BidLevel settings</Text>
          </Section>

          <Text style={text}>
            Need help? Just reply to this email and we'll walk you through it.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            BidLevel by Foxtrove
          </Text>
        </Container>
      </Body>
    </Html>
  )
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

const partnerBadge = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const badgeText = {
  display: 'inline-block',
  backgroundColor: '#065f46',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '6px 12px',
  borderRadius: '4px',
  margin: '0',
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

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #fcd34d',
}

const infoTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const infoText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
  marginTop: '0',
}

const stepsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const stepsTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const stepText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '4px',
  marginTop: '0',
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

export default HandshakeExpiredEmail
