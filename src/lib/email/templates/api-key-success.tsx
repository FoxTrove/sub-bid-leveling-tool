import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const LOGO_URL = 'https://bidlevel.foxtrove.ai/bidlevel-logo.png'

interface ApiKeySuccessEmailProps {
  firstName: string
  isHandshakeUser: boolean
}

export function ApiKeySuccessEmail({ firstName, isHandshakeUser }: ApiKeySuccessEmailProps) {
  const previewText = "You're all set - Your free BidLevel access is now permanent"

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidLevel" style={logo} />
          </Section>

          {isHandshakeUser && (
            <Section style={partnerBadge}>
              <Text style={badgeText}>HANDSHAKE PARTNER</Text>
            </Section>
          )}

          <Section style={successBadge}>
            <Text style={checkmark}>&#10003;</Text>
          </Section>

          <Heading style={h1}>You're all set!</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            Your OpenAI API key has been saved. You now have full, unlimited access to BidLevel—and it's yours to keep.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightTitle}>{isHandshakeUser ? 'Your HANDSHAKE partner access:' : 'What this means for you:'}</Text>
            <Text style={highlightText}>
              <strong>Unlimited comparisons</strong> — Run as many bid analyses as you need, whenever you need them
            </Text>
            <Text style={highlightText}>
              <strong>No subscription fees</strong> — BidLevel is free for you{isHandshakeUser ? '. Other GCs pay $99-299/month for tools like this' : ''}
            </Text>
            <Text style={highlightText}>
              <strong>You only pay OpenAI</strong> — ~$1-3 per comparison, paid directly to them. That's it.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidlevel.foxtrove.ai/dashboard">
              Go to Dashboard
            </Button>
          </Section>

          <Section style={tipsBox}>
            <Text style={tipsTitle}>Quick tips</Text>
            <Text style={tipText}>
              <strong>Monitor your OpenAI usage:</strong> Visit platform.openai.com/usage to track your API costs
            </Text>
            <Text style={tipText}>
              <strong>Set a spending limit:</strong> You can configure a monthly cap in OpenAI's billing settings
            </Text>
            <Text style={tipText}>
              <strong>Update your key anytime:</strong> Go to Settings in BidLevel if you need to change your API key
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={subtext}>
            Thanks for using BidLevel. If you have any feedback or questions, just reply to this email.
          </Text>

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
  marginBottom: '8px',
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

const successBadge = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const checkmark = {
  display: 'inline-block',
  backgroundColor: '#10b981',
  color: '#ffffff',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  fontSize: '24px',
  lineHeight: '48px',
  textAlign: 'center' as const,
  margin: '0',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
}

const highlightBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #a7f3d0',
}

const highlightTitle = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const highlightText = {
  color: '#047857',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
  marginTop: '0',
}

const tipsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const tipsTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const tipText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
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

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const subtext = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.5',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '24px',
}

export default ApiKeySuccessEmail
